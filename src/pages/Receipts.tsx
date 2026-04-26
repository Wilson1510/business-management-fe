import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getReceipts, type ReceiptListItem } from '../services/receipts';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';

export default function Receipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<ReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(function () {
    let cancelled = false;
    async function loadReceipts() {
      setLoading(true);
      setError(null);
      try {
        const receipts = await getReceipts();
        if (!cancelled) {
          setReceipts(receipts);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat penerimaan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReceipts();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const filteredReceipts = useMemo(() => {
    if (!searchQuery.trim()) return receipts;
    const query = searchQuery.toLowerCase();
    return receipts.filter((receipt) => 
      receipt.number.toLowerCase().includes(query) || 
      receipt.purchase_order.number.toLowerCase().includes(query)
    );
  }, [receipts, searchQuery]);

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Inbound Receipts</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage and receive inbound supplier deliveries</p>
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
              placeholder="Search expected receipts..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-primary/20 outline-none transition-colors"/>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700">Receipt No.</th>
                <th className="px-6 py-4 font-semibold">Source Order</th>
                <th className="px-6 py-4 font-semibold">Arrival Date</th>
                <th className="px-6 py-4 font-semibold">Ship Method</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Loading receipts...</td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No inbound receipts pending. Confirm a Purchase Order to spawn one.</td>
                </tr>
              ) : (
                filteredReceipts.map((rec) => (
                  <tr 
                    key={rec.id} 
                    onClick={() => navigate(`/purchases/receipts/${rec.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 dark:text-white transition-colors">{rec.number}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 transition-colors">
                        Order: {rec.purchase_order.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary font-mono">{rec.purchase_order.number}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 transition-colors">{new Date(rec.arrival_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-medium transition-colors">{rec.method}</td>
                    <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
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
