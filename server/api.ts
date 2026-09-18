import { Express, Request, Response } from 'express';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini client lazily on demand
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Invoice extraction schema
const invoiceExtractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    invoiceDate: {
      type: Type.STRING,
      description: 'The date of the invoice in YYYY-MM-DD format if detectable, otherwise null',
      nullable: true,
    },
    odometer: {
      type: Type.NUMBER,
      description: 'Vehicle odometer/mileage reading at time of service in kilometers, otherwise null',
      nullable: true,
    },
    workshopName: {
      type: Type.STRING,
      description: 'Name of the workshop, auto service center, mechanic or dealer',
      nullable: true,
    },
    services: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of maintenance/service operations performed (e.g., Oil Change, Brake Pad Replacement, Inspection)',
    },
    parts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'List of spare parts or fluids used/replaced (e.g., Synthetic Oil 5W30, Oil Filter, Front Ceramic Brake Pads)',
    },
    totalCost: {
      type: Type.NUMBER,
      description: 'Total final invoice amount including tax/VAT if listed',
      nullable: true,
    },
    currency: {
      type: Type.STRING,
      description: 'Currency code or symbol detected (e.g. SAR, USD, AED, EUR, etc.)',
      nullable: true,
    },
    notes: {
      type: Type.STRING,
      description: 'Any warranty details, technician advice, next service recommendations, or invoice number',
      nullable: true,
    },
    confidenceScore: {
      type: Type.NUMBER,
      description: 'Confidence score from 0.0 to 1.0 about invoice readability and extraction accuracy',
    }
  },
  required: ['services', 'parts'],
};

export function setupApiRoutes(app: Express) {
  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'sijil-api',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // Analyze invoice endpoint (server-side Gemini 2.5 flash)
  app.post('/api/analyze-invoice', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType, vehicleDetails } = req.body;

      if (!imageBase64) {
        return res.status(400).json({
          error: 'يرجى إرفاق صورة أو مستند الفاتورة (imageBase64 مطلوب)',
        });
      }

      // Check Gemini API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          error: 'مفتاح Gemini API غير مهيأ على الخادم. يرجى تفعيله من إعدادات البيئة.',
        });
      }

      const client = getGeminiClient();

      // Clean base64 data prefix if present (e.g., data:image/jpeg;base64,...)
      const cleanedBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      const validMimeType = mimeType || 'image/jpeg';

      const prompt = `أنت خبير فحص وتحليل فواتير صيانة السيارات في المملكة والخليج العربي والعالم.
مهمتك استخراج البيانات المنظمة والدقيقة من فاتورة صيانة السيارة المرفقة.

تفاصيل سيارة العميل الحالية إن توفرت للمساعدة في التحقق: ${vehicleDetails || 'غير محددة'}.

تعليمات صارمة:
1. لا تخترع بيانات غير موجودة. إذا كانت أي معلومة غير واضحة تماماً في الفاتورة اجعل قيمتها null.
2. استخرج:
   - invoiceDate: تاريخ الفاتورة بصيغة YYYY-MM-DD إن وجد.
   - odometer: قراءة عداد الكيلومترات (أرقام فقط بدون أحرف أو فواصل).
   - workshopName: اسم الورشة أو مركز الصيانة أو الوكالة.
   - services: قائمة بالأعمال والخدمات المنجزة (مثل: تغيير زيت وفلتر، وزن أذرعة، فحص كمبيوتر).
   - parts: قطع الغيار والمواد المستخدمة (مثل: زيت ماكينة 5W-30، فحمات فرامل أمامية، فلتر هواء).
   - totalCost: التكلفة الإجمالية للفاتورة رقماً (Total / المجموع مع الضريبة).
   - currency: العملة (مثل: SAR, AED, USD, KWD أو ر.س).
   - notes: أي ملاحظات هامة، رقم الفاتورة، أو توصيات الصيانة القادمة أو فترة الضمان المكتوبة.
   - confidenceScore: تقييم لمدى وضوح وجودة الفاتورة واستخراج البيانات من 0.0 إلى 1.0.
3. إذا كانت الصورة غير واضحة تماماً أو ليست فاتورة صيانة سيارة، اجعل services و parts فارغين، واجعل confidenceScore أقل من 0.3 واذكر ذلك في notes.`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanedBase64,
                  mimeType: validMimeType,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: invoiceExtractionSchema,
          temperature: 0.1, // low temperature for deterministic and accurate invoice extraction
        },
      });

      const responseText = response.text;
      if (!responseText) {
        return res.status(500).json({
          error: 'لم يتمكن الذكاء الاصطناعي من قراءة محتوى الفاتورة. يرجى تجربة صورة أوضح.',
        });
      }

      const extractedData = JSON.parse(responseText);

      return res.json({
        success: true,
        data: extractedData,
      });
    } catch (err: any) {
      console.error('Invoice analysis error:', err);
      return res.status(500).json({
        error: err.message || 'حدث خطأ غير متوقع أثناء تحليل الفاتورة عبر الذكاء الاصطناعي.',
      });
    }
  });
}
