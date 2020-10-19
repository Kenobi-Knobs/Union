package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import javax.crypto.Mac;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import javax.mail.MessagingException;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Base64.Encoder;
import java.util.Base64.Decoder;
import java.util.Objects;
import java.util.Random;

/**
 * Project's server side utility class
 * @author Vitaliy Konchatniy, Pakhota Yury
 * @version 1.0
 */
public class Utils {
    JSONParser parser = new JSONParser();

    /**
     * Creates the connection to the remote database
     * @return Returns a connected database class
     * @throws SQLException db connection exception
     * @throws ClassNotFoundException db connection exception
     * @throws IOException Input output connection exception
     * @throws ParseException parse json exception
     */
    public DBController connect() throws SQLException, ClassNotFoundException, IOException, ParseException {
        String config = new String(Files.readAllBytes(Paths.get("config.txt")));
        JSONObject jsonConfig = (JSONObject) parser.parse(config);
        return new DBController((String) jsonConfig.get("user"), (String) jsonConfig.get("pass"), (String) jsonConfig.get("url"));
    }

    /**
     * Method gets data from an agent
     * @param ctx Context that contains agent's data
     * @param db Connected database
     * @return Returns a data from an agent, or an error 400 (Bad Request) that means operation failure
     */
    //get actual data for public_key
    public String getAgentData(Context ctx, DBController db) {
        if (authCheck(ctx)) {
            if (ctx.queryParam("public_key") != null && isOwner(ctx, db)) {
                JSONObject jsonResult = new JSONObject();
                JSONArray jsonArray = new JSONArray();
                int count = 1;
                if(ctx.queryParam("count") != null && Objects.requireNonNull(ctx.queryParam("count")).matches("-?\\d+(\\.\\d+)?")){
                    count = Integer.parseInt(Objects.requireNonNull(ctx.queryParam("count")));
                    if(count <= 0){
                        count = 1;
                    }
                    if(count > 100){
                        count = 100;
                    }
                }
                try {
                    String query = "SELECT * FROM `AgentData` WHERE `public_key` = ? ORDER BY scan_time DESC LIMIT ?";
                    PreparedStatement ps = db.getConnection().prepareStatement(query);
                    ps.setString(1, ctx.queryParam("public_key"));
                    ps.setInt(2,count);
                    ResultSet res = ps.executeQuery();
                    while(res.next()) {
                        JSONObject jsonData = new JSONObject();
                        jsonData.put("public_key", res.getString("public_key"));
                        jsonData.put("scan_time", res.getString("scan_time"));
                        String str = res.getString("data");
                        JSONObject jsonBody = (JSONObject) parser.parse(str);
                        jsonData.put("data", jsonBody);
                        jsonArray.add(jsonData);
                    }
                    ps.close();
                    jsonResult.put("dataset", jsonArray);
                    return jsonResult.toJSONString();
                } catch (SQLException | ParseException throwables) {
                    throwables.printStackTrace();
                    ctx.status(400);
                    return "Bad request";
                }
            } else {
                ctx.status(400);
                return "Bad request";
            }
        } else {
            ctx.status(400);
            return "Unauthorized";
        }
    }

    private boolean isOwner(Context ctx,DBController db) {
        String mail = ctx.sessionAttribute("mail");
        String publicKey = ctx.queryParam("public_key");
        try {
            String query = "SELECT * from (SELECT ua.public_key FROM `User_agents` as ua, Users as u WHERE u.id = ua.user_id and u.mail = ?) as a where a.public_key = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, mail);
            ps.setString(2, publicKey);
            ResultSet res = ps.executeQuery();
            return res.next();
        } catch (SQLException throwables) {
            throwables.printStackTrace();
            return false;
        }
    }

    /**
     * Data validation by private key (method checks if any value is null, and checks jsonData)
     * @param ctx Context that contains data
     * @param body body of request
     * @return Returns a response of the validation
     */
    public Boolean validate(Context ctx, DBController db, String body) {
        try {
            String sign = ctx.header("Sign");
            JSONObject jsonBody = (JSONObject) parser.parse(body);
            String publicKey = (String) jsonBody.get("public_key");
            if(publicKey == null){
                return false;
            }
            String secretKey = "";
            String query = "SELECT secret_key FROM Agents WHERE public_key = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, publicKey);
            ResultSet res = ps.executeQuery();
            while (res.next()) {
                secretKey = res.getString("secret_key");
            }

            byte[] hash;

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));

