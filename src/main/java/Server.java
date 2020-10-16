package main.java;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.staticfiles.Location;
import org.jetbrains.annotations.NotNull;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.SQLException;

/**
 * Project's server side class<br>
 * <b>enableCors</b> - access to sending requests to the server
 * @author Vitaliy Konchatniy
 * @version 1.0
 */
public class Server {
    private static boolean enableCors = true;

    /**
     * Method starts the server, mail and database,
     * distributes the pages of the application,
     */
    public static void main(String[] args) throws IOException, ParseException, SQLException, ClassNotFoundException {
        String config = new String(Files.readAllBytes(Paths.get("config.txt")));
        JSONParser parser = new JSONParser();
        JSONObject jsonConfig = (JSONObject) parser.parse(config);

        Javalin app = Javalin.create().start(8080);
        Utils utils = new Utils();

        app.config.addStaticFiles( "/doc","static/Doc/", Location.EXTERNAL);
        app.config.addStaticFiles( "/login","static/LoginPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/main","static/MainPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/javadoc","javadoc/", Location.EXTERNAL);

        DBController db;
        db = utils.connect();
        System.out.println("Database connect: [OK]");

        Mail mail = new Mail((String) jsonConfig.get("mail"), (String) jsonConfig.get("mail-pass"), (String) jsonConfig.get("from"));
        System.out.println("SMTP connect: [OK]");

        app.get("/", ctx -> utils.sendHtml(ctx, "static/MainPage/index.html", "auth_only", "/login"));
        app.get("/javadoc", ctx -> ctx.redirect("javadoc/index.html"));
        app.get("/agreements", ctx -> utils.sendHtml(ctx, "static/Doc/index.html", "public", "/agreements"));
        app.get("/login", ctx -> utils.sendHtml(ctx, "static/LoginPage/index.html", "public", "/login"));
        app.get("/logout", ctx -> {ctx.sessionAttribute("auth", null); ctx.redirect("/login");});

        app.get("/api/confirm/:token", ctx -> {cors(ctx); ctx.result(utils.confirm(ctx, db, ctx.pathParam("token")));});
        app.post("/api/registerNewUser", ctx -> {cors(ctx); ctx.result(utils.register(ctx, db, mail));});
        app.get("/api/getUser", ctx -> {cors(ctx); ctx.result(utils.getUser(ctx,db));});
        app.get("/api/isAuth", ctx -> { cors(ctx); ctx.result(utils.isAuth(ctx));});
        app.get("/api/auth", ctx -> { cors(ctx); ctx.result(utils.auth(ctx, db));});
        app.get("/api/getAgentData", ctx -> { cors(ctx); ctx.result(utils.getAgentData(ctx, db)); });
        app.get("/api/getAgentList", ctx -> { cors(ctx); ctx.result(utils.getAgentList(ctx, db)); });
        app.post("/api/endpoint", ctx -> utils.saveAgentData(ctx, db));
    }


    /**
     * Method sets the access to sending the requests to the server
     * @param ctx Context that contains the header with access
     */
    public static void cors(Context ctx) {
        if (enableCors == true) {
            ctx.header("Cache-Control", "no-cache, no-store");
            ctx.header("Access-Control-Allow-Origin","*");
        }
    }
}