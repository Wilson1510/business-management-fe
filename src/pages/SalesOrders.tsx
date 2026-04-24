import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle2, Clock, XCircle, HelpCircle, Trash2 } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { getSalesOrders, deleteSalesOrder, type SalesOrderList, type SalesOrderListItem } from '../services/sales';

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

  function getStatusBadge(status: SalesOrderListItem['status']) {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12} /> Confirmed</span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12} /> Draft</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200"><XCircle size={12} /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200"><HelpCircle size={12} /> {status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manage Sales Orders</h2>
          <p className="text-sm text-gray-500">Track and confirm customer orders</p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          <Plus size={18} />
          Create Order
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
              placeholder="Search by SO number or customer..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/80 dark:bg-gray-700/50 transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">SO Number</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Delivery Date</th>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No sales orders found.</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    onClick={() => navigate(`/sales/${order.id}`)}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{order.number}</td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                      {order.customer.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-gray-900 dark:text-white">
                      {order.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Sales Order</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                You are about to delete <span className="font-bold text-gray-900 dark:text-gray-100">"{deletingOrder.number}"</span>. 
                This action is permanent and cannot be reversed.
              </p>
              
              {deleteError && <ErrorAlert message={deleteError} variant="dialog" />}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDelete}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer"
                >
                  Delete Sales Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
