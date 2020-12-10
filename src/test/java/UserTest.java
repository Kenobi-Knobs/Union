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

    public DBController db = new DBController(
            (String) jsonConfig.get("user"),
            (String) jsonConfig.get("pass"),
            (String) jsonConfig.get("url")
    );

    @Test
    void authorization() throws SQLException {
        when(ctx.formParam("mail")).thenReturn("example@gmail.com");
        when(ctx.formParam("pass")).thenReturn("NewPassword123");
        JSONObject json = new JSONObject();
        json.put("auth", "true");
        json.put("info", "user is authorized");
        assertEquals(json.toString(), User.authorization(ctx, db));

        when(ctx.formParam("mail")).thenReturn("yura_test@gmail.com");
        when(ctx.formParam("pass")).thenReturn("YuraPassword123");
        json.clear();
        json.put("auth", "false");
        json.put("info", "confirm account with mail");
        assertEquals(json.toString(), User.authorization(ctx, db));

        when(ctx.formParam("pass")).thenReturn("Password123");
        json.clear();
        json.put("auth", "false");
        json.put("info", "wrong pass");
        assertEquals(json.toString(), User.authorization(ctx, db));

        when(ctx.formParam("mail")).thenReturn("yura_netest@gmail.com");
        when(ctx.formParam("pass")).thenReturn("YuraPassword123");
        json.clear();
        json.put("auth", "false");
        json.put("info", "wrong mail");
        assertEquals(json.toString(), User.authorization(ctx, db));

        db.getConnection().close();
    }

    @Test
    void registration() throws SQLException {
        Mail mail = mock(Mail.class);

        when(ctx.formParam("mail")).thenReturn("yura_test@gmail.com");
        when(ctx.formParam("pass")).thenReturn("YuraPassword123");
        when(ctx.formParam("lang")).thenReturn("en");
        JSONObject json = new JSONObject();
        json.put("register", "true");
        json.put("info", "Confirmation mail sent");
        json.put("mail", "yura_test@gmail.com");
        assertEquals(json.toString(), User.registration(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("example@gmail.com");
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

        db.getConnection().close();
    }

    @Test
    void addAgent() throws SQLException {
        JSONObject json = new JSONObject();

        when(ctx.sessionAttribute("auth")).thenReturn("null");
        assertEquals("Unauthorized", User.addAgent(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        //when(ctx.formParam("public_key")).thenReturn("<qwerty_test");
        when(ctx.formParam("secret_key")).thenReturn("secret-key-test");
        when(ctx.formParam("host")).thenReturn("secret.com");
        //assertEquals("Bad request (xss detect)", User.addAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn("qwerty_test1");
        when(ctx.sessionAttribute("mail")).thenReturn("rasete6391@58as.com");
        when(ctx.sessionAttribute("status")).thenReturn("user");
        json.put("add", "false");
        json.put("info", "no premium");
        assertEquals(json.toString(), User.addAgent(ctx, db));

        when(ctx.sessionAttribute("mail")).thenReturn("yura_test@gmail.com");
        json.clear();
        json.put("add", "true");
        json.put("info", "Added");
        assertEquals(json.toString(), User.addAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn("qwerty_test1");
        when(ctx.formParam("secret_key")).thenReturn("secret-key-test");
        when(ctx.formParam("host")).thenReturn("secret.com");
        json.clear();
        json.put("add", "false");
        json.put("info", "agent already exists");
        assertEquals(json.toString(), User.addAgent(ctx, db));

        db.getConnection().close();
    }

    @Test
    void deleteAgent() throws SQLException {
        JSONObject json = new JSONObject();

        when(ctx.sessionAttribute("auth")).thenReturn("null");
        assertEquals("Unauthorized", User.addAgent(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.formParam("public_key")).thenReturn("qwerty_test1");
        when(ctx.sessionAttribute("mail")).thenReturn("yura_test@gmail.com");
        json.put("delete", "true");
        json.put("info", "qwerty_test1 deleted");
        assertEquals(json.toString(), User.deleteAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn(null);
        assertEquals("An error occurred: either public key is null or agent's owner is someone else",
                User.deleteAgent(ctx, db));

        when(ctx.formParam("public_key")).thenReturn("qwerty_test1");
        when(ctx.sessionAttribute("mail")).thenReturn("example@gmail.com");
        assertEquals("An error occurred: either public key is null or agent's owner is someone else",
                User.deleteAgent(ctx, db));

        db.getConnection().close();
    }

    @Test
    void resetPassword() throws SQLException {
        Mail mail = mock(Mail.class);
        JSONObject json = new JSONObject();

        when(ctx.formParam("mail")).thenReturn(null);
        assertEquals("Bad Request", User.resetPassword(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("yura_test@gmail.com");
        when(ctx.formParam("lang")).thenReturn(null);
        assertEquals("Bad Request", User.resetPassword(ctx, db, mail));

        when(ctx.formParam("lang")).thenReturn("en");
        json.put("reset", "false");
        json.put("info", "mail not confirmed");
        assertEquals(json.toString(), User.resetPassword(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("yura_test2@gmail.com");
        json.clear();
        json.put("reset", "true");
        json.put("info", "Confirmation mail sent");
        json.put("mail", "yura_test2@gmail.com");
        assertEquals(json.toString(), User.resetPassword(ctx, db, mail));

        when(ctx.formParam("mail")).thenReturn("yura_test2312321321@gmail.com");
        json.clear();
        json.put("reset", "false");
        json.put("info", "mail not found");
        assertEquals(json.toString(), User.resetPassword(ctx, db, mail));

        db.getConnection().close();
    }

    @Test
    void changePassword() throws SQLException {
        JSONObject json = new JSONObject();

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

        when(ctx.formParam("new_pass")).thenReturn("YuraNewPassword123");
        json.clear();
        json.put("reset", "true");
        json.put("info", "new password set");
        assertEquals(json.toString(), User.changePassword(ctx, db));

        db.getConnection().close();
    }

    @Test
    void addActivePing() throws SQLException {
        JSONObject json = new JSONObject();

        when(ctx.sessionAttribute("auth")).thenReturn(null);
        assertEquals("Unauthorized", User.addActivePing(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.formParam("address")).thenReturn(null);
        assertEquals("bad request", User.addActivePing(ctx, db));

        when(ctx.formParam("address")).thenReturn("google.com");
        assertEquals("An error occurred: validation not passed", User.addActivePing(ctx, db));

        when(ctx.formParam("down_timing")).thenReturn("5");
        when(ctx.formParam("ping_interval")).thenReturn("5");
        when(ctx.formParam("address")).thenReturn("http://google123.com/");
        when(ctx.sessionAttribute("status")).thenReturn("user");
        when(ctx.sessionAttribute("mail")).thenReturn("wekate4080@58as.com");
        json.put("add", "false");
        json.put("info", "no premium");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        when(ctx.formParam("ping_interval")).thenReturn("4");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        when(ctx.formParam("ping_interval")).thenReturn("61");
        assertEquals(json.toString(), User.addActivePing(ctx, db));

        when(ctx.sessionAttribute("mail")).thenReturn("yura_test@example.com");
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

        db.getConnection().close();
    }

    @Test
    void deleteActivePing() throws SQLException {
        JSONObject json = new JSONObject();

        when(ctx.sessionAttribute("auth")).thenReturn(null);
        assertEquals("Unauthorized", User.deleteActivePing(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.formParam("address")).thenReturn(null);
        assertEquals("Bad request", User.deleteActivePing(ctx, db));

        when(ctx.formParam("address")).thenReturn("http://google123.com/".replaceAll("\\\\",""));
        when(ctx.sessionAttribute("mail")).thenReturn("yura_test@example.com");
        json.put("delete", "true");
        json.put("info", "yura_test@example.com delete http://google123.com/");
        assertEquals(json.toString(), User.deleteActivePing(ctx, db));

        db.getConnection().close();
    }

    @Test
    void changeLang() throws SQLException {
        JSONObject json = new JSONObject();

        when(ctx.sessionAttribute("auth")).thenReturn(null);
        assertEquals("Unauthorized", User.deleteActivePing(ctx, db));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.queryParam("lang")).thenReturn(null);
        assertEquals("Bad Request", User.changeLang(ctx, db));

        when(ctx.queryParam("lang")).thenReturn("ua");
        when(ctx.sessionAttribute("mail")).thenReturn("yura_test@gmail.com");
        json.put("change", "true");
        assertEquals(json.toString(), User.changeLang(ctx, db));

        when(ctx.queryParam("lang")).thenReturn("en");
        assertEquals(json.toString(), User.changeLang(ctx, db));

        db.getConnection().close();
    }
}