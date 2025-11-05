package swp391.code.swp391.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import swp391.code.swp391.dto.ParsedIssueReportDTO;
import swp391.code.swp391.dto.SmartReportRequest;
import swp391.code.swp391.service.GeminiService;
import swp391.code.swp391.service.IssueReportService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class SmartReportController {

    @Autowired private GeminiService geminiService;
    @Autowired private IssueReportService issueReportService;

    @PostMapping("/submit-smart")
    public ResponseEntity<?> submitSmartReport(@RequestBody SmartReportRequest request) {

        ParsedIssueReportDTO parsedReport = geminiService.parseUserFeedback(request.getUserFeedback());

        if (parsedReport == null) {
            return ResponseEntity.status(429).body("Lỗi: Bạn đã gửi quá nhiều yêu cầu (Rate Limit).");
        }
        if (parsedReport.getStationName() == null) {
            return ResponseEntity.status(400).body("Lỗi: Không thể phân tích tên trạm từ phản hồi của bạn.");
        }

        try {
            issueReportService.createReportFromParsedData(parsedReport, request.getUserFeedback());
            return ResponseEntity.ok(parsedReport); // Trả về JSON đã bóc tách
        } catch (Exception e) {
            return ResponseEntity.status(404).body("Lỗi: " + e.getMessage());
        }
    }
}