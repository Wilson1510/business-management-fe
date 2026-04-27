import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReceipts, type ReceiptListItem } from '../services/receipts';
import { TableSearchInput } from '../components/TableSearchInput';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeading } from '../components/PageHeading';

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
        <PageHeading
          title="Daftar Penerimaan"
          description="Mengelola dan menerima penerimaan dari pemasok"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <TableSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nomor atau pesanan..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Nomor Penerimaan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Pesanan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Tanggal Penerimaan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Metode Penerimaan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Memuat penerimaan...</td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Tidak ada penerimaan yang tertunda</td>
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
                        Pesanan: {rec.purchase_order.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary dark:text-blue-400 font-mono">{rec.purchase_order.number}</td>
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
