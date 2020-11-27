package main.java;

import javax.mail.*;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import java.util.Properties;

/**
 * Class for sending emails
 *
 * @author Vitaliy Konchatniy
 */
public class Mail {
    private final String from;
    private final Session session;

    /**
     * Constructor - creating new object and connecting to email services
     * @param email  Email address google account mail services
     * @param pass  Password for google account mail
     * @param from  From  address
     */
    public Mail(String email, String pass, String from){
        this.from = from;

        Properties properties = System.getProperties();
        String host = "smtp.gmail.com";
        properties.put("mail.smtp.host", host);
        properties.put("mail.smtp.port", "465");
        properties.put("mail.smtp.ssl.enable", "true");
        properties.put("mail.smtp.auth", "true");
        session = Session.getInstance(properties, new javax.mail.Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(email, pass);
            }
        });
        //session.setDebug(true);
    }

    /**
     * Method to send email with activation link
     * @param token activation token
     * @param mailTo user email
     */
    public void sendActivationLink(String token, String mailTo, String lang) throws MessagingException {
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(from));
        message.addRecipient(Message.RecipientType.TO, new InternetAddress(mailTo));
        if(lang.equals("ua")){
            message.setSubject("Union: Вітаємо з приєднанням!");
            message.setText(
                    "Ви успішно зареєструвалися на платформі моніторингу Union," +
                            "щоб продовжити тицніть сюди : https://t5.tss2020.site/api/confirm/" + token  +
                            " (Якщо ви не реєструвалися проігноруйте це повідомлення)");
        }else {
            message.setSubject("Union: Welcome to the club buddy");
            message.setText(
                    "Hello friend, it seems that you have successfully registered your Union," +
                            "what do you have to do by click the link : https://t5.tss2020.site/api/confirm/" + token +
                            " (if you did not register then just ignore this message)");
        }
        Transport.send(message);
    }

    public void sendResetLink(String token, String mailTo, String lang) throws MessagingException {
        Message message = new MimeMessage(session);
        message.setFrom(new InternetAddress(from));
        message.addRecipient(Message.RecipientType.TO, new InternetAddress(mailTo));
        if(lang.equals("ua")){
            message.setSubject("Union: Відновлення паролю");
            message.setText(
                    "Ваше посилання для відновлення паролю,  https://t5.tss2020.site/new-password/" + token  +
                            " (Якщо ви не надсилали запит проігноруйте це повідомлення)");
        }else{
            message.setSubject("Union: Reset password");
            message.setText(
                    "Hello you reset link ,  https://t5.tss2020.site/new-password/" + token  +
                            " (if you did not reset you password then just ignore this message)");
        }
        Transport.send(message);
    }
}
