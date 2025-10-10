package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.VehicleDTO;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.entity.Vehicle;
import swp391.code.swp391.repository.UserRepository;
import swp391.code.swp391.repository.VehicleRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

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

        // Cập nhật thông tin
        existingVehicle.setBrand(vehicleDTO.getBrand());
        existingVehicle.setModel(vehicleDTO.getModel());
        existingVehicle.setCapacity(vehicleDTO.getCapacity());
        existingVehicle.setProductYear(vehicleDTO.getProductYear());

        // Cập nhật user nếu có
        if (vehicleDTO.getUserId() != null) {
            User user = userRepository.findById(vehicleDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + vehicleDTO.getUserId()));
            existingVehicle.setUser(user);
        }

        // Cập nhật connector types nếu có
//        if (vehicleDTO.getConnectorTypeIds() != null && !vehicleDTO.getConnectorTypeIds().isEmpty()) {
//            List<ConnectorType> connectorTypes = connectorTypeRepository.findAllById(vehicleDTO.getConnectorTypeIds());
//            existingVehicle.setConnectorTypes(connectorTypes);
//        }
        // đã thay đổi db, thêm carmodel nên connectortype không thay đổi theo từng vehicle mà theo model


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
    public List<VehicleDTO> searchVehiclesByBrand(String brand) {
        return vehicleRepository.findByBrandContainingIgnoreCase(brand).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByModel(String model) {
        return vehicleRepository.findByModelContainingIgnoreCase(model).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByProductYear(int productYear) {
        return vehicleRepository.findByProductYear(productYear).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDTO> searchVehiclesByConnectorType(Long connectorTypeId) {
        return vehicleRepository.findByCarModelConnectorTypeId(connectorTypeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods
    private Vehicle convertToEntity(VehicleDTO vehicleDTO) {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber(vehicleDTO.getPlateNumber());
        vehicle.setBrand(vehicleDTO.getBrand());
        vehicle.setModel(vehicleDTO.getModel());
        vehicle.setCapacity(vehicleDTO.getCapacity());
        vehicle.setProductYear(vehicleDTO.getProductYear());

        // Set user
        if (vehicleDTO.getUserId() != null) {
            User user = userRepository.findById(vehicleDTO.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + vehicleDTO.getUserId()));
            vehicle.setUser(user);
        }

         //Set connector types
//        if (vehicleDTO.getConnectorTypeIds() != null && !vehicleDTO.getConnectorTypeIds().isEmpty()) {
//            List<ConnectorType> connectorTypes = connectorTypeRepository.findAllById(vehicleDTO.getConnectorTypeIds());
//
//            vehicle.setConnectorTypes(connectorTypes);
//        }

        return vehicle;
    }

    private VehicleDTO convertToDTO(Vehicle vehicle) {
        VehicleDTO dto = new VehicleDTO();
        dto.setPlateNumber(vehicle.getPlateNumber());
        dto.setBrand(vehicle.getBrand());
        dto.setModel(vehicle.getModel());
        dto.setCapacity(vehicle.getCapacity());
        dto.setProductYear(vehicle.getProductYear());

        // Cho response: set full objects
        //dto.setUser(vehicle.getUser());
        if (vehicle.getCarModel() != null){
//            dto.setCarModel(vehicle.getCarModel().getCar_model_id());

            //lấy ConnectorType từ carModel
            dto.setConnectorTypes(vehicle.getCarModel().getConnectorTypes());
        }
        if (vehicle.getUser() != null)
            dto.setUserId(vehicle.getUser().getUserId());

        return dto;
    }
}