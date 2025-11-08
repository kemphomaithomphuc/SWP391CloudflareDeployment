package swp391.code.swp391.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.*;
import swp391.code.swp391.service.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired private GeminiService geminiService;
    @Autowired private IssueReportService issueReportService;
    // TIÊM "BỘ NHỚ" SESSION VÀO CONTROLLER
    @Autowired
    private ChatHistory chatHistory;
    @Autowired
    private AnalyticsService analyticsService;
    @Autowired
    private ChargingStationService chargingStationService;
    @Autowired
    private ProactiveSuggestionService proactiveSuggestionService;

    @PostMapping("/send")
    public ResponseEntity<ChatResponse> handleChatMessage(@RequestBody ChatRequest chatRequest) {

        // 1. Thêm tin nhắn mới của user vào "bộ nhớ"
        chatHistory.addMessage("user", chatRequest.getMessage());

        // 2. Lấy TOÀN BỘ lịch sử ra
        List<ChatMessage> fullHistory = chatHistory.getHistory();

        // 3. Gửi TOÀN BỘ lịch sử cho Gemini
        GeminiChatDecision decision = geminiService.handleChatIntent(fullHistory);

        // 4. Lấy câu trả lời của Bot
        String botReply = decision.getChatResponse();

        // Xử lý lỗi (Rate Limit, Lỗi Parse)
        if ("ERROR".equals(decision.getIntent())) {
            return ResponseEntity.ok(new ChatResponse(botReply));
        }
        // Xử lý báo lỗi
        else if ("REPORTING_ISSUE".equals(decision.getIntent())) {
            if (decision.getReportDetails() != null && decision.getReportDetails().getStationName() != null) {
                try {
                    // Gemini đã nhớ ngữ cảnh và bóc tách được
                    issueReportService.createReportFromParsedData(
                            decision.getReportDetails(),
                            chatRequest.getMessage() // Hoặc gửi toàn bộ history
                    );

                    // Tạo response rõ ràng cho user
                    String issueType = decision.getReportDetails().getIssueType() != null ?
                            decision.getReportDetails().getIssueType() : "sự cố";
                    botReply = String.format("Cảm ơn bạn đã báo cáo! Bạn đã báo cáo cho quản trị viên vấn đề: %s tại trạm %s. " +
                            "Chúng tôi sẽ xử lý sớm nhất có thể. Bạn sẽ nhận được thông báo về tình trạng xử lý.",
                            issueType,
                            decision.getReportDetails().getStationName());
                } catch (Exception e) {
                    return ResponseEntity.ok(new ChatResponse("Tôi ghi nhận lỗi, nhưng: " + e.getMessage()));
                }
            } else {
                return ResponseEntity.ok(new ChatResponse("Tôi hiểu bạn báo lỗi, nhưng vui lòng cung cấp TÊN TRẠM nhé."));
            }
        }
        else if ("CHECK_AVAILABILITY".equals(decision.getIntent())) {
            botReply = handleAvailabilityCheck(decision);
        }
        // Xử lý hỏi đáp (Mặc định)
        else {
            botReply = decision.getChatResponse();
        }
        // Lưu câu trả lời của Bot vào "bộ nhớ"
        chatHistory.addMessage("model", botReply);

        // NEW: Tạo proactive suggestions
        List<ProactiveSuggestionDTO> suggestions =
            proactiveSuggestionService.generateSuggestions(decision, chatRequest.getMessage());

        // Trả về câu trả lời của Bot với các thông tin mới
        return ResponseEntity.ok(ChatResponse.builder()
                .reply(botReply)
                .userSentiment(decision.getSentiment())
                .confidence(decision.getConfidence())
                .suggestions(suggestions)
                .detectedLanguage("vi")
                .build());
    }

    /**
     * Hàm helper mới để xử lý logic dự đoán
     */
    private String handleAvailabilityCheck(GeminiChatDecision decision) {
        String userInputStationName = decision.getStationName();
        Integer hour = decision.getHour();

        if (userInputStationName == null || hour == null) {
            return "Tôi chưa rõ bạn muốn hỏi trạm nào và vào lúc mấy giờ. Bạn có thể nói rõ hơn không?";
        }

        // Sử dụng Gemini để tìm tên trạm chính xác từ input của người dùng
        String exactStationName = geminiService.findClosestStationName(userInputStationName);

        if (exactStationName == null) {
            return "Rất tiếc, tôi không tìm thấy trạm sạc nào có tên giống \"" + userInputStationName +
                   "\". Bạn có thể kiểm tra lại tên trạm không?";
        }

        // Tìm stationId từ tên chính xác
        Long stationId = chargingStationService.findStationIdByName(exactStationName);
        if (stationId == null) {
            return "Rất tiếc, tôi không tìm thấy ID của trạm sạc \"" + exactStationName + "\"";
        }

        try {
            // 1. Lấy dữ liệu giờ cao điểm trung bình 30 ngày qua
            List<PeakHourDTO> peakData = analyticsService.getPeakHours(
                    LocalDate.now().minusDays(30),
                    LocalDate.now(),
                    stationId
            );

            // 2. Tìm mức độ cao điểm của giờ đó
            String peakLevel = "UNKNOWN";
            for (PeakHourDTO dto : peakData) {
                if (dto.getHour().equals(hour)) {
                    peakLevel = dto.getPeakLevel(); // "HIGH", "LOW", "MEDIUM"
                    break;
                }
            }

            // 3. Trả lời thông minh
            switch (peakLevel) {
                case "VERY_HIGH":
                case "HIGH":
                    return String.format("Dựa trên dữ liệu lịch sử, %d:00 là giờ CAO ĐIỂM tại %s. Khả năng cao trạm sẽ rất đông, bạn nên cân nhắc đi giờ khác.", hour, exactStationName);
                case "MEDIUM":
                    return String.format("Dựa trên dữ liệu lịch sử, %d:00 là giờ trung bình tại %s. Có thể sẽ có vài người đang sạc.", hour, exactStationName);
                case "LOW":
                    return String.format("Dựa trên dữ liệu lịch sử, %d:00 là giờ thấp điểm tại %s. Khả năng cao trạm sẽ vắng và có nhiều chỗ trống.", hour, exactStationName);
                default:
                    return String.format("Tôi đã tìm thấy trạm \"%s\", nhưng chưa có đủ dữ liệu lịch sử về giờ cao điểm tại trạm này.", exactStationName);
            }

        } catch (Exception e) {
            return "Rất tiếc, tôi chưa thể tra cứu dữ liệu giờ cao điểm cho trạm " + exactStationName;
        }
    }
}