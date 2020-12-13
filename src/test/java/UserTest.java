package test.java;

import io.javalin.http.Context;
import main.java.DBController;
import main.java.Mail;
import main.java.User;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserTest {

    UserTest() throws ParseException, IOException, SQLException, ClassNotFoundException {}

    private Context ctx = mock(Context.class);

    String config = new String(Files.readAllBytes(Paths.get("config.txt")));
    JSONParser parser = new JSONParser();
    JSONObject jsonConfig = (JSONObject) parser.parse(config);
    public DBController db = new DBController((String) jsonConfig.get("test-user"), (String) jsonConfig.get("test-pass"), (String) jsonConfig.get("test-url"));

    private void executeUpdate(String query) throws SQLException {
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        ps.executeUpdate();
        ps.close();
    }

    @Test
    void authorization() throws SQLException {
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, email_confirmed, settings) values ('authorization@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', 1, '{}')");

        when(ctx.formParam("mail")).thenReturn("authorization@test.com");
        when(ctx.formParam("pass")).thenReturn("NewPassword123");
        json.put("auth", "true");
        json.put("info", "user is authorized");
        assertEquals(json.toString(), User.authorization(ctx, db));

        executeUpdate("delete from Users where mail = 'authorization@test.com'");

        executeUpdate("insert into Users (mail, salt, pwd, email_confirmed, settings) values ('authorization@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', 0, '{}')");
        when(ctx.formParam("mail")).thenReturn("authorization@test.com");
        when(ctx.formParam("pass")).thenReturn("NewPassword123");
        json.clear();
        json.put("auth", "false");
        json.put("info", "confirm account with mail");
        assertEquals(json.toString(), User.authorization(ctx, db));

        when(ctx.formParam("pass")).thenReturn("Password123");
        json.clear();
        json.put("auth", "false");
        json.put("info", "wrong pass");
        assertEquals(json.toString(), User.authorization(ctx, db));

        when(ctx.formParam("mail")).thenReturn("authorization123@test.com");
        when(ctx.formParam("pass")).thenReturn("NewPassword123");
        json.clear();
        json.put("auth", "false");
        json.put("info", "wrong mail");
        assertEquals(json.toString(), User.authorization(ctx, db));

        executeUpdate("delete from Users where mail = 'authorization@test.com'");

        db.getConnection().close();
    }

    @Test
    void registration() throws SQLException {
        JSONObject json = new JSONObject();
        Mail mail = mock(Mail.class);

        when(ctx.formParam("mail")).thenReturn("registration@test.com");
        when(ctx.formParam("pass")).thenReturn("NewPassword123");
        when(ctx.formParam("lang")).thenReturn("en");
        json.put("register", "true");
        json.put("info", "Confirmation mail sent");
        json.put("mail", "registration@test.com");
        assertEquals(json.toString(), User.registration(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("registration@test.com");
        when(ctx.formParam("pass")).thenReturn("NewPassword123");
        when(ctx.formParam("lang")).thenReturn("en");
        json.clear();
        json.put("register", "false");
        json.put("info", "User already exists");
        assertEquals(json.toString(), User.registration(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("qwewqdsffsgfad@gmail.com");
        when(ctx.formParam("pass")).thenReturn("example");
        when(ctx.formParam("lang")).thenReturn("en");
        json.clear();
        json.put("register", "false");
        json.put("info", "An error occurred: validation not passed");
        assertEquals(json.toString(), User.registration(ctx, db, mail));

        executeUpdate("delete from Users where mail = 'registration@test.com'");

        db.getConnection().close();
    }

    @Test
    void addAgent() throws SQLException {
        JSONObject json = new JSONObject();

        when(ctx.sessionAttribute("auth")).thenReturn("null");
        assertEquals("Unauthorized", User.addAgent(ctx, db));

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('addAgent@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.formParam("public_key")).thenReturn("addAgentTest");
        when(ctx.formParam("secret_key")).thenReturn("addAgentTest-SecretKey");
        when(ctx.formParam("host")).thenReturn("AddAgent.test.com");
        when(ctx.sessionAttribute("status")).thenReturn("user");

        when(ctx.sessionAttribute("mail")).thenReturn("addAgent@test.com");
        json.put("add", "true");
        json.put("info", "Added");
        assertEquals(json.toString(), User.addAgent(ctx, db));

        json.clear();
        json.put("add", "false");
        json.put("info", "agent already exists");
        assertEquals(json.toString(), User.addAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn("addAgentTest1");
        User.addAgent(ctx, db);
        when(ctx.formParam("public_key")).thenReturn("addAgentTest2");
        User.addAgent(ctx, db);

        when(ctx.formParam("public_key")).thenReturn("addAgentTest3");
        json.clear();
        json.put("add", "false");
        json.put("info", "no premium");
        assertEquals(json.toString(), User.addAgent(ctx, db));

        executeUpdate("delete from User_agents where public_key = 'addAgentTest2'");
        executeUpdate("delete from User_agents where public_key = 'addAgentTest1'");
        executeUpdate("delete from User_agents where public_key = 'addAgentTest'");
        executeUpdate("delete from Users where mail = 'addAgent@test.com'");
        executeUpdate("delete from Agents where public_key = 'addAgentTest2'");
        executeUpdate("delete from Agents where public_key = 'addAgentTest1'");
        executeUpdate("delete from Agents where public_key = 'addAgentTest'");

        db.getConnection().close();
    }

    @Test
    void deleteAgent() throws SQLException {
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('deleteAgent@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");

        when(ctx.sessionAttribute("auth")).thenReturn("null");
        assertEquals("Unauthorized", User.addAgent(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("mail")).thenReturn("deleteAgent@test.com");
        when(ctx.formParam("public_key")).thenReturn("deleteAgentTest1");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('deleteAgentTest1', 'deleteAgentTest1-secretKey', 'deleteAgent.test.com')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'deleteAgent@test.com'), 'deleteAgentTest1')");
        json.put("delete", "true");
        json.put("info", "deleteAgentTest1 deleted");
        assertEquals(json.toString(), User.deleteAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn(null);
        assertEquals("An error occurred: either public key is null or agent's owner is someone else", User.deleteAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn("deleteAgentTest1");
        when(ctx.sessionAttribute("mail")).thenReturn("example@gmail.com");
        assertEquals("An error occurred: either public key is null or agent's owner is someone else", User.deleteAgent(ctx, db));

        executeUpdate("delete from User_agents where public_key = 'deleteAgentTest1'");
        executeUpdate("delete from Agents where public_key = 'deleteAgentTest1'");
        executeUpdate("delete from Users where mail = 'deleteAgent@test.com'");

        db.getConnection().close();
    }

    @Test
    void resetPassword() throws SQLException {
        Mail mail = mock(Mail.class);
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, email_confirmed, settings) values ('resetPassword@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', 0, '{}')");

        when(ctx.formParam("mail")).thenReturn(null);
        assertEquals("Bad Request", User.resetPassword(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("resetPassword@test.com");
        when(ctx.formParam("lang")).thenReturn(null);
        assertEquals("Bad Request", User.resetPassword(ctx, db, mail));

        when(ctx.formParam("lang")).thenReturn("en");
        json.put("reset", "false");
        json.put("info", "mail not confirmed");
        assertEquals(json.toString(), User.resetPassword(ctx, db, mail));

        executeUpdate("update Users set email_confirmed = 1 where mail = 'resetPassword@test.com'");

        json.clear();
        json.put("reset", "true");
        json.put("info", "Confirmation mail sent");
        json.put("mail", "resetPassword@test.com");
        assertEquals(json.toString(), User.resetPassword(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("resetPassword123@test.com");
        json.clear();
        json.put("reset", "false");
        json.put("info", "mail not found");
        assertEquals(json.toString(), User.resetPassword(ctx, db, mail));

        executeUpdate("delete from Users where mail = 'resetPassword@test.com'");

        db.getConnection().close();
    }

    @Test
    void changePassword() throws SQLException {
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, settings, reset_code) values ('changePassword@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}', 'iknl9vrnwfijntq76544')");

        when(ctx.formParam("token")).thenReturn(null);
        json.put("reset", "false");
        json.put("info", "An error occurred: null values");
        assertEquals(json.toString(), User.changePassword(ctx, db));

        when(ctx.formParam("new_pass")).thenReturn(null);
        json.clear();
        json.put("reset", "false");
        json.put("info", "An error occurred: null values");
        assertEquals(json.toString(), User.changePassword(ctx, db));

        when(ctx.formParam("token")).thenReturn("iknl9vrnwfijntq76544");
        when(ctx.formParam("new_pass")).thenReturn("newpass");
        json.clear();
        json.put("reset", "false");
        json.put("info", "An error occurred: validation not passed");
        assertEquals(json.toString(), User.changePassword(ctx, db));

        when(ctx.formParam("new_pass")).thenReturn("NewPassword12345");
        json.clear();
        json.put("reset", "true");
        json.put("info", "new password set");
        assertEquals(json.toString(), User.changePassword(ctx, db));

        executeUpdate("delete from Users where mail = 'changePassword@test.com'");

        db.getConnection().close();
    }

    @Test
    void addActivePing() throws SQLException {
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('addActivePing@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");

        when(ctx.sessionAttribute("auth")).thenReturn(null);
        assertEquals("Unauthorized", User.addActivePing(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.formParam("address")).thenReturn(null);
        assertEquals("bad request", User.addActivePing(ctx, db));

        when(ctx.formParam("address")).thenReturn("google.com");
        assertEquals("An error occurred: validation not passed", User.addActivePing(ctx, db));

        when(ctx.formParam("down_timing")).thenReturn("4");
        when(ctx.formParam("ping_interval")).thenReturn("4");
        when(ctx.formParam("address")).thenReturn("http://google123.com/");
        when(ctx.sessionAttribute("status")).thenReturn("user");
        when(ctx.sessionAttribute("mail")).thenReturn("addActivePing@test.com");
        json.put("add", "false");
        json.put("info", "no premium");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        when(ctx.formParam("ping_interval")).thenReturn("61");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        when(ctx.formParam("down_timing")).thenReturn("4");
        when(ctx.formParam("ping_interval")).thenReturn("5");
        assertEquals("bad request", User.addActivePing(ctx, db));

        when(ctx.formParam("down_timing")).thenReturn("0");
        assertEquals("bad request", User.addActivePing(ctx, db));

        when(ctx.formParam("down_timing")).thenReturn("61");
        assertEquals("bad request", User.addActivePing(ctx, db));

        when(ctx.formParam("down_timing")).thenReturn("5");
        when(ctx.formParam("ping_interval")).thenReturn("5");
        json.clear();
        json.put("add_ping", "true");
        json.put("info", "ping added");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        json.clear();
        json.put("add_ping", "false");
        json.put("info", "ping already exists");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        executeUpdate("delete from PingList where address = 'http://google123.com/'");
        executeUpdate("delete from Users where mail = 'addActivePing@test.com'");

        db.getConnection().close();
    }

    @Test
    void deleteActivePing() throws SQLException {
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('deleteActivePing@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("insert into PingList (user_id, address, ping_interval, down_timing) values ((select id from Users where mail = 'deleteActivePing@test.com'), 'http://google123.com/', 5, 5)");

        when(ctx.sessionAttribute("auth")).thenReturn(null);
        assertEquals("Unauthorized", User.deleteActivePing(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.formParam("address")).thenReturn(null);
        assertEquals("Bad request", User.deleteActivePing(ctx, db));

        when(ctx.formParam("address")).thenReturn("http://google123.com/");
        when(ctx.sessionAttribute("mail")).thenReturn("deleteActivePing@test.com");
        json.put("delete", "true");
        json.put("info", "deleteActivePing@test.com delete http://google123.com/");
        assertEquals(json.toString(), User.deleteActivePing(ctx, db));

        executeUpdate("delete from Users where mail = 'deleteActivePing@test.com'");

        db.getConnection().close();
    }

    @Test
    void changeLang() throws SQLException {
        JSONObject json = new JSONObject();

        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('changeLang@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{\"lang\": \"en\", \"status\": \"user\"}')");

        when(ctx.sessionAttribute("auth")).thenReturn(null);
        assertEquals("Unauthorized", User.deleteActivePing(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.queryParam("lang")).thenReturn(null);
        assertEquals("Bad Request", User.changeLang(ctx, db));

        when(ctx.queryParam("lang")).thenReturn("ua");
        when(ctx.sessionAttribute("mail")).thenReturn("changeLang@test.com");
        json.put("change", "true");
        assertEquals(json.toString(), User.changeLang(ctx, db));

        when(ctx.queryParam("lang")).thenReturn("en");
        assertEquals(json.toString(), User.changeLang(ctx, db));

        executeUpdate("delete from Users where mail = 'changeLang@test.com'");

        db.getConnection().close();
    }
}