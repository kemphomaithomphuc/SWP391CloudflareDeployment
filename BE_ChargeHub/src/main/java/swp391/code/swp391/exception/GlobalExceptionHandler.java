package swp391.code.swp391.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import swp391.code.swp391.dto.APIResponse;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiRequestException.class)
    public ResponseEntity<APIResponse<Object>> handleApiRequestException(ApiRequestException ex) {
        return ResponseEntity.badRequest().body(
                APIResponse.builder()
                        .success(false)
                        .message(ex.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse<Object>> handleOtherExceptions(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                APIResponse.builder()
                        .success(false)
                        .message("Đã xảy ra lỗi hệ thống: " + ex.getMessage())
                        .build()
        );
    }
}
