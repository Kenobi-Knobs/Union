package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
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
    public AgentData(Context ctx, String body) throws ParseException, java.text.ParseException{
        JSONParser parser = new JSONParser();

//        String debug_sign = ctx.header("Sign");
//        String debug_body = ctx.body();
//        System.out.println(debug_sign+"\n");
//        System.out.println(debug_body);

        this.privateKey = ctx.header("Sign"); //приватный ключ из параметров запроса
        this.body = body;
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