package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.VehicleDTO;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.entity.Vehicle;
import swp391.code.swp391.repository.UserRepository;
import swp391.code.swp391.repository.VehicleRepository;
import swp391.code.swp391.repository.CarModelRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final CarModelRepository carModelRepository;

    @Override
    public VehicleDTO createVehicle(VehicleDTO vehicleDTO) {
        // Kiểm tra plate number đã tồn tại
        if (vehicleRepository.existsByPlateNumber(vehicleDTO.getPlateNumber())) {
            throw new RuntimeException("Vehicle with plate number " + vehicleDTO.getPlateNumber() + " already exists");
        }

        Vehicle vehicle = convertToEntity(vehicleDTO);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return convertToDTO(savedVehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleDTO getVehicleByPlateNumber(String plateNumber) {
        Vehicle vehicle = vehicleRepository.findByPlateNumber(plateNumber)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with plate number: " + plateNumber));
        return convertToDTO(vehicle);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> getAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> getVehiclesByUserId(Long userId) {
        return vehicleRepository.findByUserUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public VehicleDTO updateVehicle(Long id, VehicleDTO vehicleDTO) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        existingVehicle.setPlateNumber(vehicleDTO.getPlateNumber());

        // Cập nhật carModel nếu có
        if (vehicleDTO.getCarModel() != null) {
            existingVehicle.setCarModel(vehicleDTO.getCarModel());
        }

        // Cập nhật user nếu có
        if (vehicleDTO.getUserId() != null) {
            User user = userRepository.findById(vehicleDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + vehicleDTO.getUserId()));
            existingVehicle.setUser(user);
        }

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return convertToDTO(updatedVehicle);
    }

    @Override
    public void deleteVehicleByUser(Long id, Long userId) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Kiểm tra vehicle có thuộc về user không
        if (vehicle.getUser() == null || !vehicle.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("You don't have permission to delete this vehicle");
        }
        vehicleRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByConnectorType(Long connectorTypeId) {
        return vehicleRepository.findByCarModelConnectorTypeId(connectorTypeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByCarModelBrand(String brand) {
        return vehicleRepository.findByCarModelBrandContainingIgnoreCase(brand).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByCarModelName(String modelName) {
        return vehicleRepository.findByCarModelNameContainingIgnoreCase(modelName).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByCarModelYear(int year) {
        return vehicleRepository.findByCarModelYear(year).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByCarModelCapacity(double capacity) {
        return vehicleRepository.findByCarModelCapacity(capacity).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByCarModelCapacityRange(double minCapacity, double maxCapacity) {
        return vehicleRepository.findByCarModelCapacityBetween(minCapacity, maxCapacity).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods
    private Vehicle convertToEntity(VehicleDTO vehicleDTO) {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber(vehicleDTO.getPlateNumber());

        // Set carModel
        if (vehicleDTO.getCarModel() != null) {
            vehicle.setCarModel(vehicleDTO.getCarModel());
        }

        // Set user
        if (vehicleDTO.getUserId() != null) {
            User user = userRepository.findById(vehicleDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + vehicleDTO.getUserId()));
            vehicle.setUser(user);
        }

        return vehicle;
    }

    private VehicleDTO convertToDTO(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setPlateNumber(vehicle.getPlateNumber());

        // Cho response: set full objects
        //dto.setUser(vehicle.getUser());
        if (vehicle.getCarModel() != null) {
//            dto.setCarModel(vehicle.getCarModel().getCar_model_id());

            //lấy ConnectorType từ carModel
            dto.setConnectorTypes(vehicle.getCarModel().getConnectorTypes());
        }
        if (vehicle.getUser() != null)
            dto.setUserId(vehicle.getUser().getUserId());

        return dto;
    }
}