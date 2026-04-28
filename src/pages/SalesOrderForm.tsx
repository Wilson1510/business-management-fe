import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
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
import { formatMoney } from '../utils/format';
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

  function handleLineProductChange(index: number, productId: number) {
    const row = formData.items[index];
    if (!row) return;
    updateItem(index, 'product_id', productId);
    if (productId && row.unit_id) {
      void resolveLineUnitPrice(index, productId, row.unit_id, row.quantity);
    }
  }

  function handleLineQuantityChange(index: number, quantity: number) {
    const row = formData.items[index];
    if (!row) return;
    updateItem(index, 'quantity', quantity);
    if (quantity > 0 && row.product_id && row.unit_id) {
      void resolveLineUnitPrice(index, row.product_id, row.unit_id, quantity);
    }
  }

  function handleLineUnitChange(index: number, unitId: number) {
    const row = formData.items[index];
    if (!row) return;
    updateItem(index, 'unit_id', unitId);
    if (unitId && row.product_id) {
      void resolveLineUnitPrice(index, row.product_id, unitId, row.quantity);
    }
  }

  function handleLinePriceChange(index: number, price: number) {
    updateItem(index, 'price', price);
  }

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

  async function handleOrderAction() {
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
      <div className="w-full max-w-5xl mx-auto p-12 text-center text-gray-500 dark:text-gray-400">
        Loading form...
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0 space-y-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <OrderFormHeader
            onBack={() => navigate('/sales')}
            titleIcon={<ShoppingCart size={24} className="text-primary" />}
            title={isEditing ? orderNumber : 'Create Sales Order'}
            subtitle={
              isEditing
                ? (status ? <StatusBadge status={status} /> : null)
                : 'Draft new outbound SO request'
            }
          />
          <OrderFormActions
            showCancel={Boolean(isEditing && status && status !== 'cancelled')}
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
          <form id="so-form" onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && <ErrorAlert message={error} variant="form" />}

            <OrderFormPartyDateSection
              isOrderLocked={isOrderLocked}
              partyLabel="Customer"
              partyPlaceholder="Select Customer"
              partyValue={formData.customer_id}
              partyOptions={customers}
              onPartyChange={customerId =>
                setFormData({ ...formData, customer_id: customerId })
              }
              dateLabel="Estimated Delivery Date"
              dateValue={formData.delivery_date}
              onDateChange={deliveryDate =>
                setFormData({ ...formData, delivery_date: deliveryDate })
              }
            />

            <OrderFormLineItems
              isOrderLocked={isOrderLocked}
              sectionTitle="Order Items"
              emptyMessage="Cart is empty. Add a product to configure the order."
              items={formData.items}
              products={products}
              units={units}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onProductChange={handleLineProductChange}
              onQuantityChange={handleLineQuantityChange}
              onUnitChange={handleLineUnitChange}
              onPriceChange={handleLinePriceChange}
            />

            <OrderFormTotal
              label="Order Total"
              amountDisplay={formatMoney(Number(calculateTotal()))}
            />

            {!isOrderLocked && <OrderFormSaveFooter saving={saving} />}
          </form>
        </div>
      </fieldset>

      {orderActionDialog && 
        <OrderActionDialog
          action={orderActionDialog}
          orderNumber={orderNumber}
          saving={saving}
          actionError={actionError}
          confirmDetail="This will finalize the order and spawn delivery workflow."
          onClose={closeOrderActionDialog}
          onSubmit={handleOrderAction}
        />
      }
    </div>
  );
}
