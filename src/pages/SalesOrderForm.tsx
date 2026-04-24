import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ShoppingCart, CheckCircle2, CircleX } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { getCustomers, type CustomerListItem } from '../services/customers';
import { getProduct, getProducts, type ProductDetail, type ProductListItem } from '../services/products';
import { getUnits, type UnitListItem } from '../services/units';
import {
  getSalesOrder,
  createSalesOrder,
  confirmSalesOrder,
  cancelSalesOrder,
  updateSalesOrder,
  type SalesOrderCreate,
  type SalesOrderProduct
} from '../services/sales';
import { formatMoney, formatQty } from '../utils/format';
import { StatusBadge } from '../components/StatusBadge';

export default function SalesOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [units, setUnits] = useState<UnitListItem[]>([]);

  const [formData, setFormData] = useState<SalesOrderCreate>({
    customer_id: 0,
    delivery_date: '',
    items: []
  });
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderActionDialog, setOrderActionDialog] = useState<'confirm' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const productDetailCache = useRef<Map<number, ProductDetail>>(new Map());

  /** Hanya order draft yang masih boleh diedit; selain itu hanya tampilan. */
  const isOrderLocked = Boolean(isEditing && status && status !== 'draft');

  useEffect(function () {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [custs, prods, uns] = await Promise.all([getCustomers(), getProducts(), getUnits()]);
        setCustomers(custs);
        setProducts(prods);
        setUnits(uns);

        if (isEditing && id) {
          const order = await getSalesOrder(Number(id));
          setFormData({
            customer_id: order.customer.id,
            delivery_date: order.delivery_date,
            items: order.items.map(i => ({
              product_id: i.product.id,
              unit_id: i.unit.id,
              quantity: i.quantity,
              price: i.price
            }))
          });
          setOrderNumber(order.number);
          setStatus(order.status);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data sales order.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return function cleanup() {
      cancelled = true;
    };
  }, [id, isEditing]);

  function addItem() {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { product_id: 0, quantity: 1, unit_id: 0, price: 0 }
      ]
    });
  }

  function updateItem(index: number, field: keyof SalesOrderProduct, value: number) {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  }

  async function resolveLineUnitPrice(
    lineIndex: number,
    productId: number,
    unitId: number,
    quantity: number
  ) {
    if (!productId || !unitId) return;
    try {
      let detail = productDetailCache.current.get(productId);
      if (!detail) {
        detail = await getProduct(productId);
        productDetailCache.current.set(productId, detail);
      }

      const rows = detail.prices.filter(
        p => p.unit.id === unitId && p.minimum_quantity <= quantity
      );
      const nextPrice = rows.length > 0 ? rows.reduce(
        (best, p) => (p.minimum_quantity > best.minimum_quantity ? p : best)
      ).price : 0;

      setFormData(prev => {
        const newItems = [...prev.items];
        if (lineIndex < 0 || lineIndex >= newItems.length) return prev;
        const it = newItems[lineIndex];
        if (it.product_id !== productId || it.unit_id !== unitId || it.quantity !== quantity) {
          return prev;
        }
        newItems[lineIndex] = { ...it, price: nextPrice };
        return { ...prev, items: newItems };
      });
    } catch {
      setFormData(prev => {
        const newItems = [...prev.items];
        if (lineIndex < 0 || lineIndex >= newItems.length) return prev;
        const it = newItems[lineIndex];
        if (it.product_id !== productId || it.unit_id !== unitId || it.quantity !== quantity) {
          return prev;
        }
        newItems[lineIndex] = { ...it, price: 0 };
        return { ...prev, items: newItems };
      });
    }
  }

  function removeItem(index: number) {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  function calculateTotal() {
    return formData.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity), 0
    ).toFixed(2);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isOrderLocked) return;
    setError(null);
    if (!formData.customer_id || !formData.delivery_date) {
      setError('Customer and Delivery Date are required.');
      return;
    }
    if (formData.items.length === 0) {
      setError('Add at least one item to the order.');
      return;
    }
    if (formData.items.some(i => !i.product_id || !i.unit_id || !i.price || i.quantity <= 0)) {
      setError('Complete all item rows correctly.');
      return;
    }
    setSaving(true);
    try {
      const payload: SalesOrderCreate = {
        customer_id: formData.customer_id,
        delivery_date: formData.delivery_date,
        items: formData.items
      };
      if (isEditing && id) {
        await updateSalesOrder(Number(id), payload);
      } else {
        await createSalesOrder(payload);
      }
      navigate('/sales');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating order');
    } finally {
      setSaving(false);
    }
  }

  function closeOrderActionDialog() {
    setOrderActionDialog(null);
    setActionError(null);
  }

  async function submitOrderAction() {
    if (!id || !orderActionDialog) {
      setActionError('Order not found');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      if (orderActionDialog === 'confirm') {
        await confirmSalesOrder(Number(id));
      } else {
        await cancelSalesOrder(Number(id));
      }
      const order = await getSalesOrder(Number(id));
      setStatus(order.status);
      closeOrderActionDialog();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : orderActionDialog === 'confirm'
            ? 'Error confirming order'
            : 'Error cancelling order'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        Loading form...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-500 pb-12">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/sales')}
            className="p-2 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <ShoppingCart size={24} className="text-primary"/>
              {isEditing ? orderNumber : 'Create Sales Order'}
            </h1>
            <p
              className={isEditing ? 'mt-1' : 'text-sm text-gray-500 mt-1 font-medium'}
            >
              {isEditing
                ? (status ? <StatusBadge status={status} /> : null)
                : 'Draft new outbound SO request'}
            </p>
          </div>
        </div>

        {/* Action Controls for Detail View */}
        <div className="flex gap-2.5">
          {isEditing && status !== 'cancelled' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setActionError(null);
                setOrderActionDialog('cancel');
              }}
              className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          {isEditing && status === 'draft' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setActionError(null);
                setOrderActionDialog('confirm');
              }}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Confirm
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <form id="so-form" onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && <ErrorAlert message={error} variant="form" />}

          {/* SECTION: GENERAL INFO */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Customer</label>
              <select
                required={!isOrderLocked}
                value={formData.customer_id}
                disabled={isOrderLocked}
                onChange={e => setFormData({ ...formData, customer_id: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60"
              >
                <option value="" disabled>Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Estimated Delivery Date</label>
              <input
                type="date"
                required={!isOrderLocked}
                value={formData.delivery_date}
                disabled={isOrderLocked}
                onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60"
              />
            </div>
          </section>

          {/* SECTION: CART ITEMS */}
          <section className="space-y-4">
            <div className="flex justify-between items-end border-b border-gray-100 pb-3">
              <div className="border-l-4 border-primary pl-3">
                <h3 className="text-lg font-bold text-gray-900">Order Items</h3>
              </div>
              {!isOrderLocked && (
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm font-semibold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={16} /> Add Product
                </button>
              )}
            </div>

            <div className="border border-gray-200 rounded-xl bg-white p-6 shadow-sm">
              {formData.items.length === 0 ? (
                <div className="py-8 text-center text-gray-400 font-medium text-sm">Cart is empty. Add a product to configure the order.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 px-2">
                    <div className="flex-1 min-w-[200px]"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Product</label></div>
                    <div className="w-1/4 min-w-[80px]"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Quantity</label></div>
                    <div className="w-1/4 min-w-[100px]"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unit</label></div>
                    <div className="w-1/4 min-w-[100px]"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unit Price</label></div>
                    <div className="w-1/4 min-w-[100px] text-right"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Line Total</label></div>
                    {!isOrderLocked && <div className="w-10" aria-hidden />}
                  </div>

                  {formData.items.map((item, i) => {
                    const lineTotal = Number(item.quantity) * Number(item.price);

                    return (
                      <div key={i} className="flex items-center gap-4">
                        <select
                          value={item.product_id}
                          disabled={isOrderLocked}
                          onChange={e => {
                            const v = Number(e.target.value);
                            const unitId = item.unit_id;
                            updateItem(i, 'product_id', v);
                            if (v && unitId) {
                              void resolveLineUnitPrice(i, v, unitId, item.quantity);
                            }
                          }}
                          className="flex-1 min-w-[200px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium disabled:opacity-70"
                        >
                          <option value={0} disabled>Select Product...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          disabled={isOrderLocked}
                          onChange={e => {
                            const v = Number(e.target.value);
                            const productId = item.product_id;
                            const unitId = item.unit_id;
                            updateItem(i, 'quantity', v);
                            if (v > 0 && productId && unitId) {
                              void resolveLineUnitPrice(i, productId, unitId, v);
                            }
                          }}
                          className="w-1/4 min-w-[80px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium disabled:opacity-70"
                        />

                        <select
                          value={item.unit_id}
                          disabled={isOrderLocked}
                          onChange={e => {
                            const v = Number(e.target.value);
                            const productId = item.product_id;
                            updateItem(i, 'unit_id', v);
                            if (v && productId) {
                              void resolveLineUnitPrice(i, productId, v, item.quantity);
                            }
                          }}
                          className="w-1/4 min-w-[100px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium disabled:opacity-70"
                        >
                          <option value={0} disabled>Unit</option>
                          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>

                        <div className="w-1/4 min-w-[100px] relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-medium text-sm">Rp</span>
                          <input
                            type="text"
                            value={formatQty(Number(item.price))}
                            disabled={isOrderLocked}
                            onChange={e => updateItem(i, 'price', Number(e.target.value.replace(/[^0-9]/g, '')))}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium disabled:opacity-70"
                          />
                        </div>

                        <div className="w-1/4 min-w-[100px] text-right font-bold self-center">
                          {formatMoney(lineTotal)}
                        </div>

                        {!isOrderLocked && (
                          <div className="w-10 flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeItem(i)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-8 py-4 text-right min-w-[200px]">
                <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Order Total
                </p>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {formatMoney(Number(calculateTotal()))}
                </p>
              </div>
            </div>
          </section>

          {!isOrderLocked && (
            <div className="flex justify-end pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/25 cursor-pointer disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Draft Request'}
              </button>
            </div>
          )}
        </form>
      </div>

      {orderActionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-action-title"
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700"
          >
            <div className="p-8 text-center">
              {orderActionDialog === 'confirm' ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={28} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-6 text-red-500 dark:text-red-400">
                  <CircleX size={28} />
                </div>
              )}
              <h3 id="order-action-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {orderActionDialog === 'confirm' ? 'Confirm this order?' : 'Cancel this order?'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {orderActionDialog === 'confirm' ? (
                  <>
                    Confirm <span className="font-bold text-gray-900 dark:text-gray-100">&quot;{orderNumber}&quot;</span>
                    ? This will finalize the order and spawn delivery workflow.
                  </>
                ) : (
                  <>
                    Cancel <span className="font-bold text-gray-900 dark:text-gray-100">&quot;{orderNumber}&quot;</span>
                    ? This cannot be undone from this screen.
                  </>
                )}
              </p>

              {actionError && <ErrorAlert message={actionError} variant="dialog" />}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeOrderActionDialog}
                  disabled={saving}
                  className="flex-1 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={submitOrderAction}
                  disabled={saving}
                  className={
                    orderActionDialog === 'confirm'
                      ? 'flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-70'
                      : 'flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/20 cursor-pointer disabled:opacity-70'
                  }
                >
                  {saving ? 'Working…' : orderActionDialog === 'confirm' ? 'Yes, confirm' : 'Yes, cancel order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
