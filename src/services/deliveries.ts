import { apiFetch } from "./api";
import type { Metadata } from "../utils/metadata";
import { handleCommonErrors } from "../utils/errorHandling";

export interface DeliveryListItem extends Metadata {
    number: string;
    status: string;
    method: string;
    sales_order: {
        id: number;
        number: string;
    };
    delivery_date: string;
}

export interface DeliveryProduct {
    id: number;
    quantity_delivered: number;
    notes: string;
}

export type DeliveryList = DeliveryListItem[];
export interface DeliveryDetail extends DeliveryListItem {
    notes: string;
    destination: string;
    items: {
        id: number;
        product: {
            id: number;
            name: string;
        };
        quantity: number;
        quantity_delivered: number;
        unit: {
            id: number;
            name: string;
        };
        notes: string;
    }[];
}

export interface DeliveryUpdate {
    notes?: string;
    method?: string;
    items?: DeliveryProduct[];
}

export async function getDeliveries(): Promise<DeliveryList> {
    const response = await apiFetch('/api/deliveries/')
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function getDelivery(id: number): Promise<DeliveryDetail> {
    const response = await apiFetch(`/api/deliveries/${id}/`)
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function updateDelivery(id: number, payload: DeliveryUpdate): Promise<DeliveryDetail> {
    const response = await apiFetch(`/api/deliveries/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
    return response.json()
}

export async function doneDelivery(id: number): Promise<void> {
    const response = await apiFetch(`/api/deliveries/${id}/done/`, { method: 'POST' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}

export async function cancelDelivery(id: number): Promise<void> {
    const response = await apiFetch(`/api/deliveries/${id}/cancel/`, { method: 'POST' })
    if (!response.ok) {
        await handleCommonErrors(response)
    }
}