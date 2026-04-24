import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { deletePurchaseOrder, getPurchaseOrders, type PurchaseOrderList, type PurchaseOrderListItem } from '../services/purchases';
import { StatusBadge } from '../components/StatusBadge';

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
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manage Purchase Orders</h2>
          <p className="text-sm text-gray-500">Track and confirm orders from suppliers</p>
        </div>
        <button
          onClick={() => navigate('/purchases/new')}
          className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          <Plus size={18} />
          Create PO
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PO number or supplier..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">PO Number</th>
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold">Arrival Date</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold w-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No purchase orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/purchases/${order.id}`)}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.number}</td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                      {order.supplier.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(order.arrival_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-gray-900 dark:text-white">
                      {order.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDelete(order); }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
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
          title="Delete Purchase Order"
          itemName={deletingOrder.number}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
          confirmLabel="Delete Purchase Order"
        />
      )}
    </div>
  );
}
