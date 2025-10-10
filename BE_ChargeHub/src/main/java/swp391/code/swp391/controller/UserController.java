package swp391.code.swp391.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import swp391.code.swp391.dto.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.service.UserServiceImpl;
import swp391.code.swp391.dto.APIResponse;
import swp391.code.swp391.dto.UpdateUserDTO;
import swp391.code.swp391.service.VehicleServiceImpl;

import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {
    @Autowired
    private final UserServiceImpl userServiceImpl;
    @Autowired
    private VehicleServiceImpl vehicleServiceImpl;

    public UserController(UserServiceImpl userServiceImpl) {
        this.userServiceImpl = userServiceImpl;
    }

    /**
     * 1. XEM THÔNG TIN USER
     * GET /api/user/profile/{id}
     * GET /api/user/profile/{id}?include=vehicles
     */
    @GetMapping("/profile/{id}")
    public ResponseEntity<APIResponse<UserDTO>> viewUserProfile(
            @PathVariable Long id,
            @RequestParam(required = false) String include) {
        // Đã có trong constructor nhờ @RequiredArgsConstructor
        try {
            // TODO: Gọi service để lấy thông tin user
            User user = userServiceImpl.getUserById(id);
            UserDTO userDTO = new UserDTO(user);

            // Kiểm tra nếu cần include vehicles
            if (include != null && include.contains("vehicles")) {
                // Lấy user kèm vehicles
                userDTO = userServiceImpl.getUserByIdWithVehicles(id);
            }
//            else {
//                // Chỉ lấy thông tin user cơ bản (mặc định)
//                user = userServiceImpl.getUserById(id);
//            }
            return ResponseEntity.ok(
                    APIResponse.success("Lấy thông tin user thành công", userDTO)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi hệ thống: " + e.getMessage()));
        }
    }

    /**
     * 2. CẬP NHẬT THÔNG TIN (cần xác nhận)
     * PUT /api/user/profile/{id}
     */
    @PutMapping("/profile/{id}")
    public ResponseEntity<APIResponse<User>> updateUserProfile(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserDTO updateDTO) {

        try {
            // TODO: Gọi service để cập nhật thông tin user
            User updatedUser = userServiceImpl.updateUserProfile(id, updateDTO);

            return ResponseEntity.ok(
                    APIResponse.success("Cập nhật thông tin thành công", updatedUser)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(APIResponse.error("lỗi: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi cập nhật: " + e.getMessage()));
        }
    }

    /**
     * 2.1 CẬP NHẬT MẬT KHẨU
     * PUT /api/user/profile/password/{id}
     */
    @PutMapping("/profile/password/{id}")
    public ResponseEntity<APIResponse<UserDTO>> updateUserPassWord(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserDTO updateDTO) {

        try {
            // TODO: Gọi service để cập nhật thông tin user
            User updatedUser = userServiceImpl.changePassword(id, updateDTO);
            UserDTO userDTO = new UserDTO(updatedUser);
            return ResponseEntity.ok(
                    APIResponse.success("Cập nhật thông tin thành công", userDTO)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(APIResponse.error("lỗi: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi cập nhật: " + e.getMessage()));
        }
    }

    /**
     * 3A. GỬI MÃ XÁC THỰC cho email mới
     * POST /api/users/{id}/verify-email
     */
    @PostMapping("/{id}/verify-email")
    public ResponseEntity<APIResponse<String>> sendEmailVerification(
            @PathVariable Long id,
            @RequestBody VerificationDTO verificationDTO) {

        try {
            // TODO: Gọi service để gửi mã xác thực email
            // String result = userService.sendEmailVerification(id, verificationDTO.getNewEmail());

            return ResponseEntity.ok(
                    APIResponse.success("Mã xác thực đã được gửi đến email mới", null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi gửi mã xác thực: " + e.getMessage()));
        }
    }

    /**
     * 3B. XÁC THỰC email mới
     * POST /api/users/{id}/confirm-email
     */
    @PostMapping("/{id}/confirm-email")
    public ResponseEntity<APIResponse<User>> confirmEmailChange(
            @PathVariable Long id,
            @RequestBody VerificationDTO verificationDTO) {

        try {
            // TODO: Gọi service để xác thực và cập nhật email
            // User updatedUser = userService.confirmEmailChange(id,
            //     verificationDTO.getNewEmail(),
            //     verificationDTO.getVerificationCode());

            return ResponseEntity.ok(
                    APIResponse.success("Email đã được cập nhật thành công", null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi xác thực email: " + e.getMessage()));
        }
    }

    /**
     * 3C. GỬI MÃ XÁC THỰC cho số điện thoại mới
     * POST /api/users/{id}/verify-phone
     */
    @PostMapping("/{id}/verify-phone")
    public ResponseEntity<APIResponse<String>> sendPhoneVerification(
            @PathVariable Long id,
            @RequestBody VerificationDTO verificationDTO) {

        try {
            // TODO: Gọi service để gửi mã xác thực phone
            // String result = userService.sendPhoneVerification(id, verificationDTO.getNewPhoneNumber());

            return ResponseEntity.ok(
                    APIResponse.success("Mã xác thực đã được gửi đến số điện thoại mới", null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi gửi mã xác thực: " + e.getMessage()));
        }
    }

    /**
     * 3D. XÁC THỰC số điện thoại mới
     * POST /api/users/{id}/confirm-phone
     */
    @PostMapping("/{id}/confirm-phone")
    public ResponseEntity<APIResponse<User>> confirmPhoneChange(
            @PathVariable Long id,
            @RequestBody VerificationDTO verificationDTO) {

        try {
            // TODO: Gọi service để xác thực và cập nhật phone
            // User updatedUser = userService.confirmPhoneChange(id,
            //     verificationDTO.getNewPhoneNumber(),
            //     verificationDTO.getVerificationCode());

            return ResponseEntity.ok(
                    APIResponse.success("Số điện thoại đã được cập nhật thành công", null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi xác thực số điện thoại: " + e.getMessage()));
        }
    }

    /**
     * 4. XÓA USER
     * DELETE /api/user/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<APIResponse<String>> deleteUser(@PathVariable Long id) {
        try {
            userServiceImpl.deleteUser(id);
            return ResponseEntity.ok(
                    APIResponse.success("User đã được xóa thành công", null)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi xóa user: " + e.getMessage()));
        }
    }

    /**
     * 5. BAN USER
     * PUT /api/user/{id}/ban
     */
    @PutMapping("/{id}/ban")
    public ResponseEntity<APIResponse<User>> banUser(@PathVariable Long id) {
        try {
            User updatedUser = userServiceImpl.banUser(id);
            return ResponseEntity.ok(
                    APIResponse.success("User đã bị ban thành công", updatedUser)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi khi ban user: " + e.getMessage()));
        }
    }
    /**
     * 6. XEM DANH SÁCH VEHICLE CỦA USER
     * GET /api/users/{id}/vehicles
     */
    @GetMapping("/{id}/vehicles")
    public ResponseEntity<APIResponse<List<VehicleDTO>>> getUserVehicles(@PathVariable Long id) {
        try {
            List<VehicleDTO> vehicles = vehicleServiceImpl.getVehiclesByUserId(id);
            return ResponseEntity.ok(
                    APIResponse.success("Lấy danh sách vehicle thành công", vehicles)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(APIResponse.error("Không tìm thấy user hoặc vehicle: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(APIResponse.error("Lỗi hệ thống: " + e.getMessage()));
        }
    }
}
