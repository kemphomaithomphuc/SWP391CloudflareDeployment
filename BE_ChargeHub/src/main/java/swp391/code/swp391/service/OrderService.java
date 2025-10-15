package swp391.code.swp391.service;

import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.Order;
import java.util.List;


public interface OrderService {

    /**
     * Tìm các khung giờ sạc trống tại trạm cụ thể dựa trên yêu cầu của người dùng.
     *
     * @param request Dữ liệu yêu cầu bao gồm thông tin xe, trạm, mức pin hiện tại và mục tiêu.
     * @return DTO chứa thông tin các khung giờ trống, công suất, giá và ước tính chi phí.
     */
    AvailableSlotsResponseDTO findAvailableSlots(OrderRequestDTO request);

    /**
     * Xác nhận đặt chỗ sạc, tạo mới một đơn đặt trong hệ thống.
     *
     * @param request Thông tin xác nhận bao gồm user, xe, trạm, điểm sạc, thời gian bắt đầu/kết thúc.
     * @return Đối tượng {@link Order} đã được lưu trong cơ sở dữ liệu.
     */
    OrderResponseDTO confirmOrder(ConfirmOrderDTO request);

    /**
     * Lấy danh sách các đơn sạc của người dùng.
     *
     * @param userId ID người dùng.
     * @param status (Tuỳ chọn) Trạng thái đơn: BOOKED, COMPLETED, CANCELLED...
     * @return Danh sách đơn đặt sạc.
     */
    List<OrderResponseDTO> getUserOrders(Long userId, Order.Status status);
}
