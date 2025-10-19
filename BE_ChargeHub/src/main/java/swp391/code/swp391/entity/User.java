package swp391.code.swp391.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "full_name", nullable = false, columnDefinition = "NVARCHAR(100)")
    private String fullName;
    @Column(name = "email", unique = true) //Nullable true để đăng ký bằng phone (fb)
    private String email;
    @Column(name = "password")
    private String password;
    @Column(name = "phone", unique = true) //Nullable true để đăng ký bằng email (gg)
    private String phone;
    @Column(name = "date_Of_Birth")
    private LocalDate dateOfBirth;

    private String googleId; // For OAuth2 Google login
    private String facebookId; // For OAuth2 Facebook login

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role = UserRole.DRIVER;
    @Column(name ="address", columnDefinition = "NVARCHAR(255)")
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "avatar")
    private String avatar;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Vehicle> vehicles;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Verification> verifications;

    @ManyToMany(mappedBy = "stationStaff")
    private List<ChargingStation> assignedStations;

    public User(String fullName, String email, String password, String phone, LocalDate dateOfBirth, String address) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.dateOfBirth = dateOfBirth;
        this.address = address;
    }
    
    // Enums for UserStatus and UserRole
    public enum UserStatus {
        ACTIVE, INACTIVE, BANNED
    }

    public enum UserRole {
        DRIVER, ADMIN, STAFF
    }
}
