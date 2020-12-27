package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.Objects;

public class API {
    /**
     * Method for check user authorization
     * @param ctx Data context to check
     * @return Returns a response with the result of checking
     */
    public static String isAuth(Context ctx) {
        JSONObject jsonResult = new JSONObject();
        if (authCheck(ctx)) {
            jsonResult.put("mail", ctx.sessionAttribute("mail"));
            jsonResult.put("auth", "true");
            jsonResult.put("status", ctx.sessionAttribute("status"));
        } else {
            jsonResult.put("auth", "false");
        }

        return jsonResult.toJSONString();
    }

    public static boolean authCheck(Context ctx) {
        return ctx.sessionAttribute("auth") != null && Objects.equals(ctx.sessionAttribute("auth"), "true");
    }

    /**
     * Method gets data from an agent
     * @param ctx Context that contains agent's data
     * @param db Connected database
     * @return Returns a data from an agent, or an error 400 (Bad Request) that means operation failure
     */
    public static String getAgentData(Context ctx, DBController db) {
        if (authCheck(ctx)) {
            if (ctx.queryParam("public_key") != null && Utils.isOwner(ctx, db, ctx.queryParam("public_key"))) {
                JSONObject jsonResult = new JSONObject();
                JSONArray jsonArray = new JSONArray();
                int count = 1;
                if (ctx.queryParam("count") != null && Objects.requireNonNull(ctx.queryParam("count")).matches("-?\\d+(\\.\\d+)?")) {
                    count = Integer.parseInt(Objects.requireNonNull(ctx.queryParam("count")));
                    if (count <= 0) {
                        count = 1;
                    }
                    if (count > 100) {
                        count = 100;
                    }
                }
                try {
                    String query = "SELECT * FROM `AgentData` WHERE `public_key` = ? ORDER BY scan_time DESC LIMIT ?";
                    PreparedStatement ps = db.getConnection().prepareStatement(query);
                    ps.setString(1, ctx.queryParam("public_key"));
                    ps.setInt(2, count);
                    ResultSet res = ps.executeQuery();
                    while(res.next()) {
                        JSONObject jsonData = new JSONObject();
                        jsonData.put("public_key", res.getString("public_key"));
                        jsonData.put("scan_time", res.getString("scan_time"));
                        String str = res.getString("data");
                        JSONObject jsonBody = (JSONObject) Utils.parser.parse(str);
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

    /**
     * Method saves and writes the data from an agent to the database
     * @param ctx Data context from an agent
     * @param db Connected database
     */
    public static void setAgentData(Context ctx, DBController db) {
        String body = ctx.body();
        try {
            if (Utils.privateKeyValidation(ctx, db, body)) {
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
                    insertPs.setString(2, sd.bootTime);
                    insertPs.setString(3, sd.agentVersion);
                    insertPs.setString(4, dateFormat.format(sd.time));
                    insertPs.setString(5, sd.jsonData);
                    insertPs.executeUpdate();
                    insertPs.close();
                    ctx.status(200);
                } else {
                    ctx.status(400);
                }
                ps.close();
            } else {
                ctx.status(400);
                ctx.result("Validation Error: private key is incorrect");
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

    public static String getAgentDataInterval(Context ctx, DBController db) {
        if (!authCheck(ctx)) {
            ctx.status(400);
            return "Unauthorized";
        }
        if (ctx.queryParam("public_key") != null && Utils.isOwner(ctx, db, ctx.queryParam("public_key"))) {
            String publicKey = ctx.queryParam("public_key");
            JSONObject jsonResult = new JSONObject();
            String query = "SELECT MAX(`scan_time`) as max, MIN(`scan_time`) as min FROM `AgentData` WHERE `public_key` = ?";
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, publicKey);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    jsonResult.put("public_key", publicKey);
                    SimpleDateFormat dateParser = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                    Date mind = dateParser.parse(res.getString("min"));
                    Date maxd = dateParser.parse(res.getString("max"));
                    jsonResult.put("min", mind.getTime() / 1000L);
                    jsonResult.put("max", maxd.getTime() / 1000L);
                }
                ps.close();
                return jsonResult.toJSONString();
            } catch (SQLException | java.text.ParseException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
        } else {
            ctx.status(400);
            return "Bad request";
        }

    }

    public static String getAgentDataByInterval(Context ctx, DBController db) {
        if (authCheck(ctx)) {
            if (ctx.queryParam("public_key") != null && Utils.isOwner(ctx, db, ctx.queryParam("public_key"))) {
                JSONObject jsonResult = new JSONObject();
                JSONArray jsonArray = new JSONArray();
                try {
                    long startUnix = Long.parseLong(ctx.queryParam("start")) * 1000L;
                    long endUnix = Long.parseLong(ctx.queryParam("end")) * 1000L;
                    long duration = startUnix - endUnix;
                    if (duration > 86400 * 3 && ctx.sessionAttribute("status").equals("user")) {
                        ctx.status(400);
                        return "no premium";
                    }
                    Date startDate = new Date(startUnix);
                    Date endDate = new Date(endUnix);
                    SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
                    JSONParser parser = new JSONParser();
                    String query = "select * from AgentData WHERE (scan_time BETWEEN ? and ?) and public_key = ? and `scan_time` like '%-%-% %:00:%'";
                    PreparedStatement ps = db.getConnection().prepareStatement(query);
                    ps.setString(1, sdf.format(startDate));
                    ps.setString(2, sdf.format(endDate));
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
                } catch (SQLException | ParseException | NumberFormatException throwables) {
                    //throwables.printStackTrace();
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

    /**
     * Method gets and returns the list of all agents
     * @param ctx Context that contains header with access to sending requests
     * @param db Database with agents list
     * @return Returns a string with result
     */
    public static String getAgentList(Context ctx, DBController db) {
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
        } else {
            ctx.status(400);
            return "Unauthorized";
        }
    }

    public static String getUser(Context ctx, DBController db) {
        if (authCheck(ctx)) {
            String mail = ctx.sessionAttribute("mail");
            JSONObject jsonResult = new JSONObject();
            String query = "SELECT * FROM `Users` WHERE `mail` = ?";
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    jsonResult.put("mail", res.getString("mail"));
                    jsonResult.put("settings", Utils.parser.parse(res.getString("settings")));
                }
                ps.close();
                return jsonResult.toJSONString();
            } catch (SQLException | ParseException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
        } else {
            return "Unauthorized";
        }
    }

    public static String getUsers(Context ctx, DBController db) {
        if (authCheck(ctx) && ctx.sessionAttribute("status").equals("admin")) {
            String query = "SELECT * FROM `Users`";
            JSONObject jsonResult = new JSONObject();
            JSONArray jsonUsers = new JSONArray();
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    int id = res.getInt("id");

                    JSONObject jsonUser = new JSONObject();
                    JSONArray jsonAgents = new JSONArray();

                    String sub = "SELECT public_key from User_agents WHERE user_id = ?";
                    PreparedStatement subPs = db.getConnection().prepareStatement(sub);
                    subPs.setInt(1, id);
                    ResultSet subRes = subPs.executeQuery();
                    while (subRes.next()) {
                        JSONObject jsonAgent = new JSONObject();
                        jsonAgent.put("public_key", subRes.getString("public_key"));
                        jsonAgents.add(jsonAgent);
                    }
                    subRes.close();
                    jsonUser.put("mail", res.getString("mail"));
                    jsonUser.put("agents", jsonAgents);
                    JSONObject jsonSettings = (JSONObject) Utils.parser.parse(res.getString("settings"));
                    jsonUser.put("settings", jsonSettings);
                    jsonUsers.add(jsonUser);
                }
                ps.close();
                jsonResult.put("users", jsonUsers);
                return jsonResult.toString();

            } catch (SQLException | ParseException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }

        } else {
            ctx.status(200);
            return "No access";
        }
    }

    public static String getActivePingData(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        JSONArray jsonPings = new JSONArray();
        if (authCheck(ctx)) {
            String mail = ctx.sessionAttribute("mail");
            String getPingList = "SELECT * FROM PingList WHERE user_id = (SELECT id FROM Users WHERE mail = ?);";
            String getDown = "SELECT * FROM DownList WHERE ping_id = ? and down_confirm = 1 and end = 1";
            try {
                PreparedStatement ps = db.getConnection().prepareStatement(getPingList);
                ps.setString(1, mail);
                ResultSet res = ps.executeQuery();
                while (res.next()) {
                    JSONArray jsonDowns = new JSONArray();
                    JSONObject jsonPing = new JSONObject();
                    jsonPing.put("address", res.getString("address"));
                    jsonPing.put("ping_interval", res.getInt("ping_interval"));
                    jsonPing.put("down_timing", res.getInt("down_timing"));
                    jsonPing.put("last_ping_time", res.getInt("last_ping_time"));
                    jsonPing.put("last_code", res.getInt("last_code"));
                    jsonPing.put("response_time", res.getInt("response_time"));
                    if (res.getInt("last_code") >= 200 && res.getInt("last_code") <= 399) {
                        jsonPing.put("current_down", "false");
                    } else {
                        jsonPing.put("current_down", "true");
                    }
                    PreparedStatement ps1 = db.getConnection().prepareStatement(getDown);
                    ps1.setInt(1,res.getInt("id"));
                    ResultSet res1 = ps1.executeQuery();
                    while (res1.next()) {
                        JSONObject jsonDown = new JSONObject();
                        jsonDown.put("start_time", res1.getInt("time"));
                        jsonDown.put("down_duration", res1.getInt("down_time"));
                        jsonDown.put("code", res1.getInt("code"));
                        jsonDowns.add(jsonDown);
                    }
                    jsonPing.put("downs", jsonDowns);
                    jsonPings.add(jsonPing);
                }
                jsonResult.put("pings",jsonPings);
                ctx.status(200);
                return jsonResult.toJSONString().replaceAll("\\\\","");

            } catch (SQLException throwables) {
                ctx.status(400);
                return "Bad request";
            }
        } else {
            ctx.status(400);
            return "Unauthorized";
        }
    }

    public static String mailConfirmation(Context ctx, DBController db, String token) {
        if (token.length() != 20) {
            ctx.status(400);
            return "Your activation link is wrong";
        }
        try {
            String query = "SELECT * FROM `Users` WHERE confirm_code = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, token);
            ResultSet res = ps.executeQuery();
            if (res.next()) {
                String mail = res.getString("mail");
                String insertQuery = "UPDATE `Users` SET `email_confirmed`= 1, `confirm_code`= null WHERE `mail` = ?";
                PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                insertPs.setString(1, mail);
                insertPs.executeUpdate();
                insertPs.close();
                ctx.status(200);
                ctx.redirect("../../login?info=confirmed");
            } else {
                ctx.status(400);
                return "Your activation link is wrong db";
            }
            ps.close();
            return "mail confirmed";
        } catch (SQLException throwables) {
            throwables.printStackTrace();
            ctx.status(400);
            return "Your activation link is wrong";
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
    public static void sendHtml(Context ctx, String path, String access, String redirect) throws IOException {
        switch (access) {
            case "auth_only":
                if (authCheck(ctx)) {
                    String contents = new String(Files.readAllBytes(Paths.get(path)));
                    ctx.html(contents);
                } else {
                    ctx.redirect(redirect);
                }
                break;
            case "admin_only":
                if (authCheck(ctx) && ctx.sessionAttribute("status").equals("admin")) {
                    String contents = new String(Files.readAllBytes(Paths.get(path)));
                    ctx.html(contents);
                } else {
                    ctx.redirect(redirect);
                }
                break;
            case "public":
                String contents = new String(Files.readAllBytes(Paths.get(path)));
                ctx.html(contents);
                break;
        }
    }

    public static String deleteUser(Context ctx, DBController db){
        JSONObject jsonResult = new JSONObject();

        if (ctx.queryParam("mail") == null ) {
            ctx.status(400);
            return "Bad request";
        }

        if (authCheck(ctx) &&  ctx.sessionAttribute("status").equals("admin") || ctx.queryParam("mail").equals(ctx.sessionAttribute("mail"))){
            String mail = ctx.queryParam("mail");
            String delUserAgent = "DELETE FROM User_agents WHERE user_id = (SELECT id from Users where mail = ?)";
            String delUser = "DELETE FROM Users WHERE mail = ?";
            try {
                PreparedStatement delUAPs = db.getConnection().prepareStatement(delUserAgent);
                delUAPs.setString(1, mail);
                delUAPs.executeUpdate();
                delUAPs.close();
                PreparedStatement delUPs = db.getConnection().prepareStatement(delUser);
                delUPs.setString(1, mail);
                delUPs.executeUpdate();
                delUPs.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
                jsonResult.put("user_delete", "false");
                ctx.status(200);
                return jsonResult.toJSONString();
            }
            jsonResult.put("user_delete", "true");
            ctx.status(200);
            return jsonResult.toJSONString();
        } else {
            ctx.status(200);
            return "No access";
        }
    }

    public static String upgradeUser(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        if (authCheck(ctx) && ctx.sessionAttribute("status").equals("admin") && ctx.queryParam("mail") != null) {
            boolean res = Utils.changeSetting(ctx.queryParam("mail"), db, "status", "premium_user");
            if (res) {
                jsonResult.put("user_upgrade", "true");
            } else {
                jsonResult.put("user_upgrade", "false");
            }
            ctx.status(200);
            return jsonResult.toJSONString();
        } else {
            ctx.status(200);
            return "No access";
        }
    }

    public static String getDashboard(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        String token = ctx.queryParam("token");
        String dashboardQ = "SELECT * FROM `Dashboards` WHERE `token` = ?;";
        String userQ = "SELECT `mail` FROM `Users` WHERE `id` = ?;";

        String text;
        String urls;
        String mail;
        int userId;

        try{
            PreparedStatement dashboardPs = db.getConnection().prepareStatement(dashboardQ);
            dashboardPs.setString(1, token);
            ResultSet res = dashboardPs.executeQuery();
            if (res.next()) {
                userId = res.getInt("user_id");
                text = res.getString("text");
                urls = res.getString("urls");
                jsonResult.put("text",text);
            }else{
                ctx.status(400);
                return "Bad request";
            }

            PreparedStatement userPs = db.getConnection().prepareStatement(userQ);
            userPs.setInt(1, userId);
            ResultSet res1 = userPs.executeQuery();
            if (res1.next()) {
                mail = res1.getString("mail");
                jsonResult.put("mail",mail);
            }else{
                ctx.status(400);
                return "Bad request";
            }

            JSONArray jsonUrls = new JSONArray();
            String[] urlArray = urls.split(",");

            for(int i = 0; i < urlArray.length; i++){
                jsonUrls.add(getPing(urlArray[i], db));
            }
            jsonResult.put("urls", jsonUrls);

        }catch (SQLException throwables) {
            throwables.printStackTrace();
            ctx.status(400);
            return "Bad request db";
        }

        return jsonResult.toJSONString().replaceAll("\\\\","").replaceAll(">n<", "><br><");
    }

    public static JSONObject getPing(String address, DBController db) throws SQLException {
        String pingQ = "SELECT `last_ping_time`, `last_code` FROM `PingList` WHERE `address` = ?;";
        JSONObject item = new JSONObject();
        PreparedStatement pingPs = db.getConnection().prepareStatement(pingQ);
        pingPs.setString(1, address.trim());
        ResultSet res =  pingPs.executeQuery();
        if (res.next()) {
            int time = res.getInt("last_ping_time");
            int code = res.getInt("last_code");
            item.put("last_ping_time", time);
            item.put("last_code", code);;
            item.put("url", address.trim());
            pingPs.close();
            return item;
        }else{
            return null;
        }
    }

    public static String checkService(Context ctx, DBController db) {
        JSONObject result = new JSONObject();
        result.put("API", "ok");
        try {
            String query = "SELECT * FROM `Users`";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.executeQuery();
            ctx.status(200);
            result.put("DB", "ok");
            return result.toJSONString();
        } catch (SQLException throwables) {
            result.put("DB", "error");
            ctx.status(500);
            return result.toJSONString();
        }
    }

    public static void createCSRF(Context ctx) {
        try {
            String secret_key = Utils.generateKey();
            byte[] salt = Utils.getSalt();
            Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
            String token = encoder.encodeToString(Utils.hash(secret_key, salt));
            ctx.cookie("csrf_token", token);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            e.printStackTrace();
        }
    }

    public static boolean checkCSRF(Context ctx) {
        if (ctx.header("csrf") != null && ctx.cookie("csrf_token") != null)
            return Objects.equals(ctx.header("csrf"), ctx.cookie("csrf_token"));
        else return false;
    }
}