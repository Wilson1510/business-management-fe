import { apiFetch } from './api'
import type { Metadata } from '../utils/metadata';
import { handleCommonErrors } from '../utils/errorHandling'

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
  id?: number;
  unit_id: number;
  multiplier: number;
  is_base_unit: boolean;
}

export interface ProductPrice {
  id?: number;
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

async function handleProductErrors(response: Response): Promise<never> {
  const errorData = await response.clone().json().catch(() => null);
  if (errorData) {
    switch (errorData.code) {
      case 'duplicate_unit_in_payload':
        throw new Error('Tidak boleh ada produk yang memiliki unit yang sama lebih dari satu');
      case 'duplicate_price_in_payload':
        throw new Error(
          'Tidak boleh ada produk yang memiliki unit dan kuantitas minimal yang sama lebih dari satu'
        );
    }
  }
  return handleCommonErrors(response);
}

export async function getProducts(): Promise<ProductList> {
  const response = await apiFetch('/api/products/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getProduct(id: number): Promise<ProductDetail> {
  const response = await apiFetch(`/api/products/${id}/`)
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Produk tidak ditemukan');
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function createProduct(payload: ProductCreate): Promise<ProductDetail> {
  const response = await apiFetch('/api/products/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    await handleProductErrors(response)
  }
  return response.json()
}

export async function updateProduct(id: number, payload: ProductUpdate): Promise<ProductDetail> {
  const response = await apiFetch(`/api/products/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    await handleProductErrors(response)
  }
  return response.json()
}

export async function deleteProduct(id: number): Promise<void> {
  const response = await apiFetch(`/api/products/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "product_has_references") {
        throw new Error("Produk ini masih digunakan oleh sales order atau purchase order");
      }
    }

    await handleCommonErrors(response)
  }
}