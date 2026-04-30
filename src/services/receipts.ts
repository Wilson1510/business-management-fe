import { apiFetch } from "./api";
import type { Metadata } from "../utils/metadata";
import { handleCommonErrors } from "../utils/errorHandling";

export interface ReceiptListItem extends Metadata {
    number: string;
    status: string;
    method: string;
    purchase_order: {
        id: number;
        number: string;
    };
    arrival_date: string;
}

export interface ReceiptProduct {
    id: number;
    quantity_received: number;
    notes: string;
}

export type ReceiptList = ReceiptListItem[];
export interface ReceiptDetail extends ReceiptListItem {
    notes: string;
    destination: string;
    items: {
        id: number;
        product: {
            id: number;
            name: string;
        };
        quantity: number;
        quantity_received: number;
        unit: {
            id: number;
            name: string;
        };
        notes: string;
    }[];
}

export interface ReceiptUpdate {
    notes?: string;
    method?: string;
    items?: ReceiptProduct[];
}

export async function getReceipts(): Promise<ReceiptList> {
    const response = await apiFetch('/api/receipts/')
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function getReceipt(id: number): Promise<ReceiptDetail> {
    const response = await apiFetch(`/api/receipts/${id}/`)
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function updateReceipt(id: number, payload: ReceiptUpdate): Promise<ReceiptDetail> {
    const response = await apiFetch(`/api/receipts/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("Anda tidak memiliki akses untuk memperbarui penerimaan");
        }
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function doneReceipt(id: number): Promise<void> {
    const response = await apiFetch(`/api/receipts/${id}/done/`, { method: 'POST' })
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("Anda tidak memiliki akses untuk menyelesaikan penerimaan");
        }
        await handleCommonErrors(response)
    }
}

export async function cancelReceipt(id: number): Promise<void> {
    const response = await apiFetch(`/api/receipts/${id}/cancel/`, { method: 'POST' })
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("Anda tidak memiliki akses untuk membatalkan penerimaan");
        }
        await handleCommonErrors(response)
    }
}