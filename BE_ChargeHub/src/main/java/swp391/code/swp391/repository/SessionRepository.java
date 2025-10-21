package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Session;

import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {

    /**
     * Tìm session theo trạng thái
     */
    List<Session> findByStatus(Session.SessionStatus status);

    /**
     * Tìm session theo order ID
     */
    Session findByOrderOrderId(Long orderId);
}