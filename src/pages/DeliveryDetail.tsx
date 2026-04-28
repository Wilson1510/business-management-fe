import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import {
  OrderActionDialog,
  OrderFormActions,
  OrderFormHeader,
  OrderFormItemSection,
  OrderFormSaveFooter
} from '../components/order-form';
import {
  getDelivery,
  updateDelivery,
  doneDelivery,
  cancelDelivery,
  type DeliveryUpdate,
  type DeliveryProduct
} from '../services/deliveries';
import { toastSuccessCancel, toastSuccessDone, toastSuccessUpdate } from '../utils/toast';
type ReadOnlyData = {
  number: string;
  sales_order: {
    id: number;
    number: string;
  };
  delivery_date: string;
  destination: string;
  items: {
    id: number;
    product: {
      id: number;
      name: string;
    };
    quantity: number;
    unit: {
      id: number;
      name: string;
    };
  }[];
}

export default function DeliveryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [readOnlyData, setReadOnlyData] = useState<ReadOnlyData | null>(null);
  const [formData, setFormData] = useState<DeliveryUpdate>({
    notes: '',
    method: 'delivery',
    items: []
  });
  const [status, setStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deliveryActionDialog, setDeliveryActionDialog] = useState<'done' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Hanya delivery draft yang masih boleh diedit; selain itu hanya tampilan. */
  const isDeliveryLocked = Boolean(status && status !== 'draft');

  useEffect(function () {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (!id) return;
        const delivery = await getDelivery(Number(id));
        setReadOnlyData({
          number: delivery.number,
          sales_order: {
            id: delivery.sales_order.id,
            number: delivery.sales_order.number
          },
          delivery_date: delivery.delivery_date,
          destination: delivery.destination,
          items: delivery.items.map(item => ({
            id: item.id,
            product: {
              id: item.product.id,
              name: item.product.name
            },
            quantity: item.quantity,
            unit: {
              id: item.unit.id,
              name: item.unit.name
            }
          }))
        });
        setStatus(delivery.status);
        setFormData({
          notes: delivery.notes,
          method: delivery.method,
          items: delivery.items.map(item => ({
            id: item.id,
            quantity_delivered: item.quantity_delivered,
            notes: item.notes
          }))
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat detail pengiriman');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return function cleanup() {
      cancelled = true;
    };
  }, [id]);

  function updateItem(index: number, field: keyof DeliveryProduct, value: number | string) {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (isDeliveryLocked) return;
    setError(null);
    setSaving(true);
    try {
      await updateDelivery(Number(id), formData);
      toastSuccessUpdate(readOnlyData.number);
      navigate(`/sales/deliveries`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui pengiriman');
    } finally {
      setSaving(false);
    }
  }

  function closeDeliveryActionDialog() {
    setDeliveryActionDialog(null);
    setActionError(null);
  }

  async function handleDeliveryAction() {
    if (!id || !deliveryActionDialog) {
      setActionError('Pengiriman tidak ditemukan');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      if (deliveryActionDialog === 'done') {
        await doneDelivery(Number(id));
        toastSuccessDone(readOnlyData.number);
      } else {
        await cancelDelivery(Number(id));
        toastSuccessCancel(readOnlyData.number);
      }
      const delivery = await getDelivery(Number(id));
      setStatus(delivery.status);
      closeDeliveryActionDialog();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : deliveryActionDialog === 'done'
          ? 'Gagal menyelesaikan pengiriman'
          : 'Gagal membatalkan pengiriman'
      );
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-12 text-center text-gray-500 dark:text-gray-400">
        Memuat pengiriman...
      </div>
    );
  }

  const lineControlClass =
    'px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium text-gray-900 dark:text-gray-100 disabled:opacity-70 dark:bg-gray-900/40 dark:border-gray-600';
  const destFieldClass =
    'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-60';
  const destReadOnlyClass =
    'w-full px-4 py-3 bg-gray-100/50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-default';

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0 space-y-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <OrderFormHeader
            onBack={() => navigate('/sales/deliveries')}
            titleIcon={<Truck size={24} className="text-primary" />}
            title={readOnlyData.number}
            subtitle={
              <>
                {status && (
                  <div className="mb-1">
                    <StatusBadge status={status} />
                  </div>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium block">
                  Penjualan:{' '}
                  {readOnlyData.sales_order.number}
                </span>
              </>
            }
          />
          <OrderFormActions
            showCancel={Boolean(status && status === 'draft')}
            showConfirm={Boolean(status && status === 'draft')}
            confirmLabel="Selesaikan"
            onRequestCancel={function () {
              setActionError(null);
              setDeliveryActionDialog('cancel');
            }}
            onRequestConfirm={function () {
              setActionError(null);
              setDeliveryActionDialog('done');
            }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <form id="delivery-form" onSubmit={handleSaveDraft} className="p-8 space-y-8">
            {error && <ErrorAlert message={error} variant="form" />}

            <section className="space-y-5 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 min-w-0">
                  <label
                    htmlFor="delivery-destination"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Alamat
                  </label>
                  <input
                    id="delivery-destination"
                    readOnly
                    value={readOnlyData.destination}
                    className={destReadOnlyClass}
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label
                    htmlFor="delivery-method"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Metode pengiriman
                  </label>
                  <select
                    id="delivery-method"
                    disabled={isDeliveryLocked}
                    value={formData.method ?? 'delivery'}
                    onChange={e => setFormData({ ...formData, method: e.target.value })}
                    className={destFieldClass}
                  >
                    <option value="delivery">Diantar</option>
                    <option value="pickup">Ambil sendiri</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="delivery-shipment-notes"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Catatan
                </label>
                <textarea
                  id="delivery-shipment-notes"
                  disabled={isDeliveryLocked}
                  value={formData.notes ?? ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Instruksi logistik untuk pengiriman ini…"
                  className={`${destFieldClass} resize-y min-h-[5.5rem] disabled:cursor-not-allowed`}
                />
              </div>
            </section>

            <OrderFormItemSection title="Pemeriksaan fisik">
              <div className="space-y-4">
                <div className="flex items-end gap-4 px-0 sm:px-1 flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-[12rem]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Produk
                    </p>
                  </div>
                  <div className="w-20 sm:w-24 shrink-0 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Jumlah
                    </p>
                  </div>
                  <div className="w-24 shrink-0 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Dikirim
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 sm:min-w-[8rem]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Catatan
                    </p>
                  </div>
                </div>

                {formData.items?.map((item, idx) => {
                  const line = readOnlyData.items.find(row => row.id === item.id);
                  if (!line) return null;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 pb-4 last:mb-0"
                    >
                      <div className="flex-1 min-w-[12rem]">
                        <p className="font-bold text-gray-900 leading-snug dark:text-gray-100">{line.product.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1 dark:text-gray-400">{line.unit.name}</p>
                      </div>
                      <div className="w-20 sm:w-24 shrink-0 text-center text-sm font-mono font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 py-2 rounded-lg tabular-nums self-center">
                        {line.quantity}
                      </div>
                      <div className="w-full sm:w-24 shrink-0 self-center">
                        <input
                          type="number"
                          min={0}
                          max={line.quantity}
                          disabled={isDeliveryLocked}
                          value={item.quantity_delivered}
                          onChange={e => updateItem(idx, 'quantity_delivered', Number(e.target.value))}
                          className={`w-full text-center text-sm font-bold ${lineControlClass}`}
                        />
                      </div>
                      <div className="min-w-0 flex-1 w-full self-center">
                        <input
                          type="text"
                          disabled={isDeliveryLocked}
                          placeholder="Catatan logistik per barang…"
                          value={item.notes}
                          onChange={e => updateItem(idx, 'notes', e.target.value)}
                          className={`w-full ${lineControlClass}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </OrderFormItemSection>

            {!isDeliveryLocked && <OrderFormSaveFooter saving={saving} mode="shipment"/>}
          </form>
        </div>
      </fieldset>

      {deliveryActionDialog && (
        <OrderActionDialog
          mode="delivery"
          action={deliveryActionDialog === 'done' ? 'confirm' : 'cancel'}
          orderNumber={readOnlyData.number}
          saving={saving}
          actionError={actionError}
          confirmDetail="Ini akan menandai pengiriman sebagai selesai."
          onClose={closeDeliveryActionDialog}
          onSubmit={handleDeliveryAction}
        />
      )}
    </div>
  );
}
