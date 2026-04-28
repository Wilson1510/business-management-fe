import { apiFetch } from "./api";
import type { Metadata } from "../utils/metadata";
import { handleCommonErrors } from "../utils/errorHandling";

export interface SalesOrderListItem extends Metadata {
    number: string;
    status: string;
    customer: {
        id: number;
        name: string;
    };
    total: number;
    delivery_date: string;
}

export interface SalesOrderProduct {
    id?: number;
    product_id: number;
    quantity: number;
    price: number;
    unit_id: number;
}

export type SalesOrderList = SalesOrderListItem[];
export interface SalesOrderDetail extends SalesOrderListItem {
    items: {
        id: number;
        product: {
            id: number;
            name: string;
        };
        unit: {
            id: number;
            name: string;
        };
        quantity: number;
        price: number;
    }[];
}

export interface SalesOrderCreate {
    customer_id: number;
    delivery_date: string;
    items: SalesOrderProduct[];
}

export type SalesOrderUpdate = Partial<SalesOrderCreate>;

export async function getSalesOrders(): Promise<SalesOrderList> {
    const response = await apiFetch('/api/sales-orders/')
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function getSalesOrder(id: number): Promise<SalesOrderDetail> {
    const response = await apiFetch(`/api/sales-orders/${id}/`)
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function createSalesOrder(payload: SalesOrderCreate): Promise<SalesOrderDetail> {
    const response = await apiFetch('/api/sales-orders/', { method: 'POST', body: JSON.stringify(payload) })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function updateSalesOrder(id: number, payload: SalesOrderUpdate): Promise<SalesOrderDetail> {
    const response = await apiFetch(`/api/sales-orders/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function deleteSalesOrder(id: number): Promise<void> {
    const response = await apiFetch(`/api/sales-orders/${id}/`, { method: 'DELETE' })
    if (!response.ok) {
        if (response.status === 409) {
            const errorData = await response.clone().json().catch(() => null);
            if (errorData && errorData.code === "confirmed_order") {
                throw new Error("Tidak dapat menghapus penjualan yang sudah dikonfirmasi");
            }
        }
        await handleCommonErrors(response)
    }
}

export async function confirmSalesOrder(id: number): Promise<void> {
    const response = await apiFetch(`/api/sales-orders/${id}/confirm/`, { method: 'POST' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}

export async function cancelSalesOrder(id: number): Promise<void> {
    const response = await apiFetch(`/api/sales-orders/${id}/cancel/`, { method: 'POST' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}