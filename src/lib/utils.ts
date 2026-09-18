import { Vehicle, MaintenanceRecord, Reminder, Language } from '../types';
import { translations } from './translations';

export const formatNumber = (val: number, lang: Language): string => {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(val);
};

export const formatCurrency = (val: number, currency: string = 'SAR', lang: Language): string => {
  const formatted = formatNumber(val, lang);
  if (lang === 'ar') {
    if (currency === 'SAR' || currency === 'ر.س') return `${formatted} ر.س`;
    return `${formatted} ${currency}`;
  }
  return `${currency} ${formatted}`;
};

export const formatDate = (dateStr: string, lang: Language): string => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const getDaysRemaining = (dueDateStr?: string): number | null => {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getKmRemaining = (dueMileage?: number, currentMileage?: number): number | null => {
  if (!dueMileage || !currentMileage) return null;
  return dueMileage - currentMileage;
};

export const compressImageIfNeeded = async (file: File, maxWidth = 1600, quality = 0.82): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    // If it's a PDF, read as data url
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          base64: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ base64: e.target?.result as string, mimeType: file.type });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64: dataUrl,
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
