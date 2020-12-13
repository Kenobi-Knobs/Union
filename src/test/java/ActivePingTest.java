package test.java;

import main.java.ActivePing;
import main.java.DBController;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class ActivePingTest {

    ActivePingTest() throws ParseException, IOException, SQLException, ClassNotFoundException {}

    ActivePing ap = new ActivePing();

    String config = new String(Files.readAllBytes(Paths.get("config.txt")));
    JSONParser parser = new JSONParser();
    JSONObject jsonConfig = (JSONObject) parser.parse(config);
    private DBController db = new DBController((String) jsonConfig.get("test-user"), (String) jsonConfig.get("test-pass"), (String) jsonConfig.get("test-url"));

    private void executeUpdate(String query) throws SQLException {
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        ps.executeUpdate();
        ps.close();
    }

    /* TESTS */

    @Test
    void getPingList() throws SQLException {
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getPingListExample@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getPingListAdmin@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('getPingListUser@test.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("INSERT INTO `PingList` (`id`, `user_id`, `address`, `ping_interval`, `last_ping_time`, `last_code`, `down_timing`, `current_down`) VALUES (NULL, (select id from Users where mail = 'getPingListExample@test.com'), 'https://googled.com', '1', NULL, '200', '1', NULL);");
        executeUpdate("INSERT INTO `PingList` (`id`, `user_id`, `address`, `ping_interval`, `last_ping_time`, `last_code`, `down_timing`, `current_down`) VALUES (NULL, (select id from Users where mail = 'getPingListAdmin@test.com'), 'https://googles.com', '1', NULL, '200', '1', NULL);");
        executeUpdate("INSERT INTO `PingList` (`id`, `user_id`, `address`, `ping_interval`, `last_ping_time`, `last_code`, `down_timing`, `current_down`) VALUES (NULL, (select id from Users where mail = 'getPingListUser@test.com'), 'https://google.com', '1', NULL, '200', '1', NULL);");
        ArrayList<String> expArray = new ArrayList<>();
        expArray.add("https://googled.com|0|1|1");
        expArray.add("https://googles.com|0|1|1");
        expArray.add("https://google.com|0|1|1");

        ArrayList<String> actualArray = ap.getPingList(db);

        ArrayList<String> preparedActualArray = new ArrayList<>();
        for (String str : actualArray){
            String[] split = str.split("\\|");
            preparedActualArray.add(split[1] + "|" + split[2] + "|" + split[3] + "|" + split[4]);
        }

        assertArrayEquals(expArray.toArray(), preparedActualArray.toArray());
        executeUpdate("DELETE FROM `DownList` WHERE 1");
        executeUpdate("DELETE FROM `PingList` WHERE 1");
        executeUpdate("delete from Users where 1");

        db.getConnection().close();
    }

    @Test
    void pingList() throws SQLException, InterruptedException {
        executeUpdate("insert into Users (mail, salt, pwd, settings) values ('example@gmail.com', 'prHpPCZF_dqKEQx9AvWXrA', '5eeS2WuWwlX5TujPjtdpI9nHDxOepgtCYa1aiNC80t0', '{}')");
        executeUpdate("INSERT INTO `PingList` (`id`, `user_id`, `address`, `ping_interval`, `last_ping_time`, `last_code`, `down_timing`, `current_down`) VALUES (NULL, (select id from Users where mail = 'example@gmail.com'), 'https://googled.com', '1', NULL, '502', '1', NULL);");

        ArrayList<String> testList1;
        testList1 = ap.getPingList(db);
        System.out.println(testList1);
        ap.pingList(testList1,db);

        Thread.sleep(65000);
        ArrayList<String> testList2;
        testList2 = ap.getPingList(db);
        System.out.println(testList2);
        ap.pingList(testList2,db);
        executeUpdate("UPDATE `PingList` SET address = \"https://google.com\" WHERE 1");

        Thread.sleep(65000);
        ArrayList<String> testList3;
        testList3 = ap.getPingList(db);
        System.out.println(testList3);
        ap.pingList(testList3,db);

        String query = "SELECT * FROM `PingList`";
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        ResultSet res = ps.executeQuery();
        int counter = 0;
        while(res.next()) {
            counter++;
        }
        assertEquals(1, counter);
        executeUpdate("DELETE FROM `PingList` WHERE 1");
        executeUpdate("DELETE FROM `DownList` WHERE 1");
        executeUpdate("delete from Users where mail = 'example@gmail.com'");

        db.getConnection().close();
    }

    @Test
    void ping() {
        assertEquals(200, ActivePing.ping("http://www.google.com"));
        assertEquals(1006, ActivePing.ping("http://wekqwq.com"));
        assertEquals(200, ActivePing.ping("https://www.google.com"));
        assertEquals(1006, ActivePing.ping("https://wekqwq.com"));
    }
}