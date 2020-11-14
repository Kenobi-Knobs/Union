package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import javax.crypto.Mac;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Project's server side utility class
 * @author Vitaliy Konchatniy, Pakhota Yury
 * @version 1.0
 */
public class Utils {
    static JSONParser parser = new JSONParser();

    public static boolean isOwner(Context ctx, DBController db, String publicKey) {
        String mail = ctx.sessionAttribute("mail");
        try {
            String query = "SELECT * from (SELECT ua.public_key FROM `User_agents` as ua, Users as u WHERE u.id = ua.user_id and u.mail = ?) as a where a.public_key = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, mail);
            ps.setString(2, publicKey);
            ResultSet res = ps.executeQuery();
            boolean result = res.next();
            ps.close();
            return result;
        } catch (SQLException throwables) {
            throwables.printStackTrace();
            return false;
        }
    }

    /**
     * Data validation by private key (method checks if any value is null, and checks jsonData)
     * @param ctx Context that contains data
     * @param body body of request
     * @return Returns a response of the validation
     */
    public static Boolean privateKeyValidation(Context ctx, DBController db, String body) {
        try {
            JSONObject jsonBody;
            String sign = ctx.header("Sign");
            try {
                jsonBody = (JSONObject) parser.parse(body);
            } catch(ClassCastException e) {
                return false;
            }
            String publicKey = (String) jsonBody.get("public_key");
            if (publicKey == null) {
                return false;
            }

            String secretKey = "";
            String query = "SELECT secret_key FROM Agents WHERE public_key = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, publicKey);
            ResultSet res = ps.executeQuery();
            while (res.next()) {
                secretKey = res.getString("secret_key");
            }
            ps.close();
            byte[] hash;

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            hash = mac.doFinal(body.getBytes(StandardCharsets.UTF_8));

            String result = String.format("%032x", new BigInteger(1, hash));
            return result.equals(sign);
        } catch (NullPointerException | NoSuchAlgorithmException | InvalidKeyException | SQLException | ParseException e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean registrationValidation(String mail, String password) {
        Pattern mailPattern = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);
        Matcher mailMatcher = mailPattern.matcher(mail.toLowerCase());

        Pattern passPattern = Pattern.compile("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=\\S+$).{8,}$");
        Matcher passMatcher = passPattern.matcher(password);

        return mailMatcher.find() && passMatcher.find();
    }

    public static byte[] getSalt() {
        byte[] salt = new byte[16];
        SecureRandom random = new SecureRandom();
        random.nextBytes(salt);

        return salt;
    }

    public static byte[] hash(String password, byte[] salt) throws NoSuchAlgorithmException, InvalidKeySpecException {
        PBEKeySpec keySpec = new PBEKeySpec(password.toCharArray(), salt, 10000, 256);
        SecretKeyFactory keyFactory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
        return keyFactory.generateSecret(keySpec).getEncoded();
    }

    public static String generateKey() {
        char[] chars = "abcdefghijklmnopqrstuvwxyz123456789".toCharArray();
        StringBuilder sb = new StringBuilder(20);
        Random random = new Random();
        for (int i = 0; i < 20; i++) {
            char c = chars[random.nextInt(chars.length)];
            sb.append(c);
        }
        return sb.toString();
    }

    public static boolean dateValidation(String start, String end) {
        String regex = "[0-9]{4}-(0[0-9]|1[012])-([012][0-9]|3[01]) ([01][0-9]|2[0-3])(:[0-5][0-9])";
        if (start != null && end != null) {
            return start.matches(regex) && end.matches(regex);
        } else {
            return false;
        }
    }

    public static boolean addAgentValidation(Context ctx) {
        String publicKey = ctx.formParam("public_key");
        String secretKey = ctx.formParam("secret_key");
        String host = ctx.formParam("host");

        Pattern pattern = Pattern.compile("^[a-zA-Z]+[a-zA-Z0-9_-]*$", Pattern.CASE_INSENSITIVE);
        Matcher pkMatcher = pattern.matcher(publicKey.toLowerCase());
        pattern = Pattern.compile("^[a-zA-Z0-9]+$", Pattern.CASE_INSENSITIVE);
        Matcher skMatcher = pattern.matcher(secretKey);
        pattern = Pattern.compile("^[\\w0-9.]+\\.\\w{2,}$", Pattern.CASE_INSENSITIVE);
        Matcher hostMatcher = pattern.matcher(host.toLowerCase());

        return (pkMatcher.find() && skMatcher.find() && hostMatcher.find() && !(publicKey.equals(host)));
    }

    public static void showChangedPasswordPage(Context ctx, DBController db) {
        String token = ctx.pathParam("token");
        if (token.length() != 20) {
            ctx.status(404);
        }
        try {
            String query = "SELECT * FROM `Users` WHERE reset_code = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, token);
            ResultSet res = ps.executeQuery();
            if (res.next()) {
                API.sendHtml(ctx, "static/NewPasswordPage/index.html", "public", "/login");
            } else {
                ctx.status(404);
            }
            ps.close();
        } catch (SQLException | IOException throwables) {
            throwables.printStackTrace();
            ctx.status(404);
        }
    }

    public static Boolean changeSetting(String mail, DBController db, String property, String new_property){
        try{
            String getSettings = "SELECT `settings` FROM `Users` WHERE `mail` = ?";
            PreparedStatement getPs = db.getConnection().prepareStatement(getSettings);
            getPs.setString(1, mail);
            ResultSet getRes = getPs.executeQuery();
            getRes.next();
            JSONObject jsonSettings = (JSONObject) Utils.parser.parse(getRes.getString("settings"));

            jsonSettings.put(property, new_property);

            String setSettings = "UPDATE `Users` SET `settings`= ? WHERE `mail` = ?";
            PreparedStatement setPs = db.getConnection().prepareStatement(setSettings);
            setPs.setString(1,jsonSettings.toJSONString());
            setPs.setString(2,mail);
            setPs.executeUpdate();
            getPs.close();
            setPs.close();
            return true;
        }catch (SQLException | ParseException throwables) {
            throwables.printStackTrace();
            return false;
        }
    }
}
