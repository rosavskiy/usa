import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentModel } from '../models/document.model';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function parseDocumentWithAI(documentId: number, filePath: string) {
  try {
    // Update status to processing
    await DocumentModel.updateParsedData(documentId, {}, 'processing');

    // Read file as base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = filePath.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

    // Get Gemini model with vision support
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Parse this utility bill/receipt and extract the following information in JSON format:
{
  "type": "electricity|gas|fuel|supplies|other",
  "provider": "company name",
  "date": "YYYY-MM-DD",
  "amount": number (total cost),
  "consumption": {
    "value": number,
    "unit": "kWh|gallons|liters|etc"
  },
  "period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  }
}
Only return valid JSON, no additional text.`;

    // Call Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini might wrap it in markdown)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    const parsedData = JSON.parse(jsonText);

    // Save parsed data
    await DocumentModel.updateParsedData(documentId, parsedData, 'completed');

    return parsedData;
  } catch (error) {
    console.error('AI parsing error:', error);
    await DocumentModel.updateParsedData(documentId, { error: String(error) }, 'failed');
    throw error;
  }
}
