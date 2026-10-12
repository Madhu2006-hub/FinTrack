package com.fintrack.controller;

import com.fintrack.dto.ReportSummary;
import com.fintrack.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.YearMonth;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Monthly summaries, month-to-month comparison, and category totals")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Report for a month range (yyyy-MM to yyyy-MM, max 24 months)")
    public ReportSummary summary(@AuthenticationPrincipal Long userId,
                                 @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth from,
                                 @RequestParam @DateTimeFormat(pattern = "yyyy-MM") YearMonth to) {
        return reportService.summary(userId, from, to);
    }
}
