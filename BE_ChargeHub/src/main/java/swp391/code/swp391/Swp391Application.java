package swp391.code.swp391;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "swp391.code.swp391.repository")
@EntityScan(basePackages = "swp391.code.swp391.entity")
@EnableScheduling // Enable scheduled tasks for PenaltyScheduler
public class Swp391Application {

    public static void main(String[] args) {
        SpringApplication.run(Swp391Application.class, args);
    }

}
