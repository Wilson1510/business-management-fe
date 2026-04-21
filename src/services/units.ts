import { apiFetch } from './api';
import type { Metadata } from '../utils/metadata';

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
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function getUnit(id: number): Promise<UnitDetail> {
  const response = await apiFetch(`/api/units/${id}/`)
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function createUnit(payload: UnitCreate): Promise<UnitDetail> {
  const response = await apiFetch('/api/units/', { method: 'POST', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function updateUnit(id: number, payload: UnitUpdate): Promise<UnitDetail> {
  const response = await apiFetch(`/api/units/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function deleteUnit(id: number): Promise<void> {
  const response = await apiFetch(`/api/units/${id}/`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(response.statusText)
  }
}