import { apiFetch } from './api';
import type { Metadata } from '../utils/metadata';
import { handleCommonErrors } from '../utils/errorHandling';

type BusinessEntity = 'pt' | 'cv' | 'perorangan' | 'ud' | 'lainnya';

interface BaseSupplier extends Metadata {
  name: string;
  business_entity: BusinessEntity;
  email: string;
  phone: string;
  address: string;
}

export interface SupplierCreate {
  name: string;
  business_entity: BusinessEntity;
  email: string;
  phone: string;
  address: string;
}

export type SupplierUpdate = Partial<SupplierCreate>;

export interface SupplierListItem extends BaseSupplier {
  count_purchase_orders: number;
  last_purchase_order_date: string | null;
  total_purchase_amount: number;
}
export type SupplierList = SupplierListItem[];
export type SupplierDetail = BaseSupplier;

export async function getSuppliers(): Promise<SupplierList> {
  const response = await apiFetch('/api/suppliers/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getSupplier(id: number): Promise<SupplierDetail> {
  const response = await apiFetch(`/api/suppliers/${id}/`)
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function createSupplier(payload: SupplierCreate): Promise<SupplierDetail> {
  const response = await apiFetch('/api/suppliers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function updateSupplier(id: number, payload: SupplierUpdate): Promise<SupplierDetail> {
  const response = await apiFetch(`/api/suppliers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function deleteSupplier(id: number): Promise<void> {
  const response = await apiFetch(`/api/suppliers/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    await handleCommonErrors(response)
  }
}