package main.java;

import io.javalin.http.Context;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import java.text.SimpleDateFormat;
import java.util.Date;

public class AgentData {
    String host;
    String bootTime;
    String publicKey;
    String privateKey;
    String agentVersion;
    Date time;
    String jsonData;


    public AgentData(Context ctx) throws ParseException, java.text.ParseException {
        this.privateKey = ctx.header("Sign"); //приватный ключ из параметров запроса
        String body = ctx.body();
        JSONParser parser = new JSONParser();
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

    //Валидация при помощи privateKey
    //Проверить все значения на null
    //Проверить jsonData
    public Boolean validate(Context ctx){
        return true;
    }

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
