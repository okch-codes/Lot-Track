import { GoogleGenerativeAI } from '@google/generative-ai';

export interface InvoiceItem {
  name: string;
  price_cents: number;
  vat_rate: number;
  unit: string;
  package_size: number;
}

const PROMPT = `You are an invoice data extractor for a food production business.
Extract ingredient line items from this invoice. For each item return:
- name: the ingredient/product name (in the original language)
- price_cents: the total price in euro cents (e.g. 12.50€ = 1250)
- vat_rate: the VAT percentage as integer (4, 10, or 22)
- unit: the measurement unit (kg, g, L, mL, or pz)
- package_size: the quantity/weight per package in the given unit

Return ONLY a JSON array of objects. No markdown, no explanation. Example:
[{"name":"Farina 00","price_cents":850,"vat_rate":4,"unit":"kg","package_size":25}]

If you cannot extract data, return an empty array: []`;

export async function scanInvoice(imageBase64: string, mediaType: string): Promise<InvoiceItem[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType,
        data: imageBase64,
      },
    },
    { text: PROMPT },
  ]);

  const text = result.response.text();

  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const items = JSON.parse(cleaned);
    if (!Array.isArray(items)) return [];
    return items.map((item: any) => ({
      name: String(item.name || ''),
      price_cents: Math.round(Number(item.price_cents) || 0),
      vat_rate: Number(item.vat_rate) || 0,
      unit: String(item.unit || ''),
      package_size: Number(item.package_size) || 0,
    }));
  } catch {
    return [];
  }
}
