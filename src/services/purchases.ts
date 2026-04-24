import { apiFetch } from "./api";
import type { Metadata } from "../utils/metadata";
import { handleCommonErrors } from "../utils/errorHandling";

export interface PurchaseOrderListItem extends Metadata {
    number: string;
    status: string;
    supplier: {
        id: number;
        name: string;
    };
    total: number;
    arrival_date: string;
}

export interface PurchaseOrderProduct {
    id?: number;
    product_id: number;
    quantity: number;
    price: number;
    unit_id: number;
}

export type PurchaseOrderList = PurchaseOrderListItem[];
export interface PurchaseOrderDetail extends PurchaseOrderListItem {
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

export interface PurchaseOrderCreate {
    supplier_id: number;
    arrival_date: string;
    items: PurchaseOrderProduct[];
}

export type PurchaseOrderUpdate = Partial<PurchaseOrderCreate>;

export async function getPurchaseOrders(): Promise<PurchaseOrderList> {
    const response = await apiFetch('/api/purchase-orders/')
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function getPurchaseOrder(id: number): Promise<PurchaseOrderDetail> {
    const response = await apiFetch(`/api/purchase-orders/${id}/`)
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function createPurchaseOrder(payload: PurchaseOrderCreate): Promise<PurchaseOrderDetail> {
    const response = await apiFetch('/api/purchase-orders/', { method: 'POST', body: JSON.stringify(payload) })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function updatePurchaseOrder(id: number, payload: PurchaseOrderUpdate): Promise<PurchaseOrderDetail> {
    const response = await apiFetch(`/api/purchase-orders/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function deletePurchaseOrder(id: number): Promise<void> {
    const response = await apiFetch(`/api/purchase-orders/${id}/`, { method: 'DELETE' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}

export async function confirmPurchaseOrder(id: number): Promise<void> {
    const response = await apiFetch(`/api/purchase-orders/${id}/confirm/`, { method: 'POST' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}

export async function cancelPurchaseOrder(id: number): Promise<void> {
    const response = await apiFetch(`/api/purchase-orders/${id}/cancel/`, { method: 'POST' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}