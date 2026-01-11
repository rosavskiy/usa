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
  const periodStart = calculation.period_start ? new Date(calculation.period_start).toLocaleDateString('ru-RU') : '-';
  const periodEnd = calculation.period_end ? new Date(calculation.period_end).toLocaleDateString('ru-RU') : '-';
  const reportDate = new Date().toLocaleDateString('ru-RU');

  // ==================== PAGE 1: TITLE PAGE ====================
  doc.fontSize(32).font('Helvetica-Bold')
     .fillColor('#2C5F2D')
     .text('CarbonEasy.ai', { align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(24).fillColor('#000')
     .text('Отчёт по углеродным выбросам', { align: 'center' });
  doc.fontSize(18).fillColor('#666')
     .text('Carbon Footprint Report', { align: 'center' });

  doc.moveDown(3);
  doc.fontSize(14).fillColor('#000').font('Helvetica')
     .text(`Для: ${companyName}`, { align: 'center' });
  
  doc.moveDown(1);
  doc.fontSize(12).fillColor('#666')
     .text(`Период: ${periodStart} — ${periodEnd}`, { align: 'center' });
  
  doc.moveDown(0.5);
  doc.text(`Дата отчёта: ${reportDate}`, { align: 'center' });
  
  doc.moveDown(0.5);
  doc.fillColor('#2C5F2D')
     .text('Подготовлено: CarbonEasy.ai (AI-инструмент)', { align: 'center' });

  doc.moveDown(8);
  doc.fontSize(10).fillColor('#999')
     .text('Версия 1.0', { align: 'center' });

  // ==================== PAGE 2: EXECUTIVE SUMMARY ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Краткое резюме', { underline: true });
  doc.fontSize(16).fillColor('#666').font('Helvetica')
     .text('Executive Summary');

  doc.moveDown(1);

  const totalCO2e = Number(calculation.total_co2e_kg).toFixed(2);
  const co2 = Number(calculation.co2_kg).toFixed(2);
  const ch4 = Number(calculation.ch4_kg).toFixed(3);
  const n2o = Number(calculation.n2o_kg).toFixed(3);

  doc.fontSize(14).fillColor('#000').font('Helvetica-Bold')
     .text(`Общий объём выбросов: ${totalCO2e} кг CO₂e`, { continued: false });

  doc.moveDown(0.5);

  // Scope breakdown
  const scopeLabel = getScopeLabel(calculation.emission_type);
  const categoryLabel = getCategoryLabel(calculation.category);
  
  doc.fontSize(12).font('Helvetica')
     .fillColor('#000')
     .text(`• ${scopeLabel}: ${categoryLabel}`, { indent: 20 });

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Детализация выбросов:', { underline: true });
  
  doc.moveDown(0.5);
  doc.font('Helvetica').fillColor('#000')
     .text(`CO₂: ${co2} кг`, { indent: 20 })
     .text(`CH₄ (эквивалент): ${ch4} кг`, { indent: 20 })
     .text(`N₂O (эквивалент): ${n2o} кг`, { indent: 20 });

  doc.moveDown(1);

  // Consumption info
  if (parsedData?.consumption) {
    doc.font('Helvetica-Bold').fillColor('#2C5F2D')
       .text('Потребление:', { underline: true });
    
    doc.moveDown(0.5);
    doc.font('Helvetica').fillColor('#000')
       .text(`${parsedData.consumption.value.toLocaleString()} ${parsedData.consumption.unit}`, { indent: 20 });
    
    if (parsedData.provider) {
      doc.text(`Поставщик: ${parsedData.provider}`, { indent: 20 });
    }
    if (parsedData.state) {
      doc.text(`Регион: ${parsedData.state}`, { indent: 20 });
    }
  }

  // ==================== PAGE 3: DETAILED BREAKDOWN ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Детализация по Scope', { underline: true });

  doc.moveDown(1);

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000')
     .text(`${scopeLabel} — ${categoryLabel}`);

  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica').fillColor('#666')
     .text(getScopeDescription(calculation.emission_type));

  doc.moveDown(1);

  // Calculation details
  doc.fillColor('#000');
  
  if (calculation.category === 'electricity') {
    const consumption = parsedData?.consumption?.value || 0;
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text(`Потребление электроэнергии: ${consumption.toLocaleString()} кВт·ч`, { indent: 20 });
    doc.text(`Коэффициент эмиссии: ${factor.toFixed(3)} кг CO₂e/кВт·ч`, { indent: 20 });
    doc.text(`Регион: ${parsedData?.state || 'США (средний)'}`, { indent: 20 });
  } else if (calculation.category === 'gas') {
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || 'therms';
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text(`Потребление газа: ${consumption.toLocaleString()} ${unit}`, { indent: 20 });
    doc.text(`Коэффициент эмиссии: ${factor.toFixed(3)} кг CO₂e/${unit}`, { indent: 20 });
  } else if (calculation.category === 'fuel') {
    const consumption = parsedData?.consumption?.value || 0;
    const unit = parsedData?.consumption?.unit || 'gallons';
    const factor = calculation.total_co2e_kg / consumption;
    
    doc.text(`Потребление топлива: ${consumption.toLocaleString()} ${unit}`, { indent: 20 });
    doc.text(`Коэффициент эмиссии: ${factor.toFixed(3)} кг CO₂e/${unit}`, { indent: 20 });
  }

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#2C5F2D')
     .text(`Итого ${scopeLabel}: ${totalCO2e} кг CO₂e`);

  // ==================== PAGE 4: METHODOLOGY ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Методология и источники данных', { underline: true });

  doc.moveDown(1);

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000')
     .text('Методология расчёта:');
  
  doc.moveDown(0.5);
  doc.font('Helvetica').fillColor('#666')
     .text('Расчёты выполнены в соответствии с протоколом GHG Protocol (Greenhouse Gas Protocol) для категорий Scope 1, Scope 2 и Scope 3.', { indent: 20, align: 'justify' });

  doc.moveDown(1);
  doc.font('Helvetica-Bold').fillColor('#000')
     .text('Источники коэффициентов эмиссии:');
  
  doc.moveDown(0.5);
  doc.font('Helvetica').fillColor('#666')
     .text('• EPA eGRID 2023 — для электроэнергии (США, региональные факторы)', { indent: 20 })
     .text('• EPA Emission Factors — для природного газа и топлива', { indent: 20 })
     .text('• Climatiq Database — для дополнительных источников (по регионам)', { indent: 20 });

  doc.moveDown(2);
  doc.fontSize(10).fillColor('#999')
     .text('Disclaimer: Отчёт подготовлен с использованием AI-инструмента CarbonEasy.ai. Не является юридической консультацией. Рекомендуется проверка сертифицированным специалистом по углеродной отчётности.', { align: 'justify' });

  // ==================== PAGE 5: SIGNATURE ====================
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#2C5F2D')
     .text('Подпись и дата', { underline: true });

  doc.moveDown(2);

  doc.fontSize(12).font('Helvetica').fillColor('#000')
     .text('Сгенерировано автоматически системой CarbonEasy.ai');
  
  doc.moveDown(0.5);
  doc.fillColor('#2C5F2D')
     .text(`Дата: ${reportDate}`);
  
  doc.moveDown(0.5);
  doc.fillColor('#666')
     .text('Версия: 1.0');

  doc.moveDown(3);
  doc.fontSize(10).fillColor('#999')
     .text('Для вопросов и уточнений обращайтесь к специалистам по устойчивому развитию.', { align: 'center' });

  return doc;
}

function getScopeLabel(emissionType: string): string {
  switch (emissionType) {
    case 'scope1': return 'Scope 1 (Прямые выбросы)';
    case 'scope2': return 'Scope 2 (Косвенные от энергии)';
    case 'scope3': return 'Scope 3 (Другие косвенные)';
    default: return 'Unknown Scope';
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'electricity': return 'Электричество';
    case 'gas': return 'Природный газ';
    case 'fuel': return 'Топливо';
    default: return category;
  }
}

function getScopeDescription(emissionType: string): string {
  switch (emissionType) {
    case 'scope1':
      return 'Прямые выбросы парниковых газов от источников, принадлежащих или контролируемых компанией (топливо, газ, транспорт).';
    case 'scope2':
      return 'Косвенные выбросы от производства приобретённой электроэнергии, тепла или пара.';
    case 'scope3':
      return 'Другие косвенные выбросы в цепочке создания стоимости (поставщики, командировки, отходы).';
    default:
      return '';
  }
}
