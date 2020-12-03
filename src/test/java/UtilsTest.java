package test.java;

import io.javalin.http.Context;
import main.java.DBController;
import main.java.Utils;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.Test;

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

    public DBController db = new DBController(
            (String) jsonConfig.get("user"),
            (String) jsonConfig.get("pass"),
            (String) jsonConfig.get("url")
    );

    @Test
    void isOwner() throws SQLException {
        when(ctx.sessionAttribute("mail")).thenReturn("example@gmail.com");
        assertTrue(Utils.isOwner(ctx, db, "ewrwe"));
        assertFalse(Utils.isOwner(ctx, db, "qwerty"));

        db.getConnection().close();
    }

    @Test
    void privateKeyValidation() throws SQLException {
        when(ctx.header("Sign")).thenReturn("D96B6E76CB921F0AA7E981C55BC88C3D184D3C0232D1B1C297B9260C6387263B");
        JSONObject json_body = mock(JSONObject.class);
        when(json_body.get("public_key")).thenReturn("gor-tss");
        assertTrue(Utils.privateKeyValidation(ctx, db, json_body.toString()));

        db.getConnection().close();
    }

    @Test
    void registrationValidation() throws SQLException {
        assertTrue(Utils.registrationValidation("example@gmail.com", "TestPassword12345"));
        assertFalse(Utils.registrationValidation("example@gmail.com", "example"));

        db.getConnection().close();
    }

    @Test
    void passwordValidation() throws SQLException {
        assertTrue(Utils.passwordValidation("TestPassword12345"));
        assertFalse(Utils.passwordValidation("example"));

        db.getConnection().close();
    }

    @Test
    void addAgentValidation() throws SQLException {
        when(ctx.formParam("public_key")).thenReturn("yura_test");
        when(ctx.formParam("secret_key")).thenReturn("secret-key");
        when(ctx.formParam("host")).thenReturn("google.com");
        assertTrue(Utils.addAgentValidation(ctx));

        when(ctx.formParam("host")).thenReturn("google");
        assertFalse(Utils.addAgentValidation(ctx));

        db.getConnection().close();
    }

    @Test
    void pingValidation() throws SQLException {
        assertTrue(Utils.pingValidation("http://google.com"));
        assertTrue(Utils.pingValidation("https://google.com"));
        assertFalse(Utils.pingValidation("google.com"));

        db.getConnection().close();
    }

    @Test
    void getSalt() throws SQLException {
        assertNotNull(Utils.getSalt());

        db.getConnection().close();
    }

    @Test
    void hash() throws InvalidKeySpecException, NoSuchAlgorithmException, SQLException {
        Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
        Base64.Decoder decoder = Base64.getUrlDecoder();
        assertEquals("5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0",
                encoder.encodeToString(Utils.hash("NewPassword123",
                decoder.decode("prHpPCZF_dqKEQx9AvWXrA"))));
        assertNotEquals("5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t1",
                encoder.encodeToString(Utils.hash("NewPassword123",
                decoder.decode("prHpPCZF_dqKEQx9AvWXrA"))));

        db.getConnection().close();
    }

    @Test
    void generateKey() throws SQLException {
        assertNotNull(Utils.generateKey());

        db.getConnection().close();
    }

    @Test
    void changeSetting() throws SQLException {
        assertTrue(Utils.changeSetting("tenoy66037@58as.com", db, "lang", "en"));
        assertTrue(Utils.changeSetting("example@gmail.com", db, "status", "admin"));

        db.getConnection().close();
    }

    @Test
    void getAgentCount() throws SQLException {
        when(ctx.sessionAttribute("mail")).thenReturn("example@gmail.com");
        assertEquals(5, Utils.getAgentCount(ctx, db));

        db.getConnection().close();
    }

    @Test
    void getPingCount() throws SQLException {
        when(ctx.sessionAttribute("mail")).thenReturn("example@gmail.com");
        assertEquals(4, Utils.getPingCount(ctx, db));

        db.getConnection().close();
    }
}