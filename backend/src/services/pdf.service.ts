import PDFDocument from 'pdfkit';
import { CarbonModel } from '../models/carbon.model';
import { DocumentModel } from '../models/document.model';
import { UserModel } from '../models/user.model';

export async function generateCarbonReport(calculationId: number, userId: number): Promise<typeof PDFDocument> {
  // Get calculation data
  const calculation = await CarbonModel.findById(calculationId);
  if (!calculation || calculation.user_id !== userId) {
    throw new Error('Calculation not found');
  }

  // Get document data
  const document = await DocumentModel.findById(calculation.document_id);
  
  // Get user data
  const user = await UserModel.findById(userId);

  // Create PDF document
  const doc = new PDFDocument({ 
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const companyName = user?.company_name || user?.email || 'Client';
  const parsedData = typeof document?.parsed_data === 'string' 
    ? JSON.parse(document.parsed_data) 
    : document?.parsed_data;

  // Format dates
  const periodStart = calculation.period_start ? new Date(calculation.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const periodEnd = calculation.period_end ? new Date(calculation.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
  const reportDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // ==================== PAGE 1: TITLE PAGE ====================
  doc.fontSize(32).font('Helvetica-Bold')
     .fillColor('#2C5F2D')
     .text('CarbonEasy.ai', { align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(24).fillColor('#000')
     .text('Carbon Footprint Report', { align: 'center' });

  doc.moveDown(3);
  doc.fontSize(14).fillColor('#000').font('Helvetica')
     .text(`For: ${companyName}`, { align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(12).fillColor('#666')
     .text(`Period: ${periodStart} - ${periodEnd}`, { align: 'center' });
  
  doc.moveDown(0.5);
  doc.text(`Report Date: ${reportDate}`, { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fillColor('#2C5F2D')
     .text('Prepared by: CarbonEasy.ai (AI-powered tool)', { align: 'center' });

  doc.moveDown(8);
  doc.fontSize(10).fillColor('#999')
     .text('Version 1.0', { align: 'center' });

  // ==================== PAGE 2: EXECUTIVE SUMMARY ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Executive Summary', { underline: true });

  doc.moveDown(1);

  const totalCO2e = Number(calculation.total_co2e_kg).toFixed(2);
  const co2 = Number(calculation.co2_kg).toFixed(2);
  const ch4 = Number(calculation.ch4_kg).toFixed(3);
  const n2o = Number(calculation.n2o_kg).toFixed(3);

  doc.fontSize(14).fillColor('#000').font('Helvetica-Bold')
     .text(`Total Emissions: ${totalCO2e} kg CO2e`, { continued: false });

  doc.moveDown(0.5);

  // Scope breakdown
  const scopeLabel = getScopeLabel(calculation.emission_type);
  const categoryLabel = getCategoryLabel(calculation.category);
  
  doc.fontSize(12).font('Helvetica')
     .fillColor('#000')
     .text(`- ${scopeLabel}: ${categoryLabel}`, { indent: 20 });

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Emissions Breakdown:', { underline: true });
  
  doc.moveDown(0.5);
  doc.font('Helvetica').fillColor('#000')
     .text(`CO2: ${co2} kg`, { indent: 20 })
     .text(`CH4 (equivalent): ${ch4} kg`, { indent: 20 })
     .text(`N2O (equivalent): ${n2o} kg`, { indent: 20 });

  doc.moveDown(1);

  // Consumption info
  if (parsedData?.consumption) {
    doc.font('Helvetica-Bold').fillColor('#2C5F2D')
       .text('Consumption:', { underline: true });
    
    doc.moveDown(0.5);
    doc.font('Helvetica').fillColor('#000')
       .text(`${parsedData.consumption.value.toLocaleString()} ${parsedData.consumption.unit}`, { indent: 20 });
    
    if (parsedData.provider) {
      doc.text(`Provider: ${parsedData.provider}`, { indent: 20 });
    }
    if (parsedData.state) {
      doc.text(`Region: ${parsedData.state}`, { indent: 20 });
    }
  }

  // ==================== PAGE 3: DETAILED BREAKDOWN ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Scope Breakdown', { underline: true });

  doc.moveDown(1);

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000')
     .text(`${scopeLabel} - ${categoryLabel}`);

  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').fillColor('#666')
     .text(getScopeDescription(calculation.emission_type));

  doc.moveDown(1);

  // Calculation details
  doc.fillColor('#000');
  
  if (calculation.category === 'electricity') {
    const consumption = parsedData?.consumption?.value || 0;
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text(`Electricity Consumption: ${consumption.toLocaleString()} kWh`, { indent: 20 });
    doc.text(`Emission Factor: ${factor.toFixed(3)} kg CO2e/kWh`, { indent: 20 });
    doc.text(`Region: ${parsedData?.state || 'US (average)'}`, { indent: 20 });
  } else if (calculation.category === 'gas') {
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || 'therms';
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text(`Natural Gas Consumption: ${consumption.toLocaleString()} ${unit}`, { indent: 20 });
    doc.text(`Emission Factor: ${factor.toFixed(3)} kg CO2e/${unit}`, { indent: 20 });
  } else if (calculation.category === 'fuel') {
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || 'gallons';
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text(`Fuel Consumption: ${consumption.toLocaleString()} ${unit}`, { indent: 20 });
    doc.text(`Emission Factor: ${factor.toFixed(3)} kg CO2e/${unit}`, { indent: 20 });
  }

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#2C5F2D')
     .text(`Total ${scopeLabel}: ${totalCO2e} kg CO2e`);

  // ==================== PAGE 4: METHODOLOGY ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Methodology & Data Sources', { underline: true });

  doc.moveDown(1);

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000')
     .text('Calculation Methodology:');
  
  doc.moveDown(0.5);
  doc.font('Helvetica').fillColor('#666')
     .text('Calculations performed in accordance with the GHG Protocol (Greenhouse Gas Protocol) for Scope 1, Scope 2, and Scope 3 categories.', { indent: 20, align: 'justify' });

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fillColor('#000')
     .text('Emission Factor Sources:');
  
  doc.moveDown(0.5);
  doc.font('Helvetica').fillColor('#666')
     .text('- EPA eGRID 2023 for electricity (US regional factors)', { indent: 20 })
     .text('- EPA Emission Factors for natural gas and fuel', { indent: 20 })
     .text('- Climatiq Database for additional sources (regional)', { indent: 20 });

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#999')
     .text('Disclaimer: This report is prepared using the CarbonEasy.ai AI-powered tool. It does not constitute legal or professional advice. Verification by a certified carbon accounting specialist is recommended.', { align: 'justify' });

  // ==================== PAGE 5: SIGNATURE ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Signature & Date', { underline: true });

  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica').fillColor('#000')
     .text('Automatically generated by CarbonEasy.ai system');
  
  doc.moveDown(0.5);
  doc.fillColor('#2C5F2D')
     .text(`Date: ${reportDate}`);
  
  doc.moveDown(0.5);
  doc.fillColor('#666')
     .text('Version: 1.0');

  doc.moveDown(3);
  doc.fontSize(10).fillColor('#999')
     .text('For questions and clarifications, please consult with sustainability specialists.', { align: 'center' });

  return doc;
}

function getScopeLabel(emissionType: string): string {
  switch (emissionType) {
    case 'scope1': return 'Scope 1 (Direct Emissions)';
    case 'scope2': return 'Scope 2 (Indirect from Energy)';
    case 'scope3': return 'Scope 3 (Other Indirect)';
    default: return 'Unknown Scope';
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'electricity': return 'Electricity';
    case 'gas': return 'Natural Gas';
    case 'fuel': return 'Fuel';
    default: return category;
  }
}

function getScopeDescription(emissionType: string): string {
  switch (emissionType) {
    case 'scope1':
      return 'Direct greenhouse gas emissions from sources owned or controlled by the company (fuel, gas, transportation).';
    case 'scope2':
      return 'Indirect emissions from purchased electricity, heat, or steam.';
    case 'scope3':
      return 'Other indirect emissions in the value chain (suppliers, business travel, waste).';
    default:
      return '';
  }
}
