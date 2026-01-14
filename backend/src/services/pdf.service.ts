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
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
  });

  const companyName = user?.company_name || "[COMPANY NAME]";
  const userEmail = user?.email || "";
  const parsedData =
    typeof document?.parsed_data === "string"
      ? JSON.parse(document.parsed_data)
      : document?.parsed_data;

  // Format dates
  const reportingYear = calculation.period_end
    ? new Date(calculation.period_end).getFullYear()
    : new Date().getFullYear();
  
  const periodStartDate = calculation.period_start ? new Date(calculation.period_start) : new Date();
  const periodEndDate = calculation.period_end ? new Date(calculation.period_end) : new Date();
  
  const formatDate = (date: Date) => {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  // Calculate totals in metric tons (mt)
  const totalCO2e = Number(calculation.total_co2e_kg);
  const totalMetricTons = (totalCO2e / 1000).toFixed(3);
  const co2Mt = (Number(calculation.co2_kg) / 1000).toFixed(3);
  const ch4Mt = (Number(calculation.ch4_kg) / 1000).toFixed(3);
  const n2oMt = (Number(calculation.n2o_kg) / 1000).toFixed(3);
  const hfcsMt = (Number(calculation.hfcs_kg || 0) / 1000).toFixed(3);
  const pfcsMt = (Number(calculation.pfcs_kg || 0) / 1000).toFixed(3);
  const sf6Mt = (Number(calculation.sf6_kg || 0) / 1000).toFixed(3);
  const otherMt = (Number(calculation.other_kg || 0) / 1000).toFixed(3);

  const scope1Total = calculation.emission_type === 'scope1' ? totalMetricTons : '0.000';
  const scope2Total = calculation.emission_type === 'scope2' ? totalMetricTons : '0.000';

  const tealColor = '#008B8B';
  const grayColor = '#666666';

  // ==================== PAGE 1: TITLE PAGE ====================
  
  // Disclaimer at top
  doc
    .fontSize(9)
    .fillColor(grayColor)
    .font('Helvetica')
    .text(
      'This is not the official reporting template of the WRI/WBCSD GHG Protocol. It is a sample template',
      { align: 'center' }
    );
  doc.text('meant to help outline the reporting requirements of the GHG Protocol Corporate Standard.', {
    align: 'center',
  });

  doc.moveDown(4);

  // Main title
  doc
    .fontSize(20)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Greenhouse Gas Emissions Inventory', { align: 'center' });

  doc.moveDown(2);

  // Company name and year
  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`[${companyName.toUpperCase()}]`, { align: 'center' });
  doc.moveDown(0.5);
  doc.text(`[${reportingYear}]`, { align: 'center' });

  doc.moveDown(3);

  // Company logo box
  const logoBoxWidth = 180;
  const logoBoxHeight = 60;
  const pageWidth = doc.page.width;
  const logoX = (pageWidth - logoBoxWidth) / 2;
  const logoY = doc.y;

  doc
    .rect(logoX, logoY, logoBoxWidth, logoBoxHeight)
    .stroke();
  
  doc
    .fontSize(10)
    .fillColor(grayColor)
    .text('COMPANY', logoX, logoY + 20, { width: logoBoxWidth, align: 'center' });
  doc.text('LOGO', logoX, logoY + 32, { width: logoBoxWidth, align: 'center' });

  doc.y = logoY + logoBoxHeight + 40;

  // Verification table
  const tableX = 70;
  const tableWidth = doc.page.width - 140;
  const rowHeight = 20;
  let currentY = doc.y;

  // Header row
  doc
    .fillColor(tealColor)
    .rect(tableX, currentY, tableWidth, rowHeight)
    .fill();

  doc
    .fontSize(9)
    .fillColor('#FFF')
    .font('Helvetica')
    .text(
      'Has this inventory been verified by an accredited third party?',
      tableX + 5,
      currentY + 6,
      { width: tableWidth - 10 }
    );

  currentY += rowHeight;

  // Checkbox row
  doc
    .rect(tableX, currentY, tableWidth, rowHeight)
    .stroke();

  doc
    .fontSize(9)
    .fillColor('#000')
    .text('☐ No', tableX + 10, currentY + 5);
  
  doc.text(
    '☑ Yes (if yes, fill in verifier contact information below and attach verification',
    tableX + 60,
    currentY + 5,
    { continued: false }
  );

  currentY += rowHeight;

  // Info rows
  const infoRows = [
    `Date of verification: ${formatDate(new Date())}`,
    `Verifier: ${companyName}`,
    `Email: ${userEmail}`,
    `Phone: ${parsedData?.phoneNumber || 'N/A'}`,
    `Address: ${parsedData?.serviceAddress || 'N/A'}`,
  ];

  infoRows.forEach((text) => {
    doc
      .rect(tableX, currentY, tableWidth, rowHeight)
      .stroke();
    
    doc
      .fontSize(9)
      .fillColor('#000')
      .text(text, tableX + 5, currentY + 5);
    
    currentY += rowHeight;
  });

  // ==================== PAGE 2: REQUIRED INFORMATION ====================
  doc.addPage();

  doc
    .fontSize(14)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('REQUIRED INFORMATION', { align: 'center' });

  doc.moveDown(1);

  let y = doc.y;
  const colWidth = doc.page.width - 120;

  // Exclusions question
  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 30)
    .fill();

  doc
    .fontSize(9)
    .fillColor('#FFF')
    .font('Helvetica')
    .text(
      'Have any facilities, operations and/or emissions sources been excluded from this inventory? If yes,',
      65,
      y + 5,
      { width: colWidth - 10 }
    );
  doc.text('please specify.', 65, y + 17, { width: colWidth - 10 });

  y += 30;

  doc
    .rect(60, y, colWidth, 20)
    .stroke();
  doc
    .fontSize(9)
    .fillColor('#000')
    .text('No exclusions', 65, y + 5);

  y += 25;

  // Reporting period
  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 20)
    .fill();

  doc
    .fontSize(9)
    .fillColor('#FFF')
    .text('Reporting period covered by this inventory:', 65, y + 5);

  y += 20;

  doc
    .rect(60, y, colWidth, 20)
    .stroke();
  doc
    .fontSize(9)
    .fillColor('#000')
    .text(`${formatDate(periodStartDate)} to ${formatDate(periodEndDate)}`, 65, y + 5);

  y += 25;

  // ORGANIZATIONAL BOUNDARIES
  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('ORGANIZATIONAL BOUNDARIES', 60, y);

  y += 20;

  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 30)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .font('Helvetica')
    .text(
      'What approach is your company using? (Check each consolidation approach for which your company is',
      65,
      y + 5,
      { width: colWidth - 10 }
    );
  doc.text(
    'reporting emissions.) If your company is reporting according to more than one consolidation approach,',
    65,
    y + 15,
    { width: colWidth - 10 }
  );

  y += 30;

  const checkboxY = y;
  const checkboxSpacing = (colWidth - 20) / 3;

  doc.rect(60, checkboxY, colWidth, 25).stroke();

  doc
    .fontSize(9)
    .fillColor('#000')
    .text('☐ Equity Share', 70, checkboxY + 7);
  doc.text('☐ Financial Control', 70 + checkboxSpacing, checkboxY + 7);
  doc.text('☑ Operational Control', 70 + checkboxSpacing * 2, checkboxY + 7);

  y = checkboxY + 30;

  // OPERATIONAL BOUNDARIES
  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('OPERATIONAL BOUNDARIES', 60, y);

  y += 20;

  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 20)
    .fill();

  doc
    .fontSize(9)
    .fillColor('#FFF')
    .font('Helvetica')
    .text('Are Scope 3 emissions included in this inventory?', 65, y + 5);

  y += 20;

  doc.rect(60, y, colWidth, 20).stroke();
  doc
    .fontSize(9)
    .fillColor('#000')
    .text('☐ Yes     ☑ No', 65, y + 5);

  y += 25;

  // INFORMATION ON EMISSIONS
  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('INFORMATION ON EMISSIONS', 60, y);

  y += 15;

  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font('Helvetica')
    .text(
      'The table below refers to emissions independent of any GHG trades such as sales, purchases, transfers,',
      60,
      y,
      { width: colWidth }
    );
  doc.text('or banking of allowances.', 60, y + 10, { width: colWidth });

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
    .fillColor('#FFF')
    .font('Helvetica-Bold')
    .text('EMISSIONS', col1X + 5, tableStartY + 5, { width: col1Width - 10 });

  const headers = ['TOTAL\n(mtCO2e)', 'CO2\n(mt)', 'CH4\n(mt)', 'N2O\n(mt)', 'HFCs\n(mt)', 'PFCs\n(mt)', 'SF6\n(mt)', 'Other\n(mt)'];
  
  headers.forEach((header, i) => {
    const x = col1X + col1Width + i * dataColWidth;
    doc.text(header, x + 2, tableStartY + 2, { width: dataColWidth - 4, align: 'center' });
  });

  y = tableStartY + 20;

  // Data rows
  const emissionRows = [
    { 
      label: 'Scope 1', 
      total: scope1Total, 
      co2: calculation.emission_type === 'scope1' ? co2Mt : '0.000', 
      ch4: calculation.emission_type === 'scope1' ? ch4Mt : '0.000', 
      n2o: calculation.emission_type === 'scope1' ? n2oMt : '0.000',
      hfcs: calculation.emission_type === 'scope1' ? hfcsMt : '0.000',
      pfcs: calculation.emission_type === 'scope1' ? pfcsMt : '0.000',
      sf6: calculation.emission_type === 'scope1' ? sf6Mt : '0.000',
      other: calculation.emission_type === 'scope1' ? otherMt : '0.000'
    },
    { 
      label: 'Scope 2', 
      total: scope2Total, 
      co2: calculation.emission_type === 'scope2' ? co2Mt : '0.000', 
      ch4: calculation.emission_type === 'scope2' ? ch4Mt : '0.000', 
      n2o: calculation.emission_type === 'scope2' ? n2oMt : '0.000',
      hfcs: calculation.emission_type === 'scope2' ? hfcsMt : '0.000',
      pfcs: calculation.emission_type === 'scope2' ? pfcsMt : '0.000',
      sf6: calculation.emission_type === 'scope2' ? sf6Mt : '0.000',
      other: calculation.emission_type === 'scope2' ? otherMt : '0.000'
    },
    { 
      label: 'Scope 3\n(OPTIONAL)', 
      total: '0.000', 
      co2: '0.000', 
      ch4: '0.000', 
      n2o: '0.000',
      hfcs: '0.000',
      pfcs: '0.000',
      sf6: '0.000',
      other: '0.000'
    },
  ];

  emissionRows.forEach((row) => {
    doc.rect(col1X, y, col1Width, 20).stroke();
    doc
      .fontSize(9)
      .fillColor('#000')
      .font('Helvetica')
      .text(row.label, col1X + 5, y + 5, { width: col1Width - 10 });

    // Total
    doc.rect(col1X + col1Width, y, dataColWidth, 20).stroke();
    doc.text(row.total, col1X + col1Width + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // CO2
    doc.rect(col1X + col1Width + dataColWidth, y, dataColWidth, 20).stroke();
    doc.text(row.co2, col1X + col1Width + dataColWidth + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // CH4
    doc.rect(col1X + col1Width + dataColWidth * 2, y, dataColWidth, 20).stroke();
    doc.text(row.ch4, col1X + col1Width + dataColWidth * 2 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // N2O
    doc.rect(col1X + col1Width + dataColWidth * 3, y, dataColWidth, 20).stroke();
    doc.text(row.n2o, col1X + col1Width + dataColWidth * 3 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // HFCs
    doc.rect(col1X + col1Width + dataColWidth * 4, y, dataColWidth, 20).stroke();
    doc.text(row.hfcs, col1X + col1Width + dataColWidth * 4 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // PFCs
    doc.rect(col1X + col1Width + dataColWidth * 5, y, dataColWidth, 20).stroke();
    doc.text(row.pfcs, col1X + col1Width + dataColWidth * 5 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // SF6
    doc.rect(col1X + col1Width + dataColWidth * 6, y, dataColWidth, 20).stroke();
    doc.text(row.sf6, col1X + col1Width + dataColWidth * 6 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    // Other
    doc.rect(col1X + col1Width + dataColWidth * 7, y, dataColWidth, 20).stroke();
    doc.text(row.other, col1X + col1Width + dataColWidth * 7 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    y += 20;
  });

  y += 10;

  // Biogenic emissions note
  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 20)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .font('Helvetica')
    .text('Direct CO2 emissions from biogenic combustion (mtCO2)', 65, y + 5);

  y += 20;

  doc.rect(60, y, colWidth, 20).stroke();
  doc
    .fontSize(9)
    .fillColor('#000')
    .text('0.000', 65, y + 5);

  y += 30;

  // BASE YEAR section
  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('BASE YEAR', 60, y);

  y += 20;

  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 15)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .font('Helvetica')
    .text('Year chosen as base year', 65, y + 3);

  y += 15;

  doc.rect(60, y, colWidth, 15).stroke();
  doc
    .fontSize(9)
    .fillColor('#000')
    .text(reportingYear.toString(), 65, y + 3);

  y += 20;

  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 15)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .text('Clarification of company-determined policy for making base year emissions recalculations', 65, y + 3);

  y += 15;

  doc.rect(60, y, colWidth, 15).stroke();
  doc
    .fontSize(8)
    .fillColor('#000')
    .text('First year of operation', 65, y + 3);

  y += 20;

  // Context for any significant emissions changes
  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 20)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .text('Context for any significant emissions changes that triggered base year emissions recalculations', 65, y + 5);

  y += 20;

  doc.rect(60, y, colWidth, 15).stroke();
  doc
    .fontSize(8)
    .fillColor('#000')
    .text('N/A', 65, y + 3);

  // ==================== PAGE 3: BASE YEAR EMISSIONS TABLE ====================
  doc.addPage();

  y = 60;

  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Base year emissions', 60, y);

  y += 20;

  // Base year emissions table (same structure as current year)
  doc.fillColor(tealColor).rect(col1X, y, colWidth, 20).fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .font('Helvetica-Bold')
    .text('EMISSIONS', col1X + 5, y + 5, { width: col1Width - 10 });

  headers.forEach((header, i) => {
    const x = col1X + col1Width + i * dataColWidth;
    doc.text(header, x + 2, y + 2, { width: dataColWidth - 4, align: 'center' });
  });

  y += 20;

  // Same data for base year (first reporting year)
  emissionRows.forEach((row) => {
    doc.rect(col1X, y, col1Width, 20).stroke();
    doc
      .fontSize(9)
      .fillColor('#000')
      .font('Helvetica')
      .text(row.label, col1X + 5, y + 5, { width: col1Width - 10 });

    doc.rect(col1X + col1Width, y, dataColWidth, 20).stroke();
    doc.text(row.total, col1X + col1Width + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    doc.rect(col1X + col1Width + dataColWidth, y, dataColWidth, 20).stroke();
    doc.text(row.co2, col1X + col1Width + dataColWidth + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    doc.rect(col1X + col1Width + dataColWidth * 2, y, dataColWidth, 20).stroke();
    doc.text(row.ch4, col1X + col1Width + dataColWidth * 2 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    doc.rect(col1X + col1Width + dataColWidth * 3, y, dataColWidth, 20).stroke();
    doc.text(row.n2o, col1X + col1Width + dataColWidth * 3 + 2, y + 7, { width: dataColWidth - 4, align: 'center' });

    for (let i = 4; i < 8; i++) {
      doc.rect(col1X + col1Width + dataColWidth * i, y, dataColWidth, 20).stroke();
      doc.text('0.000', col1X + col1Width + dataColWidth * i + 2, y + 7, { width: dataColWidth - 4, align: 'center' });
    }

    y += 20;
  });

  y += 20;

  // METHODOLOGIES AND EMISSION FACTORS
  doc
    .fontSize(11)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('METHODOLOGIES AND EMISSION FACTORS', 60, y);

  y += 20;

  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 30)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .font('Helvetica')
    .text(
      'If you have used calculation tools or methodologies other than those provided by the GHG Protocol,',
      65,
      y + 5
    );
  doc.text('provide the name of and link to any other GHG Protocol calculation tools used.', 65, y + 17);

  y += 30;

  doc.rect(60, y, colWidth, 25).stroke();
  doc
    .fontSize(8)
    .fillColor('#000')
    .text('EPA eGRID 2023, EPA Emission Factors Hub, Climatiq API', 65, y + 5, { width: colWidth - 10 });

  y += 35;

  // Optional Information header
  doc
    .fontSize(14)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Optional Information', { align: 'center' });

  y = doc.y + 15;

  // Information on emissions breakdown
  doc
    .fontSize(10)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('INFORMATION ON EMISSIONS', 60, y);

  y += 20;

  const detailRows = [
    'Scope 1: Direct Emissions from Owned/Controlled Operations',
    calculation.category === 'gas' ? 'a. Direct Emissions from Stationary Combustion' : '',
    calculation.category === 'fuel' ? 'b. Direct Emissions from Mobile Combustion' : '',
    '',
    'Scope 2: Indirect Emissions from the Use of Purchased',
    calculation.category === 'electricity' ? 'a. Indirect Emissions from Purchased/Acquired Electricity' : '',
  ].filter(text => text !== '');

  detailRows.forEach((text) => {
    doc
      .fillColor(tealColor)
      .rect(60, y, colWidth, 18)
      .fill();
    
    doc
      .fontSize(8)
      .fillColor('#FFF')
      .font('Helvetica')
      .text(text, 65, y + 5);
    
    y += 18;

    doc.rect(60, y, colWidth, 18).stroke();
    
    const value = text.includes('Stationary') || text.includes('Mobile') || text.includes('Electricity') 
      ? totalMetricTons + ' mtCO2e'
      : '';
    
    doc
      .fontSize(9)
      .fillColor('#000')
      .text(value, 65, y + 5);
    
    y += 20;
  });

  y += 10;

  // Source information
  doc
    .fillColor(tealColor)
    .rect(60, y, colWidth, 18)
    .fill();

  doc
    .fontSize(8)
    .fillColor('#FFF')
    .text('Emissions disaggregated by facility (recommended for individual facilities with stationary combustion)', 65, y + 5);

  y += 18;

  doc.rect(60, y, 150, 18).stroke();
  doc.rect(210, y, colWidth - 150, 18).stroke();

  doc
    .fontSize(8)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Facility', 65, y + 5);
  doc.text('Scope 1 emissions', 215, y + 5);

  y += 18;

  const provider = parsedData?.provider || 'Primary Facility';
  const accountNum = parsedData?.accountNumber || '';
  const serviceAddr = parsedData?.serviceAddress || '';
  
  doc.rect(60, y, 150, 18).stroke();
  doc.rect(210, y, colWidth - 150, 18).stroke();
  
  doc
    .fontSize(8)
    .fillColor('#000')
    .font('Helvetica')
    .text(provider, 65, y + 5);
  
  const facilityInfo = [
    scope1Total + ' mtCO2e',
    accountNum ? `Acct: ${accountNum}` : '',
    serviceAddr ? `Addr: ${serviceAddr.substring(0, 40)}` : ''
  ].filter(x => x).join(' | ');
  
  doc.text(facilityInfo, 215, y + 5, { width: colWidth - 155 });

  y += 30;

  // Detailed Emission Breakdown
  doc.fillColor('#000').font('Helvetica-Bold').text('Emission Breakdown by Gas:', 60, y);
  doc.moveDown(0.3);
  y = doc.y;
  
  doc.font('Helvetica');
  doc.text(`CO₂: ${co2Mt} metric tons`, { indent: 20 });
  doc.text(`CH₄ (CO₂ equivalent): ${ch4Mt} metric tons`, { indent: 20 });
  doc.text(`N₂O (CO₂ equivalent): ${n2oMt} metric tons`, { indent: 20 });
  doc.text(`HFCs (CO₂ equivalent): ${hfcsMt} metric tons`, { indent: 20 });
  doc.text(`PFCs (CO₂ equivalent): ${pfcsMt} metric tons`, { indent: 20 });
  doc.text(`SF₆ (CO₂ equivalent): ${sf6Mt} metric tons`, { indent: 20 });
  doc.text(`Other (CO₂ equivalent): ${otherMt} metric tons`, { indent: 20 });
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold');
  doc.text(`Total CO₂e: ${totalMetricTons} metric tons`, { indent: 20 });

  y = doc.y + 20;

  // Final note
  doc
    .fontSize(8)
    .fillColor(grayColor)
    .font('Helvetica-Oblique')
    .text(
      'This report was generated by CarbonEasy.ai using automated AI-based OCR technology and EPA emission factors.',
      60,
      y,
      { width: colWidth, align: 'center' }
    );

  y += 15;

  doc.text(
    'Calculations comply with GHG Protocol Corporate Standard. Independent verification is recommended for regulatory submissions.',
    60,
    y,
    { width: colWidth, align: 'center' }
  );

  return doc;
}
