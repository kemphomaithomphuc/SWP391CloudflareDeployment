package swp391.code.swp391.service;

import swp391.code.swp391.dto.VehicleDTO;
import swp391.code.swp391.entity.Vehicle;

import java.util.List;

public interface VehicleService {

    // Tạo vehicle mới
    VehicleDTO createVehicle(VehicleDTO vehicleDTO);

    // Lấy vehicle theo plate number
    VehicleDTO getVehicleByPlateNumber(String plateNumber);

    // Lấy tất cả vehicles
    List<VehicleDTO> getAllVehicles();

    // Lấy vehicles theo user ID
    List<VehicleDTO> getVehiclesByUserId(Long userId);

    // Cập nhật vehicle
    VehicleDTO updateVehicle(Long id, VehicleDTO vehicleDTO);

    // Xóa vehicle
    //void deleteVehicle(String plateNumber);

    // Tìm kiếm vehicle theo brand
    List<VehicleDTO> searchVehiclesByBrand(String brand);

    // Tìm kiếm vehicle theo model
    List<VehicleDTO> searchVehiclesByModel(String model);

    // Tìm kiếm vehicle theo năm sản xuất
    List<VehicleDTO> searchVehiclesByProductYear(int productYear);

    // Tìm kiếm vehicle theo connector type
    List<VehicleDTO> searchVehiclesByConnectorType(Long connectorTypeId);

    // Xóa vehicle với user validation
    void deleteVehicleByUser(Long id, Long userId);
}