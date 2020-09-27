package main.java;
import java.sql.*;
import java.text.SimpleDateFormat;

public class DBController {
    private Connection connection;

    public DBController(String user, String pass, String url) throws SQLException, ClassNotFoundException {
        Class.forName("com.mysql.cj.jdbc.Driver");
        connection = DriverManager.getConnection(url,user,pass);
    }

    public Connection getConnection() {
        return connection;
    }
}
