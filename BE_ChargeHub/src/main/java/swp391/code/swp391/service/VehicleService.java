package swp391.code.swp391.service;

import swp391.code.swp391.dto.VehicleDTO;
import swp391.code.swp391.entity.User;

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
    VehicleDTO updateVehicle(String plateNumber, VehicleDTO vehicleDTO, Long userId);

    // Xóa vehicle với user validation
    void deleteVehicleByUser(String plateNumber, Long userId);

}