            String result = String.format("%032x", new BigInteger(1, hash));
            return result.equals(sign);
        } catch (NullPointerException | NoSuchAlgorithmException | InvalidKeyException | SQLException | ParseException e) {
            //e.printStackTrace();
            return false;
        }
    }

    /**
     * Method saves and writes the data from an agent to the database
     * @param ctx Data context from an agent
     * @param db Connected database
     */
    public void saveAgentData(Context ctx, DBController db) {
        String body = ctx.body();
        try {
            if (validate(ctx, db, body)) {
                AgentData sd = new AgentData(ctx, body);
                SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                String query = "SELECT * FROM `Agents` WHERE `public_key` =?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, sd.publicKey);
                ResultSet res = ps.executeQuery();
                if (res.next()) {
                    String insertQuery = "INSERT INTO `AgentData`(`public_key`,`boot_time`, `agent_version`, `scan_time`, `data`) VALUES (?,?,?,?,?)";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                    insertPs.setString(1, sd.publicKey);
                    insertPs.setString(2,sd.bootTime);
                    insertPs.setString(3,sd.agentVersion);
                    insertPs.setString(4, dateFormat.format(sd.time));
                    insertPs.setString(5,sd.jsonData);
                    insertPs.executeUpdate();
                    insertPs.close();
                    ctx.status(200);
                } else {
                    ctx.status(400);
                }
                ps.close();
            } else {
                ctx.status(400);
                ctx.result("validation error");
            }
        } catch (ParseException e) {
            ctx.status(500);
            e.printStackTrace();
        }
        catch (SQLException e) {
            e.printStackTrace();
            ctx.status(500);
        } catch (java.text.ParseException e) {
            e.printStackTrace();
            ctx.status(400);
        }
    }

    /**
     * Method gets and returns the list of all agents
     * @param ctx Context that contains header with access to sending requests
     * @param db Database with agents list
     * @return Returns a string with result
     */
    public String getAgentList(Context ctx, DBController db) {
        if (authCheck(ctx)) {
            JSONObject jsonResult = new JSONObject();
            JSONArray jsonAgents = new JSONArray();
            try {
                String query = "SELECT a.* FROM `Agents` as a, (SELECT ua.public_key FROM `User_agents` as ua, Users as u WHERE ua.`user_id` = u.id and u.mail = ?) as b WHERE a.`public_key` = b.`public_key`";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, ctx.sessionAttribute("mail"));
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    JSONObject jsonAgent = new JSONObject();
                    jsonAgent.put("host", res.getString("host"));
                    jsonAgent.put("public_key", res.getString("public_key"));
                    jsonAgents.add(jsonAgent);
                }
                ps.close();
                jsonResult.put("agents", jsonAgents);

                return jsonResult.toString();

            } catch (SQLException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
        }else{
            ctx.status(400);
            return "Unauthorized";
        }
    }

    /**
     * Method for authorizing users
     * Sends an error 400 (bad request) if user and password fields were empty
     * @param ctx Data context to check
     * @param db Database to write new users or check old ones
     * @return Returns a response with the result of checking
     */
    public String auth(Context ctx, DBController db) {
        String mail = ctx.queryParam("mail");
        String pass = ctx.queryParam("pass");
        JSONObject jsonResult = new JSONObject();
        if(mail != null && pass != null) {
            try {
                String query = "SELECT * FROM `Users` WHERE mail = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                if (res.next()) {
                    Encoder encoder = Base64.getUrlEncoder().withoutPadding();
                    Decoder decoder = Base64.getUrlDecoder();
                    byte[] salt = decoder.decode(res.getString("salt"));
                    byte[] expectedHash = hash(pass, salt);
                    String hash = res.getString("pwd");
                    String expectedHashString = encoder.encodeToString(expectedHash);

                    if (hash.equals(expectedHashString)) {
                        if(res.getInt("email_confirmed") == 1){
                            jsonResult.put("auth", "true");
                            jsonResult.put("info", "user is authorized");
                            ctx.sessionAttribute("auth", "true");
                            ctx.sessionAttribute("mail", mail);
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

    /**
     * Method for check user authorization
     * @param ctx Data context to check
     * @return Returns a response with the result of checking
     */
    public String isAuth(Context ctx) {
        JSONObject jsonResult = new JSONObject();
        if (authCheck(ctx)) {
            jsonResult.put("mail", ctx.sessionAttribute("mail"));
            jsonResult.put("auth", "true");
        }else{
            jsonResult.put("auth", "false");
        }

        return jsonResult.toJSONString();
    }

    public String register(Context ctx, DBController db, Mail mailService) {
        Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        JSONObject jsonResult = new JSONObject();
        String params = ctx.body();
        String mail;
        String pass;

        try {
            JSONObject jsonBody = (JSONObject) parser.parse(params);
            mail = (String) jsonBody.get("mail");
            pass = (String) jsonBody.get("pass");
        } catch (ParseException e) {
           return "Bad request";
        }

        String key = generateKey();
        try {
            if (mail != null && pass != null && validation(mail, pass)) {
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

                    insertPs.setString(1, mail);
                    insertPs.setString(2, encoder.encodeToString(salt));
                    insertPs.setString(3, encoder.encodeToString(hash));
                    insertPs.setString(4, key);
                    insertPs.setString(5, "{}");
                    insertPs.executeUpdate();
                    insertPs.close();
                    jsonResult.put("register","true");
                    jsonResult.put("info","Confirmation mail sent");
                    jsonResult.put("mail",mail);
                }else{
                   jsonResult.put("register","false");
                   jsonResult.put("info","User already exist");
                }
                ps.close();
            }else {
                jsonResult.put("register","false");
                jsonResult.put("info","Validation error");
            }
        } catch (SQLException | MessagingException | NoSuchAlgorithmException | InvalidKeySpecException throwables) {
            throwables.printStackTrace();
            ctx.status(400);
            return "Bad request";
        }
        return jsonResult.toString();
    }

    public byte[] getSalt() {
        byte[] salt = new byte[16];
        SecureRandom random = new SecureRandom();
        random.nextBytes(salt);

        return salt;
    }

    public byte[] hash(String password, byte[] salt) throws NoSuchAlgorithmException, InvalidKeySpecException {
        PBEKeySpec keySpec = new PBEKeySpec(password.toCharArray(), salt, 10000, 256);
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
        byte[] hash = keyFactory.generateSecret(keySpec).getEncoded();

        return hash;
    }

    public String generateKey() {
        char[] chars = "abcdefghijklmnopqrstuvwxyz123456789".toCharArray();
        StringBuilder sb = new StringBuilder(20);
        Random random = new Random();
        for (int i = 0; i < 20; i++) {
            char c = chars[random.nextInt(chars.length)];
            sb.append(c);
        }
        return sb.toString();
    }

    //проверка пароля и почты
    public boolean validation(String mail, String password) {
        return true;
    }

    public String confirm(Context ctx, DBController db, String token) {
        if(token.length() != 20){
            ctx.status(404);
            return "You activation link wrong";
        }
        try {
            String query = "SELECT * FROM `Users` WHERE confirm_code = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, token);
            ResultSet res = ps.executeQuery();
            if(res.next()){
                String mail = res.getString("mail");
                String insertQuery = "UPDATE `Users` SET `email_confirmed`= 1,`confirm_code`= null WHERE `mail` = ?";
                PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                insertPs.setString(1, mail);
                insertPs.executeUpdate();
                insertPs.close();
                ctx.status(200);
                ctx.redirect("../../login?info=confirmed");
            }else{
                ctx.status(404);
                return "You activation link wrong db";
            }
            ps.close();
            return "confirm";
        } catch (SQLException throwables) {
            throwables.printStackTrace();
            ctx.status(404);
            return "You activation link wrong db";
        }
    }

    public String getUser(Context ctx, DBController db) {
        if(authCheck(ctx)){
            String mail = ctx.sessionAttribute("mail");
            JSONObject jsonResult = new JSONObject();
            String query = "SELECT * FROM `Users` WHERE `mail` = ?";
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    jsonResult.put("mail", res.getString("mail"));
                    jsonResult.put("settings", parser.parse(res.getString("settings")));
                }
                ps.close();
                return jsonResult.toJSONString();
            } catch (SQLException | ParseException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
        }else{
            return "User unauthorized";
        }
    }

    /**
     * Method sends an html context to the pages
     * @param ctx Data context
     * @param path Page path
     * @param access Access mode
     * @param redirect Redirect if auth false
     * @throws IOException input output exception
     */
    public void sendHtml(Context ctx, String path, String access, String redirect) throws IOException {
        if(access.equals("auth_only")){
            if (authCheck(ctx)) {
                String contents = new String(Files.readAllBytes(Paths.get(path)));
                ctx.html(contents);
            } else {
                ctx.redirect(redirect);
            }
        }else if(access.equals("public")){
            String contents = new String(Files.readAllBytes(Paths.get(path)));
            ctx.html(contents);
        }
    }

    public String getAgentDataByInterval(Context ctx, DBController db) {
        if (authCheck(ctx)) {
            if (ctx.queryParam("public_key") != null && isOwner(ctx, db)) {
                JSONObject jsonResult = new JSONObject();
                JSONArray jsonArray = new JSONArray();
                if(dateValidation(ctx.queryParam("start"), ctx.queryParam("end"))) {
                    try {
                        JSONParser parser = new JSONParser();
                        String query = "select * from AgentData WHERE (scan_time BETWEEN ? and ? ) and public_key = ?";
                        PreparedStatement ps = db.getConnection().prepareStatement(query);
                        ps.setString(1, ctx.queryParam("start") + ":05");
                        ps.setString(2, ctx.queryParam("end") + ":05");
                        ps.setString(3, ctx.queryParam("public_key"));
                        ResultSet res = ps.executeQuery();
                        while (res.next()) {
                            JSONObject jsonData = new JSONObject();
                            jsonData.put("public_key", res.getString("public_key"));
                            jsonData.put("scan_time", res.getString("scan_time"));
                            String str = res.getString("data");
                            JSONObject jsonBody = (JSONObject) parser.parse(str);
                            jsonData.put("data", jsonBody);
                            jsonArray.add(jsonData);
                        }
                        ps.close();
                        jsonResult.put("dataset", jsonArray);
                        return jsonResult.toJSONString();
                    } catch (SQLException | ParseException throwables) {
                        throwables.printStackTrace();
                        ctx.status(400);
                        return "Bad request";
                    }
                }else{
                    ctx.status(400);
                    return "Interval validation error";
                }
            } else {
                ctx.status(400);
                return "Bad request";
            }
        } else {
            ctx.status(400);
            return "Unauthorized";
        }
    }

    private boolean dateValidation(String start, String end) {
        String regex = "[0-9]{4}-(0[0-9]|1[012])-([012][0-9]|3[01]) ([01][0-9]|2[0-3])(:[0-5][0-9])";
        if(start != null && end != null){
            return start.matches(regex) && end.matches(regex);
        }else{
            return false;
        }
    }

    public String getInterval(Context ctx, DBController db) {
        if(!authCheck(ctx)){
            ctx.status(400);
            return "Unauthorized";
        }
        if(ctx.queryParam("public_key") != null && isOwner(ctx, db)){
            String publicKey = ctx.queryParam("public_key");
            JSONObject jsonResult = new JSONObject();
            String query = "SELECT MAX(`scan_time`) as max, MIN(`scan_time`) as min FROM `AgentData` WHERE `public_key` = ?";
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, publicKey);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    jsonResult.put("public_key", publicKey);
                    jsonResult.put("min", res.getString("min"));
                    jsonResult.put("max", res.getString("max"));
                }
                ps.close();
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

    public boolean authCheck(Context ctx) {
        return ctx.sessionAttribute("auth") != null && Objects.equals(ctx.sessionAttribute("auth"), "true");
    }
}
