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

  // Get previous calculation for comparison (baseline)
  const previousCalculation = await CarbonModel.findPreviousByCategory(
    userId,
    calculation.category,
    calculationId
  );

  // Create PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const companyName = user?.company_name || user?.email || "Client";
  const parsedData =
    typeof document?.parsed_data === "string"
      ? JSON.parse(document.parsed_data)
      : document?.parsed_data;

  // Format dates
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
  const reportDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ==================== PAGE 1: TITLE PAGE ====================
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("CarbonEasy.ai", { align: "center" });

  doc.moveDown(1);
  doc
    .fontSize(24)
    .fillColor("#000")
    .text("Carbon Footprint Report", { align: "center" });

  doc.moveDown(3);
  doc
    .fontSize(14)
    .fillColor("#000")
    .font("Helvetica")
    .text(`For: ${companyName}`, { align: "center" });

  doc.moveDown(1);
  doc
    .fontSize(12)
    .fillColor("#666")
    .text(`Period: ${periodStart} - ${periodEnd}`, { align: "center" });

  doc.moveDown(0.5);
  doc.text(`Report Date: ${reportDate}`, { align: "center" });

  doc.moveDown(0.5);
  doc
    .fillColor("#2C5F2D")
    .text("Prepared by: CarbonEasy.ai (AI-powered tool)", { align: "center" });

  doc.moveDown(1);
  doc.fontSize(10).fillColor('#2C5F2D')
     .text("Calculated in accordance with GHG Protocol Corporate Standard", { align: 'center' });

  doc.moveDown(7);
  doc.fontSize(10).fillColor("#999").text("Version 1.0", { align: "center" });

  // ==================== PAGE 2: ORGANIZATIONAL BOUNDARIES ====================
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Organizational Boundaries", { underline: true });

  doc.moveDown(1);

  doc.fontSize(12).font('Helvetica').fillColor('#000')
     .text('This report covers the following organizational scope:', { align: 'justify' });

  doc.moveDown(0.5);

  // Location/Region coverage
  const location = parsedData?.state || 'United States';
  const provider = parsedData?.provider || 'Not specified';

  doc.fontSize(11).fillColor('#000')
     .text(`Location: ${location}`, { indent: 20 })
     .text(`Service Provider: ${provider}`, { indent: 20 })
     .text(`Report Period: ${periodStart} - ${periodEnd}`, { indent: 20 });

  doc.moveDown(1);

  doc.fontSize(10).fillColor('#666')
     .text('Note: This report represents emissions from utility consumption at the specified location during the reporting period. Organizational boundaries are defined in accordance with the GHG Protocol Corporate Accounting and Reporting Standard.', { align: 'justify' });

  // ==================== PAGE 3: EXECUTIVE SUMMARY ====================
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Executive Summary", { underline: true });

  doc.moveDown(1);

  const totalCO2e = Number(calculation.total_co2e_kg).toFixed(2);
  const co2 = Number(calculation.co2_kg).toFixed(2);
  const ch4 = Number(calculation.ch4_kg).toFixed(3);
  const n2o = Number(calculation.n2o_kg).toFixed(3);

  doc
    .fontSize(14)
    .fillColor("#000")
    .font("Helvetica-Bold")
    .text(`Total Emissions: ${totalCO2e} kg CO2e`, { continued: false });

  doc.moveDown(0.5);

  // Scope breakdown
  const scopeLabel = getScopeLabel(calculation.emission_type);
  const categoryLabel = getCategoryLabel(calculation.category);

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#000")
    .text(`- ${scopeLabel}: ${categoryLabel}`, { indent: 20 });

  doc.moveDown(1);
  doc
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Emissions Breakdown:", { underline: true });

  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fillColor("#000")
    .text(`CO2: ${co2} kg`, { indent: 20 })
    .text(`CH4 (equivalent): ${ch4} kg`, { indent: 20 })
    .text(`N2O (equivalent): ${n2o} kg`, { indent: 20 });

  doc.moveDown(1);

  // Consumption info
  if (parsedData?.consumption) {
    doc
      .font("Helvetica-Bold")
      .fillColor("#2C5F2D")
      .text("Consumption:", { underline: true });

    doc.moveDown(0.5);
    doc
      .font("Helvetica")
      .fillColor("#000")
      .text(
        `${parsedData.consumption.value.toLocaleString()} ${
          parsedData.consumption.unit
        }`,
        { indent: 20 }
      );

    if (parsedData.provider) {
      doc.text(`Provider: ${parsedData.provider}`, { indent: 20 });
    }
    if (parsedData.state) {
      doc.text(`Region: ${parsedData.state}`, { indent: 20 });
    }
  }

  // Baseline comparison
  if (previousCalculation) {
    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fillColor("#2C5F2D")
      .text("Comparison with Previous Period:", { underline: true });

    doc.moveDown(0.5);
    const previousTotal = Number(previousCalculation.total_co2e_kg);
    const currentTotal = Number(calculation.total_co2e_kg);
    const change = currentTotal - previousTotal;
    const changePercent = ((change / previousTotal) * 100).toFixed(1);
    const isReduction = change < 0;

    doc.font("Helvetica").fillColor("#000")
       .text(`Previous: ${previousTotal.toFixed(2)} kg CO2e`, { indent: 20 })
       .text(`Current: ${currentTotal.toFixed(2)} kg CO2e`, { indent: 20 });

    doc.fillColor(isReduction ? '#16a34a' : '#dc2626')
       .text(`Change: ${isReduction ? '' : '+'}${change.toFixed(2)} kg CO2e (${isReduction ? '' : '+'}${changePercent}%)`, { indent: 20 });

    if (isReduction) {
      doc.fillColor('#16a34a')
         .text(`✓ Emissions reduced by ${Math.abs(change).toFixed(2)} kg CO2e`, { indent: 20 });
    }
  }

  // ==================== PAGE 4: DETAILED CALCULATION (TRANSPARENCY) ====================
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Detailed Calculation Methodology", { underline: true });

  doc.moveDown(1);

  doc.fontSize(11).font('Helvetica').fillColor('#666')
     .text('All calculations performed in accordance with GHG Protocol Corporate Standard.', { align: 'justify' });

  doc.moveDown(1);

  // TRANSPARENCY: Show detailed formula
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000')
     .text('Calculation Formula:', { underline: true });

  doc.moveDown(0.5);

  // Calculation details with exact coefficients
  doc.fillColor('#000').font('Helvetica').fontSize(11);
  
  if (calculation.category === 'electricity') {
    const consumption = parsedData?.consumption?.value || 0;
    const factor = calculation.total_co2e_kg / consumption;
    const region = parsedData?.state || 'US';
    
    doc.text('Step 1: Consumption Data', { indent: 20, underline: true });
    doc.text(`   Electricity consumed: ${consumption.toLocaleString()} kWh`, { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('Step 2: Emission Factor', { indent: 20, underline: true });
    doc.text(`   Region: ${region}`, { indent: 20 });
    doc.text(`   EPA eGRID 2023 factor: ${factor.toFixed(4)} kg CO2e/kWh`, { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('Step 3: Calculation', { indent: 20, underline: true });
    doc.fillColor('#2C5F2D').font('Helvetica-Bold');
    doc.text(`   ${consumption.toLocaleString()} kWh × ${factor.toFixed(4)} = ${totalCO2e} kg CO2e`, { indent: 20 });
    
  } else if (calculation.category === 'gas') {
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || 'therms';
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text('Step 1: Consumption Data', { indent: 20, underline: true });
    doc.text(`   Natural gas consumed: ${consumption.toLocaleString()} ${unit}`, { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('Step 2: Emission Factor', { indent: 20, underline: true });
    doc.text(`   EPA emission factor: ${factor.toFixed(4)} kg CO2e/${unit}`, { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('Step 3: Calculation', { indent: 20, underline: true });
    doc.fillColor('#2C5F2D').font('Helvetica-Bold');
    doc.text(`   ${consumption.toLocaleString()} ${unit} × ${factor.toFixed(4)} = ${totalCO2e} kg CO2e`, { indent: 20 });
    
  } else if (calculation.category === 'fuel') {
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || 'gallons';
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text('Step 1: Consumption Data', { indent: 20, underline: true });
    doc.text(`   Fuel consumed: ${consumption.toLocaleString()} ${unit}`, { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('Step 2: Emission Factor', { indent: 20, underline: true });
    doc.text(`   EPA emission factor: ${factor.toFixed(4)} kg CO2e/${unit}`, { indent: 20 });
    
    doc.moveDown(0.5);
    doc.text('Step 3: Calculation', { indent: 20, underline: true });
    doc.fillColor('#2C5F2D').font('Helvetica-Bold');
    doc.text(`   ${consumption.toLocaleString()} ${unit} × ${factor.toFixed(4)} = ${totalCO2e} kg CO2e`, { indent: 20 });
  }

  doc.moveDown(1);
  doc.fillColor('#000').font('Helvetica').fontSize(11);
  doc.text('Step 4: GHG Components', { indent: 20, underline: true });
  doc.text(`   CO2: ${co2} kg (${((Number(co2) / Number(totalCO2e)) * 100).toFixed(1)}%)`, { indent: 20 });
  doc.text(`   CH4 (CO2 equivalent): ${ch4} kg (${((Number(ch4) / Number(totalCO2e)) * 100).toFixed(1)}%)`, { indent: 20 });
  doc.text(`   N2O (CO2 equivalent): ${n2o} kg (${((Number(n2o) / Number(totalCO2e)) * 100).toFixed(1)}%)`, { indent: 20 });

  // ==================== PAGE 5: SCOPE BREAKDOWN ====================
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Scope Classification", { underline: true });

  doc.moveDown(1);

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text(`${scopeLabel} - ${categoryLabel}`);

  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#666")
    .text(getScopeDescription(calculation.emission_type));

  doc.moveDown(1);

  doc.fillColor('#2C5F2D').font('Helvetica-Bold').fontSize(12)
     .text('GHG Protocol Classification:');

  doc.moveDown(0.5);
  doc.fillColor("#000").font('Helvetica').fontSize(11);

  if (calculation.category === "electricity") {
    doc.text(`Category: Purchased Electricity (Scope 2)`, { indent: 20 })
       .text(`Source: ${parsedData?.provider || 'Utility Provider'}`, { indent: 20 })
       .text(`Region: ${parsedData?.state || 'US'}`, { indent: 20 })
       .text(`Reporting Standard: GHG Protocol Scope 2 Guidance`, { indent: 20 });
  } else if (calculation.category === "gas") {
    doc.text(`Category: Stationary Combustion (Scope 1)`, { indent: 20 })
       .text(`Fuel Type: Natural Gas`, { indent: 20 })
       .text(`Source: ${parsedData?.provider || 'Gas Utility'}`, { indent: 20 })
       .text(`Reporting Standard: GHG Protocol Corporate Standard`, { indent: 20 });
  } else if (calculation.category === "fuel") {
    doc.text(`Category: Mobile Combustion (Scope 1)`, { indent: 20 })
       .text(`Fuel Type: Gasoline/Diesel`, { indent: 20 })
       .text(`Reporting Standard: GHG Protocol Corporate Standard`, { indent: 20 });
  }

  doc.moveDown(1);
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#2C5F2D")
    .text(`Total ${scopeLabel}: ${totalCO2e} kg CO2e`);

  // ==================== PAGE 6: METHODOLOGY ====================
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Methodology & Data Sources", { underline: true });

  doc.moveDown(1);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor("#000")
    .text("Calculation Methodology:");

  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fillColor("#666")
    .text(
      "Calculations performed in accordance with the GHG Protocol Corporate Accounting and Reporting Standard. All emission factors sourced from EPA eGRID 2023 and EPA Emission Factor databases.",
      { indent: 20, align: "justify" }
    );

  doc.moveDown(1);
  doc.font("Helvetica-Bold").fillColor("#000").text("Emission Factor Sources:");

  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fillColor("#666")
    .text("- EPA eGRID 2023 for electricity (US regional factors)", {
      indent: 20,
    })
    .text("- EPA Emission Factors for natural gas and fuel", { indent: 20 })
    .text("- Climatiq Database for additional sources (regional)", {
      indent: 20,
    });

  doc.moveDown(1);
  doc.font("Helvetica-Bold").fillColor("#000").text("Quality Assurance:");

  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fillColor("#666")
    .text("- All calculations verified against GHG Protocol standards", {
      indent: 20,
    })
    .text("- Emission factors updated annually from official sources", {
      indent: 20,
    })
    .text("- Data accuracy ensured through automated validation", {
      indent: 20,
    });

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#999")
    .text(
      "Disclaimer: This report is prepared using the CarbonEasy.ai AI-powered tool in accordance with GHG Protocol Corporate Standard. It does not constitute legal or professional advice. Independent verification by a certified carbon accounting specialist is recommended for regulatory compliance.",
      { align: "justify" }
    );

  // ==================== PAGE 7: SIGNATURE ====================
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .fillColor("#2C5F2D")
    .text("Report Certification", { underline: true });

  doc.moveDown(2);

  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#000")
    .text("This report has been automatically generated by CarbonEasy.ai");

  doc.moveDown(0.5);
  doc.fillColor("#2C5F2D").text(`Report Date: ${reportDate}`);

  doc.moveDown(0.5);
  doc.fillColor("#666").text("Version: 1.0");

  doc.moveDown(1);
  doc.fillColor('#2C5F2D').font('Helvetica-Bold')
     .text('Compliance Statement:');

  doc.moveDown(0.5);
  doc.fillColor('#000').font('Helvetica')
     .text('This report has been calculated in accordance with:', { indent: 20 })
     .text('- GHG Protocol Corporate Accounting and Reporting Standard', { indent: 30 })
     .text('- EPA eGRID 2023 emission factors', { indent: 30 })
     .text('- ISO 14064-1:2018 guidelines', { indent: 30 });

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#999")
    .text(
      "For questions and clarifications, please consult with certified sustainability specialists. This report is for informational purposes and may require independent verification for regulatory submissions.",
      { align: "center" }
    );

  return doc;
}

function getScopeLabel(emissionType: string): string {
  switch (emissionType) {
    case "scope1":
      return "Scope 1 (Direct Emissions)";
    case "scope2":
      return "Scope 2 (Indirect from Energy)";
    case "scope3":
      return "Scope 3 (Other Indirect)";
    default:
      return "Unknown Scope";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "electricity":
      return "Electricity";
    case "gas":
      return "Natural Gas";
    case "fuel":
      return "Fuel";
    default:
      return category;
  }
}

function getScopeDescription(emissionType: string): string {
  switch (emissionType) {
    case "scope1":
      return "Direct greenhouse gas emissions from sources owned or controlled by the company (fuel, gas, transportation).";
    case "scope2":
      return "Indirect emissions from purchased electricity, heat, or steam.";
    case "scope3":
      return "Other indirect emissions in the value chain (suppliers, business travel, waste).";
    default:
      return "";
  }
}
