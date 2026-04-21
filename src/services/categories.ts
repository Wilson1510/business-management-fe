import { apiFetch } from './api';
import type { Metadata } from '../utils/metadata';

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
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function getCategory(id: number): Promise<CategoryDetail> {
  const response = await apiFetch(`/api/categories/${id}/`)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function createCategory(payload: CategoryCreate): Promise<CategoryDetail> {
  const response = await apiFetch('/api/categories/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function updateCategory(id: number, payload: CategoryUpdate): Promise<CategoryDetail> {
  const response = await apiFetch(`/api/categories/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function deleteCategory(id: number): Promise<void> {
  const response = await apiFetch(`/api/categories/${id}/`, { method: 'DELETE' });
  console.log(response)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
}