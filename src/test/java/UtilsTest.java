package test.java;

import io.javalin.http.Context;
import main.java.DBController;
import main.java.Utils;
import org.jetbrains.annotations.NotNull;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.Mockito;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UtilsTest {

    UtilsTest() throws ParseException, IOException, SQLException, ClassNotFoundException {}

    private Context ctx = mock(Context.class);

    String config = new String(Files.readAllBytes(Paths.get("config.txt")));
    JSONParser parser = new JSONParser();
    JSONObject jsonConfig = (JSONObject) parser.parse(config);
    private DBController db = new DBController((String) jsonConfig.get("test-user"), (String) jsonConfig.get("test-pass"), (String) jsonConfig.get("test-url"));

    private void executeUpdate(String query) throws SQLException {
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        ps.executeUpdate();
        ps.close();
    }

    @Test
    void isOwner() throws SQLException {
        executeUpdate("INSERT INTO `Users` (`mail`, `salt`, `pwd`, `email_confirmed`, `confirm_code`, `settings`) " +
                        "VALUES ('isOwner@test.com', 'wbd55uUmEOErnmDkZ3CZIA', 'eZNyxbDiP3kt9tsCF7ZWfh4zZbPLWLlbVtqMhqwtkf0', 0, 'q8ac1x9jvh9evkal963q', '{\"lang\": \"en\", \"status\": \"user\"}');");
        executeUpdate("insert into Agents (public_key, secret_key, host) values('qwerty', 'qwerty-secret', 'google.com')");
        executeUpdate("insert into User_agents (user_id, public_key) VALUES ((select id from Users where mail = 'isOwner@test.com'), 'qwerty')");
        when(ctx.sessionAttribute("mail")).thenReturn("isOwner@test.com");
        assertTrue(Utils.isOwner(ctx, db, "qwerty"));
        assertFalse(Utils.isOwner(ctx, db, "glsdak"));

        executeUpdate("delete from User_agents where public_key = 'qwerty'");
        executeUpdate("delete from Agents where public_key = 'qwerty'");
        executeUpdate("delete from Users where mail = 'isOwner@test.com'");

        db.getConnection().close();
    }

    @Test
    void privateKeyValidation() throws SQLException {
        JSONObject json = new JSONObject();

        //executeUpdate(db, "insert into Agents (public_key, secret_key, host) values ('gor-tss', 'D96B6E76CB921F0AA7E981C55BC88C3D184D3C0232D1B1C297B9260C6387263B', 'google.com')");

        when(ctx.header("Sign")).thenReturn("D96B6E76CB921F0AA7E981C55BC88C3D184D3C0232D1B1C297B9260C6387263B");
        when(json.get("public_key")).thenReturn("gor-tss");
        assertTrue(Utils.privateKeyValidation(ctx, db, json.toString()));

        executeUpdate("delete from Agents where public_key = 'gor-tss'");

        db.getConnection().close();
    }

    @Test
    void registrationValidation() {
        assertTrue(Utils.registrationValidation("example@gmail.com", "TestPassword12345"));
        assertFalse(Utils.registrationValidation("example@gmail.com", "example"));
    }

    @Test
    void passwordValidation() {
        assertTrue(Utils.passwordValidation("TestPassword12345"));
        assertFalse(Utils.passwordValidation("example"));
    }

    @Test
    void addAgentValidation() {
        when(ctx.formParam("public_key")).thenReturn("yura_test");
        when(ctx.formParam("secret_key")).thenReturn("secret-key");
        when(ctx.formParam("host")).thenReturn("google.com");
        assertTrue(Utils.addAgentValidation(ctx));

        when(ctx.formParam("host")).thenReturn("google");
        assertFalse(Utils.addAgentValidation(ctx));
    }

    @Test
    void pingValidation() {
        assertTrue(Utils.pingValidation("http://google.com"));
        assertTrue(Utils.pingValidation("https://google.com"));
        assertFalse(Utils.pingValidation("google.com"));
    }

    @Test
    void getSalt() {
        assertNotNull(Utils.getSalt());
    }

    @Test
    void hash() throws InvalidKeySpecException, NoSuchAlgorithmException {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        Base64.Decoder decoder = Base64.getUrlDecoder();
        assertEquals("5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0",
                encoder.encodeToString(Utils.hash("NewPassword123",
                decoder.decode("prHpPCZF_dqKEQx9AvWXrA"))));
        assertNotEquals("5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t1",
                encoder.encodeToString(Utils.hash("NewPassword123",
                decoder.decode("prHpPCZF_dqKEQx9AvWXrA"))));
    }

    @Test
    void generateKey() {
        assertNotNull(Utils.generateKey());
    }

    @Test
    void changeSetting() throws SQLException {
        executeUpdate("insert into Users (mail, salt, pwd, settings) values('changeSettings@test.com', 'uGhp_sia4HOydmWHBVPzIB', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', " +
                " '{\"lang\": \"en\", \"status\": \"user\"}')");

        assertTrue(Utils.changeSetting("changeSettings@test.com", db, "lang", "en"));
        assertTrue(Utils.changeSetting("changeSettings@test.com", db, "status", "admin"));

        executeUpdate("delete from Users where mail = 'changeSettings@test.com'");

        db.getConnection().close();
    }

    @Test
    void getAgentCount() throws SQLException {
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getAgentCount@test.com', 'uGhp_sia4HOydmWHBVPzIB', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('public-one', 'secret-one', 'google.com')");
        executeUpdate("insert into Agents (public_key, secret_key, host) values ('public-two', 'secret-two', 'google.com')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getAgentCount@test.com'), 'public-one')");
        executeUpdate("insert into User_agents (user_id, public_key) values ((select id from Users where mail = 'getAgentCount@test.com'), 'public-two')");

        when(ctx.sessionAttribute("mail")).thenReturn("getAgentCount@test.com");
        assertEquals(2, Utils.getAgentCount(ctx, db));

        executeUpdate("delete from User_agents where public_key = 'public-one'");
        executeUpdate("delete from User_agents where public_key = 'public-two'");
        executeUpdate("delete from Agents where public_key = 'public-one'");
        executeUpdate("delete from Agents where public_key = 'public-two'");
        executeUpdate("delete from Users where mail = 'getAgentCount@test.com'");

        db.getConnection().close();
    }

    @Test
    void getPingCount() throws SQLException {
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getPingCount@test.com', 'uGhp_sia4HOydmWHBVPzIB', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("insert into PingList (user_id, address, ping_interval, down_timing) values ((select id from Users where mail = 'getPingCount@test.com'), 'https://google.com', 5, 5)");
        executeUpdate("insert into PingList (user_id, address, ping_interval, down_timing) values ((select id from Users where mail = 'getPingCount@test.com'), 'http://google.com', 5, 5)");
        executeUpdate("insert into PingList (user_id, address, ping_interval, down_timing) values ((select id from Users where mail = 'getPingCount@test.com'), 'http://twitter.com', 5, 5)");

        when(ctx.sessionAttribute("mail")).thenReturn("getPingCount@test.com");
        assertEquals(3, Utils.getPingCount(ctx, db));

        executeUpdate("delete from PingList where address = 'https://google.com'");
        executeUpdate("delete from PingList where address = 'http://google.com'");
        executeUpdate("delete from PingList where address = 'http://twitter.com'");
        executeUpdate("delete from Users where mail = 'getPingCount@test.com'");

        db.getConnection().close();
    }
}