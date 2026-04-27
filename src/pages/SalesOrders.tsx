import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { TableSearchInput } from '../components/TableSearchInput';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { getSalesOrders, deleteSalesOrder, type SalesOrderList, type SalesOrderListItem } from '../services/sales';
import { StatusBadge } from '../components/StatusBadge';
import { formatDate, formatMoney } from '../utils/format';
import { PageHeading } from '../components/PageHeading';

export default function SalesOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SalesOrderList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<SalesOrderListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;
    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const orders = await getSalesOrders();
        if (!cancelled) {
          setOrders(orders);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat sales order.');
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
      order.customer.name.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  function openDelete(order: SalesOrderListItem) {
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
      await deleteSalesOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      closeDelete();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Gagal menghapus sales order.');
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title="Daftar Penjualan"
          description="Mengelola dan mengkonfirmasi pesanan pelanggan"
        />
        <AddItemButton text="Tambah Penjualan" onClick={() => navigate('/sales/new')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <TableSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nomor SO atau pelanggan..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/80 dark:bg-gray-700/50 transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">Nomor SO</th>
                <th className="px-6 py-4 font-semibold">Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Tanggal Pengiriman</th>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Tidak ada pesanan penjualan yang ditemukan.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/sales/${order.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.number}</td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                      {order.customer.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatDate(order.delivery_date)}
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
                        aria-label="Hapus pesanan penjualan"
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
          title="Hapus Pesanan Penjualan"
          itemName={deletingOrder.number}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
          confirmLabel="Hapus Pesanan Penjualan"
        />
      )}
    </div>
  );
}
