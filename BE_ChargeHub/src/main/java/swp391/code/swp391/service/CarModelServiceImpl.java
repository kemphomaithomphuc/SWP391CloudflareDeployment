package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.CarModelDTO;
import swp391.code.swp391.entity.CarModel;
import swp391.code.swp391.entity.ConnectorType;
import swp391.code.swp391.repository.CarModelRepository;
import swp391.code.swp391.repository.ConnectorTypeRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CarModelServiceImpl implements CarModelService {

    private final CarModelRepository carModelRepository;
    private final ConnectorTypeRepository connectorTypeRepository;

    @Override
    public CarModelDTO createCarModel(CarModelDTO carModelDTO) {
        // Kiểm tra trùng lặp
        if (carModelRepository.existsByBrandAndModel(carModelDTO.getBrand(), carModelDTO.getModel())) {
            throw new RuntimeException("CarModel with brand " + carModelDTO.getBrand() + " and model " + carModelDTO.getModel() + " already exists");
        }

        CarModel carModel = convertToEntity(carModelDTO);
        CarModel savedCarModel = carModelRepository.save(carModel);
        return convertToDTO(savedCarModel);
    }

    @Override
    public CarModelDTO updateCarModel(Long carModelId, CarModelDTO carModelDTO) {
        CarModel carModel = carModelRepository.findById(carModelId)
                .orElseThrow(() -> new RuntimeException("CarModel not found with id: " + carModelId));

        carModel.setBrand(carModelDTO.getBrand());
        carModel.setModel(carModelDTO.getModel());
        carModel.setCapacity(carModelDTO.getCapacity());
        carModel.setProductYear(carModelDTO.getProductYear());

        // Cập nhật ConnectorTypes nếu có
        if (carModelDTO.getConnectorTypeIds() != null && !carModelDTO.getConnectorTypeIds().isEmpty()) {
            List<ConnectorType> connectorTypes = connectorTypeRepository.findAllById(carModelDTO.getConnectorTypeIds());
            carModel.setConnectorTypes(connectorTypes);
        }

        CarModel updatedCarModel = carModelRepository.save(carModel);
        return convertToDTO(updatedCarModel);
    }

    @Override
    public void deleteCarModel(Long carModelId) {
        if (!carModelRepository.existsById(carModelId)) {
            throw new RuntimeException("CarModel not found with id: " + carModelId);
        }
        carModelRepository.deleteById(carModelId);
    }

    @Override
    @Transactional(readOnly = true)
    public CarModelDTO getCarModelById(Long carModelId) {
        CarModel carModel = carModelRepository.findById(carModelId)
                .orElseThrow(() -> new RuntimeException("CarModel not found with id: " + carModelId));
        return convertToDTO(carModel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarModelDTO> findAllCarModels() {
        return carModelRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarModelDTO> findCarModelsByBrand(String brand) {
        return carModelRepository.findByBrandContainingIgnoreCase(brand).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarModelDTO> findCarModelsByModel(String model) {
        return carModelRepository.findByModelContainingIgnoreCase(model).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarModelDTO> findCarModelsByProductYear(int productYear) {
        return carModelRepository.findByProductYear(productYear).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarModelDTO> findCarModelsByConnectorType(Long connectorTypeId) {
        return carModelRepository.findByConnectorTypeId(connectorTypeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Helper methods
    private CarModel convertToEntity(CarModelDTO carModelDTO) {
        CarModel carModel = new CarModel();
        carModel.setBrand(carModelDTO.getBrand());
        carModel.setModel(carModelDTO.getModel());
        carModel.setCapacity(carModelDTO.getCapacity());
        carModel.setProductYear(carModelDTO.getProductYear());

        if (carModelDTO.getConnectorTypeIds() != null && !carModelDTO.getConnectorTypeIds().isEmpty()) {
            List<ConnectorType> connectorTypes = connectorTypeRepository.findAllById(carModelDTO.getConnectorTypeIds());
            carModel.setConnectorTypes(connectorTypes);
        }

        return carModel;
    }

    private CarModelDTO convertToDTO(CarModel carModel) {
        CarModelDTO dto = new CarModelDTO();
        dto.setCarModelId(carModel.getCar_model_id());
        dto.setBrand(carModel.getBrand());
        dto.setModel(carModel.getModel());
        dto.setCapacity(carModel.getCapacity());
        dto.setProductYear(carModel.getProductYear());
        if (carModel.getConnectorTypes() != null) {
            dto.setConnectorTypes(carModel.getConnectorTypes());
        }
        return dto;
    }
}