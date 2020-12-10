import io.javalin.http.Context;
import main.java.API;
import main.java.DBController;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
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

    APITest() throws SQLException, ClassNotFoundException, IOException, ParseException {}

    @Test
    void isAuth() throws SQLException {
        JSONObject json = new JSONObject();

        //when(ctx.sessionAttribute("auth")).thenReturn(null);
        json.put("auth", "false");
        //assertEquals(json.toString(), API.isAuth(ctx));

        when(ctx.sessionAttribute("auth")).thenReturn("false");
        assertEquals(json.toString(), API.isAuth(ctx));

        when(ctx.sessionAttribute("auth")).thenReturn("true");
        when(ctx.sessionAttribute("mail")).thenReturn("yura_test@gmail.com");
        when(ctx.sessionAttribute("status")).thenReturn("user");
        json.clear();
        json.put("mail", "yura_test@gmail.com");
        json.put("auth", "true");
        json.put("status", "user");
        assertEquals(json.toString(), API.isAuth(ctx));

        db.getConnection().close();
    }
    @BeforeEach
    void setUp() {
        MockitoAnnotations.initMocks(this);
    }

    @Test
    void authCheck() {
        when(ctx.sessionAttribute("auth")).thenReturn("false");
        assertFalse(API.authCheck(ctx));
    }

    @Test
    void getAgentData() {
    }

    @Test
    void getAgentDataByInterval() {
    }

    @Test
    void getAgentList() {
    }

    @Test
    void getUser() {
    }

    @Test
    void getAgentDataInterval() {
    }

    @Test
    void setAgentData() {
    }

    @Test
    void mailConfirmation() {
    }

    @Test
    void sendHtml() {
    }

    @Test
    void getUsers() {
    }

    @Test
    void deleteUser() {
    }

    @Test
    void upgradeUser() {
    }
}