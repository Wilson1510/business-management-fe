import { useEffect, useState } from 'react';
import { Activity, DollarSign, Package, ShoppingBag } from 'lucide-react';
import {
  getDashboardMetrics,
  getDashboardTopData,
  type DashboardMetrics,
  type DashboardTopData,
} from '../services/dashboard';

function formatMoney(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatQty(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}

type TopCustomerRowClasses = { row: string; name: string; amount: string };

function getTopCustomerRowClasses(rank: number): TopCustomerRowClasses {
  const rowFlex = 'flex justify-between items-center gap-3 transition-colors';
  const rowMedal = 'rounded-xl px-3 py-2.5 -mx-1 border bg-gradient-to-r';
  const nameBase = 'text-sm transition-colors min-w-0';
  const amountBase = 'text-sm font-bold shrink-0 tabular-nums transition-colors';

  if (rank === 1) {
    return {
      row: `${rowFlex} group ${rowMedal} from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/45 dark:via-yellow-950/25 dark:to-amber-950/45 border-amber-200/90 dark:border-amber-700/50`,
      name: `${nameBase} font-semibold text-[#B8860B] dark:text-[#FFD700]`,
      amount: `${amountBase} text-[#9A7209] dark:text-[#E8C547]`,
    };
  }
  if (rank === 2) {
    return {
      row: `${rowFlex} group ${rowMedal} from-slate-100 to-gray-100 dark:from-slate-900/55 dark:to-gray-900/40 border-slate-200/90 dark:border-slate-600/45`,
      name: `${nameBase} font-semibold text-[#5c6b7a] dark:text-[#C8D0D8]`,
      amount: `${amountBase} text-[#4a5568] dark:text-[#B8C0C8]`,
    };
  }
  if (rank === 3) {
    return {
      row: `${rowFlex} group ${rowMedal} from-orange-50 to-amber-50/80 dark:from-orange-950/35 dark:to-amber-950/30 border-orange-200/80 dark:border-orange-800/40`,
      name: `${nameBase} font-semibold text-[#8B4513] dark:text-[#CD7F32]`,
      amount: `${amountBase} text-[#7a3d18] dark:text-[#D4915A]`,
    };
  }
  return {
    row: `${rowFlex} group`,
    name: `${nameBase} font-medium text-gray-900 dark:text-white group-hover:text-primary`,
    amount: `${amountBase} text-gray-700 dark:text-gray-300`,
  };
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topData, setTopData] = useState<DashboardTopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [m, top] = await Promise.all([getDashboardMetrics(), getDashboardTopData()]);
        if (!cancelled) {
          setMetrics(m);
          setTopData(top);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const topSelling = topData?.top_selling_products ?? [];
  const slowMoving = topData?.slow_moving_products ?? [];
  const topCustomers = topData?.top_customers ?? [];

  const cards = [
    {
      title: 'Total Revenue',
      value: metrics ? formatMoney(metrics.total_revenue) : '—',
      icon: DollarSign,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Gross Margin',
      value: metrics ? formatMoney(metrics.gross_margin) : '—',
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Active Sales',
      value: metrics ? metrics.active_sales_orders : '—',
      icon: ShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Active Purchases',
      value: metrics ? metrics.active_purchase_orders : '—',
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bg} dark:bg-opacity-20 ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '…' : card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 transition-colors">
            Top Selling
          </h3>
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">Loading…</div>
          ) : topSelling.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm">No data yet.</div>
          ) : (
            <div className="space-y-4">
              {topSelling.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-3 group">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.sku_number}</p>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
                  {/* <div className="text-sm font-bold text-gray-700 dark:text-gray-300 shrink-0"> */}
                    {formatQty(item.sold_qty)} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 transition-colors">
            Slow Moving
          </h3>
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">Loading…</div>
          ) : slowMoving.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm">No data yet.</div>
          ) : (
            <div className="space-y-4">
              {slowMoving.map((item) => (
                <div key={item.id} className="flex justify-between items-center group">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku_number}</p>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-md">
                    {formatQty(item.sold_qty)} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-6 transition-colors duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 transition-colors">
            Top Customers
          </h3>
          {loading ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">Loading…</div>
          ) : topCustomers.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm">No data yet.</div>
          ) : (
            <div className="space-y-4">
              {topCustomers.map((item, index) => {
                const rank = index + 1;
                const c = getTopCustomerRowClasses(rank);
                return (
                  <div key={item.id} className={c.row}>
                    <div className="min-w-0">
                      <p className={c.name}>{item.name}</p>
                    </div>
                    <div className={c.amount}>{formatMoney(item.total_purchased)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
