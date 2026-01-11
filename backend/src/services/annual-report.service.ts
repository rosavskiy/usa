import PDFDocument from "pdfkit";
import { CarbonModel } from "../models/carbon.model";
import { UserModel } from "../models/user.model";

interface AnnualReportParams {
  userId: number;
  year: number;
}

export async function generateAnnualReport(
  params: AnnualReportParams
): Promise<typeof PDFDocument> {
  const { userId, year } = params;

  // Get user info
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Get all calculations for the year
  const calculations = await CarbonModel.findByUserIdAndDateRange(
    userId,
    `${year}-01-01`,
    `${year}-12-31`
  );

  if (calculations.length === 0) {
    throw new Error(`No calculations found for year ${year}`);
  }

  // Calculate totals and breakdowns
  const totalEmissions = calculations.reduce(
    (sum, calc) => sum + Number(calc.total_co2e_kg),
    0
  );

  const scope1Total = calculations
    .filter((c) => c.emission_type === "scope1")
    .reduce((sum, calc) => sum + Number(calc.total_co2e_kg), 0);

  const scope2Total = calculations
    .filter((c) => c.emission_type === "scope2")
    .reduce((sum, calc) => sum + Number(calc.total_co2e_kg), 0);

  const scope3Total = calculations
    .filter((c) => c.emission_type === "scope3")
    .reduce((sum, calc) => sum + Number(calc.total_co2e_kg), 0);

  // Group by category
  const byCategory: { [key: string]: number } = {};
  calculations.forEach((calc) => {
    const category = calc.category || "Unknown";
    byCategory[category] = (byCategory[category] || 0) + Number(calc.total_co2e_kg);
  });

  // Group by month
  const byMonth: { [key: string]: number } = {};
  calculations.forEach((calc) => {
    const month = new Date(calc.calculation_date).toLocaleDateString("en-US", {
      month: "short",
    });
    byMonth[month] = (byMonth[month] || 0) + Number(calc.total_co2e_kg);
  });

  // Create PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Page 1: Title Page
  doc
    .fontSize(32)
    .font("Helvetica-Bold")
    .text("Annual Carbon Footprint Report", { align: "center" });
  doc.moveDown(1);
  doc
    .fontSize(24)
    .font("Helvetica")
    .text(`Year ${year}`, { align: "center" });
  doc.moveDown(2);
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(user.company_name, { align: "center" });
  doc.moveDown(0.5);
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(`Prepared on: ${new Date().toLocaleDateString("en-US")}`, {
      align: "center",
    });
  doc.moveDown(4);
  doc
    .fontSize(10)
    .font("Helvetica-Oblique")
    .text(
      "This report has been prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard",
      { align: "center" }
    );

  // Page 2: Executive Summary
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Executive Summary", { underline: true });
  doc.moveDown(1);

  doc
    .fontSize(12)
    .font("Helvetica")
    .text(
      `This report presents the greenhouse gas (GHG) emissions inventory for ${user.company_name} for the calendar year ${year}.`
    );
  doc.moveDown(1);

  // Summary Statistics Table
  doc.fontSize(14).font("Helvetica-Bold").text("Total Emissions Summary");
  doc.moveDown(0.5);

  const summaryTableTop = doc.y;
  const col1X = 50;
  const col2X = 350;

  // Table rows
  const rows = [
    ["Total Emissions", `${totalEmissions.toFixed(2)} kg CO₂e`],
    ["Scope 1 Emissions", `${scope1Total.toFixed(2)} kg CO₂e`],
    ["Scope 2 Emissions", `${scope2Total.toFixed(2)} kg CO₂e`],
    ["Scope 3 Emissions", `${scope3Total.toFixed(2)} kg CO₂e`],
    ["Number of Calculations", `${calculations.length}`],
    [
      "Average per Calculation",
      `${(totalEmissions / calculations.length).toFixed(2)} kg CO₂e`,
    ],
  ];

  let currentY = summaryTableTop;
  doc.fontSize(11).font("Helvetica");

  rows.forEach((row, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc
        .rect(col1X, currentY - 3, 495, 20)
        .fillAndStroke("#f3f4f6", "#000");
    }

    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(row[0], col1X + 5, currentY, { width: 280 });
    doc
      .font("Helvetica")
      .text(row[1], col2X + 5, currentY, { width: 180 });

    currentY += 20;
  });

  doc.moveDown(2);

  // Page 3: Scope Breakdown
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Emissions by Scope", { underline: true });
  doc.moveDown(1);

  // PIE CHART - Scope Breakdown
  const centerX = 300;
  const centerY = 200;
  const radius = 80;

  const scopeData = [
    { name: "Scope 1", value: scope1Total, color: "#ef4444" },
    { name: "Scope 2", value: scope2Total, color: "#f59e0b" },
    { name: "Scope 3", value: scope3Total, color: "#3b82f6" },
  ].filter(s => s.value > 0);

  let startAngle = 0;
  scopeData.forEach((scope) => {
    const percentage = totalEmissions > 0 ? (scope.value / totalEmissions) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const endAngle = startAngle + angle;

    // Draw pie slice
    if (angle > 0) {
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (endAngle - 90) * Math.PI / 180;
      
      doc.save();
      doc.path(`M ${centerX} ${centerY}`)
         .lineTo(centerX + radius * Math.cos(startRad), centerY + radius * Math.sin(startRad))
         .arc(centerX, centerY, radius, startRad, endRad)
         .lineTo(centerX, centerY)
         .fill(scope.color);
      doc.restore();
    }

    startAngle = endAngle;
  });

  // Draw white circle in center for donut effect
  doc.circle(centerX, centerY, radius * 0.5).fill('#fff');

  // Legend
  let legendY = 350;
  scopeData.forEach((scope) => {
    const percentage = totalEmissions > 0 ? (scope.value / totalEmissions) * 100 : 0;

    // Color box
    doc.rect(80, legendY, 15, 15).fill(scope.color);
    
    // Text
    doc.fontSize(11).font("Helvetica-Bold").fillColor('#000')
       .text(scope.name, 100, legendY + 2);
    doc.font("Helvetica")
       .text(`${scope.value.toFixed(2)} kg CO₂e (${percentage.toFixed(1)}%)`, 200, legendY + 2);

    legendY += 25;
  });

  // Page 4: Category Breakdown
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Emissions by Category", { underline: true });
  doc.moveDown(1);

  const sortedCategories = Object.entries(byCategory).sort(
    (a, b) => b[1] - a[1]
  );

  // PIE CHART - Category Breakdown
  const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
  const categoryData = sortedCategories.slice(0, 7).map(([name, value], i) => ({
    name,
    value,
    color: colors[i % colors.length]
  }));

  const catCenterX = 300;
  const catCenterY = 200;
  const catRadius = 80;

  let catStartAngle = 0;
  categoryData.forEach((cat) => {
    const percentage = totalEmissions > 0 ? (cat.value / totalEmissions) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const catEndAngle = catStartAngle + angle;

    if (angle > 0) {
      const startRad = (catStartAngle - 90) * Math.PI / 180;
      const endRad = (catEndAngle - 90) * Math.PI / 180;
      
      doc.save();
      doc.path(`M ${catCenterX} ${catCenterY}`)
         .lineTo(catCenterX + catRadius * Math.cos(startRad), catCenterY + catRadius * Math.sin(startRad))
         .arc(catCenterX, catCenterY, catRadius, startRad, endRad)
         .lineTo(catCenterX, catCenterY)
         .fill(cat.color);
      doc.restore();
    }

    catStartAngle = catEndAngle;
  });

  // Donut center
  doc.circle(catCenterX, catCenterY, catRadius * 0.5).fill('#fff');

  // Legend
  let catLegendY = 350;
  categoryData.forEach((cat) => {
    const percentage = (cat.value / totalEmissions) * 100;

    doc.rect(80, catLegendY, 15, 15).fill(cat.color);
    doc.fontSize(10).font("Helvetica-Bold").fillColor('#000')
       .text(cat.name, 100, catLegendY + 2);
    doc.font("Helvetica")
       .text(`${cat.value.toFixed(2)} kg (${percentage.toFixed(1)}%)`, 250, catLegendY + 2);

    catLegendY += 20;
  });

  // Page 5: Monthly Trend
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Monthly Emissions Trend", { underline: true });
  doc.moveDown(1);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  doc.fontSize(11).font("Helvetica");
  months.forEach((month) => {
    const value = byMonth[month] || 0;
    doc.text(`${month} ${year}: ${value.toFixed(2)} kg CO₂e`);
    doc.moveDown(0.3);
  });

  // Page 6: Detailed Calculations
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Detailed Calculations", { underline: true });
  doc.moveDown(1);

  doc.fontSize(10).font("Helvetica");

  calculations.forEach((calc, index) => {
    if (doc.y > 700) {
      doc.addPage();
    }

    doc
      .font("Helvetica-Bold")
      .text(`${index + 1}. ${calc.category} (${calc.emission_type})`);
    doc.font("Helvetica").text(`Date: ${new Date(calc.calculation_date).toLocaleDateString()}`);
    doc.text(`Total CO₂e: ${Number(calc.total_co2e_kg).toFixed(2)} kg`);
    doc.text(
      `Breakdown: CO₂=${Number(calc.co2_kg).toFixed(2)} kg, CH₄=${Number(calc.ch4_kg).toFixed(3)} kg, N₂O=${Number(calc.n2o_kg).toFixed(3)} kg`
    );
    doc.moveDown(0.5);
  });

  // Final Page: Certification
  doc.addPage();
  doc
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("Report Certification", { underline: true });
  doc.moveDown(1);

  doc
    .fontSize(11)
    .font("Helvetica")
    .text(
      `This Annual Carbon Footprint Report for ${user.company_name} has been prepared in accordance with:`
    );
  doc.moveDown(0.5);
  doc.text("• The Greenhouse Gas Protocol Corporate Standard");
  doc.text("• ISO 14064-1:2018 Greenhouse gases");
  doc.text("• EPA eGRID 2023 emission factors");
  doc.moveDown(1);
  doc.text(
    `Report generated on ${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`
  );
  doc.moveDown(2);
  doc
    .fontSize(9)
    .font("Helvetica-Oblique")
    .text(
      "This report is based on data provided by the organization and processed using standardized emission factors. The accuracy of this report depends on the quality and completeness of the input data."
    );

  return doc;
}
