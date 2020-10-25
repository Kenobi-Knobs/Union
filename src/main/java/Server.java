package main.java;

import io.javalin.Javalin;
import io.javalin.http.Context;
import io.javalin.http.staticfiles.Location;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.sql.SQLException;
import java.util.Objects;

/**
 * Project's server side class<br>
 * <b>enableCors</b> - access to sending requests to the server
 * @author Vitaliy Konchatniy
 * @version 1.0
 */
public class Server {
    private static final boolean enableCors = true;

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

        app.config.addStaticFiles( "/new-password","static/NewPasswordPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/reset","static/ResetPasswordPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/sign-in","static/SignInPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/","static/Root/", Location.EXTERNAL);
        app.config.addStaticFiles( "/doc","static/Doc/", Location.EXTERNAL);
        app.config.addStaticFiles( "/login","static/LoginPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/main","static/MainPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/settings","static/SettingsPage/", Location.EXTERNAL);
        //app.config.addStaticFiles( "/statistic","static/StatisticPage/", Location.EXTERNAL);
        //app.config.addStaticFiles( "/admin","static/AdminPage/", Location.EXTERNAL);
        app.config.addStaticFiles( "/javadoc","javadoc/", Location.EXTERNAL);
        app.config.addStaticFiles( "/404","static/NotFoundPage", Location.EXTERNAL);
        app.config.addStaticFiles( "/api/404","static/NotFoundPage", Location.EXTERNAL);

        DBController db = new DBController((String) jsonConfig.get("user"), (String) jsonConfig.get("pass"), (String) jsonConfig.get("url"));
        System.out.println("Database connect: [OK]");

        Mail mail = new Mail((String) jsonConfig.get("mail"), (String) jsonConfig.get("mail-pass"), (String) jsonConfig.get("from"));
        System.out.println("SMTP connect: [OK]");

        app.error(404, ctx -> utils.sendHtml(ctx, "static/NotFoundPage/index.html", "public", "/"));

        //app.get("/admin", ctx -> utils.sendHtml(ctx, "static/AdminPage/index.html", "admin_only", "/"));
        //app.get("/statistic", ctx -> utils.sendHtml(ctx, "static/StatisticPage/index.html", "auth_only", "/login"));
        app.get("/settings", ctx -> utils.sendHtml(ctx, "static/SettingsPage/index.html", "auth_only", "/login"));
        app.get("/", ctx -> utils.sendHtml(ctx, "static/MainPage/index.html", "auth_only", "/login"));
        app.get("/new-password/:token", ctx -> {
            if (ctx.sessionAttribute("auth") != null){
                ctx.redirect("/");
            }
            utils.showChangePassword(ctx,db);
        });
        app.get("/reset", ctx -> {
            if (ctx.sessionAttribute("auth") != null){
                ctx.redirect("/");
            }
            utils.sendHtml(ctx, "static/ResetPasswordPage/index.html", "public", "/login");
        });
        app.get("/sign-in", ctx -> {
            if (ctx.sessionAttribute("auth") != null){
                ctx.redirect("/");
            }
            utils.sendHtml(ctx, "static/SignInPage/index.html", "public", "/login");
        });
        app.get("/javadoc", ctx -> ctx.redirect("javadoc/index.html"));
        app.get("/agreements", ctx -> utils.sendHtml(ctx, "static/Doc/index.html", "public", "/agreements"));
        app.get("/login", ctx -> {
            if (ctx.sessionAttribute("auth") != null){
                ctx.redirect("/");
            }
            utils.sendHtml(ctx, "static/LoginPage/index.html", "public", "/login");
        });
        app.get("/logout", ctx -> {
            System.out.println(ctx.sessionAttribute("mail") + " logout");ctx.sessionAttribute("auth", null); ctx.sessionAttribute("mail", null); ctx.redirect("/login");});

        app.post("/api/changePassword", ctx -> {cors(ctx); ctx.result(utils.changePassword(ctx, db));});
        app.post("/api/resetPasswordMail", ctx -> {cors(ctx); ctx.result(utils.resetPassword(ctx, db, mail));});
        app.get("/api/confirm/:token", ctx -> {cors(ctx); ctx.result(utils.confirm(ctx, db, ctx.pathParam("token")));});
        app.post("/api/registerNewUser", ctx -> {cors(ctx); ctx.result(utils.register(ctx, db, mail));});
        app.get("/api/getUser", ctx -> {cors(ctx); ctx.result(utils.getUser(ctx,db));});
        app.get("/api/isAuth", ctx -> { cors(ctx); ctx.result(utils.isAuth(ctx));});
        app.get("/api/auth", ctx -> { cors(ctx); ctx.result(utils.auth(ctx, db));});

        app.get("/api/getAgentData", ctx -> { cors(ctx); ctx.result(utils.getAgentData(ctx, db)); });
        app.get("/api/getDataTimeInterval", ctx -> { cors(ctx); ctx.result(utils.getInterval(ctx, db)); });
        app.get("/api/getAgentDataByInterval", ctx -> { cors(ctx); ctx.result(utils.getAgentDataByInterval(ctx, db)); });

        app.post("/api/deleteAgent", ctx -> { cors(ctx); ctx.result(utils.deleteAgent(ctx, db)); });
        app.post("/api/addAgent", ctx -> { cors(ctx); ctx.result(utils.addAgent(ctx, db)); });
        app.get("/api/getAgentList", ctx -> { cors(ctx); ctx.result(utils.getAgentList(ctx, db)); });

        app.post("/api/endpoint", ctx -> utils.saveAgentData(ctx, db));
    }


    /**
     * Method sets the access to sending the requests to the server
     * @param ctx Context that contains the header with access
     */
    public static void cors(Context ctx) {
        ctx.header("Cache-Control", "no-cache, no-store");
        if (enableCors) {
            ctx.header("Access-Control-Allow-Origin","*");
        }
    }
}