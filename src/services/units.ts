import { apiFetch } from './api';
import type { Metadata } from '../utils/metadata';
import { handleCommonErrors } from '../utils/errorHandling'

interface BaseUnit extends Metadata {
  name: string;
}

export interface UnitCreate {
  name: string;
}

export type UnitUpdate = Partial<UnitCreate>;

export type UnitListItem = BaseUnit;
export type UnitList = UnitListItem[];
export type UnitDetail = BaseUnit;

export async function getUnits(): Promise<UnitList> {
  const response = await apiFetch('/api/units/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getUnit(id: number): Promise<UnitDetail> {
  const response = await apiFetch(`/api/units/${id}/`)
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function createUnit(payload: UnitCreate): Promise<UnitDetail> {
  const response = await apiFetch('/api/units/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "unique") {
        throw new Error(`Satuan dengan nama '${payload.name}' sudah ada`);
      }
    }
    else if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk membuat satuan");
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function updateUnit(id: number, payload: UnitUpdate): Promise<UnitDetail> {
  const response = await apiFetch(`/api/units/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "unique") {
        throw new Error(`Satuan dengan nama '${payload.name}' sudah ada`);
      }
    }
    else if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk memperbarui satuan");
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function deleteUnit(id: number): Promise<void> {
  const response = await apiFetch(`/api/units/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "has_references") {
        throw new Error("Satuan ini masih digunakan oleh penjualan atau pembelian");
      }
    }
    else if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk menghapus satuan");
    }
    await handleCommonErrors(response)
  }
}