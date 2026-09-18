export type Language = 'ar' | 'en';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  preferredLanguage?: Language;
}

export interface Vehicle {
  id: string;
  userId: string;
  make: string; // الصانع (Toyota, GMC, Ford...)
  model: string; // الموديل (Land Cruiser, Yukon, Camry...)
  year: number; // سنة الصنع
  currentOdometer: number; // قراءة العداد الحالية كم
  nickname?: string; // الاسم المخصص أو اللوحة
  vin?: string; // رقم الهيكل (اختياري)
  plateNumber?: string; // رقم اللوحة
  color?: string; // اللون
  fuelType?: string; // بنزين، ديزل، هجين، كهرباء
  createdAt: string;
  updatedAt: string;
}

export type ServiceType = 
  | 'oil_filter' // تغيير زيت وفلتر
  | 'brakes' // فرامل وفحمات
  | 'tires' // إطارات وميزان
  | 'battery' // بطارية وكهرباء
  | 'major_service' // صيانة دورية شاملة
  | 'transmission' // ناقل الحركة / القير
  | 'suspension' // مساعدات ونظام تعليق
  | 'ac_cooling' // تكييف وتبريد
  | 'spark_plugs' // بواجي وفلاتر هواء
  | 'body_paint' // سمكرة ودهان
  | 'inspection' // فحص فني / فحص دوري
  | 'other'; // أخرى

export interface MaintenanceRecord {
  id: string;
  userId: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  odometer: number; // قراءة العداد عند الصيانة
  serviceType: ServiceType;
  description: string;
  parts: string[]; // قائمة قطع الغيار
  cost: number; // التكلفة الإجمالية
  currency: string; // SAR, AED, USD ...
  workshop: string; // اسم المركز / الورشة
  notes?: string;
  documentUrl?: string; // رابط أو Base64 لصورة الفاتورة
  documentName?: string;
  isAiExtracted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleDocument {
  id: string;
  userId: string;
  vehicleId: string;
  title: string;
  category: 'invoice' | 'insurance' | 'registration' | 'inspection' | 'warranty' | 'other';
  documentDate?: string;
  fileData?: string; // Base64 data url
  fileName: string;
  fileSize?: number;
  mimeType: string;
  notes?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  vehicleId: string;
  service: string; // اسم الخدمة المطلوبة
  serviceType: ServiceType;
  dueDate?: string; // تاريخ الاستحقاق YYYY-MM-DD
  dueMileage?: number; // عداد الاستحقاق كم
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface AiExtractedInvoice {
  invoiceDate: string | null;
  odometer: number | null;
  workshopName: string | null;
  services: string[];
  parts: string[];
  totalCost: number | null;
  currency: string | null;
  notes: string | null;
  confidenceScore?: number;
}
