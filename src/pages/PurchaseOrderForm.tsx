import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { getSuppliers, type SupplierListItem } from '../services/suppliers';
import { getProducts, type ProductListItem } from '../services/products';
import { getUnits, type UnitListItem } from '../services/units';
import {
  getPurchaseOrder,
  createPurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  type PurchaseOrderProduct,
  type PurchaseOrderCreate,
  updatePurchaseOrder
} from '../services/purchases';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorAlert } from '../components/ErrorAlert';
import {
  OrderActionDialog,
  OrderFormActions,
  OrderFormHeader,
  OrderFormLineItems,
  OrderFormPartyDateSection,
  OrderFormSaveFooter,
  OrderFormTotal
} from '../components/order-form';
import { formatMoney } from '../utils/format';
import {
  toastSuccessCancel,
  toastSuccessConfirm,
  toastSuccessCreate,
  toastSuccessUpdate
} from '../utils/toast';

export default function PurchaseOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [suppliers, setSuppliers] = useState<SupplierListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [units, setUnits] = useState<UnitListItem[]>([]);

  const [formData, setFormData] = useState<PurchaseOrderCreate>({
    supplier_id: 0,
    arrival_date: '',
    items: []
  });
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderActionDialog, setOrderActionDialog] = useState<'confirm' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Hanya order draft yang masih boleh diedit; selain itu hanya tampilan. */
  const isOrderLocked = Boolean(isEditing && status && status !== 'draft');

  useEffect(function () {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [sups, prods, uns] = await Promise.all([getSuppliers(), getProducts(), getUnits()]);
        setSuppliers(sups);
        setProducts(prods);
        setUnits(uns);

        if (isEditing && id) {
          const order = await getPurchaseOrder(Number(id));
          setFormData({
            supplier_id: order.supplier.id,
            arrival_date: order.arrival_date,
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
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat data purchase order.');
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
        { product_id: 0, unit_id: 0, quantity: 1, price: 0 }
      ]
    });
  }

  function updateItem(index: number, field: keyof PurchaseOrderProduct, value: number) {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
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
    if (!orderNumber) return;
    setError(null);
    if (!formData.supplier_id) {
      setError('Pemasok wajib dipilih.');
      return;
    }
    if (!formData.arrival_date) {
      setError('Tanggal perkiraan tiba wajib diisi.');
      return;
    }
    if (formData.items.length === 0) {
      setError('Minimal satu item wajib ditambahkan');
      return;
    }
    if (formData.items.some(i => !i.product_id || !i.unit_id || !i.price || i.quantity <= 0)) {
      setError('Isi semua baris item dengan benar');
      return;
    }
    setSaving(true);
    let created_order = null;
    try {
      const payload: PurchaseOrderCreate = {
        supplier_id: formData.supplier_id,
        arrival_date: formData.arrival_date,
        items: formData.items
      };
      if (isEditing && id) {
        await updatePurchaseOrder(Number(id), payload);
        toastSuccessUpdate(orderNumber);
      } else {
        created_order = await createPurchaseOrder(payload);
        toastSuccessCreate(created_order.number);
      }
      navigate('/purchases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan pembelian');
    } finally {
      setSaving(false);
    }
  }

  function closeOrderActionDialog() {
    setOrderActionDialog(null);
    setActionError(null);
  }

  async function handleOrderAction() {
    if (!id || !orderActionDialog || !orderNumber) {
      setActionError('Pembelian tidak ditemukan');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      if (orderActionDialog === 'confirm') {
        await confirmPurchaseOrder(Number(id));
        toastSuccessConfirm(orderNumber);
      } else {
        await cancelPurchaseOrder(Number(id));
        toastSuccessCancel(orderNumber);
      } 
      const order = await getPurchaseOrder(Number(id));
      setStatus(order.status);
      closeOrderActionDialog();
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : orderActionDialog === 'confirm'
            ? 'Gagal mengonfirmasi pembelian'
            : 'Gagal membatalkan pembelian'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-12 text-center text-gray-500 dark:text-gray-400">
        Memuat pembelian...
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0 space-y-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <OrderFormHeader
            onBack={() => navigate('/purchases')}
            titleIcon={<ShoppingBag size={24} className="text-primary" />}
            title={isEditing ? orderNumber : 'Buat pembelian'}
            subtitle={
              isEditing
                ? (status ? <StatusBadge status={status} /> : null)
                : 'Draft pembelian baru'
            }
          />
          <OrderFormActions
            showCancel={Boolean(isEditing && status !== 'cancelled')}
            showConfirm={Boolean(isEditing && status === 'draft')}
            onRequestCancel={() => {
              setActionError(null);
              setOrderActionDialog('cancel');
            }}
            onRequestConfirm={() => {
              setActionError(null);
              setOrderActionDialog('confirm');
            }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && <ErrorAlert message={error} variant="form" />}

            <OrderFormPartyDateSection
              isOrderLocked={isOrderLocked}
              partyLabel="Pemasok"
              partyPlaceholder="Pilih pemasok"
              partyValue={formData.supplier_id}
              partyOptions={suppliers}
              onPartyChange={supplierId =>
                setFormData({ ...formData, supplier_id: supplierId })
              }
              dateLabel="Tanggal Penerimaan"
              dateValue={formData.arrival_date}
              onDateChange={arrivalDate =>
                setFormData({ ...formData, arrival_date: arrivalDate })
              }
            />

            <OrderFormLineItems
              isOrderLocked={isOrderLocked}
              sectionTitle="Item Pembelian"
              emptyMessage="Keranjang kosong. Tambahkan produk untuk mengkonfigurasi pembelian."
              items={formData.items}
              products={products}
              units={units}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onProductChange={(i, v) => updateItem(i, 'product_id', v)}
              onQuantityChange={(i, v) => updateItem(i, 'quantity', v)}
              onUnitChange={(i, v) => updateItem(i, 'unit_id', v)}
              onPriceChange={(i, v) => updateItem(i, 'price', v)}
            />

            <OrderFormTotal
              label="Total Pembelian"
              amountDisplay={formatMoney(Number(calculateTotal()))}
            />

            {!isOrderLocked && <OrderFormSaveFooter saving={saving} />}
          </form>
        </div>
      </fieldset>

      {orderActionDialog && (
        <OrderActionDialog
          action={orderActionDialog}
          orderNumber={orderNumber}
          saving={saving}
          actionError={actionError}
          confirmDetail="Ini akan menyelesaikan pembelian dan memulai alur penerimaan."
          onClose={closeOrderActionDialog}
          onSubmit={handleOrderAction}
        />
      )}
    </div>
  );
}
