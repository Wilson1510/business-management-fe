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

  const [error, setError] = useState('');
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
    setError(null);
    if (!formData.supplier_id || !formData.arrival_date) {
      setError('Supplier and Arrival Date are required.');
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
      const payload: PurchaseOrderCreate = {
        supplier_id: formData.supplier_id,
        arrival_date: formData.arrival_date,
        items: formData.items
      };
      if (isEditing && id) {
        await updatePurchaseOrder(Number(id), payload);
      } else {
        await createPurchaseOrder(payload);
      }
      navigate('/purchases');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating PO');
    } finally {
      setSaving(false);
    }
  }

  function closeOrderActionDialog() {
    setOrderActionDialog(null);
    setActionError(null);
  }

  async function handleOrderAction() {
    if (!id || !orderActionDialog) {
      setActionError('Order not found');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      if (orderActionDialog === 'confirm') {
        await confirmPurchaseOrder(Number(id));
      } else {
        await cancelPurchaseOrder(Number(id));
      }
      const order = await getPurchaseOrder(Number(id));
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
        <OrderFormHeader
          onBack={() => navigate('/purchases')}
          titleIcon={<ShoppingBag size={24} className="text-primary" />}
          title={isEditing ? orderNumber : 'Create Purchase Order'}
          subtitle={
            isEditing
              ? (status ? <StatusBadge status={status} /> : null)
              : 'Draft new inbound PO request'
          }
        />
        <OrderFormActions
          saving={saving}
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

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && <ErrorAlert message={error} variant="form" />}

          <OrderFormPartyDateSection
            isOrderLocked={isOrderLocked}
            partyLabel="Supplier"
            partyPlaceholder="Select Supplier"
            partyValue={formData.supplier_id}
            partyOptions={suppliers}
            onPartyChange={supplierId =>
              setFormData({ ...formData, supplier_id: supplierId })
            }
            dateLabel="Estimated Arrival Date"
            dateValue={formData.arrival_date}
            onDateChange={arrivalDate =>
              setFormData({ ...formData, arrival_date: arrivalDate })
            }
          />

          <OrderFormLineItems
            isOrderLocked={isOrderLocked}
            sectionTitle="Purchase Items"
            emptyMessage="List is empty. Add products to request."
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
            label="Purchase Total"
            amountDisplay={formatMoney(Number(calculateTotal()))}
          />

          {!isOrderLocked && <OrderFormSaveFooter saving={saving} />}
        </form>
      </div>

      {orderActionDialog && (
        <OrderActionDialog
          action={orderActionDialog}
          orderNumber={orderNumber}
          saving={saving}
          actionError={actionError}
          confirmDetail="This will finalize the request and spawn receipt workflow."
          onClose={closeOrderActionDialog}
          onSubmit={handleOrderAction}
        />
      )}
    </div>
  );
}
