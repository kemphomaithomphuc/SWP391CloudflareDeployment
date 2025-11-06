package swp391.code.swp391.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
// Import các DTO mới cho History
import swp391.code.swp391.dto.*;
import swp391.code.swp391.entity.ChargingStation;
import swp391.code.swp391.entity.ConnectorType;
import swp391.code.swp391.entity.KnowledgeBaseItem;
import swp391.code.swp391.repository.ChargingStationRepository;
import swp391.code.swp391.repository.ConnectorTypeRepository;
import swp391.code.swp391.repository.KnowledgeBaseRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiService.class);
    private final GeminiApiCaller apiCaller;
    private final ObjectMapper objectMapper;
    private final ChargingStationRepository stationRepository;
    private final ConnectorTypeRepository connectorTypeRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;

    @Autowired
    public GeminiService(GeminiApiCaller apiCaller, ObjectMapper objectMapper,
                         ChargingStationRepository stationRepository,
                         ConnectorTypeRepository connectorTypeRepository,
                         KnowledgeBaseRepository knowledgeBaseRepository) {
        this.apiCaller = apiCaller;
        this.objectMapper = objectMapper;
        this.stationRepository = stationRepository;
        this.connectorTypeRepository = connectorTypeRepository;
        this.knowledgeBaseRepository = knowledgeBaseRepository;
    }

    // --- CÁC HÀM STATELESS (KHÔNG CẦN CONTEXT) ---

    /**
     * HÀM 3.0: Tìm tên trạm gần giống nhất
     * Gemini sẽ so sánh input của user với danh sách trạm và trả về tên chính xác nhất
     */
    public String findClosestStationName(String userInput) {
        String knownStations = getDynamicStationsJson();

        String promptText = String.format(
                """
                Bạn là trợ lý tìm kiếm thông minh.
                Người dùng nhập: "%s"
                Danh sách tên trạm sạc có sẵn: %s
                
                Nhiệm vụ: Tìm tên trạm CHÍNH XÁC nhất khớp với input của người dùng.
                - Nếu tìm thấy tên gần giống (cho phép lỗi chính tả, thiếu dấu, viết tắt), trả về TÊN CHÍNH XÁC từ danh sách.
                - Nếu không tìm thấy, trả về: "NOT_FOUND"
                
                Chỉ trả về TÊN TRẠM hoặc "NOT_FOUND", không giải thích gì thêm.
                """,
                userInput, knownStations
        );

        GeminiRequest request = GeminiRequest.from(promptText);
        String result = callGeminiApi(request);

        if (result == null || result.trim().isEmpty() || result.contains("NOT_FOUND")) {
            return null;
        }

        return result.trim();
    }

    /**
     * HÀM 3.1: Gợi ý Tiện ích Xung quanh
     */
    public String getAmenitiesAround(double latitude, double longitude) {
        String promptText = String.format(
                """
                Bạn là một trợ lý du lịch am hiểu. Tại một trạm sạc xe điện ở vị trí:
                Vĩ độ: %f
                Kinh độ: %f
                Trả lời dưới dạng danh sách gạch đầu dòng, không cần xin chào.
                Hãy gợi ý 3-5 địa điểm tiện ích (quán cafe, cửa hàng tiện lợi, quán ăn...)
                trong bán kính đi bộ 5 phút, cho địa chỉ cụ thể và mô tả ngắn gọn.
                """,
                latitude, longitude
        );
        // Gói prompt vào Request và gọi hàm API private
        GeminiRequest request = GeminiRequest.from(promptText);
        return callGeminiApi(request);
    }

    /**
     * HÀM 3.2: Phân tích Xu hướng Thị trường (Đã sửa)
     */
    public String getMarketTrends() {
        String promptText = """
            Bạn là một nhà phân tích thị trường xe điện (EV) chuyên nghiệp tại Việt Nam.
            Hãy tóm tắt 3 xu hướng quan trọng nhất trong tuần này
            liên quan đến thị trường xe điện và trạm sạc tại Việt Nam.
            Tập trung vào:
            1. Mẫu xe điện mới hoặc phổ biến?
            2. Động thái của đối thủ cạnh tranh (VinFast, EBOOST)?
            3. Công nghệ sạc mới?
            Trả lời ngắn gọn dưới dạng gạch đầu dòng.
            """;
        // Gói prompt vào Request và gọi hàm API private
        GeminiRequest request = GeminiRequest.from(promptText);
        return callGeminiApi(request);
    }

    /**
     * HÀM 3.3 (Báo lỗi): Dùng cho SmartReportController
     */
    public ParsedIssueReportDTO parseUserFeedback(String userFeedbackText) {
        String knownStations = getDynamicStationsJson();
        String knownConnectors = getDynamicConnectorsJson();
        String knownIssues = "[\"Không vào điện\", \"Hỏng hóc vật lý\", \"Không kết nối được\", \"Ứng dụng lỗi\", \"Khác\"]";

        String promptText = String.format(
                """
                Phân tích phản hồi của người dùng.
                Chỉ trả lời bằng một cấu trúc JSON duy nhất.
                Dựa vào các danh sách sau:
                Trạm sạc đã biết: %s
                Loại trụ đã biết: %s
                Loại lỗi đã biết: %s
                Cảm xúc: ["TÍCH CỰC", "TIÊU CỰC", "TRUNG LẬP"]
                Phản hồi: "%s"
                
                JSON:
                {
                  "station_name": "[tên trạm]",
                  "connector_type": "[loại trụ]",
                  "issue_type": "[loại lỗi]",
                  "user_sentiment": "[cảm xúc]"
                }
                """,
                knownStations, knownConnectors, knownIssues, userFeedbackText
        );

        // Gói prompt vào Request và gọi hàm API private
        GeminiRequest request = GeminiRequest.from(promptText);
        String jsonString = callGeminiApi(request);

        if (jsonString == null) return null;
        try {
            String cleanJson = jsonString.replace("```json", "").replace("```", "").trim();
            return objectMapper.readValue(cleanJson, ParsedIssueReportDTO.class);
        } catch (Exception e) {
            logger.error("Lỗi parse JSON báo lỗi: {}", e.getMessage(), e);
            return null;
        }
    }

    // --- HÀM STATEFUL (CẦN CONTEXT) ---

    /**
     * HÀM 3.3 (Chatbot): ĐÃ NÂNG CẤP ĐỂ NHỚ CONTEXT (Đã sửa)
     */
    public GeminiChatDecision handleChatIntent(List<ChatMessage> history) {

        // 1. Xây dựng Master Prompt
        String knownStations = getDynamicStationsJson();
        String knownConnectors = getDynamicConnectorsJson();
        String knownIssues = "[\"Không vào điện\", \"Hỏng hóc vật lý\", \"Không kết nối được\"]";
        String dynamicKnowledgeBase = getDynamicKnowledgeBase();

        String masterPrompt = String.format(
                """
                Bạn là một trợ lý AI. Xem toàn bộ LỊCH SỬ TRÒ CHUYỆN.
                Dựa vào tin nhắn CUỐI CÙNG của user, phân tích ý định (intent).
                Chỉ trả lời bằng MỘT cấu trúc JSON DUY NHẤT.

                Ý định: "ASKING_QUESTION" (hỏi đáp) hoặc "REPORTING_ISSUE" (báo lỗi).

                Nếu intent = "ASKING_QUESTION":
                - Dùng LỊCH SỬ và kiến thức sau để trả lời.
                - JSON: { "intent": "ASKING_QUESTION", "answer": "[Câu trả lời]" }
                KIẾN THỨC: %s

                Nếu intent = "REPORTING_ISSUE":
                - Dùng LỊCH SỬ để bóc tách thông tin (user có thể cung cấp tên trạm, trụ, lỗi ở nhiều tin nhắn).
                - JSON: { "intent": "REPORTING_ISSUE", "answer": "[Câu trả lời xác nhận]", "report_details": { ... } }
                Nếu intent = "CHECK_AVAILABILITY":
                - User đang hỏi về tình trạng trạm (ví dụ: "còn chỗ không", "có đông không").
                - Bóc tách TÊN TRẠM và GIỜ (0-23). Nếu là "sáng", "chiều", "tối", hãy ước lượng (vd: sáng=7, chiều=15, tối=19).
                - JSON: { "intent": "CHECK_AVAILABILITY", "answer": "[Câu trả lời chờ]", "station_name": "[Tên trạm]", "hour": [số giờ 0-23] }
                THÔNG TIN BÓC TÁCH:
                - Trạm đã biết: %s
                - Trụ đã biết: %s
                - Lỗi đã biết: %s
                
                ---
                JSON:
                """,
                dynamicKnowledgeBase,
                knownStations, knownConnectors, knownIssues
        );

        // 2. Xây dựng List<GeminiContent> (Lịch sử chat)
        List<GeminiContent> contents = new ArrayList<>();
        for (int i = 0; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            String text = msg.getText();

            // Gắn master prompt vào tin nhắn đầu tiên của user
            if (i == 0 && "user".equals(msg.getRole())) {
                text = masterPrompt + "\n\nLỊCH SỬ BẮT ĐẦU:\nUser: " + text;
            }

            // Tạo GeminiContent với cấu trúc đúng: (List<GeminiPart>, role)
            List<GeminiPart> parts = List.of(new GeminiPart(text));
            contents.add(new GeminiContent(parts, msg.getRole()));
        }

        // 3. Tạo Request mới
        GeminiRequest geminiRequest = new GeminiRequest(contents, null);

        // 4. Gọi API (Hàm private thống nhất)
        String jsonString = callGeminiApi(geminiRequest);

        if (jsonString == null) {
            return createErrorDecision("Rất tiếc, tôi đang gặp lỗi kết nối (Rate Limit). Vui lòng thử lại sau 1 phút.");
        }

        try {
            String cleanJson = jsonString.replace("```json", "").replace("```", "").trim();
            GeminiChatDecision decision = objectMapper.readValue(cleanJson, GeminiChatDecision.class);

            if (decision.getIntent() == null || decision.getChatResponse() == null) {
                return createErrorDecision("Tôi chưa hiểu rõ ý của bạn. Bạn có thể nói rõ hơn không?");
            }
            return decision;

        } catch (Exception e) {
            logger.error("Lỗi parse JSON quyết định: {}", e.getMessage());
            return createErrorDecision(jsonString);
        }
    }

    // --- CÁC HÀM HELPER ---

    /**
     * Hàm gọi API private thống nhất, chấp nhận GeminiRequest (Object)
     */
    @RateLimiter(name = "gemini-limiter", fallbackMethod = "geminiFallback")
    private String callGeminiApi(GeminiRequest requestBody) {
        return apiCaller.callGemini(requestBody);
    }

    /**
     * Fallback cho hàm đã nâng cấp
     */
    private String geminiFallback(GeminiRequest requestBody, RequestNotPermitted ex) {
        logger.warn("RATE LIMIT! Request bị từ chối.");
        return null;
    }

    // (Hàm createErrorDecision)
    private GeminiChatDecision createErrorDecision(String errorMessage) {
        GeminiChatDecision errorDecision = new GeminiChatDecision();
        errorDecision.setIntent("ERROR");
        errorDecision.setChatResponse(errorMessage);
        return errorDecision;
    }

    // (Các hàm getDynamic)
    private String getDynamicKnowledgeBase() {
        try {
            List<KnowledgeBaseItem> items = knowledgeBaseRepository.findAll();
            return items.stream()
                    .map(item -> String.format("- Hỏi: %s? Trả lời: %s.", item.getQuestion(), item.getAnswer()))
                    .collect(Collectors.joining("\n"));
        } catch (Exception e) { return "Không có kiến thức."; }
    }

    private String getDynamicStationsJson() {
        try {
            List<String> stationNames = stationRepository.findAll().stream().map(ChargingStation::getStationName).toList();
            return objectMapper.writeValueAsString(stationNames);
        } catch (Exception e) { return "[]"; }
    }

    private String getDynamicConnectorsJson() {
        try {
            List<String> connectorNames = connectorTypeRepository.findAll().stream().map(ConnectorType::getTypeName).toList();
            return objectMapper.writeValueAsString(connectorNames);
        } catch (Exception e) { return "[]"; }
    }
}