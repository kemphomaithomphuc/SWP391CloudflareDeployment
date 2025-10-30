package swp391.code.swp391.service;

import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import swp391.code.swp391.dto.RevenueFilterRequestDTO;
import swp391.code.swp391.dto.RevenueResponseDTO;
import swp391.code.swp391.entity.Session;
import swp391.code.swp391.entity.Transaction;
import swp391.code.swp391.repository.SessionRepository;
import swp391.code.swp391.repository.TransactionRepository;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueServiceImpl implements RevenueService {

    private final TransactionRepository transactionRepository;
    private final SessionRepository sessionRepository;

    @Override
    @Transactional(readOnly = true)
    public RevenueResponseDTO getRevenueReport(RevenueFilterRequestDTO filter) {
        log.info("Lấy báo cáo doanh thu với filter: {}", filter);

        // Validate filter
        validateFilter(filter);

        // Lấy danh sách transactions theo filter
        List<Transaction> transactions = getFilteredTransactions(filter);

        // Tính tổng quan
        RevenueResponseDTO.RevenueSummary summary = calculateSummary(transactions, filter);

        // Dữ liệu biểu đồ theo thời gian
        List<RevenueResponseDTO.RevenueChartData> chartData = generateChartData(transactions, filter);

        // Doanh thu theo trạm
        List<RevenueResponseDTO.RevenueByStation> revenueByStation = calculateRevenueByStation(transactions);

        // Doanh thu theo phương thức thanh toán
        Map<String, BigDecimal> revenueByPaymentMethod = calculateRevenueByPaymentMethod(transactions);

        return RevenueResponseDTO.builder()
                .summary(summary)
                .chartData(chartData)
                .revenueByStation(revenueByStation)
                .revenueByPaymentMethod(revenueByPaymentMethod)
                .build();
    }

    @Override
    public void validateFilter(RevenueFilterRequestDTO filter) {
        if (filter.getFromDate() != null && filter.getToDate() != null) {
            if (filter.getFromDate().isAfter(filter.getToDate())) {
                throw new IllegalArgumentException("Ngày bắt đầu phải trước ngày kết thúc");
            }

            // Giới hạn khoảng thời gian tối đa 1 năm
            long daysBetween = ChronoUnit.DAYS.between(filter.getFromDate(), filter.getToDate());
            if (daysBetween > 365) {
                throw new IllegalArgumentException("Khoảng thời gian không được vượt quá 365 ngày");
            }
        }

        if (filter.getFromDate() != null && filter.getFromDate().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Ngày bắt đầu không được ở tương lai");
        }

        if (filter.getGroupBy() != null) {
            String groupBy = filter.getGroupBy().toUpperCase();
            if (!Arrays.asList("DAY", "WEEK", "MONTH", "YEAR").contains(groupBy)) {
                throw new IllegalArgumentException("GroupBy chỉ được là DAY, WEEK, MONTH hoặc YEAR");
            }
        }
    }

    private List<Transaction> getFilteredTransactions(RevenueFilterRequestDTO filter) {
        List<Transaction> allTransactions = transactionRepository.findAll();

        return allTransactions.stream()
                .filter(t -> filter.getFromDate() == null ||
                        !t.getCreatedAt().isBefore(filter.getFromDate()))
                .filter(t -> filter.getToDate() == null ||
                        !t.getCreatedAt().isAfter(filter.getToDate()))
                .filter(t -> filter.getStatus() == null ||
                        t.getStatus().equals(filter.getStatus()))
                .filter(t -> filter.getPaymentMethod() == null ||
                        t.getPaymentMethod().equals(filter.getPaymentMethod()))
                .filter(t -> filter.getStationId() == null ||
                        matchesStation(t, filter.getStationId()))
                .collect(Collectors.toList());
    }

    /**
     * Kiểm tra transaction có thuộc station không
     * Session -> Order -> ChargingPoint -> Station
     */
    private boolean matchesStation(Transaction transaction, Long stationId) {
        if (transaction.getSession() == null) {
            return false;
        }

        Session session = transaction.getSession();
        if (session.getOrder() == null) {
            return false;
        }

        if (session.getOrder().getChargingPoint() == null) {
            return false;
        }

        if (session.getOrder().getChargingPoint().getStation() == null) {
            return false;
        }

        return session.getOrder().getChargingPoint().getStation().getStationId().equals(stationId);
    }

    private RevenueResponseDTO.RevenueSummary calculateSummary(List<Transaction> transactions, RevenueFilterRequestDTO filter) {
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal successRevenue = BigDecimal.ZERO;
        BigDecimal pendingRevenue = BigDecimal.ZERO;
        BigDecimal failedRevenue = BigDecimal.ZERO;

        long successCount = 0;
        long pendingCount = 0;
        long failedCount = 0;

        for (Transaction t : transactions) {
            BigDecimal amount = BigDecimal.valueOf(t.getAmount());
            totalRevenue = totalRevenue.add(amount);

            switch (t.getStatus()) {
                case SUCCESS:
                    successRevenue = successRevenue.add(amount);
                    successCount++;
                    break;
                case PENDING:
                    pendingRevenue = pendingRevenue.add(amount);
                    pendingCount++;
                    break;
                case FAILED:
                    failedRevenue = failedRevenue.add(amount);
                    failedCount++;
                    break;
            }
        }

        BigDecimal avgAmount = transactions.isEmpty() ? BigDecimal.ZERO :
                totalRevenue.divide(BigDecimal.valueOf(transactions.size()), 2, RoundingMode.HALF_UP);

        // Tính tỷ lệ tăng trưởng (so với kỳ trước)
        BigDecimal growthRate = calculateGrowthRate(filter);

        return RevenueResponseDTO.RevenueSummary.builder()
                .totalRevenue(totalRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalSuccessRevenue(successRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalPendingRevenue(pendingRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalFailedRevenue(failedRevenue.setScale(2, RoundingMode.HALF_UP))
                .totalTransactions((long) transactions.size())
                .successfulTransactions(successCount)
                .pendingTransactions(pendingCount)
                .failedTransactions(failedCount)
                .averageTransactionAmount(avgAmount)
                .growthRate(growthRate)
                .build();
    }

    private BigDecimal calculateGrowthRate(RevenueFilterRequestDTO filter) {
        // Logic tính tỷ lệ tăng trưởng so với kỳ trước
        if (filter.getFromDate() == null || filter.getToDate() == null) {
            return BigDecimal.ZERO;
        }

        long daysBetween = ChronoUnit.DAYS.between(filter.getFromDate(), filter.getToDate());
        LocalDateTime previousFrom = filter.getFromDate().minusDays(daysBetween);
        LocalDateTime previousTo = filter.getFromDate();

        RevenueFilterRequestDTO previousFilter = RevenueFilterRequestDTO.builder()
                .fromDate(previousFrom)
                .toDate(previousTo)
                .status(filter.getStatus())
                .paymentMethod(filter.getPaymentMethod())
                .stationId(filter.getStationId())
                .build();

        List<Transaction> previousTransactions = getFilteredTransactions(previousFilter);
        List<Transaction> currentTransactions = getFilteredTransactions(filter);

        BigDecimal previousRevenue = previousTransactions.stream()
                .map(t -> BigDecimal.valueOf(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal currentRevenue = currentTransactions.stream()
                .map(t -> BigDecimal.valueOf(t.getAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (previousRevenue.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return currentRevenue.subtract(previousRevenue)
                .divide(previousRevenue, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    private List<RevenueResponseDTO.RevenueChartData> generateChartData(List<Transaction> transactions, RevenueFilterRequestDTO filter) {
        String groupBy = filter.getGroupBy() != null ? filter.getGroupBy().toUpperCase() : "DAY";

        Map<String, List<Transaction>> groupedTransactions = transactions.stream()
                .collect(Collectors.groupingBy(t -> formatPeriod(t.getCreatedAt(), groupBy)));

        return groupedTransactions.entrySet().stream()
                .map(entry -> {
                    BigDecimal revenue = entry.getValue().stream()
                            .map(t -> BigDecimal.valueOf(t.getAmount()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    return RevenueResponseDTO.RevenueChartData.builder()
                            .period(entry.getKey())
                            .date(entry.getValue().get(0).getCreatedAt())
                            .revenue(revenue.setScale(2, RoundingMode.HALF_UP))
                            .transactionCount((long) entry.getValue().size())
                            .build();
                })
                .sorted(Comparator.comparing(RevenueResponseDTO.RevenueChartData::getDate))
                .collect(Collectors.toList());
    }

    private String formatPeriod(LocalDateTime date, String groupBy) {
        DateTimeFormatter formatter;
        switch (groupBy) {
            case "WEEK":
                return date.format(DateTimeFormatter.ofPattern("yyyy-'W'ww"));
            case "MONTH":
                return date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            case "YEAR":
                return date.format(DateTimeFormatter.ofPattern("yyyy"));
            default: // DAY
                return date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        }
    }

    private List<RevenueResponseDTO.RevenueByStation> calculateRevenueByStation(List<Transaction> transactions) {
        // Group transactions by station: Session -> Order -> ChargingPoint -> Station
        Map<Long, List<Transaction>> byStation = transactions.stream()
                .filter(t -> t.getSession() != null)
                .filter(t -> t.getSession().getOrder() != null)
                .filter(t -> t.getSession().getOrder().getChargingPoint() != null)
                .filter(t -> t.getSession().getOrder().getChargingPoint().getStation() != null)
                .collect(Collectors.groupingBy(t ->
                        t.getSession().getOrder().getChargingPoint().getStation().getStationId()));

        return byStation.entrySet().stream()
                .map(entry -> {
                    var station = entry.getValue().get(0).getSession().getOrder()
                            .getChargingPoint().getStation();

                    BigDecimal revenue = entry.getValue().stream()
                            .map(t -> BigDecimal.valueOf(t.getAmount()))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal avg = revenue.divide(
                            BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP);

                    return RevenueResponseDTO.RevenueByStation.builder()
                            .stationId(station.getStationId())
                            .stationName(station.getStationName())
                            .stationAddress(station.getAddress())
                            .revenue(revenue.setScale(2, RoundingMode.HALF_UP))
                            .transactionCount((long) entry.getValue().size())
                            .averagePerTransaction(avg)
                            .build();
                })
                .sorted(Comparator.comparing(RevenueResponseDTO.RevenueByStation::getRevenue).reversed())
                .collect(Collectors.toList());
    }

    private Map<String, BigDecimal> calculateRevenueByPaymentMethod(List<Transaction> transactions) {
        return transactions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getPaymentMethod().name(),
                        Collectors.reducing(BigDecimal.ZERO,
                                t -> BigDecimal.valueOf(t.getAmount()),
                                BigDecimal::add)
                ));
    }

    @Override
    public ByteArrayOutputStream exportRevenueToPDF(RevenueFilterRequestDTO filter) {
        log.info("Xuất báo cáo doanh thu ra PDF");
        validateFilter(filter);

        RevenueResponseDTO report = getRevenueReport(filter);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdfDoc = new PdfDocument(writer);
            Document document = new Document(pdfDoc);

            // Màu sắc
            DeviceRgb primaryColor = new DeviceRgb(220, 53, 69); // Red
            DeviceRgb headerBg = new DeviceRgb(248, 249, 250); // Light gray

            // Tiêu đề
            Paragraph title = new Paragraph("BAO CAO DOANH THU")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(primaryColor);
            document.add(title);

            // Kỳ báo cáo
            if (filter.getFromDate() != null && filter.getToDate() != null) {
                String period = String.format("Tu: %s - Den: %s",
                        filter.getFromDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                        filter.getToDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
                Paragraph periodPara = new Paragraph(period)
                        .setFontSize(12)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setMarginBottom(20);
                document.add(periodPara);
            }

            // 1. Tổng quan
            document.add(new Paragraph("TONG QUAN")
                    .setFontSize(14)
                    .setBold()
                    .setFontColor(primaryColor)
                    .setMarginTop(10));

            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .useAllAvailableWidth();

            // Doanh thu
            addPdfSummaryRow(summaryTable, "Tong doanh thu", formatMoney(report.getSummary().getTotalRevenue()), headerBg);
            addPdfSummaryRow(summaryTable, "Doanh thu thanh cong", formatMoney(report.getSummary().getTotalSuccessRevenue()), null);
            addPdfSummaryRow(summaryTable, "Doanh thu cho xu ly", formatMoney(report.getSummary().getTotalPendingRevenue()), headerBg);
            addPdfSummaryRow(summaryTable, "Doanh thu that bai", formatMoney(report.getSummary().getTotalFailedRevenue()), null);

            // Thêm dòng trống
            addPdfSummaryRow(summaryTable, "", "", null);

            // Số lượng giao dịch
            addPdfSummaryRow(summaryTable, "Tong so giao dich", report.getSummary().getTotalTransactions().toString(), headerBg);
            addPdfSummaryRow(summaryTable, "Giao dich thanh cong", report.getSummary().getSuccessfulTransactions().toString(), null);
            addPdfSummaryRow(summaryTable, "Giao dich cho xu ly", report.getSummary().getPendingTransactions().toString(), headerBg);
            addPdfSummaryRow(summaryTable, "Giao dich that bai", report.getSummary().getFailedTransactions().toString(), null);

            // Thêm dòng trống
            addPdfSummaryRow(summaryTable, "", "", null);

            // Thống kê khác
            addPdfSummaryRow(summaryTable, "Gia tri TB/giao dich", formatMoney(report.getSummary().getAverageTransactionAmount()), headerBg);
            addPdfSummaryRow(summaryTable, "Ty le tang truong", report.getSummary().getGrowthRate().toString() + "%", null);

            document.add(summaryTable);

            // 2. Biểu đồ theo thời gian
            if (!report.getChartData().isEmpty()) {
                document.add(new Paragraph("DOANH THU THEO THOI GIAN")
                        .setFontSize(14)
                        .setBold()
                        .setFontColor(primaryColor)
                        .setMarginTop(20));

                Table chartTable = new Table(UnitValue.createPercentArray(new float[]{2, 3, 2}))
                        .useAllAvailableWidth();

                // Header
                chartTable.addHeaderCell(createPdfHeaderCell("Ky"));
                chartTable.addHeaderCell(createPdfHeaderCell("Doanh thu (VND)"));
                chartTable.addHeaderCell(createPdfHeaderCell("So giao dich"));

                // Data
                for (RevenueResponseDTO.RevenueChartData data : report.getChartData()) {
                    chartTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(data.getPeriod())));
                    chartTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(formatMoney(data.getRevenue()))));
                    chartTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(data.getTransactionCount().toString())));
                }

                document.add(chartTable);
            }

            // 3. Doanh thu theo trạm
            if (!report.getRevenueByStation().isEmpty()) {
                document.add(new Paragraph("DOANH THU THEO TRAM")
                        .setFontSize(14)
                        .setBold()
                        .setFontColor(primaryColor)
                        .setMarginTop(20));

                Table stationTable = new Table(UnitValue.createPercentArray(new float[]{1, 2, 2, 2, 1, 2}))
                        .useAllAvailableWidth();

                // Header
                stationTable.addHeaderCell(createPdfHeaderCell("ID"));
                stationTable.addHeaderCell(createPdfHeaderCell("Ten tram"));
                stationTable.addHeaderCell(createPdfHeaderCell("Dia chi"));
                stationTable.addHeaderCell(createPdfHeaderCell("Doanh thu"));
                stationTable.addHeaderCell(createPdfHeaderCell("So GD"));
                stationTable.addHeaderCell(createPdfHeaderCell("TB/giao dich"));

                // Data
                for (RevenueResponseDTO.RevenueByStation station : report.getRevenueByStation()) {
                    stationTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(station.getStationId().toString())));
                    stationTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(station.getStationName())));
                    stationTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(station.getStationAddress())));
                    stationTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(formatMoney(station.getRevenue()))));
                    stationTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(station.getTransactionCount().toString())));
                    stationTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(formatMoney(station.getAveragePerTransaction()))));
                }

                document.add(stationTable);
            }

            // 4. Doanh thu theo phương thức thanh toán
            if (!report.getRevenueByPaymentMethod().isEmpty()) {
                document.add(new Paragraph("DOANH THU THEO PHUONG THUC THANH TOAN")
                        .setFontSize(14)
                        .setBold()
                        .setFontColor(primaryColor)
                        .setMarginTop(20));

                Table paymentTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                        .useAllAvailableWidth();

                // Header
                paymentTable.addHeaderCell(createPdfHeaderCell("Phuong thuc"));
                paymentTable.addHeaderCell(createPdfHeaderCell("Doanh thu (VND)"));

                // Data
                for (Map.Entry<String, BigDecimal> entry : report.getRevenueByPaymentMethod().entrySet()) {
                    paymentTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(entry.getKey())));
                    paymentTable.addCell(new com.itextpdf.layout.element.Cell().add(new Paragraph(formatMoney(entry.getValue()))));
                }

                document.add(paymentTable);
            }

            // Footer
            document.add(new Paragraph("\nNgay xuat bao cao: " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")))
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setMarginTop(20));

            document.close();
            return out;

        } catch (Exception e) {
            log.error("Lỗi khi xuất PDF: {}", e.getMessage());
            throw new RuntimeException("Không thể xuất báo cáo PDF", e);
        }
    }

    private com.itextpdf.layout.element.Cell createPdfHeaderCell(String text) {
        return new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(text).setBold())
                .setBackgroundColor(new DeviceRgb(248, 249, 250))
                .setTextAlignment(TextAlignment.CENTER);
    }

    private void addPdfSummaryRow(Table table, String label, String value, DeviceRgb bgColor) {
        com.itextpdf.layout.element.Cell labelCell = new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(label).setBold());
        com.itextpdf.layout.element.Cell valueCell = new com.itextpdf.layout.element.Cell()
                .add(new Paragraph(value));

        if (bgColor != null) {
            labelCell.setBackgroundColor(bgColor);
            valueCell.setBackgroundColor(bgColor);
        }

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatMoney(BigDecimal amount) {
        return String.format("%,.0f VND", amount.doubleValue());
    }

    @Override
    public ByteArrayOutputStream exportRevenueToExcel(RevenueFilterRequestDTO filter) {
        log.info("Xuất báo cáo doanh thu ra Excel");
        validateFilter(filter);

        RevenueResponseDTO report = getRevenueReport(filter);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            // Sheet 1: Tổng quan
            createSummarySheet(workbook, report.getSummary(), filter);

            // Sheet 2: Biểu đồ theo thời gian
            createChartDataSheet(workbook, report.getChartData());

            // Sheet 3: Doanh thu theo trạm
            createStationRevenueSheet(workbook, report.getRevenueByStation());

            // Sheet 4: Doanh thu theo phương thức thanh toán
            createPaymentMethodSheet(workbook, report.getRevenueByPaymentMethod());

            workbook.write(out);
            return out;

        } catch (IOException e) {
            log.error("Lỗi khi xuất Excel: {}", e.getMessage());
            throw new RuntimeException("Không thể xuất báo cáo Excel", e);
        }
    }

    private void createSummarySheet(Workbook workbook, RevenueResponseDTO.RevenueSummary summary, RevenueFilterRequestDTO filter) {
        Sheet sheet = workbook.createSheet("Tong quan");

        // Tạo header style
        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        CellStyle dataStyle = createExcelDataStyle(workbook);

        int rowNum = 0;

        // Tiêu đề
        Row titleRow = sheet.createRow(rowNum++);
        org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("BAO CAO DOANH THU");
        titleCell.setCellStyle(headerStyle);

        // Khoảng thời gian
        rowNum++;
        if (filter.getFromDate() != null && filter.getToDate() != null) {
            Row periodRow = sheet.createRow(rowNum++);
            periodRow.createCell(0).setCellValue("Ky bao cao:");
            periodRow.createCell(1).setCellValue(
                    filter.getFromDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) +
                            " - " +
                            filter.getToDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
            );
        }

        // Dữ liệu tổng quan
        rowNum++;
        addExcelDataRow(sheet, rowNum++, "Tong doanh thu", summary.getTotalRevenue().toString() + " VND", headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Doanh thu thanh cong", summary.getTotalSuccessRevenue().toString() + " VND", headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Doanh thu cho xu ly", summary.getTotalPendingRevenue().toString() + " VND", headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Doanh thu that bai", summary.getTotalFailedRevenue().toString() + " VND", headerStyle, dataStyle);

        rowNum++;
        addExcelDataRow(sheet, rowNum++, "Tong so giao dich", summary.getTotalTransactions().toString(), headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Giao dich thanh cong", summary.getSuccessfulTransactions().toString(), headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Giao dich cho xu ly", summary.getPendingTransactions().toString(), headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Giao dich that bai", summary.getFailedTransactions().toString(), headerStyle, dataStyle);

        rowNum++;
        addExcelDataRow(sheet, rowNum++, "Gia tri TB/giao dich", summary.getAverageTransactionAmount().toString() + " VND", headerStyle, dataStyle);
        addExcelDataRow(sheet, rowNum++, "Ty le tang truong", summary.getGrowthRate().toString() + " %", headerStyle, dataStyle);

        // Auto-size columns
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private void createChartDataSheet(Workbook workbook, List<RevenueResponseDTO.RevenueChartData> chartData) {
        Sheet sheet = workbook.createSheet("Doanh thu theo thoi gian");

        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        CellStyle dataStyle = createExcelDataStyle(workbook);

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Ky");
        headerRow.createCell(1).setCellValue("Doanh thu (VND)");
        headerRow.createCell(2).setCellValue("So giao dich");
        headerRow.getCell(0).setCellStyle(headerStyle);
        headerRow.getCell(1).setCellStyle(headerStyle);
        headerRow.getCell(2).setCellStyle(headerStyle);

        // Data
        int rowNum = 1;
        for (RevenueResponseDTO.RevenueChartData data : chartData) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(data.getPeriod());
            row.createCell(1).setCellValue(data.getRevenue().doubleValue());
            row.createCell(2).setCellValue(data.getTransactionCount());

            row.getCell(0).setCellStyle(dataStyle);
            row.getCell(1).setCellStyle(dataStyle);
            row.getCell(2).setCellStyle(dataStyle);
        }

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
        sheet.autoSizeColumn(2);
    }

    private void createStationRevenueSheet(Workbook workbook, List<RevenueResponseDTO.RevenueByStation> stationRevenue) {
        Sheet sheet = workbook.createSheet("Doanh thu theo tram");

        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        CellStyle dataStyle = createExcelDataStyle(workbook);

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("ID Tram");
        headerRow.createCell(1).setCellValue("Ten tram");
        headerRow.createCell(2).setCellValue("Dia chi");
        headerRow.createCell(3).setCellValue("Doanh thu (VND)");
        headerRow.createCell(4).setCellValue("So giao dich");
        headerRow.createCell(5).setCellValue("TB/giao dich (VND)");

        for (int i = 0; i < 6; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }

        // Data
        int rowNum = 1;
        for (RevenueResponseDTO.RevenueByStation data : stationRevenue) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(data.getStationId());
            row.createCell(1).setCellValue(data.getStationName());
            row.createCell(2).setCellValue(data.getStationAddress());
            row.createCell(3).setCellValue(data.getRevenue().doubleValue());
            row.createCell(4).setCellValue(data.getTransactionCount());
            row.createCell(5).setCellValue(data.getAveragePerTransaction().doubleValue());

            for (int i = 0; i < 6; i++) {
                row.getCell(i).setCellStyle(dataStyle);
            }
        }

        for (int i = 0; i < 6; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createPaymentMethodSheet(Workbook workbook, Map<String, BigDecimal> paymentMethodData) {
        Sheet sheet = workbook.createSheet("Phuong thuc thanh toan");

        CellStyle headerStyle = createExcelHeaderStyle(workbook);
        CellStyle dataStyle = createExcelDataStyle(workbook);

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Phuong thuc");
        headerRow.createCell(1).setCellValue("Doanh thu (VND)");
        headerRow.getCell(0).setCellStyle(headerStyle);
        headerRow.getCell(1).setCellStyle(headerStyle);

        // Data
        int rowNum = 1;
        for (Map.Entry<String, BigDecimal> entry : paymentMethodData.entrySet()) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(entry.getValue().doubleValue());

            row.getCell(0).setCellStyle(dataStyle);
            row.getCell(1).setCellStyle(dataStyle);
        }

        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }

    private CellStyle createExcelHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createExcelDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private void addExcelDataRow(Sheet sheet, int rowNum, String label, String value,
                                 CellStyle headerStyle, CellStyle dataStyle) {
        Row row = sheet.createRow(rowNum);
        org.apache.poi.ss.usermodel.Cell labelCell = row.createCell(0);
        labelCell.setCellValue(label);
        labelCell.setCellStyle(headerStyle);

        org.apache.poi.ss.usermodel.Cell valueCell = row.createCell(1);
        valueCell.setCellValue(value);
        valueCell.setCellStyle(dataStyle);
    }
}