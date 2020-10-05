package main.java;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.staticfiles.Location;
import org.jetbrains.annotations.NotNull;
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
     * Method starts the server and database,
     * distributes the pages of the application,
     * and gets the agent's data
     */
    public static void main(String[] args) throws IOException, ParseException {
        Javalin app = Javalin.create().start(80);
        Utils utils = new Utils();
        app.config.addStaticFiles( "/doc","static/Doc/", Location.EXTERNAL);
        app.config.addStaticFiles( "/login","static/LoginPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/main","static/MainPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/javadoc","javadoc/", Location.EXTERNAL);

        try {
            DBController db;
            db = utils.connect();
            System.out.println("Database connect: [OK]");
            app.get("/", ctx -> sendHtml(ctx, "static/MainPage/index.html", "auth_only", "/login"));
            app.get("/javadoc", ctx -> ctx.redirect("javadoc/index.html"));
            app.get("/agreements", ctx -> sendHtml(ctx, "static/Doc/index.html", "public", "/agreements"));
            app.get("/login", ctx -> sendHtml(ctx, "static/LoginPage/index.html", "public", "/login"));
            app.get("/logout", ctx -> {ctx.sessionAttribute("auth", null); ctx.redirect("/login");});

            app.get("/api/auth", ctx -> { cors(ctx); ctx.result(utils.auth(ctx, db));});
            app.get("/api/getAgentData", ctx -> { cors(ctx); ctx.result(utils.getAgentData(ctx, db)); });
            app.get("/api/getAgentList", ctx -> { cors(ctx); ctx.result(utils.getAgentList(ctx, db)); });
            app.post("/api/endpoint", ctx -> utils.saveAgentData(ctx, db));
        } catch (SQLException | ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    /**
     * Method sends an html context to the pages
     * @param ctx Data context
     * @param path Page path
     * @param acces Acces mode
     * @param redirect Redirect if auth false
     * @throws IOException
     */
    public static void sendHtml(@NotNull Context ctx, String path, String acces, String redirect) throws IOException {
        if(acces.equals("auth_only")){
            if (ctx.sessionAttribute("auth") != null && ctx.sessionAttribute("auth").equals("true")) {
                String contents = new String(Files.readAllBytes(Paths.get(path)));
                ctx.html(contents);
            } else {
                ctx.redirect(redirect);
            }
        }else if(acces.equals("public")){
            String contents = new String(Files.readAllBytes(Paths.get(path)));
            ctx.html(contents);
        }
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