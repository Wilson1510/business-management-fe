import { apiFetch } from './api'
import { handleCommonErrors } from '../utils/errorHandling'

export type DashboardMetrics = {
  total_revenue: number
  gross_margin: number
  active_sales_orders: number
  active_purchase_orders: number
}

export type DashboardTopData = {
  top_selling_products: {
    id: number
    sku_number: string
    name: string
    sold_qty: number
    unit: string
  }[]
  slow_moving_products: {
    id: number
    sku_number: string
    name: string
    sold_qty: number
    unit: string
  }[]
  top_customers: {
    id: number
    name: string
    total_purchased: number
  }[]
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await apiFetch('/api/dashboard/metrics/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getDashboardTopData(): Promise<DashboardTopData> {
  const response = await apiFetch('/api/dashboard/top-data/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}