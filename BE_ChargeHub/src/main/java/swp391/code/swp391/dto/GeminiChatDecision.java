package swp391.code.swp391.dto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
@Data @JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiChatDecision {
    @JsonProperty("intent") private String intent;
    @JsonProperty("answer") private String chatResponse; // Khớp với "answer"
    @JsonProperty("report_details") private ParsedIssueReportDTO reportDetails;

    @JsonProperty("station_name")
    private String stationName; // Dùng cho CHECK_AVAILABILITY

    @JsonProperty("hour")
    private Integer hour; // Dùng cho CHECK_AVAILABILITY
}