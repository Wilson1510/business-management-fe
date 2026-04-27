import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getDeliveries, type DeliveryList } from '../services/deliveries';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeading } from '../components/PageHeading';

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

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading title="Daftar Pengiriman" description="Mengelola pengiriman ke pelanggan" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengiriman berdasarkan nomor atau pesanan..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Nomor Pengiriman</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Pesanan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Tanggal Pengiriman</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Metode Pengiriman</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Memuat pengiriman...</td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Tidak ada pengiriman yang tertunda</td>
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
                        Pesanan: {dlv.sales_order.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary dark:text-blue-400 font-mono">{dlv.sales_order.number}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 transition-colors">{new Date(dlv.delivery_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium transition-colors">{dlv.method}</td>
                    <td className="px-6 py-4"><StatusBadge status={dlv.status} /></td>
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
