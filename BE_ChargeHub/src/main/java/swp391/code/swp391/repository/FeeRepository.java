package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Fee;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {
    // The save method is already provided by JpaRepository
}
