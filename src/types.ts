export interface ProductImage {
  id: string;
  url: string;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
}

export interface CustomField {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  customFields: CustomField[];
  images?: ProductImage[];
}
