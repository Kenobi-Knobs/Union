package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;

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
     */
    public DBController connect() throws SQLException, ClassNotFoundException {
        DBController db = new DBController("HcVe4sjBJU", "A7xIVTWbwK", "jdbc:mysql://remotemysql.com:3306/HcVe4sjBJU");
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
        if (ctx.queryParam("public_key") != null) {
            JSONObject jsonData = new JSONObject();
            try {
                String query = "SELECT * FROM `AgentData` WHERE `public_key` = ? ORDER BY scan_time DESC LIMIT 1";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setString(1, ctx.queryParam("public_key"));
                ResultSet res = ps.executeQuery();
                while(res.next()) {
                    JSONParser parser = new JSONParser();
                    jsonData.put("public_key", res.getString("public_key"));
                    jsonData.put("scan_time", res.getString("scan_time"));
                    String str = res.getString("data");
                    JSONObject jsonBody = (JSONObject) parser.parse(str);
                    jsonData.put("data", jsonBody);
                }
                ps.close();
                return jsonData.toString();
            } catch (SQLException | ParseException throwables) {
                throwables.printStackTrace();
                ctx.status(400);
                return "Bad request";
            }
        } else {
            ctx.status(400);
            return "Bad request";
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
                    String insertQuery = "INSERT INTO `AgentData`(`public_key`, `scan_time`, `data`) VALUES (?,?,?)";
                    PreparedStatement insertPs = db.getConnection().prepareStatement(insertQuery);
                    insertPs.setString(1, sd.publicKey);
                    insertPs.setString(2, dateFormat.format(sd.time));
                    insertPs.setString(3,sd.jsonData);
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
     * @return Returns a string with result
     */
    public String getAgentList(Context ctx, DBController db) {
        JSONObject jsonResult = new JSONObject();
        JSONArray jsonAgents = new JSONArray();
        try {
            String query = "SELECT * FROM `Agents`";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ResultSet res = ps.executeQuery();
            while(res.next()) {
                JSONObject jsonAgent = new JSONObject();
                jsonAgent.put("host", res.getString("host"));
                jsonAgent.put("boot_time", res.getString("boot_time"));
                jsonAgent.put("public_key", res.getString("public_key"));
                jsonAgent.put("agent_version", res.getString("agent_version"));
                jsonAgents.add(jsonAgent);
            }
            ps.close();
            jsonResult.put("agents", jsonAgents);

            return jsonResult.toString();

        } catch (SQLException throwables) {
            throwables.printStackTrace();
            ctx.header("Access-Control-Allow-Origin","*");
            return jsonResult.toString();
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
            if (mail.equals("example@gmail.com")) {
                if (pass.equals("password")) {
                    jsonResult.put("auth", "true");
                    jsonResult.put("info", "user is authorized");
                    ctx.sessionAttribute("auth", "true");
                } else {
                    jsonResult.put("auth", "false");
                    jsonResult.put("info", "wrong pass");
                }
            } else {
                jsonResult.put("auth", "false");
                jsonResult.put("info", "wrong mail");
            }
        } else {
            ctx.status(400);
        }
        return jsonResult.toString();
    }
}
