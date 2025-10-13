package swp391.code.swp391.service;


import swp391.code.swp391.entity.Session;

import java.util.List;
import java.util.Optional;

public interface SessionService {

    boolean isValidTime(Long orderId,int maxStartDelayMinutes);

    //CRUD cho Session
    //Tao moi session khi tao order
    Optional<Session> createSession(Long orderId);

    //Lay session dua tren sessionId
    Session getSessionById(Long sessionId);

    //Lay tat ca session
    List<Session> getAllSessions();

    //Cap nhat session
    Session updateSession(Session session);

    //Xoa session
    void deleteSession(Long sessionId);
}
