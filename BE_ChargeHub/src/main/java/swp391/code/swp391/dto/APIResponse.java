package swp391.code.swp391.dto;

import lombok.Data;

import java.time.LocalDateTime;
@Data
public class APIResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public APIResponse() {
        this.timestamp = LocalDateTime.now();
    }

    public APIResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> APIResponse<T> success(String message, T data) {
        return new APIResponse<>(true, message, data);
    }

    public static <T> APIResponse<T> error(String message) {
        return new APIResponse<>(false, message, null);
    }
}
