package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Class that gets data from an agent<br>
 * <b>host</b> - host's (agent) name<br>
 * <b>bootTime</b> - agent's boot time<br>
 * <b>publicKey</b> - public identifier of an agent<br>
 * <b>privateKey</b> - agent's private (secret) identifier<br>
 * <b>agentVersion</b> - agent's version<br>
 * <b>time</b> - server's local time<br>
 * <b>jsonData</b> - json response from the server that contains data<br>
 * @author Vitaliy Konchatniy, Pakhota Yury
 * @version 1.0
 */
public class AgentData {
    String body;
    String host;
    String bootTime;
    String publicKey;
    String privateKey;
    String agentVersion;
    Date time;
    String jsonData;

    /**
     * Constructor - creates a new object
     * @param ctx Context that contains data
     * @throws ParseException
     * @throws java.text.ParseException
     */
    public AgentData(Context ctx) throws ParseException, java.text.ParseException{
        JSONParser parser = new JSONParser();

//        String debug_sign = ctx.header("Sign");
//        String debug_body = ctx.body();
//        System.out.println(debug_sign+"\n");
//        System.out.println(debug_body);

        this.privateKey = ctx.header("Sign"); //приватный ключ из параметров запроса
        this.body = ctx.body();
        JSONObject jsonBody = (JSONObject) parser.parse(body);
        this.host = (String) jsonBody.get("host");
        //2020-09-22 08:21:02 +0000
        SimpleDateFormat dateParser = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss Z");
        this.time = dateParser.parse((String) jsonBody.get("at"));
        this.bootTime = (String) jsonBody.get("boot_time");
        this.publicKey = (String) jsonBody.get("public_key");
        this.agentVersion = (String) jsonBody.get("agent_version");

        JSONObject jsonData = new JSONObject();
        jsonData.put("cpu", jsonBody.get("cpu"));
        jsonData.put("disks", jsonBody.get("disks"));
        jsonData.put("load", jsonBody.get("load"));
        jsonData.put("memory", jsonBody.get("memory"));
        jsonData.put("network", jsonBody.get("network"));

        this.jsonData = jsonData.toString();
    }

    /**
     * Data validation by private key (method checks if any value is null, and checks jsonData)
     * @see #privateKey
     * @see #jsonData
     * @param ctx Context that contains data
     * @return Returns a response of the validation
     */
    public Boolean validate(Context ctx, DBController db) {
        try {
            String body = this.body;
            String sign = ctx.header("Sign");
            String publicKey = this.publicKey;
            String secretKey = "";

            String query = "select secret_key from Agents where public_key = ?";
            PreparedStatement ps = db.getConnection().prepareStatement(query);
            ps.setString(1, publicKey);
            ResultSet res = ps.executeQuery();
            while (res.next()) {
                secretKey = res.getString("secret_key");
            }

            byte[] hash = null;

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            hash = mac.doFinal(body.getBytes("UTF-8"));

            String result = String.format("%032x", new BigInteger(1, hash));
            return result.equals(sign);
        } catch (NoSuchAlgorithmException | InvalidKeyException | UnsupportedEncodingException | SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Method overrides data output
     * @return Returns a string with agent's data
     */
    @Override
    public String toString() {
        return "AgentData{" +
                "host='" + host + '\'' +
                ", bootTime='" + bootTime + '\'' +
                ", publicKey='" + publicKey + '\'' +
                ", privateKey='" + privateKey + '\'' +
                ", agentVersion='" + agentVersion + '\'' +
                ", time='" + time + '\'' +
                ", jsonData='" + jsonData + '\'' +
                '}';
    }
}