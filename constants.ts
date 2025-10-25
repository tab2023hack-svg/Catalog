
import { Size, PdfTheme } from './types';

export const AVAILABLE_SIZES: Size[] = ['M', 'L', 'XL', '2XL', '3XL'];

export const PDF_THEMES = [
  { id: PdfTheme.SIMPLE, name: 'بسيط' },
  { id: PdfTheme.MODERATE, name: 'معتدل' },
  { id: PdfTheme.FANCY, name: 'فخم' },
];