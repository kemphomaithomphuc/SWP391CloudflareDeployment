package swp391.code.swp391.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.ChargingPointDTO;
import swp391.code.swp391.dto.ChargingStationDTO;
import swp391.code.swp391.entity.ChargingStation.ChargingStationStatus;
import swp391.code.swp391.service.ChargingStationService;

import java.util.List;

@RestController
@RequestMapping("/api/charging-stations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChargingStationController {

    private final ChargingStationService chargingStationService;

    // Tạo charging station mới
    @PostMapping
    public ResponseEntity<?> createChargingStation(@RequestBody @Validated ChargingStationDTO chargingStationDTO) {
        try {
            // Validate số lượng charging points
            if (chargingStationDTO.getChargingPoints() == null || chargingStationDTO.getChargingPoints().isEmpty()) {
                return new ResponseEntity<>("At least one charging point is required", HttpStatus.BAD_REQUEST);
            }

            // Validate số lượng charging points khớp với chargingPointNumber
            if (chargingStationDTO.getChargingPointNumber() != chargingStationDTO.getChargingPoints().size()) {
                return new ResponseEntity<>("Charging point number must match the number of charging points provided",
                        HttpStatus.BAD_REQUEST);
            }

            // Validate connector type name
            for (ChargingPointDTO chargingPoint : chargingStationDTO.getChargingPoints()) {
                if (chargingPoint.getTypeName() == null || chargingPoint.getTypeName().trim().isEmpty()) {
                    return new ResponseEntity<>("Connector type name is required for each charging point",
                            HttpStatus.BAD_REQUEST);
                }
            }

            ChargingStationDTO createdStation = chargingStationService.createChargingStation(chargingStationDTO);
            return new ResponseEntity<>(createdStation, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Lấy tất cả charging stations
    @GetMapping
    public ResponseEntity<List<ChargingStationDTO>> getAllChargingStations() {
        List<ChargingStationDTO> chargingStations = chargingStationService.getAllChargingStations();
        return new ResponseEntity<>(chargingStations, HttpStatus.OK);
    }

    // Cập nhật charging station
    @PutMapping("/{stationId}")
    public ResponseEntity<?> updateChargingStation(@PathVariable Long stationId,
                                                   @RequestBody @Validated ChargingStationDTO chargingStationDTO) {
        try {
            ChargingStationDTO updatedStation = chargingStationService.updateChargingStation(stationId, chargingStationDTO);
            return new ResponseEntity<>(updatedStation, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Xóa charging station
    @DeleteMapping("/{stationId}")
    public ResponseEntity<?> deleteChargingStation(@PathVariable Long stationId) {
        try {
            chargingStationService.deleteChargingStation(stationId);
            return new ResponseEntity<>("Charging station deleted successfully", HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Tìm kiếm stations theo tên
    @GetMapping("/search/name")
    public ResponseEntity<List<ChargingStationDTO>> searchChargingStationsByName(@RequestParam String name) {
        List<ChargingStationDTO> stations = chargingStationService.searchChargingStationsByName(name);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Tìm kiếm stations theo địa chỉ
    @GetMapping("/search/address")
    public ResponseEntity<List<ChargingStationDTO>> searchChargingStationsByAddress(@RequestParam String address) {
        List<ChargingStationDTO> stations = chargingStationService.searchChargingStationsByAddress(address);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Lấy stations theo status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ChargingStationDTO>> getChargingStationsByStatus(@PathVariable ChargingStationStatus status) {
        List<ChargingStationDTO> stations = chargingStationService.getChargingStationsByStatus(status);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Cập nhật status của station
    @PatchMapping("/{stationId}/status")
    public ResponseEntity<?> updateChargingStationStatus(@PathVariable Long stationId,
                                                         @RequestBody ChargingStationStatus status) {
        try {
            ChargingStationDTO updatedStation = chargingStationService.updateChargingStationStatus(stationId, status);
            return new ResponseEntity<>(updatedStation, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // Lấy stations có available charging points
    @GetMapping("/with-available-points")
    public ResponseEntity<List<ChargingStationDTO>> getStationsWithAvailableChargingPoints() {
        List<ChargingStationDTO> stations = chargingStationService.getStationsWithAvailableChargingPoints();
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Lấy stations theo số lượng charging points tối thiểu
    @GetMapping("/min-points/{minPoints}")
    public ResponseEntity<List<ChargingStationDTO>> getStationsWithMinimumChargingPoints(@PathVariable int minPoints) {
        List<ChargingStationDTO> stations = chargingStationService.getStationsWithMinimumChargingPoints(minPoints);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Lấy stations không có charging points
    @GetMapping("/without-points")
    public ResponseEntity<List<ChargingStationDTO>> getStationsWithoutChargingPoints() {
        List<ChargingStationDTO> stations = chargingStationService.getStationsWithoutChargingPoints();
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Lấy stations theo connector type
    @GetMapping("/connector-type/{connectorTypeId}")
    public ResponseEntity<List<ChargingStationDTO>> getStationsByConnectorType(@PathVariable Long connectorTypeId) {
        List<ChargingStationDTO> stations = chargingStationService.getStationsByConnectorType(connectorTypeId);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Tìm kiếm stations theo địa chỉ và status
    @GetMapping("/search/address-status")
    public ResponseEntity<List<ChargingStationDTO>> searchStationsByAddressAndStatus(
            @RequestParam String address,
            @RequestParam ChargingStationStatus status) {
        List<ChargingStationDTO> stations = chargingStationService.searchStationsByAddressAndStatus(address, status);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Tìm kiếm stations theo tên và status
    @GetMapping("/search/name-status")
    public ResponseEntity<List<ChargingStationDTO>> searchStationsByNameAndStatus(
            @RequestParam String name,
            @RequestParam ChargingStationStatus status) {
        List<ChargingStationDTO> stations = chargingStationService.searchStationsByNameAndStatus(name, status);
        return new ResponseEntity<>(stations, HttpStatus.OK);
    }

    // Đếm stations theo status
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> countStationsByStatus(@PathVariable ChargingStationStatus status) {
        long count = chargingStationService.countStationsByStatus(status);
        return new ResponseEntity<>(count, HttpStatus.OK);
    }

    // Kiểm tra tên station có tồn tại không
    @GetMapping("/exists")
    public ResponseEntity<Boolean> isStationNameExists(@RequestParam String stationName) {
        boolean exists = chargingStationService.isStationNameExists(stationName);
        return new ResponseEntity<>(exists, HttpStatus.OK);
    }
}