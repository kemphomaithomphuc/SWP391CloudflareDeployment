package swp391.code.swp391.service;

import swp391.code.swp391.dto.VehicleDTO;

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

    // Xóa vehicle với user validation
    void deleteVehicleByUser(Long id, Long userId);

    // Thêm các method mới để xử lý tìm kiếm qua CarModel
    List<VehicleDTO> searchVehiclesByCarModelBrand(String brand);
    List<VehicleDTO> searchVehiclesByCarModelName(String modelName);
    List<VehicleDTO> searchVehiclesByCarModelYear(int year);
    List<VehicleDTO> searchVehiclesByCarModelCapacity(double capacity);

    public List<VehicleDTO> searchVehiclesByCarModelCapacityRange(double minCapacity, double maxCapacity);
}