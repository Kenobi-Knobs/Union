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
import java.util.*;
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
        String mail = ctx.formParam("mail");
        String pass = ctx.formParam("pass");
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
                            API.createCSRF(ctx);

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

    public static String registration(Context ctx, DBController db, Mail mailService) {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        JSONObject jsonResult = new JSONObject();
        String mail = ctx.formParam("mail");
        String pass = ctx.formParam("pass");
        String lang = ctx.formParam("lang");

        if (mail != null && pass != null /*&& lang != null*/) {
            String key = generateKey();
            if (registrationValidation(mail, pass) /*&& (lang.equals("ua") || lang.equals("en"))*/) {
                try {
                    String query = "SELECT * FROM `Users` WHERE mail = ?";
                    PreparedStatement ps = db.getConnection().prepareStatement(query);
                    ps.setString(1, mail);
                    ResultSet res = ps.executeQuery();
                    if (!res.next()) {
                        mailService.sendActivationLink(key, mail/*, lang*/);
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

                } catch (SQLException | MessagingException | NoSuchAlgorithmException | InvalidKeySpecException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
                }
            } else {
                    jsonResult.put("register","false");
                    jsonResult.put("info","Validation Error: registration data is incorrect");
            }
        }
        return jsonResult.toString();
    }

    public static String addAgent(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        if (!API.authCheck(ctx)) {
            ctx.status(401);
            return "Unauthorized";
        }

        if (addAgentValidation(ctx)) {
            String publicKey = ctx.formParam("public_key");
            String privateKey = ctx.formParam("secret_key");
            String host = ctx.formParam("host");

            if (publicKey.contains("<") && host.contains("<")) {
                ctx.status(400);
                return "Bad request (xss detect)";
            }
            try {
                if(ctx.sessionAttribute("status").equals("user") && Utils.getAgentCount(ctx, db) >= 3){
                    jsonResult.put("add", "false");
                    jsonResult.put("info", "no premium");
                    return jsonResult.toJSONString();
                }
                String insertQuery = "INSERT IGNORE INTO `Agents`(`public_key`, `secret_key`, `host`) VALUES (?,?,?)";
                PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                insertPs.setString(1, publicKey.toLowerCase());
                insertPs.setString(2, privateKey);
                insertPs.setString(3, host.toLowerCase());
                int count = insertPs.executeUpdate();
                if(count <= 0){
                    jsonResult.put("add", "false");
                    jsonResult.put("info", "Is exist");
                    return jsonResult.toJSONString();
                }
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
                System.out.println(ctx.sessionAttribute("mail") + " add agent  " + publicKey.toLowerCase());
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
                System.out.println(ctx.sessionAttribute("mail") + " delete " +  publicKey);
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
        String lang = ctx.formParam("lang");

        if(mail == null || lang == null || !(lang.equals("ua") || lang.equals("en"))){
            ctx.status(400);
            return "Bad Request";
        }

        String query = "SELECT * FROM `Users` WHERE `mail` = ?";
        try {
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, mail);
            ResultSet res = ps.executeQuery();
            if (res.next()) {
                if (res.getInt("email_confirmed") == 1) {
                    String key = generateKey();
                    mailService.sendResetLink(key, mail, lang);
                    String insertQuery = "UPDATE `Users` SET `reset_code`= ? WHERE `mail` = ?";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                    insertPs.setString(1, key);
                    insertPs.setString(2, mail);
                    insertPs.executeUpdate();
                    insertPs.close();
                    System.out.println(mail + " reset password ");
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

    public static String addActivePing(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();

        if (!API.authCheck(ctx)) {
            ctx.status(401);
            return "Unauthorized";
        }

        String address = "";
        if (ctx.formParam("address") != null)
            address = ctx.formParam("address");
        if (Utils.pingValidation(address)) {
            try {
                int pingInterval = Integer.parseInt(Objects.requireNonNull(ctx.formParam("ping_interval")));
                int downTiming = Integer.parseInt(Objects.requireNonNull(ctx.formParam("down_timing")));

                if ((ctx.sessionAttribute("status").equals("user")) && (pingInterval < 5 || pingInterval > 60 || Utils.getPingCount(ctx, db) >= 5)) {
                    jsonResult.put("add", "false");
                    jsonResult.put("info", "user has no premium status, invalid data requested");
                    ctx.status(400);
                    return jsonResult.toJSONString();
                }
                if (downTiming < pingInterval || downTiming <= 0 || downTiming > 60) {
                    ctx.status(400);
                    return "bad request";
                }

                if (address.contains("<")) {
                    ctx.status(400);
                    return "bad request";
                }
                Date date = new Date(System.currentTimeMillis());
                long currentTime = date.getTime() / 1000L;

                try {
                    String insertQuery = "INSERT IGNORE INTO `PingList`(`user_id`, `address`, `ping_interval`, `last_ping_time`, `down_timing`) VALUES ((SELECT id FROM Users WHERE mail = ?),?,?,?,?)";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                    insertPs.setString(1, ctx.sessionAttribute("mail"));
                    insertPs.setString(2, address);
                    insertPs.setInt(3, pingInterval);
                    insertPs.setLong(4, currentTime);
                    insertPs.setInt(5, downTiming);
                    int col = insertPs.executeUpdate();
                    insertPs.close();
                    if (col <= 0) {
                        jsonResult.put("add_ping", "false");
                        jsonResult.put("info", "is exist");
                        return jsonResult.toJSONString();
                    }
                    ctx.status(200);
                    jsonResult.put("add_ping", "true");
                    jsonResult.put("info", "Added");
                    System.out.println(ctx.sessionAttribute("mail") + " add " + address + " to activePing");
                    return jsonResult.toJSONString();
                } catch (SQLException throwables) {
                    throwables.printStackTrace();
                    ctx.status(400);
                    return "bad request";
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(400);
                return "bad request";
            }
        } else {
            ctx.status(400);
            return "incorrect address; validation failed";
        }
    }

    public static String deleteActivePing(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        if(!API.authCheck(ctx)){
            ctx.status(401);
            return "Unauthorized";
        }
        String address =  ctx.formParam("address");
        if (address != null){
            try {
                String update = "UPDATE `PingList` SET current_down = NULL WHERE `user_id` = (SELECT id FROM Users WHERE mail = ?) and `address` = ?";
                PreparedStatement updatePs = db.getConnection().prepareStatement(update);
                updatePs.setString(1, ctx.sessionAttribute("mail"));
                updatePs.setString(2, address);
                updatePs.executeUpdate();
                updatePs.close();
                String insertQuery = "DELETE FROM `PingList` WHERE `address` = ? and `user_id` = (SELECT id FROM Users WHERE mail = ?)";
                PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                insertPs.setString(1, address);
                insertPs.setString(2, ctx.sessionAttribute("mail"));
                int col = insertPs.executeUpdate();
                insertPs.close();
                if(col > 0){
                    jsonResult.put("delete", "true");
                    jsonResult.put("info", ctx.sessionAttribute("mail") + " delete " + address);
                    System.out.println(ctx.sessionAttribute("mail") + " delete " + address + " from activePing");
                }else{
                    ctx.status(400);
                    return "Bad request";
                }
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

    public static String changeLang(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        if(!API.authCheck(ctx)){
            ctx.status(401);
            return "Unauthorized";
        }
        String lang = ctx.queryParam("lang");
        if(lang != null && (lang.equals("ua") || lang.equals("en"))){
            if(Utils.changeSetting(ctx.sessionAttribute("mail"), db, "lang", lang)){
                ctx.status(200);
                jsonResult.put("change", "true");

                return jsonResult.toJSONString();
            }else{
                ctx.status(400);
                return "Bad Request";
            }
        }else{
            ctx.status(400);
            return "Bad Request";
        }
    }
}
