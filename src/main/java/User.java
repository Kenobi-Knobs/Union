package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONObject;
import org.json.simple.parser.ParseException;

import javax.mail.MessagingException;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Base64;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static main.java.Utils.*;

public class User {
    /**
     * Method for authorizing users
     * Sends an error 400 (bad request) if user and password fields were empty
     * @param ctx Data context to check
     * @param db Database to write new users or check old ones
     * @return Returns a response with the result of checking
     */
    public static String authorization(Context ctx, DBController db) {
        String mail = ctx.queryParam("mail");
        String pass = ctx.queryParam("pass");
        JSONObject jsonResult = new JSONObject();
        if(mail != null && pass != null) {
            mail = mail.trim();
            pass = pass.trim();
            try {
                String query = "SELECT * FROM `Users` WHERE mail = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                if (res.next()) {
                    Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
                    Base64.Decoder decoder = Base64.getUrlDecoder();
                    byte[] salt = decoder.decode(res.getString("salt"));
                    byte[] expectedHash = hash(pass, salt);
                    String hash = res.getString("pwd");
                    String expectedHashString = encoder.encodeToString(expectedHash);
                    String settings = res.getString("settings");
                    JSONObject jsonSettings;
                    try {
                        jsonSettings = (JSONObject) parser.parse(settings);
                    } catch(ClassCastException | ParseException e) {
                        ctx.status(400);
                        return "bad request";
                    }
                    if (hash.equals(expectedHashString)) {
                        if(res.getInt("email_confirmed") == 1) {
                            jsonResult.put("auth", "true");
                            jsonResult.put("info", "user is authorized");
                            ctx.sessionAttribute("auth", "true");
                            ctx.sessionAttribute("mail", mail);
                            ctx.sessionAttribute("status", jsonSettings.get("status"));
                            ctx.sessionAttribute("lang", jsonSettings.get("lang"));
                            System.out.println( mail + " auth");
                        }else{
                            jsonResult.put("auth", "false");
                            jsonResult.put("info", "confirm account with mail");
                        }
                    } else {
                        jsonResult.put("auth", "false");
                        jsonResult.put("info", "wrong pass");
                    }
                } else {
                    jsonResult.put("auth", "false");
                    jsonResult.put("info", "wrong mail");
                }
                ps.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
                jsonResult.put("auth", "false");
                jsonResult.put("info", "error");
            } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
                ctx.status(400);
                return "bad request";
            }
        } else {
            ctx.status(400);
            return "bad request";
        }
        return jsonResult.toJSONString();
    }

    public static String register(Context ctx, DBController db, Mail mailService) {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        JSONObject jsonResult = new JSONObject();
        String mail = ctx.formParam("mail");
        String pass = ctx.formParam("pass");

        String key = generateKey();
        try {
            if (mail != null && pass != null && registrationValidation(mail, pass)) {
                String query = "SELECT * FROM `Users` WHERE mail = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                if (!res.next()) {
                    mailService.sendActivationLink(key, mail);
                    String insertQuery = "INSERT INTO `Users`(`mail`, `salt`, `pwd`, `confirm_code`, `settings`) VALUES (?, ?, ?, ?, ?)";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);

                    byte[] salt = getSalt();
                    byte[] hash = hash(pass, salt);

                    insertPs.setString(1, mail.toLowerCase());
                    insertPs.setString(2, encoder.encodeToString(salt));
                    insertPs.setString(3, encoder.encodeToString(hash));
                    insertPs.setString(4, key);
                    insertPs.setString(5, "{\"status\" : \"user\", \"lang\" : \"en\"}");
                    insertPs.executeUpdate();
                    insertPs.close();
                    jsonResult.put("register","true");
                    jsonResult.put("info","Confirmation mail sent");
                    jsonResult.put("mail",mail);
                    System.out.println( mail + " register");
                } else{
                    jsonResult.put("register","false");
                    jsonResult.put("info","User already exist");
                }
                ps.close();
            } else {
                jsonResult.put("register","false");
                jsonResult.put("info","Validation Error: registration data is incorrect");
            }
        } catch (SQLException | MessagingException | NoSuchAlgorithmException | InvalidKeySpecException throwables) {
            throwables.printStackTrace();
            ctx.status(400);
            return "Bad request";
        }
        return jsonResult.toString();
    }

    public static String addAgent(Context ctx, DBController db) {
        if (!API.authCheck(ctx)) {
            ctx.status(401);
            return "Unauthorized";
        }

        if (addAgentValidation(ctx)) {
            JSONObject jsonResult = new JSONObject();

            String publicKey = ctx.formParam("public_key");
            String privateKey = ctx.formParam("secret_key");
            String host = ctx.formParam("host");

            if (publicKey.contains("<") && host.contains("<")) {
                ctx.status(400);
                return "Bad request (xss detect)";
            }
            try {
                String insertQuery = "INSERT IGNORE INTO `Agents`(`public_key`, `secret_key`, `host`) VALUES (?,?,?)";
                PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                insertPs.setString(1, publicKey.toLowerCase());
                insertPs.setString(2, privateKey);
                insertPs.setString(3, host.toLowerCase());
                insertPs.executeUpdate();
                insertPs.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
            try {
                String makeLink = "INSERT INTO `User_agents`(`user_id`, `public_key`) VALUES ((SELECT id from Users where mail = ?), ?)";
                PreparedStatement linkPs = db.getConnection().prepareStatement(makeLink);
                linkPs.setString(1, ctx.sessionAttribute("mail"));
                linkPs.setString(2, publicKey.toLowerCase());
                linkPs.executeUpdate();
                linkPs.close();

                jsonResult.put("add", "true");
                jsonResult.put("info", "Added");

                return jsonResult.toJSONString();
            } catch (SQLException throwables) {
                jsonResult.put("add", "false");
                jsonResult.put("info", "Is exist");

                return jsonResult.toJSONString();
            }
        } else {
            ctx.status(400);
            return "Validation Error: incorrect data";
        }
    }

    public static String deleteAgent(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        if(!API.authCheck(ctx)){
            ctx.status(401);
            return "Unauthorized";
        }
        String publicKey = ctx.formParam("public_key");
        if (publicKey != null && isOwner(ctx, db, publicKey)){
            try {
                String insertQuery = "DELETE FROM `User_agents` WHERE `user_id` = (Select id from Users WHERE mail = ?) and `public_key` = ?";
                PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                insertPs.setString(1, ctx.sessionAttribute("mail"));
                insertPs.setString(2, publicKey);
                insertPs.executeUpdate();
                insertPs.close();
                jsonResult.put("delete", "true");
                jsonResult.put("info", publicKey + " deleted");
                return jsonResult.toJSONString();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
        }else{
            ctx.status(400);
            return "Bad request";
        }
    }

    public static String resetPassword(Context ctx, DBController db, Mail mailService) {
        JSONObject jsonResult = new JSONObject();
        String mail = ctx.formParam("mail");
        String query = "SELECT * FROM `Users` WHERE `mail` = ?";
        try {
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, mail);
            ResultSet res = ps.executeQuery();
            if (res.next()) {
                if (res.getInt("email_confirmed") == 1) {
                    String key = generateKey();
                    mailService.sendResetLink(key, mail);
                    String insertQuery = "UPDATE `Users` SET `reset_code`= ? WHERE `mail` = ?";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                    insertPs.setString(1, key);
                    insertPs.setString(2, mail);
                    insertPs.executeUpdate();
                    insertPs.close();
                    jsonResult.put("reset", "true");
                    jsonResult.put("info", "Confirmation mail sent");
                    jsonResult.put("mail", mail);
                    ps.close();
                } else {
                    ps.close();
                    jsonResult.put("reset", "false");
                    jsonResult.put("info", "mail not confirm");
                }
            } else {
                ps.close();
                jsonResult.put("reset", "false");
                jsonResult.put("info", "mail not found");
            }
            return jsonResult.toJSONString();
        } catch (SQLException | MessagingException throwables) {

            throwables.printStackTrace();
            jsonResult.put("reset", "false");
            jsonResult.put("info", "mail not found or not sent");
            return jsonResult.toJSONString();
        }

    }

    public static String changePassword(Context ctx, DBController db){
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        JSONObject jsonResult = new JSONObject();
        String token = ctx.formParam("token");
        String newPass = ctx.formParam("new_pass");
        Pattern passPattern = Pattern.compile("^(?=.*[0-9])(?=.*[a-zA-Z])(?=\\S+$).{8,}$");
        Matcher passMatcher = passPattern.matcher(Objects.requireNonNull(newPass));
        if(!passMatcher.find()){
            jsonResult.put("reset", "false");
            jsonResult.put("info","Validation Error: password is incorrect");
            return jsonResult.toJSONString();
        }
        try {
            byte[] salt = getSalt();
            byte[] hash = hash(newPass, salt);
            String query = "UPDATE `Users` SET `salt`= ?,`pwd`= ?,`reset_code`= NULL WHERE `reset_code` = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, encoder.encodeToString(salt));
            ps.setString(2, encoder.encodeToString(hash));
            ps.setString(3, token);
            ps.executeUpdate();
            ps.close();
            jsonResult.put("reset", "true");
            jsonResult.put("info","new password set");
        } catch (SQLException | NoSuchAlgorithmException | InvalidKeySpecException throwables) {
            throwables.printStackTrace();
            jsonResult.put("reset", "false");
            jsonResult.put("info","token no found");
        }
        return jsonResult.toJSONString();
    }
}
