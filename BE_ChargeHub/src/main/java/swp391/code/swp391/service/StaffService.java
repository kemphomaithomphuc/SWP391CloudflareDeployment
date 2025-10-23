package swp391.code.swp391.service;

import swp391.code.swp391.dto.ChangeChargingPointRequestDTO;
import swp391.code.swp391.dto.ChangeChargingPointResponseDTO;
import swp391.code.swp391.dto.ChargingPointDTO;

import java.util.List;

public interface StaffService {

    /**
     * Đổi trụ sạc cho driver khi trụ hiện tại bị chiếm dụng
     * @param request Thông tin đổi trụ sạc
     * @return Kết quả đổi trụ sạc
     */
    ChangeChargingPointResponseDTO changeChargingPointForDriver(ChangeChargingPointRequestDTO request);

    /**
     * Tìm trụ sạc thay thế cùng loại connector trong cùng station
     * @param orderId ID của order cần đổi trụ
     * @param currentChargingPointId ID trụ sạc hiện tại
     * @return Danh sách trụ sạc có thể thay thế
     */
    List<ChargingPointDTO> findAlternativeChargingPoints(Long orderId, Long currentChargingPointId);
}