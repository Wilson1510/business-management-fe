import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, PackageOpen, HelpCircle } from 'lucide-react';
import { getDeliveries, type DeliveryList, type DeliveryListItem } from '../services/deliveries';

export default function Deliveries() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<DeliveryList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(function () {
    let cancelled = false;
    async function loadDeliveries() {
      setLoading(true);
      setError(null);
      try {
        const deliveries = await getDeliveries();
        if (!cancelled) {
          setDeliveries(deliveries);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat pengiriman.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDeliveries();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const filteredDeliveries = useMemo(() => {
    if (!searchQuery.trim()) return deliveries;
    const query = searchQuery.toLowerCase();
    return deliveries.filter((delivery) => 
      delivery.number.toLowerCase().includes(query) || 
      delivery.sales_order.number.toLowerCase().includes(query)
    );
  }, [deliveries, searchQuery]);

  function getStatusBadge(status: DeliveryListItem['status']) {
    switch (status) {
      case 'done':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Done</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><PackageOpen size={12} /> Ready</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"><HelpCircle size={12} /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Outbound Deliveries</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and execute shipments to customers</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliveries..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">Delivery Number</th>
                <th className="px-6 py-4 font-semibold">Source Order</th>
                <th className="px-6 py-4 font-semibold">Delivery Date</th>
                <th className="px-6 py-4 font-semibold">Ship Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading deliveries...</td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No outbound deliveries pending. Confirm a Sales Order to spawn one.</td>
                </tr>
              ) : (
                filteredDeliveries.map((dlv) => (
                  <tr 
                    key={dlv.id} 
                    onClick={() => navigate(`/sales/deliveries/${dlv.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white transition-colors">{dlv.number}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 transition-colors">
                        Order: {dlv.sales_order.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary font-mono">{dlv.sales_order.number}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 transition-colors">{new Date(dlv.delivery_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium transition-colors">{dlv.method}</td>
                    <td className="px-6 py-4">{getStatusBadge(dlv.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
