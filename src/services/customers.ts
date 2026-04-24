import { apiFetch } from './api';
import type { Metadata } from '../utils/metadata';
import { handleCommonErrors } from '../utils/errorHandling';

interface BaseCustomer extends Metadata {
  name: string;
  business_entity: string;
  email: string;
  phone: string;
  address: string;
}

export interface CustomerCreate {
  name: string;
  business_entity: string;
  email: string;
  phone: string;
  address: string;
}

export type CustomerUpdate = Partial<CustomerCreate>;

export interface CustomerListItem extends BaseCustomer {
    count_sales_orders: number;
    last_sales_order_date: string;
    total_sales_amount: number;
}
export type CustomerList = CustomerListItem[];
export type CustomerDetail = BaseCustomer;

export async function getCustomers(): Promise<CustomerList> {
  const response = await apiFetch('/api/customers/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const response = await apiFetch(`/api/customers/${id}/`)
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function createCustomer(payload: CustomerCreate): Promise<CustomerDetail> {
  const response = await apiFetch('/api/customers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function updateCustomer(id: number, payload: CustomerUpdate): Promise<CustomerDetail> {
  const response = await apiFetch(`/api/customers/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function deleteCustomer(id: number): Promise<void> {
  const response = await apiFetch(`/api/customers/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    await handleCommonErrors(response)
  }
}