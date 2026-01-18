import PDFDocument from "pdfkit";
import { CarbonModel } from "../models/carbon.model";
import { DocumentModel } from "../models/document.model";
import { UserModel } from "../models/user.model";
import path from "path";
import fs from "fs";

interface ReportOptions {
  verified?: boolean;
  exclusions?: boolean;
  exclusionsText?: string;
  reportingPeriodStart?: string;
  reportingPeriodEnd?: string;
  consolidationApproach?: string[];
  baseYearPolicy?: string;
  emissionsChangesContext?: string;
}

export async function generateCarbonReport(
  calculationIdOrIds: number | number[],
  userId: number,
  options: ReportOptions = {},
): Promise<typeof PDFDocument> {
  console.log(
    "PDF Service - Received options:",
    JSON.stringify(options, null, 2),
  );

  // Set default values for missing options
  const consolidationApproach =
    options.consolidationApproach && options.consolidationApproach.length > 0
      ? options.consolidationApproach
      : [];

  console.log("consolidationApproach after processing:", consolidationApproach);

  const baseYearPolicy = options.baseYearPolicy || "first_year";
  const emissionsChangesContext =
    options.emissionsChangesContext || "Not provided";

  // Handle both single ID and array of IDs
  const calculationIds = Array.isArray(calculationIdOrIds)
    ? calculationIdOrIds
    : [calculationIdOrIds];

  // Get all calculations
  const calculations = await Promise.all(
    calculationIds.map((id) => CarbonModel.findById(id)),
  );

  // Verify all calculations exist and belong to user
  if (calculations.some((calc) => !calc || calc.user_id !== userId)) {
    throw new Error("One or more calculations not found or unauthorized");
  }

  // Aggregate emissions data
  const aggregated = {
    co2_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.co2_kg) || 0),
      0,
    ),
    ch4_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.ch4_kg) || 0),
      0,
    ),
    n2o_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.n2o_kg) || 0),
      0,
    ),
    hfcs_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.hfcs_kg) || 0),
      0,
    ),
    pfcs_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.pfcs_kg) || 0),
      0,
    ),
    sf6_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.sf6_kg) || 0),
      0,
    ),
    other_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.other_kg) || 0),
      0,
    ),
    total_co2e_kg: calculations.reduce(
      (sum, calc) => sum + (Number(calc!.total_co2e_kg) || 0),
      0,
    ),
  };

  // Get period dates - use provided dates from options, or fall back to calculation dates
  const periodStartDate = options.reportingPeriodStart
    ? new Date(options.reportingPeriodStart)
    : new Date(
        Math.min(
          ...calculations.map((c) =>
            new Date(c!.period_start || Date.now()).getTime(),
          ),
        ),
      );
  const periodEndDate = options.reportingPeriodEnd
    ? new Date(options.reportingPeriodEnd)
    : new Date(
        Math.max(
          ...calculations.map((c) =>
            new Date(c!.period_end || Date.now()).getTime(),
          ),
        ),
      );

  const reportingYear = periodEndDate.getFullYear();

  // Use first calculation's data for document reference
  const calculation = calculations[0]!;

  // Get document data from first calculation
  const document = await DocumentModel.findById(calculation.document_id);

  // Get user data
  const user = await UserModel.findById(userId);

  // Create PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
  });

  const companyName = user?.company_name || "[COMPANY NAME]";
  const userEmail = user?.email || "";
  const parsedData =
    typeof document?.parsed_data === "string"
      ? JSON.parse(document.parsed_data)
      : document?.parsed_data;

  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Calculate totals in metric tons (mt) using aggregated data
  const totalCO2e = aggregated.total_co2e_kg;
  const totalMetricTons = (totalCO2e / 1000).toFixed(3);
  const co2Mt = (aggregated.co2_kg / 1000).toFixed(3);
  const ch4Mt = (aggregated.ch4_kg / 1000).toFixed(3);
  const n2oMt = (aggregated.n2o_kg / 1000).toFixed(3);
  const hfcsMt = (aggregated.hfcs_kg / 1000).toFixed(3);
  const pfcsMt = (aggregated.pfcs_kg / 1000).toFixed(3);
  const sf6Mt = (aggregated.sf6_kg / 1000).toFixed(3);
  const otherMt = (aggregated.other_kg / 1000).toFixed(3);

  // For combined reports, calculate scope totals from all calculations
  const scope1Total =
    calculations
      .filter((c) => c!.emission_type === "scope1")
      .reduce((sum, c) => sum + (Number(c!.total_co2e_kg) || 0), 0) / 1000;
  const scope2Total =
    calculations
      .filter((c) => c!.emission_type === "scope2")
      .reduce((sum, c) => sum + (Number(c!.total_co2e_kg) || 0), 0) / 1000;
  const scope3Total =
    calculations
      .filter((c) => c!.emission_type === "scope3")
      .reduce((sum, c) => sum + (Number(c!.total_co2e_kg) || 0), 0) / 1000;

  const tealColor = "#008B8B";
  const grayColor = "#666666";

  // ==================== PAGE 1: TITLE PAGE ====================

  // Disclaimer at top
  doc
    .fontSize(9)
    .fillColor(grayColor)
    .font("Helvetica")
    .text(
      "This is not the official reporting template of the WRI/WBCSD GHG Protocol. It is a sample template",
      { align: "center" },
    );
  doc.text(
    "meant to help outline the reporting requirements of the GHG Protocol Corporate Standard.",
    {
      align: "center",
    },
  );

  doc.moveDown(4);

  // Main title
  doc
    .fontSize(20)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("Greenhouse Gas Emissions Inventory", { align: "center" });

  doc.moveDown(2);

  // Company name and year
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(`[${companyName.toUpperCase()}]`, { align: "center" });
  doc.moveDown(0.5);
  doc.text(`[${reportingYear}]`, { align: "center" });

  doc.moveDown(3);

  // Company logo box
  const logoBoxWidth = 250;
  const logoBoxHeight = 100;
  const pageWidth = doc.page.width;
  const logoX = (pageWidth - logoBoxWidth) / 2;
  const logoY = doc.y;

  // Display logo if available, otherwise show placeholder
  if (user?.logo_path) {
    try {
      const logoFilePath = path.join(__dirname, "../../", user.logo_path);
      if (fs.existsSync(logoFilePath)) {
        doc.image(logoFilePath, logoX, logoY, {
          width: logoBoxWidth,
          height: logoBoxHeight,
          fit: [logoBoxWidth, logoBoxHeight],
          align: "center",
          valign: "center",
        });
      } else {
        // File doesn't exist, show placeholder
        doc
          .fontSize(10)
          .fillColor(grayColor)
          .text("COMPANY", logoX, logoY + 35, {
            width: logoBoxWidth,
            align: "center",
          });
        doc.text("LOGO", logoX, logoY + 47, {
          width: logoBoxWidth,
          align: "center",
        });
      }
    } catch (err) {
      // If logo fails to load, show placeholder
      doc
        .fontSize(10)
        .fillColor(grayColor)
        .text("COMPANY", logoX, logoY + 35, {
          width: logoBoxWidth,
          align: "center",
        });
      doc.text("LOGO", logoX, logoY + 47, {
        width: logoBoxWidth,
        align: "center",
      });
    }
  } else {
    doc
      .fontSize(10)
      .fillColor(grayColor)
      .text("COMPANY", logoX, logoY + 35, {
        width: logoBoxWidth,
        align: "center",
      });
    doc.text("LOGO", logoX, logoY + 47, {
      width: logoBoxWidth,
      align: "center",
    });
  }

  doc.y = logoY + logoBoxHeight + 40;

  // Verification table
  const tableX = 70;
  const tableWidth = doc.page.width - 140;
  const rowHeight = 20;
  let currentY = doc.y;

  // Header row
  doc.fillColor(tealColor).rect(tableX, currentY, tableWidth, rowHeight).fill();

  doc
    .fontSize(9)
    .fillColor("#FFF")
    .font("Helvetica")
    .text(
      "Has this inventory been verified by an accredited third party?",
      tableX + 5,
      currentY + 6,
      { width: tableWidth - 10 },
    );

  currentY += rowHeight;

  // Checkbox row
  doc.rect(tableX, currentY, tableWidth, rowHeight).stroke();

  const verifiedYes = options.verified === true;
  const verifiedNo = !verifiedYes;

  doc
    .fontSize(9)
    .fillColor("#000")
    .text(verifiedNo ? "[X] No" : "[ ] No", tableX + 10, currentY + 5);

  doc.text(verifiedYes ? "[X] Yes" : "[ ] Yes", tableX + 60, currentY + 5);

  currentY += rowHeight;

  // Info rows
  const infoRows = [
    `Date of verification: ${formatDate(new Date())}`,
    `Verifier: ${companyName}`,
    `Email: ${userEmail}`,
    `Phone: ${user?.phone || "N/A"}`,
    `Address: ${user?.address || "N/A"}`,
  ];

  infoRows.forEach((text) => {
    doc.rect(tableX, currentY, tableWidth, rowHeight).stroke();

    doc
      .fontSize(9)
      .fillColor("#000")
      .text(text, tableX + 5, currentY + 5);

    currentY += rowHeight;
  });

  // ==================== PAGE 2: REQUIRED INFORMATION ====================
  doc.addPage();

  doc
    .fontSize(14)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("REQUIRED INFORMATION", { align: "center" });

  doc.moveDown(1);

  let y = doc.y;
  const colWidth = doc.page.width - 120;

  // Exclusions question
  doc.fillColor(tealColor).rect(60, y, colWidth, 30).fill();

  doc
    .fontSize(9)
    .fillColor("#FFF")
    .font("Helvetica")
    .text(
      "Have any facilities, operations and/or emissions sources been excluded from this inventory? If yes,",
      65,
      y + 5,
      { width: colWidth - 10 },
    );
  doc.text("please specify.", 65, y + 17, { width: colWidth - 10 });

  y += 30;

  doc.rect(60, y, colWidth, 20).stroke();
  doc
    .fontSize(9)
    .fillColor("#000")
    .text(
      options.exclusions === true
        ? `Yes - ${options.exclusionsText || "Not provided"}`
        : "No",
      65,
      y + 5,
      { width: colWidth - 10 },
    );

  y += 25;

  // Reporting period
  doc.fillColor(tealColor).rect(60, y, colWidth, 20).fill();

  doc
    .fontSize(9)
    .fillColor("#FFF")
    .text("Reporting period covered by this inventory:", 65, y + 5);

  y += 20;

  doc.rect(60, y, colWidth, 20).stroke();
  doc
    .fontSize(9)
    .fillColor("#000")
    .text(
      `${formatDate(periodStartDate)} to ${formatDate(periodEndDate)}`,
      65,
      y + 5,
    );

  y += 25;

  // ORGANIZATIONAL BOUNDARIES
  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("ORGANIZATIONAL BOUNDARIES", 60, y);

  y += 20;

  // Expanded teal header to fit three lines of explanatory text
  doc.fillColor(tealColor).rect(60, y, colWidth, 40).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .font("Helvetica")
    .text(
      "What approach is your company using? (Check each consolidation approach for which your company is",
      65,
      y + 5,
      { width: colWidth - 10 },
    );
  doc.text(
    "reporting emissions.) If your company is reporting according to more than one consolidation approach,",
    65,
    y + 15,
    { width: colWidth - 10 },
  );
  doc.text("complete a separate table for each approach.", 65, y + 25, {
    width: colWidth - 10,
  });

  y += 40;

  const checkboxY = y;
  const checkboxSpacing = (colWidth - 20) / 3;

  doc.rect(60, checkboxY, colWidth, 25).stroke();

  // Use consolidation approaches from options with default
  console.log("Rendering checkboxes with approaches:", consolidationApproach);
  const equityShareChecked = consolidationApproach.includes("Equity Share")
    ? "[X]"
    : "[ ]";
  const financialControlChecked = consolidationApproach.includes(
    "Financial Control",
  )
    ? "[X]"
    : "[ ]";
  const operationalControlChecked = consolidationApproach.includes(
    "Operational Control",
  )
    ? "[X]"
    : "[ ]";

  doc
    .fontSize(9)
    .fillColor("#000")
    .text(`${equityShareChecked} Equity Share`, 70, checkboxY + 7);
  doc.text(
    `${financialControlChecked} Financial Control`,
    70 + checkboxSpacing,
    checkboxY + 7,
  );
  doc.text(
    `${operationalControlChecked} Operational Control`,
    70 + checkboxSpacing * 2,
    checkboxY + 7,
  );

  y = checkboxY + 30;

  // OPERATIONAL BOUNDARIES
  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("OPERATIONAL BOUNDARIES", 60, y);

  y += 20;

  doc.fillColor(tealColor).rect(60, y, colWidth, 20).fill();

  doc
    .fontSize(9)
    .fillColor("#FFF")
    .font("Helvetica")
    .text("Are Scope 3 emissions included in this inventory?", 65, y + 5);

  y += 20;

  doc.rect(60, y, colWidth, 20).stroke();

  // Automatically determine if scope3 emissions are included based on calculations
  const hasScope3 = calculations.some(
    (calc) => calc!.emission_type === "scope3",
  );

  doc
    .fontSize(9)
    .fillColor("#000")
    .text(hasScope3 ? "[X] Yes     [ ] No" : "[ ] Yes     [X] No", 65, y + 5);

  y += 25;

  // INFORMATION ON EMISSIONS
  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("INFORMATION ON EMISSIONS", 60, y);

  y += 15;

  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font("Helvetica")
    .text(
      "The table below refers to emissions independent of any GHG trades such as sales, purchases, transfers,",
      60,
      y,
      { width: colWidth },
    );
  doc.text("or banking of allowances.", 60, y + 10, { width: colWidth });

  y += 30;

  // Emissions table
  const tableStartY = y;
  const col1X = 60;
  const col1Width = 80;
  const numCols = 8;
  const dataColWidth = (colWidth - col1Width) / numCols;

  // Header row
  doc.fillColor(tealColor).rect(col1X, tableStartY, colWidth, 20).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .font("Helvetica-Bold")
    .text("EMISSIONS", col1X + 5, tableStartY + 5, { width: col1Width - 10 });

  const headers = [
    "TOTAL\n(mtCO2e)",
    "CO2\n(mt)",
    "CH4\n(mt)",
    "N2O\n(mt)",
    "HFCs\n(mt)",
    "PFCs\n(mt)",
    "SF6\n(mt)",
    "Other\n(mt)",
  ];

  headers.forEach((header, i) => {
    const x = col1X + col1Width + i * dataColWidth;
    doc.text(header, x + 2, tableStartY + 2, {
      width: dataColWidth - 4,
      align: "center",
    });
  });

  y = tableStartY + 20;

  // Data rows - for combined reports, aggregate by scope
  const scope1Calcs = calculations.filter((c) => c!.emission_type === "scope1");
  const scope2Calcs = calculations.filter((c) => c!.emission_type === "scope2");
  const scope3Calcs = calculations.filter((c) => c!.emission_type === "scope3");

  const getGasTotal = (calcs: any[], gasField: string) => {
    if (calcs.length === 0) return "0.000";
    const total =
      calcs.reduce((sum, c) => sum + (Number(c[gasField]) || 0), 0) / 1000;
    return total.toFixed(3);
  };

  const emissionRows = [
    {
      label: "Scope 1",
      total: scope1Total.toFixed(3),
      co2: getGasTotal(scope1Calcs, "co2_kg"),
      ch4: getGasTotal(scope1Calcs, "ch4_kg"),
      n2o: getGasTotal(scope1Calcs, "n2o_kg"),
      hfcs: getGasTotal(scope1Calcs, "hfcs_kg"),
      pfcs: getGasTotal(scope1Calcs, "pfcs_kg"),
      sf6: getGasTotal(scope1Calcs, "sf6_kg"),
      other: getGasTotal(scope1Calcs, "other_kg"),
    },
    {
      label: "Scope 2",
      total: scope2Total.toFixed(3),
      co2: getGasTotal(scope2Calcs, "co2_kg"),
      ch4: getGasTotal(scope2Calcs, "ch4_kg"),
      n2o: getGasTotal(scope2Calcs, "n2o_kg"),
      hfcs: getGasTotal(scope2Calcs, "hfcs_kg"),
      pfcs: getGasTotal(scope2Calcs, "pfcs_kg"),
      sf6: getGasTotal(scope2Calcs, "sf6_kg"),
      other: getGasTotal(scope2Calcs, "other_kg"),
    },
    {
      label: "Scope 3\n(OPTIONAL)",
      total: scope3Total.toFixed(3),
      co2: getGasTotal(scope3Calcs, "co2_kg"),
      ch4: getGasTotal(scope3Calcs, "ch4_kg"),
      n2o: getGasTotal(scope3Calcs, "n2o_kg"),
      hfcs: getGasTotal(scope3Calcs, "hfcs_kg"),
      pfcs: getGasTotal(scope3Calcs, "pfcs_kg"),
      sf6: getGasTotal(scope3Calcs, "sf6_kg"),
      other: getGasTotal(scope3Calcs, "other_kg"),
    },
  ];

  emissionRows.forEach((row) => {
    const rowHeight = row.label.includes("OPTIONAL") ? 48 : 20;
    const fontSize = 9;
    const lineHeight = Math.round(fontSize * 1.2);
    const lineCount = row.label.split("\n").length;
    const labelY =
      y + Math.max(4, Math.floor((rowHeight - lineCount * lineHeight) / 2) + 1);
    const dataY = y + Math.max(6, Math.floor((rowHeight - fontSize) / 2) + 1);

    doc.rect(col1X, y, col1Width, rowHeight).stroke();
    doc
      .fontSize(fontSize)
      .fillColor("#000")
      .font("Helvetica")
      .text(row.label, col1X + 5, labelY, { width: col1Width - 10 });

    // Total
    doc.rect(col1X + col1Width, y, dataColWidth, rowHeight).stroke();
    doc.text(row.total, col1X + col1Width + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // CO2
    doc
      .rect(col1X + col1Width + dataColWidth, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.co2, col1X + col1Width + dataColWidth + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // CH4
    doc
      .rect(col1X + col1Width + dataColWidth * 2, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.ch4, col1X + col1Width + dataColWidth * 2 + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // N2O
    doc
      .rect(col1X + col1Width + dataColWidth * 3, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.n2o, col1X + col1Width + dataColWidth * 3 + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // HFCs
    doc
      .rect(col1X + col1Width + dataColWidth * 4, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.hfcs, col1X + col1Width + dataColWidth * 4 + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // PFCs
    doc
      .rect(col1X + col1Width + dataColWidth * 5, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.pfcs, col1X + col1Width + dataColWidth * 5 + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // SF6
    doc
      .rect(col1X + col1Width + dataColWidth * 6, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.sf6, col1X + col1Width + dataColWidth * 6 + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    // Other
    doc
      .rect(col1X + col1Width + dataColWidth * 7, y, dataColWidth, rowHeight)
      .stroke();
    doc.text(row.other, col1X + col1Width + dataColWidth * 7 + 2, dataY, {
      width: dataColWidth - 4,
      align: "center",
    });

    y += rowHeight;
  });

  y += 40;

  // Biogenic emissions note
  doc.fillColor(tealColor).rect(60, y, colWidth, 20).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .font("Helvetica")
    .text("Direct CO2 emissions from biogenic combustion (mtCO2)", 65, y + 5);

  y += 20;

  doc.rect(60, y, colWidth, 20).stroke();
  doc
    .fontSize(9)
    .fillColor("#000")
    .text("0.000", 65, y + 5);

  y += 30;

  // BASE YEAR section
  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("BASE YEAR", 60, y);

  y += 20;

  doc.fillColor(tealColor).rect(60, y, colWidth, 15).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .font("Helvetica")
    .text("Year chosen as base year", 65, y + 3);

  y += 15;

  doc.rect(60, y, colWidth, 15).stroke();
  doc
    .fontSize(9)
    .fillColor("#000")
    .text(reportingYear.toString(), 65, y + 3);

  y += 20;

  doc.fillColor(tealColor).rect(60, y, colWidth, 15).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .text(
      "Clarification of company-determined policy for making base year emissions recalculations",
      65,
      y + 3,
    );

  y += 15;

  doc.rect(60, y, colWidth, 15).stroke();

  // Use baseYearPolicy with default
  const baseYearPolicyText =
    {
      first_year: "First year of operation",
      threshold: "Threshold-based recalculation",
      structural_changes: "Structural changes only",
      no_recalculation: "No recalculation policy",
    }[baseYearPolicy] || "First year of operation";

  doc
    .fontSize(8)
    .fillColor("#000")
    .text(baseYearPolicyText, 65, y + 3);

  y += 20;

  // Context for any significant emissions changes
  doc.fillColor(tealColor).rect(60, y, colWidth, 20).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .text(
      "Context for any significant emissions changes that triggered base year emissions recalculations",
      65,
      y + 5,
    );

  y += 20;

  doc.rect(60, y, colWidth, 15).stroke();
  doc
    .fontSize(8)
    .fillColor("#000")
    .text(emissionsChangesContext, 65, y + 3);

  // ==================== PAGE 3: BASE YEAR EMISSIONS TABLE ====================
  doc.addPage();

  y = 60;

  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("Base year emissions", 60, y);

  y += 20;

  // Base year emissions table (same structure as current year)
  // For base year table make the first column slightly wider so multi-line labels fit
  const baseCol1Width = col1Width + 28;
  const baseDataColWidth = (colWidth - baseCol1Width) / numCols;

  doc.fillColor(tealColor).rect(col1X, y, colWidth, 20).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .font("Helvetica-Bold")
    .text("EMISSIONS", col1X + 5, y + 5, { width: baseCol1Width - 10 });

  headers.forEach((header, i) => {
    const x = col1X + baseCol1Width + i * baseDataColWidth;
    doc.text(header, x + 2, y + 2, {
      width: baseDataColWidth - 4,
      align: "center",
    });
  });

  y += 20;

  // Same data for base year (first reporting year)
  emissionRows.forEach((row) => {
    const rowH = row.label.includes("OPTIONAL") ? 28 : 20;

    doc.rect(col1X, y, baseCol1Width, rowH).stroke();
    doc
      .fontSize(9)
      .fillColor("#000")
      .font("Helvetica")
      .text(row.label, col1X + 5, y + 5, { width: baseCol1Width - 10 });

    doc.rect(col1X + baseCol1Width, y, baseDataColWidth, rowH).stroke();
    doc.text(row.total, col1X + baseCol1Width + 2, y + 7, {
      width: baseDataColWidth - 4,
      align: "center",
    });

    doc
      .rect(col1X + baseCol1Width + baseDataColWidth, y, baseDataColWidth, rowH)
      .stroke();
    doc.text(row.co2, col1X + baseCol1Width + baseDataColWidth + 2, y + 7, {
      width: baseDataColWidth - 4,
      align: "center",
    });

    doc
      .rect(
        col1X + baseCol1Width + baseDataColWidth * 2,
        y,
        baseDataColWidth,
        rowH,
      )
      .stroke();
    doc.text(row.ch4, col1X + baseCol1Width + baseDataColWidth * 2 + 2, y + 7, {
      width: baseDataColWidth - 4,
      align: "center",
    });

    doc
      .rect(
        col1X + baseCol1Width + baseDataColWidth * 3,
        y,
        baseDataColWidth,
        rowH,
      )
      .stroke();
    doc.text(row.n2o, col1X + baseCol1Width + baseDataColWidth * 3 + 2, y + 7, {
      width: baseDataColWidth - 4,
      align: "center",
    });

    for (let i = 4; i < 8; i++) {
      doc
        .rect(
          col1X + baseCol1Width + baseDataColWidth * i,
          y,
          baseDataColWidth,
          rowH,
        )
        .stroke();
      doc.text(
        "0.000",
        col1X + baseCol1Width + baseDataColWidth * i + 2,
        y + 7,
        {
          width: baseDataColWidth - 4,
          align: "center",
        },
      );
    }

    y += rowH;
  });

  y += 20;

  // METHODOLOGIES AND EMISSION FACTORS
  doc
    .fontSize(11)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("METHODOLOGIES AND EMISSION FACTORS", 60, y);

  y += 20;

  doc.fillColor(tealColor).rect(60, y, colWidth, 30).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .font("Helvetica")
    .text(
      "If you have used calculation tools or methodologies other than those provided by the GHG Protocol,",
      65,
      y + 5,
    );
  doc.text(
    "provide the name of and link to any other GHG Protocol calculation tools used.",
    65,
    y + 17,
  );

  y += 30;

  doc.rect(60, y, colWidth, 25).stroke();
  doc
    .fontSize(8)
    .fillColor("#000")
    .text("OpenAI (used for AI services), EPA eGRID 2023", 65, y + 5, {
      width: colWidth - 10,
    });

  y += 35;

  // Optional Information header - add extra spacing and position explicitly
  y += 8;
  doc
    .fontSize(14)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("Optional Information", 60, y, { width: colWidth, align: "center" });

  y += 28;

  // Information on emissions breakdown
  doc
    .fontSize(10)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("INFORMATION ON EMISSIONS", 60, y);

  y += 20;

  const detailRows = [
    "Scope 1: Direct Emissions from Owned/Controlled Operations",
    calculation.category === "gas"
      ? "a. Direct Emissions from Stationary Combustion"
      : "",
    calculation.category === "fuel"
      ? "b. Direct Emissions from Mobile Combustion"
      : "",
    "",
    "Scope 2: Indirect Emissions from the Use of Purchased",
    calculation.category === "electricity"
      ? "a. Indirect Emissions from Purchased/Acquired Electricity"
      : "",
  ].filter((text) => text !== "");

  // Helper: try to read parsed emissions values from parsedData.emissions
  const getParsedEmission = (key: string): string | null => {
    try {
      if (parsedData && parsedData.emissions && parsedData.emissions[key]) {
        return String(parsedData.emissions[key]);
      }
    } catch (e) {
      // ignore
    }
    return null;
  };

  detailRows.forEach((text) => {
    doc.fillColor(tealColor).rect(60, y, colWidth, 18).fill();

    doc
      .fontSize(8)
      .fillColor("#FFF")
      .font("Helvetica")
      .text(text, 65, y + 5);

    y += 18;

    doc.rect(60, y, colWidth, 18).stroke();

    // Determine value to display: prefer calculated scope totals, then parsedData, else mark Not provided
    let value = "";

    if (text.startsWith("Scope 1")) {
      if (scope1Calcs.length > 0) {
        value = scope1Total.toFixed(3) + " mtCO2e";
      } else if (getParsedEmission("scope1")) {
        value = getParsedEmission("scope1") + " mtCO2e";
      } else {
        value = "Not provided";
      }
    } else if (text.startsWith("Scope 2")) {
      if (scope2Calcs.length > 0) {
        value = scope2Total.toFixed(3) + " mtCO2e";
      } else if (getParsedEmission("scope2")) {
        value = getParsedEmission("scope2") + " mtCO2e";
      } else {
        value = "Not provided";
      }
    } else if (text.includes("Electricity")) {
      // Electricity is Scope 2
      if (scope2Calcs.length > 0) {
        value = scope2Total.toFixed(3) + " mtCO2e";
      } else {
        value = "Not provided";
      }
    } else if (text.includes("Stationary") || text.includes("Mobile")) {
      // Stationary and Mobile are Scope 1
      if (scope1Calcs.length > 0) {
        value = scope1Total.toFixed(3) + " mtCO2e";
      } else {
        value = "Not provided";
      }
    } else {
      value = "Not provided";
    }

    doc
      .fontSize(9)
      .fillColor("#000")
      .text(value, 65, y + 5);

    y += 20;
  });

  y += 10;

  // Source information
  doc.fillColor(tealColor).rect(60, y, colWidth, 18).fill();

  doc
    .fontSize(8)
    .fillColor("#FFF")
    .text(
      "Emissions disaggregated by facility (recommended for individual facilities with stationary combustion)",
      65,
      y + 5,
    );

  y += 18;

  doc.rect(60, y, 150, 18).stroke();
  doc.rect(210, y, colWidth - 150, 18).stroke();

  doc
    .fontSize(8)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("Facility", 65, y + 5);
  doc.text("Scope 1 emissions", 215, y + 5);

  y += 18;

  const provider = parsedData?.provider || "Primary Facility";
  const accountNum = parsedData?.accountNumber || "";
  const serviceAddr = parsedData?.serviceAddress || "";

  doc.rect(60, y, 150, 18).stroke();
  doc.rect(210, y, colWidth - 150, 18).stroke();

  doc
    .fontSize(8)
    .fillColor("#000")
    .font("Helvetica")
    .text(provider, 65, y + 5);

  // Determine how to label the service/address field:
  // - if there's no accountNum and serviceAddr is a short numeric string, treat it as an account number
  // - otherwise show it as an address (truncate to 60 chars)
  let addrLabel = "";
  if (serviceAddr) {
    const trimmed = serviceAddr.trim();
    if (!accountNum && /^\d{1,6}$/.test(trimmed)) {
      addrLabel = `Acct: ${trimmed}`;
    } else {
      addrLabel = `Addr: ${trimmed.substring(0, 60)}`;
    }
  }

  const facilityInfo = [
    scope1Total.toFixed(3) + " mtCO2e",
    accountNum ? `Acct: ${accountNum}` : "",
    addrLabel,
  ]
    .filter((x) => x)
    .join(" | ");

  // Ensure the facility info cell is never empty — use English fallback
  const facilityInfoFinal =
    facilityInfo && facilityInfo.length > 0 ? facilityInfo : "Not provided";

  doc.text(facilityInfoFinal, 215, y + 5, { width: colWidth - 155 });

  y += 30;

  // Detailed Emission Breakdown
  doc
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text("Emission Breakdown by Gas:", 60, y);
  doc.moveDown(0.3);
  y = doc.y;

  doc.font("Helvetica");
  doc.text(`CO₂: ${co2Mt} metric tons`, { indent: 20 });
  doc.text(`CH₄ (CO₂ equivalent): ${ch4Mt} metric tons`, { indent: 20 });
  doc.text(`N₂O (CO₂ equivalent): ${n2oMt} metric tons`, { indent: 20 });
  doc.text(`HFCs (CO₂ equivalent): ${hfcsMt} metric tons`, { indent: 20 });
  doc.text(`PFCs (CO₂ equivalent): ${pfcsMt} metric tons`, { indent: 20 });
  doc.text(`SF₆ (CO₂ equivalent): ${sf6Mt} metric tons`, { indent: 20 });
  doc.text(`Other (CO₂ equivalent): ${otherMt} metric tons`, { indent: 20 });
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold");
  doc.text(`Total CO₂e: ${totalMetricTons} metric tons`, { indent: 20 });

  y = doc.y + 20;

  // Final note
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font("Helvetica-Oblique")
    .text(
      "This report was generated by CarbonEasy.ai using automated AI-based OCR technology and EPA emission factors.",
      60,
      y,
      { width: colWidth, align: "center" },
    );

  y += 15;

  doc.text(
    "Calculations comply with GHG Protocol Corporate Standard. Independent verification is recommended for regulatory submissions.",
    60,
    y,
    { width: colWidth, align: "center" },
  );

  return doc;
}
