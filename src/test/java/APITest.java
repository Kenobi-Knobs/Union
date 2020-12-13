package test.java;

import io.javalin.http.Context;
import main.java.API;
import main.java.DBController;
import main.java.Utils;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;
import org.w3c.dom.ls.LSOutput;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class APITest {

    private Context ctx = mock(Context.class);

    String config = new String(Files.readAllBytes(Paths.get("config.txt")));
    JSONParser parser = new JSONParser();
    JSONObject jsonConfig = (JSONObject) parser.parse(config);
    private DBController db = new DBController((String) jsonConfig.get("test-user"), (String) jsonConfig.get("test-pass"), (String) jsonConfig.get("test-url"));

    APITest() throws SQLException, ClassNotFoundException, IOException, ParseException {
        when(ctx.sessionAttribute("auth")).thenReturn("false");
    }

    private void executeUpdate(String query) throws SQLException {
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        ps.executeUpdate();
        ps.close();
    }

    private ResultSet executeQuery(String query) throws SQLException {
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        return ps.executeQuery();
    }

    @Test
    void isAuth() {
        JSONObject json = new JSONObject();

        json.put("auth", "false");
        assertEquals(json.toString(), API.isAuth(ctx));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("mail")).thenReturn("isAuth@test.com");
        when(ctx.sessionAttribute("status")).thenReturn("user");
        json.clear();
        json.put("mail", "isAuth@test.com");
        json.put("auth", "true");
        json.put("status", "user");
        assertEquals(json.toString(), API.isAuth(ctx));
    }

    @Test
    void authCheck() {
        assertFalse(API.authCheck(ctx));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        assertTrue(API.authCheck(ctx));
    }

    @Test
    void getAgentData() throws SQLException {
        JSONObject json = new JSONObject();
        JSONArray jsonArray = new JSONArray();

        assertEquals("Unauthorized", API.getAgentData(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.queryParam("public_key")).thenReturn(null);
        assertEquals("Bad request", API.getAgentData(ctx, db));

        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getAgentData', 'getAgentData-secret-key', 'getAgentData.test.com')");
        executeUpdate("insert into AgentData (public_key, boot_time, agent_version, scan_time, data) values ('getAgentData', '2020-07-27 19:45:52'," +
                "'0.1.0', '2020-09-10 19:20:09', '{\"data\": \"test\"}')");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getAgentData@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{}')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getAgentData@test.com'), 'getAgentData')");
        when(ctx.queryParam("count")).thenReturn("1");
        when(ctx.queryParam("public_key")).thenReturn("getAgentData");
        when(ctx.sessionAttribute("mail")).thenReturn("getAgentData@test.com");
        json.put("public_key", "getAgentData");
        json.put("scan_time", "2020-09-10 19:20:09");
        JSONObject temp = new JSONObject();
        temp.put("data", "test");
        json.put("data", temp);
        jsonArray.add(json);
        JSONObject result = new JSONObject();
        result.put("dataset", jsonArray);
        assertEquals(result.toString(), API.getAgentData(ctx, db));

        executeUpdate("delete from User_agents where public_key = 'getAgentData'");
        executeUpdate("delete from Users where mail = 'getAgentData@test.com'");
        executeUpdate("delete from AgentData where public_key = 'getAgentData'");
        executeUpdate("delete from Agents where public_key = 'getAgentData'");

        db.getConnection().close();
    }

    @Test
    void setAgentData() throws SQLException {
        //executeUpdate("insert into Agents (public_key, secret_key, host) values ('setAgentData', 'D96B6E76CB921F0AA7E981C55BC88C3D184D3C0232D1B1C297B9260C6387263B', 'google.com')");

    }

    @Test
    void getAgentDataByInterval() {
        assertEquals("Unauthorized", API.getAgentDataByInterval(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.queryParam("public_key")).thenReturn(null);
        assertEquals("Bad request", API.getAgentDataByInterval(ctx, db));

        System.out.println(Long.parseLong("300") * 1000L);
        /*executeUpdate("insert into ");
        when(ctx.queryParam("public_key")).thenReturn(null);*/
    }

    @Test
    void getAgentList() throws SQLException {
        assertEquals("Unauthorized", API.getAgentList(ctx, db));

        JSONObject json = new JSONObject();
        JSONArray agents = new JSONArray();

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getAgentList@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{}')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getAgentListTest1', 'getAgentList-secret1', 'google.com')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getAgentListTest2', 'getAgentList-secret2', 'google.com')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getAgentListTest3', 'getAgentList-secret3', 'google.com')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getAgentList@test.com'), 'getAgentListTest1')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getAgentList@test.com'), 'getAgentListTest2')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getAgentList@test.com'), 'getAgentListTest3')");
        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("mail")).thenReturn("getAgentList@test.com");
        JSONObject agent1 = new JSONObject();
        agent1.put("host", "google.com");
        agent1.put("public_key", "getAgentListTest1");
        agents.add(agent1);
        JSONObject agent2 = new JSONObject();
        agent2.put("host", "google.com");
        agent2.put("public_key", "getAgentListTest2");
        agents.add(agent2);
        JSONObject agent3 = new JSONObject();
        agent3.put("host", "google.com");
        agent3.put("public_key", "getAgentListTest3");
        agents.add(agent3);
        json.put("agents", agents);
        assertEquals(json.toString(), API.getAgentList(ctx, db));

        executeUpdate("delete from User_agents where public_key = 'getAgentListTest1'");
        executeUpdate("delete from User_agents where public_key = 'getAgentListTest2'");
        executeUpdate("delete from User_agents where public_key = 'getAgentListTest3'");
        executeUpdate("delete from Agents where public_key = 'getAgentListTest1'");
        executeUpdate("delete from Agents where public_key = 'getAgentListTest2'");
        executeUpdate("delete from Agents where public_key = 'getAgentListTest3'");
        executeUpdate("delete from Users where mail = 'getAgentList@test.com'");

        db.getConnection().close();
    }

    @Test
    void getUser() throws SQLException {
        assertEquals("Unauthorized", API.getUser(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getUser@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{}')");
        when(ctx.sessionAttribute("mail")).thenReturn("getUser@test.com");
        assertEquals("{\"settings\":{},\"mail\":\"getUser@test.com\"}", API.getUser(ctx, db));

        executeUpdate("delete from Users where mail = 'getUser@test.com'");

        db.getConnection().close();
    }

    @Test
    void getAgentDataInterval() {
        assertEquals("Unauthorized", API.getAgentDataInterval(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.queryParam("public_key")).thenReturn(null);
        assertEquals("Bad request", API.getAgentDataInterval(ctx, db));


        when(ctx.queryParam("public_key")).thenReturn(null);
    }

    @Test
    void getActivePingData() throws SQLException {
        JSONObject jsonPing = new JSONObject();
        JSONObject jsonDown = new JSONObject();
        JSONArray jsonPings = new JSONArray();
        JSONArray jsonDowns = new JSONArray();
        JSONObject json = new JSONObject();

        assertEquals("Unauthorized", API.getActivePingData(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("mail")).thenReturn("getActivePingData@test.com");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getActivePingData@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{}')");
        executeUpdate("insert into PingList (id, user_id, address, ping_interval, last_ping_time, last_code, down_timing, current_down) " +
         "values (null, (select id from Users where mail = 'getActivePingData@test.com'), 'https://googled.com', '1', null, '502', '1', null);");
        executeUpdate("insert into DownList (id, ping_id, time, down_time, code, down_confirm, end) values " +
                "(null, (select id from PingList where user_id = (select id from Users where mail = 'getActivePingData@test.com')), 1, 1, 1, 1, 1);");
        jsonPing.put("address", "https://googled.com");
        jsonPing.put("ping_interval", 1);
        jsonPing.put("down_timing", 1);
        jsonPing.put("last_ping_time", 0);
        jsonPing.put("last_code", 502);
        jsonPing.put("current_down", "true");
        jsonPings.add(jsonPing);
        jsonDown.put("start_time", 1);
        jsonDown.put("down_duration", 1);
        jsonDown.put("code", 1);
        jsonDowns.add(jsonDown);
        jsonPing.put("downs", jsonDowns);
        json.put("pings", jsonPings);
        assertEquals(json.toString().replaceAll("\\\\", ""), API.getActivePingData(ctx, db));

        executeUpdate("delete from DownList where 1");
        executeUpdate("delete from PingList where 1");
        executeUpdate("delete from Users where 1");

        db.getConnection().close();
    }

    @Test
    void mailConfirmation() throws SQLException {
        assertEquals("Your activation link is wrong", API.mailConfirmation(ctx, db, "123"));

        String token = Utils.generateKey();
        assertEquals("Your activation link is wrong db", API.mailConfirmation(ctx, db, token));

        executeUpdate("insert into Users (mail, salt, pwd, confirm_code, settings) values ('mailConfirmation@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '" + token + "', '{}')");
        when(ctx.sessionAttribute("mail")).thenReturn("mailConfirmation@test.com");
        assertEquals("mail confirmed", API.mailConfirmation(ctx, db, token));

        executeUpdate("delete from Users where mail = 'mailConfirmation@test.com'");

        db.getConnection().close();
    }

    @Test
    void sendHtml() {

    }

    @Test
    void getUsers() throws SQLException, ParseException {
        assertEquals("No access", API.getUsers(ctx, db));

        JSONObject json = new JSONObject();
        JSONArray users = new JSONArray();

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("status")).thenReturn("admin");

        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getUsersTestAgent1', 'getUsersTestAgent1-secretKey', 'google.com')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getUsersTestAgent2', 'getUsersTestAgent2-secretKey', 'google.com')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('getUsersTestAgent3', 'getUsersTestAgent3-secretKey', 'google.com')");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getUsers@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{}')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getUsers@test.com'), 'getUsersTestAgent1')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getUsers@test.com'), 'getUsersTestAgent2')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getUsers@test.com'), 'getUsersTestAgent3')");

        ResultSet rs = executeQuery("select * from Users");
        while (rs.next()) {
            int id = rs.getInt("id");

            JSONObject jsonUser = new JSONObject();
            JSONArray jsonAgents = new JSONArray();

            ResultSet subRes = executeQuery("select public_key from User_agents where user_id = " + id);
            while (subRes.next()) {
                JSONObject jsonAgent = new JSONObject();
                jsonAgent.put("public_key", subRes.getString("public_key"));
                jsonAgents.add(jsonAgent);
            }
            subRes.close();
            jsonUser.put("mail", rs.getString("mail"));
            jsonUser.put("agents", jsonAgents);
            JSONObject jsonSettings = (JSONObject) Utils.parser.parse(rs.getString("settings"));
            jsonUser.put("settings", jsonSettings);
            users.add(jsonUser);
        }

        json.put("users", users);
        assertEquals(json.toString(), API.getUsers(ctx, db));

        executeUpdate("delete from User_agents where public_key = 'getUsersTestAgent1'");
        executeUpdate("delete from User_agents where public_key = 'getUsersTestAgent2'");
        executeUpdate("delete from User_agents where public_key = 'getUsersTestAgent3'");
        executeUpdate("delete from Users where mail = 'getUsers@test.com'");
        executeUpdate("delete from Agents where public_key = 'getUsersTestAgent1'");
        executeUpdate("delete from Agents where public_key = 'getUsersTestAgent2'");
        executeUpdate("delete from Agents where public_key = 'getUsersTestAgent3'");

        db.getConnection().close();
    }

    @Test
    void deleteUser() throws SQLException {
        JSONObject json = new JSONObject();

        assertEquals("No access", API.deleteUser(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("status")).thenReturn("admin");
        when(ctx.queryParam("mail")).thenReturn(null);
        assertEquals("Bad request", API.deleteUser(ctx, db));

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('deleteUser1@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{}')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('deleteUserTestAgent1', 'deleteUserTestAgent1-secretKey', 'google.com')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'deleteUser1@test.com'), 'deleteUserTestAgent1')");

        when(ctx.queryParam("mail")).thenReturn("deleteUser1@test.com");
        when(ctx.sessionAttribute("mail")).thenReturn("deleteUser@test.com");
        json.put("user_delete", "true");
        assertEquals(json.toString(), API.deleteUser(ctx, db));

        executeUpdate("delete from Agents where public_key = 'deleteUserTestAgent1'");

        db.getConnection().close();
    }

    @Test
    void upgradeUser() throws SQLException {
        JSONObject json = new JSONObject();

        assertEquals("No access", API.deleteUser(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("status")).thenReturn("admin");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('upgradeUser@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', '{\"lang\": \"en\", \"status\": \"user\"}')");
        when(ctx.queryParam("mail")).thenReturn("upgradeUser@test.com");
        json.put("user_upgrade", "true");
        assertEquals(json.toString(), API.upgradeUser(ctx, db));

        executeUpdate("delete from Users where mail = 'upgradeUser@test.com'");

        db.getConnection().close();
    }

    @Test
    void checkService() {
        JSONObject json = new JSONObject();

        json.put("API", "ok");
        json.put("DB", "ok");
        assertEquals(json.toString(), API.checkService(ctx, db));
    }

    @Test
    void createCSRF() {
        /*String token = Utils.generateKey();
        API.createCSRF(ctx);
        assertEquals(token.length(), ctx.cookie("csrf_token").length());*/
    }

    @Test
    void checkCSRF() {
        when(ctx.cookie("csrf_token")).thenReturn(null);
        assertFalse(API.checkCSRF(ctx));

        when(ctx.header("csrf")).thenReturn("123");
        when(ctx.cookie("csrf")).thenReturn("123");
        assertTrue(API.checkCSRF(ctx));
    }
}