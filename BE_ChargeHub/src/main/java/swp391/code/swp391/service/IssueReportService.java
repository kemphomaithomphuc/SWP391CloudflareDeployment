package swp391.code.swp391.service;

import swp391.code.swp391.dto.IssueReportDTO;
import swp391.code.swp391.dto.IssueReportRequestDTO;

import java.util.List;

public interface IssueReportService {

    Long createIssueReport(IssueReportRequestDTO dto, Long staffId);

    void resolveIssue(Long issueId);

    List<IssueReportDTO> getAllIssueReports();
}
