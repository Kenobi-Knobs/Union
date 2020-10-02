package main.java;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.staticfiles.Location;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.SQLException;

public class Server {
    private static boolean enableCors = true;

    public static void main(String[] args){
        Javalin app = Javalin.create().start(80);
        Utils utils = new Utils();
        app.config.addStaticFiles( "/doc","static/Doc/", Location.EXTERNAL);
        app.config.addStaticFiles( "/login","static/LoginPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/main","static/MainPage/", Location.EXTERNAL);

        try {
            DBController db = utils.connect();
            System.out.println("Database connect: [OK]");
            app.get("/", ctx -> check(ctx));
            app.get("/agreements", ctx -> sendHtml(ctx, "static/Doc/index.html"));
            app.get("/login", ctx -> sendHtml(ctx, "static/LoginPage/index.html"));
            app.get("/logout", ctx -> {ctx.sessionAttribute("auth", null); ctx.redirect("/login");});
            app.get("/api/auth", ctx -> { cors(ctx); ctx.result(utils.auth(ctx, db));});
            app.get("/api/getAgentData", ctx -> { cors(ctx); ctx.result(utils.getAgentData(ctx,db)); });
            app.get("/api/getAgentList", ctx -> { cors(ctx); ctx.result(utils.getAgentList(ctx,db)); });
            app.post("/api/endpoint", ctx -> utils.saveAgentData(ctx, db));
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
        }

    }

    public static void sendHtml(Context ctx, String path) throws IOException {
        String contents = new String(Files.readAllBytes(Paths.get(path)));
        ctx.html(contents);
    }

    public static void check(Context ctx) throws IOException {
        if (ctx.sessionAttribute("auth") != null){
            if(ctx.sessionAttribute("auth").equals("true")){
                sendHtml(ctx, "static/MainPage/index.html");
            }else{
                ctx.redirect("/login");
            }
        }else{
            ctx.redirect("/login");
        }
    }

    public static void cors(Context ctx){
        if (enableCors == true){
            ctx.header("Access-Control-Allow-Origin","*");
        }
    }

}