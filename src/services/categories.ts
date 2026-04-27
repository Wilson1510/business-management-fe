import { apiFetch } from './api';
import type { Metadata } from '../utils/metadata';
import { handleCommonErrors } from '../utils/errorHandling';

interface BaseCategory extends Metadata {
  name: string;
}

export interface CategoryCreate {
  name: string;
}

export type CategoryUpdate = Partial<CategoryCreate>;

export type CategoryListItem = BaseCategory;
export type CategoryList = CategoryListItem[];
export type CategoryDetail = BaseCategory;

export async function getCategories(): Promise<CategoryList> {
  const response = await apiFetch('/api/categories/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getCategory(id: number): Promise<CategoryDetail> {
  const response = await apiFetch(`/api/categories/${id}/`)
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function createCategory(payload: CategoryCreate): Promise<CategoryDetail> {
  const response = await apiFetch('/api/categories/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "unique") {
        throw new Error(`Kategori dengan nama '${payload.name}' sudah ada`);
      }
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function updateCategory(id: number, payload: CategoryUpdate): Promise<CategoryDetail> {
  const response = await apiFetch(`/api/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "unique") {
        throw new Error(`Kategori dengan nama '${payload.name}' sudah ada`);
      }
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await apiFetch(`/api/categories/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "has_references") {
        throw new Error("Kategori ini masih digunakan oleh produk");
      }
    }
    await handleCommonErrors(response)
  }
}