package main.java;

import javax.net.ssl.HttpsURLConnection;
import java.io.IOException;
import java.net.*;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;

public class ActivePing {

    public ArrayList<String> getPingList(DBController db) throws SQLException {
        ArrayList<String> pingList = new ArrayList();

        Date date = new Date(System.currentTimeMillis());
        long currentTime = date.getTime() / 1000L;
        String query = "SELECT * FROM `PingList`";
        PreparedStatement ps = db.getConnection().prepareStatement(query);
        ResultSet res = ps.executeQuery();
        while(res.next()) {
            int id = res.getInt("id");
            String address = res.getString("address");
            int pingInterval = res.getInt("ping_interval");
            int lastPing = res.getInt("last_ping_time");
            int currentDown = res.getInt("current_down");
            int downTiming = res.getInt("down_timing");

            if (lastPing + (pingInterval*60) <= currentTime){
                pingList.add(id + "|" + address + "|" + currentDown + "|" + downTiming + "|" + pingInterval);
            }
        }

        return pingList;
    }

    public void pingList(ArrayList<String> list, DBController db) {
        Date date = new Date(System.currentTimeMillis());
        long currentTime = date.getTime() / 1000L;
        for(String element:list){
            String[] parse = element.split("\\|");

            int id = Integer.parseInt(parse[0]);
            String address = parse[1];
            int currentDown = Integer.parseInt(parse[2]);
            int downTiming = Integer.parseInt(parse[3]);
            int pingInterval = Integer.parseInt(parse[4]);

            int code = ping(address);

            boolean error = !(code >= 200 && code <= 399);
            boolean down = (currentDown != 0);
            // System.out.println(address + " " + code);
            // ошибка есть текущего падения нет
            if (error && !down){
                // System.out.println("падение началось");
                try {
                    int confirm = 0;
                    if(downTiming == pingInterval){
                        confirm = 1;
                    }
                    String query1 = "INSERT INTO `DownList`(`ping_id`, `time`, `down_time`, `code`, `down_confirm`) VALUES (?,?,?,?,?)";
                    PreparedStatement ps1 = db.getConnection().prepareStatement(query1);
                    ps1.setInt(1,id);
                    ps1.setLong(2,currentTime);
                    ps1.setInt(3, pingInterval);
                    ps1.setInt(4, code);
                    ps1.setInt(5, confirm);
                    ps1.executeUpdate();
                    ps1.close();
                    String query2 = "UPDATE `PingList` SET `current_down`= (SELECT id from DownList where ping_id = ? and end = 0)  WHERE `id` = ?";
                    PreparedStatement ps2 = db.getConnection().prepareStatement(query2);
                    ps2.setInt(1,id);
                    ps2.setInt(2,id);
                    ps2.executeUpdate();
                    ps2.close();
                } catch (SQLException throwables) {
                    throwables.printStackTrace();
                }
            }
            // ошибка есть текущее падение есть
            else if (error && down){
                // System.out.println("падение продолжается");
                try {
                    int downTime = 1;
                    String query = "SELECT `down_time` FROM `DownList` WHERE id = (SELECT current_down from PingList where id = ?)";
                    PreparedStatement ps = db.getConnection().prepareStatement(query);
                    ps.setInt(1,id);
                    ResultSet res = ps.executeQuery();
                    while(res.next()) {
                        downTime = res.getInt("down_time");
                    }
                    ps.close();

                    int confirm = 0;
                    if (downTime+pingInterval >= downTiming){
                        confirm = 1;
                    }

                    String query2 = "UPDATE `DownList` SET `down_time` = ?, `down_confirm` = ? WHERE id = (SELECT current_down from PingList where id = ?)";
                    PreparedStatement ps2 = db.getConnection().prepareStatement(query2);
                    ps2.setInt(1,downTime+pingInterval);
                    ps2.setInt(2,confirm);
                    ps2.setInt(3,id);
                    ps2.executeUpdate();
                    ps2.close();
                } catch (SQLException throwables) {
                    throwables.printStackTrace();
                }
            }
            // ошибки нет текущее падение есть
            else if (!error && down){
                // System.out.println("падение закончилось");
                try{
                    String query0 = "UPDATE `DownList` SET `end` = ? WHERE id = (SELECT current_down from PingList where id = ?)";
                    PreparedStatement ps0 = db.getConnection().prepareStatement(query0);
                    ps0.setInt(1,1);
                    ps0.setInt(2,id);
                    ps0.executeUpdate();
                    ps0.close();
                    String query1 = "UPDATE `PingList` SET `current_down`= NULL  WHERE `id` = ?";
                    PreparedStatement ps1 = db.getConnection().prepareStatement(query1);
                    ps1.setInt(1,id);
                    ps1.executeUpdate();
                    ps1.close();
                } catch (SQLException throwables) {
                    throwables.printStackTrace();
                }
            }
            // изменяем время последнего пинга
            try{
                String query = "UPDATE `PingList` SET `last_ping_time`= ?, last_code = ? WHERE `id` = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setLong(1,currentTime);
                ps.setInt(2,code);
                ps.setInt(3,id);
                ps.executeUpdate();
                ps.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
        }
    }

    public static int ping(String address) {
        int code = 0;
        try {
            URL url = new URL(address);
            if(address.startsWith("http://")){
                HttpURLConnection http = (HttpURLConnection) url.openConnection();
                http.setInstanceFollowRedirects(true);
                code = http.getResponseCode();
            }else if(address.startsWith("https://")){
                HttpsURLConnection https = (HttpsURLConnection) url.openConnection();
                https.setInstanceFollowRedirects(true);
                code = https.getResponseCode();
            }
        } catch (IOException e) {
            code = 404;
        }
        return code;
    }
}
