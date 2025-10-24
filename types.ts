
export type Size = 'M' | 'L' | 'XL' | '2XL';

export interface Color {
  id: string;
  name: string;
  hex: string;
}

export interface ProductImage {
  id: string;
  src?: string; // This is a temporary ObjectURL for UI previews, not persisted in localStorage
  alt: string;
  isCover: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  sizes: Size[];
  colors: Color[];
  images: ProductImage[];
  notes?: string;
}

export interface ProjectData {
  projectName: string;
  createdAt: string;
  products: Product[];
  colors: Color[];
}

export enum PdfTheme {
    SIMPLE = 'simple',
    MODERATE = 'moderate',
    FANCY = 'fancy',
}
