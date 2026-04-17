const API_ORIGIN = import.meta.env.VITE_API_ORIGIN

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

export async function getDashboardMetrics(accessToken: string): Promise<DashboardMetrics> {
  const response = await fetch(`${API_ORIGIN}/api/dashboard/metrics/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}

export async function getDashboardTopData(accessToken: string): Promise<DashboardTopData> {
  const response = await fetch(`${API_ORIGIN}/api/dashboard/top-data/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}