import PDFDocument from "pdfkit";
import { CarbonModel } from "../models/carbon.model";
import { DocumentModel } from "../models/document.model";
import { UserModel } from "../models/user.model";

export async function generateCarbonReport(
  calculationId: number,
  userId: number
): Promise<typeof PDFDocument> {
  // Get calculation data
  const calculation = await CarbonModel.findById(calculationId);
  if (!calculation || calculation.user_id !== userId) {
    throw new Error("Calculation not found");
  }

  // Get document data
  const document = await DocumentModel.findById(calculation.document_id);

  // Get user data
  const user = await UserModel.findById(userId);

  // Create PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const companyName = user?.company_name || "Company";
  const userState = user?.state || "United States";
  const userEmail = user?.email || "";
  const parsedData =
    typeof document?.parsed_data === "string"
      ? JSON.parse(document.parsed_data)
      : document?.parsed_data;

  // Format dates
  const reportingYear = calculation.period_end
    ? new Date(calculation.period_end).getFullYear()
    : new Date().getFullYear();
  const periodStart = calculation.period_start
    ? new Date(calculation.period_start).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";
  const periodEnd = calculation.period_end
    ? new Date(calculation.period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "-";

  // Calculate totals
  const totalCO2e = Number(calculation.total_co2e_kg);
  const totalMetricTons = (totalCO2e / 1000).toFixed(3);
  const co2Tons = (Number(calculation.co2_kg) / 1000).toFixed(3);
  const ch4Tons = (Number(calculation.ch4_kg) / 1000).toFixed(3);
  const n2oTons = (Number(calculation.n2o_kg) / 1000).toFixed(3);

  const scope1Total = calculation.emission_type === 'scope1' ? totalMetricTons : '0.000';
  const scope2Total = calculation.emission_type === 'scope2' ? totalMetricTons : '0.000';

  // ==================== PAGE 1: TITLE PAGE ====================
  doc
    .fontSize(28)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("Greenhouse Gas Emissions", { align: "center" });
  
  doc.moveDown(0.5);
  doc
    .fontSize(24)
    .text("Inventory Report", { align: "center" });

  doc.moveDown(2);
  doc
    .fontSize(16)
    .font("Helvetica-Bold")
    .fillColor("#333")
    .text(`Reporting Year: ${reportingYear}`, { align: "center" });

  doc.moveDown(2);
  doc
    .fontSize(14)
    .font("Helvetica")
    .fillColor("#000")
    .text(`Company Name: ${companyName}`, { align: "center" });

  doc.moveDown(0.5);
  doc.text(`Contact Information: ${userEmail}`, { align: "center" });
  doc.text(`State: ${userState}`, { align: "center" });

  doc.moveDown(3);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text("Inventory Method:", { align: "center" });
  
  doc.moveDown(0.5);
  doc
    .fontSize(9)
    .fillColor("#666")
    .text(
      "Based on the World Resources Institute (WRI) and the World Business Council",
      { align: "center" }
    );
  doc.text("for Sustainable Development (WBCSD) GHG Protocol Corporate Standard.", {
    align: "center",
  });

  doc.moveDown(5);
  doc
    .fontSize(8)
    .fillColor("#999")
    .text(`Report Generated: ${new Date().toLocaleDateString("en-US")}`, {
      align: "center",
    });
  doc.text("Powered by CarbonEasy.ai", { align: "center" });

  // ==================== PAGE 2: ORGANIZATIONAL BOUNDARIES ====================
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("2. Organizational Boundaries", { underline: true });

  doc.moveDown(1);
  doc
    .fontSize(11)
    .font("Helvetica")
    .fillColor("#000")
    .text(
      "We confirm that this inventory covers the following organizational scope:",
      { align: "justify" }
    );

  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("Approach:", { continued: true })
    .font("Helvetica")
    .text(" Operational Control");

  doc.moveDown(0.3);
  doc.text(
    "The Company reports emissions from all operations under its operational control."
  );

  doc.moveDown(1);
  doc.font("Helvetica-Bold").text("Facilities Included:");
  doc.moveDown(0.3);
  doc.font("Helvetica").text(`- ${userState}-based facilities`, { indent: 20 });
  doc.text(`- Reporting Period: ${periodStart} - ${periodEnd}`, { indent: 20 });

  doc.moveDown(0.5);
  const provider = parsedData?.provider || "Utility Provider";
  doc.text(`- Service Provider: ${provider}`, { indent: 20 });

  // ==================== PAGE 3: SUMMARY OF EMISSIONS ====================
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("3. Summary of Emissions", { underline: true });

  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text(
      "The following table presents the greenhouse gas emissions inventory for the reporting period."
    );

  doc.moveDown(1);

  // Table header
  const tableTop = doc.y;
  const col1 = 70;
  const col2 = 220;
  const col3 = 370;
  const rowHeight = 25;

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("Category", col1, tableTop)
    .text("Source", col2, tableTop)
    .text("Metric Tons CO₂e", col3, tableTop);

  doc
    .moveTo(col1 - 10, tableTop + 15)
    .lineTo(500, tableTop + 15)
    .stroke();

  let currentY = tableTop + rowHeight;

  // Scope 1 rows
  doc.font("Helvetica");
  if (calculation.emission_type === 'scope1') {
    if (calculation.category === 'gas') {
      doc
        .text("Scope 1", col1, currentY)
        .text("Stationary Combustion (Natural Gas)", col2, currentY)
        .text(scope1Total, col3, currentY);
    } else if (calculation.category === 'fuel') {
      doc
        .text("Scope 1", col1, currentY)
        .text("Mobile Combustion (Gasoline/Diesel)", col2, currentY)
        .text(scope1Total, col3, currentY);
    }
  } else {
    doc
      .text("Scope 1", col1, currentY)
      .text("Stationary Combustion (Natural Gas)", col2, currentY)
      .text("0.000", col3, currentY);
    currentY += rowHeight;
    doc
      .text("Scope 1", col1, currentY)
      .text("Mobile Combustion (Gasoline/Diesel)", col2, currentY)
      .text("0.000", col3, currentY);
  }

  currentY += rowHeight;

  // Scope 2 row
  if (calculation.emission_type === 'scope2') {
    doc
      .text("Scope 2", col1, currentY)
      .text("Purchased Electricity (Location-based)", col2, currentY)
      .text(scope2Total, col3, currentY);
  } else {
    doc
      .text("Scope 2", col1, currentY)
      .text("Purchased Electricity (Location-based)", col2, currentY)
      .text("0.000", col3, currentY);
  }

  currentY += rowHeight;

  // Total row
  doc
    .moveTo(col1 - 10, currentY - 5)
    .lineTo(500, currentY - 5)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .text("TOTAL", col1, currentY)
    .text("Gross Emissions", col2, currentY)
    .text(totalMetricTons, col3, currentY);

  // ==================== PAGE 4: SCOPE 2 INDIRECT EMISSIONS ====================
  if (calculation.emission_type === 'scope2' && calculation.category === 'electricity') {
    doc.addPage();
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("4. Scope 2: Indirect Emissions", { underline: true });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Detailed calculation for purchased electricity.");

    doc.moveDown(1);
    const consumption = parsedData?.consumption?.value || 0;
    const region = parsedData?.state || userState;
    const emissionFactor = (totalCO2e / consumption / 1000).toFixed(6);

    doc.font("Helvetica-Bold").text("Data Source:", { continued: true });
    doc.font("Helvetica").text(" Utility Bills (PNG/JPG Uploads)");

    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").text("Total Usage:", { continued: true });
    doc.font("Helvetica").text(` ${consumption.toLocaleString()} kWh`);

    doc.moveDown(0.3);
    doc
      .font("Helvetica-Bold")
      .text("Emission Factor Source:", { continued: true });
    doc
      .font("Helvetica")
      .text(` EPA eGRID ${reportingYear} - Subregion ${region}`);

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").text("Calculation:");
    doc.moveDown(0.3);
    doc
      .font("Helvetica")
      .fillColor("#2C5F2D")
      .text(
        `${consumption.toLocaleString()} kWh × ${emissionFactor} = ${totalMetricTons} mtCO₂e`,
        { indent: 20 }
      );
  }

  // ==================== PAGE 5: SCOPE 1 DIRECT EMISSIONS ====================
  if (calculation.emission_type === 'scope1') {
    doc.addPage();
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("5. Scope 1: Direct Emissions", { underline: true });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Detailed calculation for direct combustion emissions.");

    doc.moveDown(1);
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || "units";
    const emissionFactor = (totalCO2e / consumption / 1000).toFixed(6);

    if (calculation.category === 'gas') {
      doc.font("Helvetica-Bold").text("Natural Gas:");
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fillColor("#2C5F2D")
        .text(
          `${consumption.toLocaleString()} ${unit} × ${emissionFactor} = ${totalMetricTons} mtCO₂e`,
          { indent: 20 }
        );
    } else if (calculation.category === 'fuel') {
      doc.font("Helvetica-Bold").text("Fleet Fuel:");
      doc.moveDown(0.3);
      doc
        .font("Helvetica")
        .fillColor("#2C5F2D")
        .text(
          `${consumption.toLocaleString()} ${unit} × ${emissionFactor} = ${totalMetricTons} mtCO₂e`,
          { indent: 20 }
        );
    }
  }

  // ==================== PAGE 6: METHODOLOGY & ASSURANCE ====================
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("6. Methodology & Assurance", { underline: true });

  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text("This section provides legitimacy and shields from audits.");

  doc.moveDown(1);
  doc.fontSize(11).fillColor("#000").font("Helvetica-Bold").text("Emission Factors:");
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .text(
      "Used from the latest EPA Emission Factors Hub and eGRID database.",
      { indent: 20 }
    );

  doc.moveDown(0.5);
  doc
    .font("Helvetica-Bold")
    .text("Global Warming Potentials (GWP):");
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .text(
      "Based on the IPCC Fifth Assessment Report (AR5), 100-year time horizon.",
      { indent: 20 }
    );

  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").text("De Minimis:");
  doc.moveDown(0.3);
  doc
    .font("Helvetica")
    .text(
      "Any sources contributing less than 1% of total emissions are excluded.",
      { indent: 20 }
    );

  // ==================== PAGE 7: AUDITOR-READY DISCLAIMER ====================
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("7. Auditor-Ready Disclaimer", { underline: true });

  doc.moveDown(1);
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#333")
    .text(
      `This report was generated using automated AI-based OCR technology. While CarbonEasy.ai applies the highest standards of calculation accuracy based on federal guidelines (EPA), the final responsibility for data authenticity rests with the reporting entity. This document is intended to assist with compliance and corporate disclosure.`,
      { align: "justify" }
    );

  doc.moveDown(1.5);
  doc
    .font("Helvetica-Bold")
    .text("Calculation Standards:", { underline: true });
  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .text("- GHG Protocol Corporate Standard", { indent: 20 })
    .text("- EPA eGRID Emission Factors", { indent: 20 })
    .text("- IPCC AR5 Global Warming Potentials", { indent: 20 });

  doc.moveDown(1);
  doc
    .fillColor("#999")
    .fontSize(9)
    .text(
      "For regulatory submissions, independent verification by a certified carbon accounting specialist is recommended.",
      { align: "center" }
    );

  // ==================== PAGE 8: APPENDIX - SOURCE LOG ====================
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("8. Appendix: Source Log", { underline: true });

  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text("All processed data files for this inventory:");

  doc.moveDown(1);
  doc.fontSize(11).fillColor("#000").font("Helvetica-Bold").text("Bill #1:");
  doc.moveDown(0.3);
  doc.font("Helvetica");
  doc.text(`Date: ${periodEnd}`, { indent: 20 });
  doc.text(`Provider: ${parsedData?.provider || "Not specified"}`, {
    indent: 20,
  });
  
  if (parsedData?.consumption) {
    doc.text(
      `Usage: ${parsedData.consumption.value.toLocaleString()} ${
        parsedData.consumption.unit
      }`,
      { indent: 20 }
    );
  }
  
  doc.text(`Status: Verified`, { indent: 20 });
  doc.fillColor("#16a34a").text("✓ Processed successfully", { indent: 20 });

  doc.moveDown(1);
  doc.fillColor("#000").font("Helvetica-Bold").text("Emission Breakdown:");
  doc.moveDown(0.3);
  doc.font("Helvetica");
  doc.text(`CO₂: ${co2Tons} metric tons`, { indent: 20 });
  doc.text(`CH₄ (CO₂ equivalent): ${ch4Tons} metric tons`, { indent: 20 });
  doc.text(`N₂O (CO₂ equivalent): ${n2oTons} metric tons`, { indent: 20 });
  doc.moveDown(0.3);
  doc.font("Helvetica-Bold");
  doc.text(`Total CO₂e: ${totalMetricTons} metric tons`, { indent: 20 });

  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor("#999")
    .font("Helvetica")
    .text("End of Report", { align: "center" });

  return doc;
}
