package main.java;

import io.javalin.http.Context;
import org.jetbrains.annotations.NotNull;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import javax.mail.MessagingException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Random;

/**
 * Project's server side utility class
 * @author Vitaliy Konchatniy, Pakhota Yury
 * @version 1.0
 */
public class Utils {
    /**
     * Creates the connection to the remote database
     * @return Returns a connected database class
     * @throws SQLException
     * @throws ClassNotFoundException
     * @throws IOException
     * @throws ParseException
     */
    public DBController connect() throws SQLException, ClassNotFoundException, IOException, ParseException {
        String config = new String(Files.readAllBytes(Paths.get("config.txt")));
        JSONParser parser = new JSONParser();
        JSONObject jsonConfig = (JSONObject) parser.parse(config);
        DBController db = new DBController((String) jsonConfig.get("user"), (String) jsonConfig.get("pass"), (String) jsonConfig.get("url"));
        return db;
    }

    /**
     * Method gets data from an agent
     * @param ctx Context that contains agent's data
     * @param db Connected database
     * @return Returns a data from an agent, or an error 400 (Bad Request) that means operation failure
     */
    //get actual data for public_key
    public String getAgentData(Context ctx, DBController db) {
        if (ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true")) {
            if (ctx.queryParam("public_key") != null && isOwner(ctx, db)) {
                JSONObject jsonResult = new JSONObject();
                JSONArray jsonArray = new JSONArray();
                int count = 1;
                if(ctx.queryParam("count") != null && ctx.queryParam("count").matches("-?\\d+(\\.\\d+)?")){
                    count = Integer.parseInt(ctx.queryParam("count"));
                    if(count <= 0){
                        count = 1;
                    }
                    if(count > 100){
                        count = 100;
                    }
                }
                try {
                    JSONParser parser = new JSONParser();
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
                    jsonResult.put("datas", jsonArray);
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
            if (res.next() != false) {
                return true;
            }else{
                return false;
            }
        } catch (SQLException throwables) {
            throwables.printStackTrace();
            return false;
        }
    }

    /**
     * Method saves and writes the data from an agent to the database
     * @param ctx Data context from an agent
     * @param db Connected database
     */
    public void saveAgentData(Context ctx, DBController db) {
        try {
            AgentData sd = new AgentData(ctx);
            if (sd.validate(ctx)){
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
            }
        } catch (ParseException e) {
            ctx.status(500);
        }
        catch (SQLException e) {
            e.printStackTrace();
            ctx.status(500);
        } catch (java.text.ParseException e) {
            ctx.status(400);
        }
    }

    /**
     * Method gets and returns the list of all agents
     * @param ctx Context that contains header with access to sending requests
     * @param db Database with agents list
     * @return Returns a string with resultд
     */
    public String getAgentList(Context ctx, DBController db) {
        if (ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true")) {
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
    public String auth(Context ctx, DBController db){
        String mail = ctx.queryParam("mail");
        String pass = ctx.queryParam("pass");
        JSONObject jsonResult = new JSONObject();
        if(mail != null && pass != null) {
            try {
                String query = "SELECT * FROM `Users` WHERE mail = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                if (res.next() != false) {
                    if (pass.equals(res.getString("pwd"))) {
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
            }
        }else{
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
        if (ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true")) { ;
            jsonResult.put("mail", ctx.sessionAttribute("mail"));
            jsonResult.put("auth", "true");
        }else{
            jsonResult.put("auth", "false");
        }

        return jsonResult.toJSONString();
    }

    public String register(Context ctx, DBController db, Mail mailService) {
        JSONObject jsonResult = new JSONObject();
        String params = ctx.body();
        String mail = null;
        String pass = null;
        JSONParser parser = new JSONParser();

        try {
            JSONObject jsonBody = (JSONObject) parser.parse(params);
            mail = (String) jsonBody.get("mail");
            pass = (String) jsonBody.get("pass");
        } catch (ParseException e) {
           return "Bad request";
        }

        String key = generateKey();
        try{
            if(mail != null && pass != null && validation(mail, pass)){
                String query = "SELECT * FROM `Users` WHERE mail = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                if(res.next() == false){
                    mailService.sendActivationLink(key,mail);
                    String insertQuery = "INSERT INTO `Users`(`mail`, `pwd`, `confirm_code`,`settings`) VALUES (?,?,?,?)";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                    insertPs.setString(1, mail);
                    insertPs.setString(2, pass);
                    insertPs.setString(3, key);
                    insertPs.setString(4, "{}");
                    insertPs.executeUpdate();
                    insertPs.close();
                    jsonResult.put("register","true");
                    jsonResult.put("info","Confirmation mail sended");
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
        }catch (SQLException | MessagingException throwables) {
            throwables.printStackTrace();
            ctx.status(400);
            return "Bad request";
        }
        return jsonResult.toString();
    }

    public String generateKey() {
        char[] chars = "abcdefghijklmnopqrstuvwxyz123456789".toCharArray();
        StringBuilder sb = new StringBuilder(20);
        Random random = new Random();
        for (int i = 0; i < 20; i++) {
            char c = chars[random.nextInt(chars.length)];
            sb.append(c);
        }
        String output = sb.toString();
        return output;
    }

    //проверка пароля и почты
    public boolean validation(String mail, String pass){
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
            if(res.next() != false){
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
        if(ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true") ){
            String mail = ctx.sessionAttribute("mail");
            JSONObject jsonResult = new JSONObject();
            String query = "SELECT * FROM `Users` WHERE `mail` = ?";
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    jsonResult.put("mail", res.getString("mail"));
                    jsonResult.put("settings", res.getString("settings"));
                }
                ps.close();
                return jsonResult.toJSONString();
            } catch (SQLException throwables) {
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
     * @param acces Acces mode
     * @param redirect Redirect if auth false
     * @throws IOException
     */
    public void sendHtml(@NotNull Context ctx, String path, String acces, String redirect) throws IOException {
        if(acces.equals("auth_only")){
            if (ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true")) {
                String contents = new String(Files.readAllBytes(Paths.get(path)));
                ctx.html(contents);
            } else {
                ctx.redirect(redirect);
            }
        }else if(acces.equals("public")){
            String contents = new String(Files.readAllBytes(Paths.get(path)));
            ctx.html(contents);
        }
    }

    public String getAgentDataByInterval(Context ctx, DBController db) {
        if (ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true")) {
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
                        jsonResult.put("datas", jsonArray);
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
            if(start.matches(regex) && end.matches(regex)){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        }
    }
}
