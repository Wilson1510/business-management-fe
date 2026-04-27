import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { deletePurchaseOrder, getPurchaseOrders, type PurchaseOrderList, type PurchaseOrderListItem } from '../services/purchases';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatMoney } from '../utils/format';
import { PageHeading } from '../components/PageHeading';

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrderList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<PurchaseOrderListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const orders = await getPurchaseOrders();
        if (!cancelled) {
          setOrders(orders);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat purchase order.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadOrders();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => 
      order.number.toLowerCase().includes(query) || 
      order.supplier.name.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  function openDelete(order: PurchaseOrderListItem) {
    setDeleteError(null);
    setDeletingOrder(order);
    setIsDeleteOpen(true);
  };

  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingOrder(null);
  };

  async function handleDelete() {
    if (!deletingOrder) return;
    const id = deletingOrder.id;
    setDeleteError(null);
    try {
      await deletePurchaseOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      closeDelete();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Gagal menghapus purchase order.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title="Daftar Pesanan Pembelian"
          description="Mengelola dan mengkonfirmasi pesanan dari pemasok"
        />
        <AddItemButton text="Tambah Pembelian" onClick={() => navigate('/purchases/new')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nomor PO atau pemasok..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">Nomor PO</th>
                <th className="px-6 py-4 font-semibold">Pemasok</th>
                <th className="px-6 py-4 font-semibold">Tanggal Penerimaan</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold w-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Memuat pesanan...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Tidak ada pesanan pembelian yang ditemukan</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/purchases/${order.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.number}</td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                      {order.supplier.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(order.arrival_date)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {formatMoney(Number(order.total))}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeleteIconButton
                        onClick={(e) => { e.stopPropagation(); openDelete(order); }}
                        aria-label="Hapus pesanan pembelian"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeleteOpen && deletingOrder && (
        <ConfirmDeleteModal
          title="Hapus Pesanan Pembelian"
          itemName={deletingOrder.number}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
          confirmLabel="Hapus Pesanan Pembelian"
        />
      )}
    </div>
  );
}
