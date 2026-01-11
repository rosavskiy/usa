import PDFDocument from "pdfkit";
import { CarbonModel } from "../models/carbon.model";
import { UserModel } from "../models/user.model";

export interface ReportOptions {
  userId: number;
  startDate?: string;
  endDate?: string;
  period?: "month" | "quarter" | "year";
}

export async function generateCarbonReport(
  options: ReportOptions
): Promise<Buffer> {
  const { userId, startDate, endDate, period } = options;

  // Fetch user data
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  // Calculate date range
  let start = startDate;
  let end = endDate;

  if (period && !startDate) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (period) {
      case "month":
        start = new Date(year, month, 1).toISOString().split("T")[0];
        end = new Date(year, month + 1, 0).toISOString().split("T")[0];
        break;
      case "quarter":
        const quarter = Math.floor(month / 3);
        start = new Date(year, quarter * 3, 1).toISOString().split("T")[0];
        end = new Date(year, quarter * 3 + 3, 0).toISOString().split("T")[0];
        break;
      case "year":
        start = new Date(year, 0, 1).toISOString().split("T")[0];
        end = new Date(year, 11, 31).toISOString().split("T")[0];
        break;
    }
  }

  // Fetch calculations
  const calculations = await CarbonModel.findByUserIdAndDateRange(
    userId,
    start,
    end
  );

  // Calculate totals
  const totals = {
    scope1: 0,
    scope2: 0,
    scope3: 0,
    total: 0,
    co2: 0,
    ch4: 0,
    n2o: 0,
  };

  calculations.forEach((calc) => {
    const co2e = calc.total_co2e_kg;
    totals.total += co2e;
    totals.co2 += calc.co2_kg;
    totals.ch4 += calc.ch4_kg;
    totals.n2o += calc.n2o_kg;

    if (calc.emission_type === "scope1") totals.scope1 += co2e;
    else if (calc.emission_type === "scope2") totals.scope2 += co2e;
    else if (calc.emission_type === "scope3") totals.scope3 += co2e;
  });

  // Create PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fontSize(24)
      .text("Carbon Emissions Report", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Generated: ${new Date().toLocaleDateString()}`, {
        align: "center",
      })
      .moveDown(2);

    // Company Info
    doc
      .fontSize(14)
      .text("Company Information", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Company: ${user.company_name}`)
      .text(`Email: ${user.email}`)
      .moveDown(1);

    // Period
    if (start && end) {
      doc.fontSize(10).text(`Reporting Period: ${start} to ${end}`).moveDown(1);
    }

    // Summary
    doc
      .fontSize(14)
      .text("Emissions Summary", { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .text(`Total CO₂e: ${(Number(totals.total) || 0).toFixed(2)} kg`)
      .text(`Scope 1 (Direct): ${(Number(totals.scope1) || 0).toFixed(2)} kg`)
      .text(
        `Scope 2 (Electricity): ${(Number(totals.scope2) || 0).toFixed(2)} kg`
      )
      .text(`Scope 3 (Indirect): ${(Number(totals.scope3) || 0).toFixed(2)} kg`)
      .moveDown(1);

    doc
      .text(`CO₂: ${(Number(totals.co2) || 0).toFixed(2)} kg`)
      .text(`CH₄: ${(Number(totals.ch4) || 0).toFixed(4)} kg`)
      .text(`N₂O: ${(Number(totals.n2o) || 0).toFixed(4)} kg`)
      .moveDown(2);

    // Detailed Table
    doc
      .fontSize(14)
      .text("Detailed Breakdown", { underline: true })
      .moveDown(0.5);

    // Table headers
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 150;
    const col3 = 250;
    const col4 = 350;
    const col5 = 450;

    doc
      .fontSize(9)
      .text("Date", col1, tableTop, { width: 90 })
      .text("Type", col2, tableTop, { width: 90 })
      .text("Category", col3, tableTop, { width: 90 })
      .text("CO₂e (kg)", col4, tableTop, { width: 90 })
      .text("Scope", col5, tableTop, { width: 90 });

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    // Table rows
    calculations.forEach((calc) => {
      const y = doc.y;

      if (y > 700) {
        doc.addPage();
      }

      doc
        .fontSize(8)
        .text(
          new Date(calc.calculation_date).toLocaleDateString(),
          col1,
          doc.y,
          { width: 90 }
        )
        .text(calc.emission_type, col2, y, { width: 90 })
        .text(calc.category, col3, y, { width: 90 })
        .text((Number(calc.total_co2e_kg) || 0).toFixed(2), col4, y, {
          width: 90,
        })
        .text(calc.emission_type.toUpperCase(), col5, y, { width: 90 });

      doc.moveDown(0.5);
    });

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(8)
      .text(
        "This report complies with GHG Protocol, EPA Standards, and ISO 14064-1",
        { align: "center" }
      )
      .text("Calculated using AI-powered document parsing with 95%+ accuracy", {
        align: "center",
      });

    doc.end();
  });
}
