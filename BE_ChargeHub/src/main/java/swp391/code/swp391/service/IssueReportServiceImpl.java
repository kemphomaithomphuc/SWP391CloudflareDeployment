package swp391.code.swp391.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.IssueReportDTO;
import swp391.code.swp391.dto.IssueReportRequestDTO;
import swp391.code.swp391.entity.ChargingStation;
import swp391.code.swp391.entity.IssueReport;
import swp391.code.swp391.entity.User;
import swp391.code.swp391.repository.ChargingStationRepository;
import swp391.code.swp391.repository.IssueReportRepository;
import swp391.code.swp391.repository.UserRepository;
import swp391.code.swp391.service.NotificationServiceImpl.IssueEvent;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class IssueReportServiceImpl implements IssueReportService {

    private final IssueReportRepository issueReportRepository;
    private final ChargingStationRepository chargingStationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public Long createIssueReport(IssueReportRequestDTO dto, Long staffId) {
        // Validate station exists
        ChargingStation station = chargingStationRepository.findByStationId(dto.getStationId())
                .orElseThrow(() -> new RuntimeException("Station not found"));

        // Validate staff exists
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new RuntimeException("Staff not found"));

        // Create issue report
        IssueReport issueReport = new IssueReport();
        issueReport.setStation(station);
        issueReport.setStaff(staff);
        issueReport.setDescription(dto.getDescription());
        issueReport.setStatus(IssueReport.Status.INBOX);
        issueReport.setReportedTime(LocalDateTime.now());

        IssueReport saved = issueReportRepository.save(issueReport);

        // Send notification to admin
        notificationService.createIssueNotification(station.getStationId(), IssueEvent.STATION_ERROR_ADMIN, "New issue reported: " + dto.getDescription());

        return saved.getIssueReportId();
    }

    @Override
    public void updateStatusIssue(Long issueId, String status) {
        IssueReport issueReport = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue report not found"));

        if (status.equalsIgnoreCase("RESOLVED")) {
            issueReport.setStatus(IssueReport.Status.RESOLVED);
        } else if (status.equalsIgnoreCase("IN_PROGRESS")) {
            issueReport.setStatus(IssueReport.Status.IN_PROGRESS);
        } else {
            throw new RuntimeException("Invalid status");
        }
        issueReportRepository.save(issueReport);

        notificationService.createIssueNotification(issueReport.getStation().getStationId(), IssueEvent.STATION_ERROR_STAFF, "Issue status updated! Status: " +issueReport.getStatus().name() + " "+  issueReport.getDescription());
    }

    @Override
    public List<IssueReportDTO> getAllIssueReports() {
        List<IssueReport> issues = issueReportRepository.findAll();
        return issues.stream()
                .map(issue -> new IssueReportDTO(
                        issue.getIssueReportId(),
                        issue.getStation().getStationId(),
                        issue.getStation().getStationName(),
                        issue.getStaff().getUserId(),
                        issue.getStaff().getFullName(),
                        issue.getDescription(),
                        issue.getStatus(),
                        issue.getReportedTime()
                ))
                .collect(Collectors.toList());
    }
}
