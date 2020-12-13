package main.java;

import java.sql.*;

/**
 * Database controller class<br>
 * <b>connection</b> - database connectivity field
 * @author Vitaliy Konchatniy, Pakhota Yury
 * @version 1.0
 */
public class DBController {
    private final Connection connection;

    /**
     * Controller constructor, connects to the remote database with the help of JDBC (Java Database Connectivity) library
     * @param user User's login
     * @param pass User's password
     * @param url Database host
     * @throws SQLException db connection exception
     * @throws ClassNotFoundException db connection exception
     */
    public DBController(String user, String pass, String url) throws SQLException, ClassNotFoundException {
        Class.forName("com.mysql.cj.jdbc.Driver");
        connection = DriverManager.getConnection(url, user, pass);
    }

    /**
     * Method gets the connection to the database
     * @return Returns the connection
     * @see #connection
     */
    public Connection getConnection() {
        return connection;
    }
}