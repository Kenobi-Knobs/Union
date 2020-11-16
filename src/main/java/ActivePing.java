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
            long lastPing = res.getLong("last_ping_time");
            int currentDown = res.getInt("current_down");

            if (lastPing + (pingInterval*60) <= currentTime){
                pingList.add(id + "|" + address + "|" + currentDown);
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

            int code = ping(address);
            boolean error = !(code >= 200 && code <= 399);
            boolean down = (currentDown != 0);


            // ошибка есть текущего падения нет
            if (error && !down){
                System.out.println("падение началось");
                // падение началось
                // добавить падение
            }
            // ошибки нет текущего падения нет
            else if (!error && !down){
                System.out.println("Все хорошо");
                // все хорошо
                // сервис активен
            }
            // ошибка есть текущее падение есть
            else if (error && down){
                System.out.println("падение продолжается");
                // падение продолжается
                // добавить время падению если время падения >= downTiming подтвердить падение
            }

            // ошибки нет текущее падение есть
            else if (!error && down){
                System.out.println("падение закончилось");
                // падение закончилось
                // закрыть падение и удалить текущее если оно не подтверждено удалить падение
            }

            // изменяем время последнего пинга
            try{
                String query = "UPDATE `PingList` SET `last_ping_time`= ? WHERE `id` = ?";
                PreparedStatement ps = db.getConnection().prepareStatement(query);
                ps.setLong(1,currentTime);
                ps.setInt(2,id);
                ps.executeUpdate();
                ps.close();
            } catch (SQLException throwables) {
                throwables.printStackTrace();
            }
        }
    }

    public static int ping(String address){
        int code = 0;
        try {
            URL url = new URL(address);
            if(address.startsWith("http://")){
                HttpURLConnection http = (HttpURLConnection) url.openConnection();
                code = http.getResponseCode();
            }else if(address.startsWith("https://")){
                HttpsURLConnection https = (HttpsURLConnection) url.openConnection();
                code = https.getResponseCode();
            }
        } catch (IOException e) {
            code = 404;
        }
        return code;
    }

}
