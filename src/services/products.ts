import { apiFetch } from './api'
import type { Metadata } from '../utils/metadata';

interface BaseProduct extends Metadata {
  name: string;
  sku_number: string;
  category: {
    id: number;
    name: string;
  };
  base_price: number;
  quantity: number;
}

export interface ProductListItem extends BaseProduct {
  price: number;
  unit: string;
}

export interface ProductDetail extends BaseProduct {
  prices: {
    id: number;
    price: number;
    minimum_quantity: number;
    unit: {
      id: number;
      name: string;
    };
  }[];
  units: {
    id: number;
    unit: {
      id: number;
      name: string;
    };
    multiplier: number;
    is_base_unit: boolean;
  }[];
}

export type ProductList = ProductListItem[];

export interface ProductUnit {
  unit_id: number;
  multiplier: number;
  is_base_unit: boolean;
}

export interface ProductPrice {
  unit_id: number;
  minimum_quantity: number;
  price: number;
}

export interface ProductCreate {
  name: string;
  category_id: number;
  units: ProductUnit[];
  prices: ProductPrice[];
}

export type ProductUpdate = Partial<ProductCreate>;

export async function getProducts(): Promise<ProductList> {
  const response = await apiFetch('/api/products/')
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function getProduct(id: number): Promise<ProductDetail> {
  const response = await apiFetch(`/api/products/${id}/`)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function createProduct(payload: ProductCreate): Promise<ProductDetail> {
  const response = await apiFetch('/api/products/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function updateProduct(id: number, payload: ProductUpdate): Promise<ProductDetail> {
  const response = await apiFetch(`/api/products/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await apiFetch(`/api/products/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
}