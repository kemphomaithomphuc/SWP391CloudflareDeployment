package swp391.code.swp391.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import swp391.code.swp391.entity.Vehicle;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    // Tìm vehicle theo user ID
    List<Vehicle> findByUserUserId(Long userId);

    Optional<Vehicle> findByPlateNumber(String plateNumber);

    // Custom query tìm vehicle theo connector type
    @Query("SELECT v FROM Vehicle v JOIN v.carModel cm JOIN cm.connectorTypes ct WHERE ct.connectorTypeId = :connectorTypeId")
    List<Vehicle> findByCarModelConnectorTypeId(@Param("connectorTypeId") Long connectorTypeId);

    // Kiểm tra vehicle có tồn tại với plate number
    boolean existsByPlateNumber(String plateNumber);

    Optional<Vehicle> findById(Long id);

    // Tìm kiếm theo brand của CarModel
    @Query("SELECT v FROM Vehicle v JOIN v.carModel cm WHERE LOWER(cm.brand) LIKE LOWER(CONCAT('%', :brand, '%'))")
    List<Vehicle> findByCarModelBrandContainingIgnoreCase(@Param("brand") String brand);

    // Tìm kiếm theo tên model của CarModel
    @Query("SELECT v FROM Vehicle v JOIN v.carModel cm WHERE LOWER(cm.model) LIKE LOWER(CONCAT('%', :modelName, '%'))")
    List<Vehicle> findByCarModelNameContainingIgnoreCase(@Param("modelName") String modelName);

    // Tìm kiếm theo năm của CarModel
    @Query("SELECT v FROM Vehicle v JOIN v.carModel cm WHERE cm.productYear = :year")
    List<Vehicle> findByCarModelYear(@Param("year") int year);

    // Tìm kiếm theo capacity của CarModel
    @Query("SELECT v FROM Vehicle v JOIN v.carModel cm WHERE cm.capacity = :capacity")
    List<Vehicle> findByCarModelCapacity(@Param("capacity") double capacity);

    // Tìm kiếm theo khoảng capacity của CarModel
    @Query("SELECT v FROM Vehicle v JOIN v.carModel cm WHERE cm.capacity BETWEEN :minCapacity AND :maxCapacity")
    List<Vehicle> findByCarModelCapacityBetween(@Param("minCapacity") double minCapacity, @Param("maxCapacity") double maxCapacity);
}