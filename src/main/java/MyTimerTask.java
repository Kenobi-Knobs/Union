package main.java;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.TimerTask;

public class MyTimerTask extends TimerTask {
    public ActivePing ap;
    public DBController db;

    public MyTimerTask(ActivePing ap, DBController db) {
        this.ap = ap;
        this.db = db;
    }

    public void run(){
        try{
            ArrayList<String> pingList = ap.getPingList(db);
            ap.pingList(pingList, db);
        } catch (SQLException throwables) {
            throwables.printStackTrace();
            System.out.println("ping aborted");
        }
    }
}
