package test.java;

import main.java.ActivePing;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ActivePingTest {

    @Test
    void getPingList() {
    }

    @Test
    void pingList() {
    }

    @Test
    void ping() {
        assertEquals(200, ActivePing.ping("http://www.google.com"));
        assertEquals(404, ActivePing.ping("http://wekqwq.com"));
        assertEquals(200, ActivePing.ping("https://www.google.com"));
        assertEquals(404, ActivePing.ping("https://ewqewq.com"));
    }
}