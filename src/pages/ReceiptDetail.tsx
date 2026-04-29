import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
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
  cancelReceipt,
  doneReceipt,
  getReceipt,
  updateReceipt,
  type ReceiptUpdate,
  type ReceiptProduct
} from '../services/receipts';
import { toastSuccessCancel, toastSuccessDone, toastSuccessUpdate } from '../utils/toast';

type ReadOnlyData = {
  number: string;
  purchase_order: {
    id: number;
    number: string;
  };
  arrival_date: string;
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
};

export default function ReceiptDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [readOnlyData, setReadOnlyData] = useState<ReadOnlyData | null>(null);
  const [formData, setFormData] = useState<ReceiptUpdate>({
    notes: '',
    method: 'delivery',
    items: []
  });
  const [status, setStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receiptActionDialog, setReceiptActionDialog] = useState<'done' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const isReceiptLocked = Boolean(status && status !== 'draft');

  useEffect(function () {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (!id) return;
        const receipt = await getReceipt(Number(id));
        setReadOnlyData({
          number: receipt.number,
          purchase_order: {
            id: receipt.purchase_order.id,
            number: receipt.purchase_order.number
          },
          arrival_date: receipt.arrival_date,
          destination: receipt.destination,
          items: receipt.items.map(item => ({
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
        setStatus(receipt.status);
        setFormData({
          notes: receipt.notes,
          method: receipt.method,
          items: receipt.items.map(item => ({
            id: item.id,
            quantity_received: item.quantity_received,
            notes: item.notes
          }))
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat detail penerimaan');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return function cleanup() {
      cancelled = true;
    };
  }, [id]);

  function updateItem(index: number, field: keyof ReceiptProduct, value: number | string) {
    const items = formData.items ?? [];
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  }

  async function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (isReceiptLocked || !readOnlyData || !id) return;
    setError(null);
    setSaving(true);
    try {
      await updateReceipt(Number(id), formData);
      toastSuccessUpdate(readOnlyData.number);
      navigate('/purchases/receipts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui penerimaan');
    } finally {
      setSaving(false);
    }
  }

  function closeReceiptActionDialog() {
    setReceiptActionDialog(null);
    setActionError(null);
  }

  async function handleReceiptAction() {
    if (!id || !receiptActionDialog) {
      setActionError('Penerimaan tidak ditemukan');
      return;
    }
    if (!readOnlyData) {
      setActionError('Data penerimaan belum dimuat');
      return;
    }
    const orderNumber = readOnlyData.number;
    setActionError(null);
    setSaving(true);
    try {
      if (receiptActionDialog === 'done') {
        await doneReceipt(Number(id));
        toastSuccessDone(orderNumber);
      } else {
        await cancelReceipt(Number(id));
        toastSuccessCancel(orderNumber);
      }
      const receipt = await getReceipt(Number(id));
      setStatus(receipt.status);
      closeReceiptActionDialog();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : receiptActionDialog === 'done'
          ? 'Gagal menyelesaikan penerimaan'
          : 'Gagal membatalkan penerimaan'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-12 text-center text-gray-500 dark:text-gray-400">
        Memuat penerimaan...
      </div>
    );
  }

  if (!readOnlyData) {
    return (
      <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 space-y-4">
        <ErrorAlert
          message={error ?? 'Penerimaan tidak ditemukan atau ID tidak valid.'}
          variant="form"
        />
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/purchases/receipts')}
            className="rounded-xl px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
          >
            Kembali ke daftar penerimaan
          </button>
        </div>
      </div>
    );
  }

  const lineControlClass =
    'px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium text-gray-900 dark:text-gray-100 disabled:opacity-70 dark:bg-gray-900/40 dark:border-gray-600';
  const destFieldClass =
    'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-60';
  const destReadOnlyClass =
    'w-full px-4 py-3 bg-gray-100/50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm font-medium text-gray-900 dark:text-gray-100 cursor-default';

  const pemeriksaanStackLabelClass =
    'block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400';

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12">
      <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0 space-y-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <OrderFormHeader
            onBack={() => navigate('/purchases/receipts')}
            titleIcon={<Package size={24} className="text-primary" />}
            title={readOnlyData.number}
            subtitle={
              <>
                {status && (
                  <div className="mb-1">
                    <StatusBadge status={status} />
                  </div>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium block">
                  Pembelian: {readOnlyData.purchase_order.number}
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
              setReceiptActionDialog('cancel');
            }}
            onRequestConfirm={function () {
              setActionError(null);
              setReceiptActionDialog('done');
            }}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <form id="receipt-form" onSubmit={handleSaveDraft} className="p-8 space-y-8">
            {error && <ErrorAlert message={error} variant="form" />}

            <section className="space-y-5 p-6 bg-gray-50/50 rounded-2xl border border-gray-100 dark:border-gray-700 dark:bg-gray-900/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 min-w-0">
                  <label
                    htmlFor="receipt-destination"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Alamat
                  </label>
                  <input
                    id="receipt-destination"
                    readOnly
                    value={readOnlyData.destination}
                    className={destReadOnlyClass}
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label
                    htmlFor="receipt-method"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Metode pengiriman
                  </label>
                  <select
                    id="receipt-method"
                    disabled={isReceiptLocked}
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
                  htmlFor="receipt-notes"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Catatan
                </label>
                <textarea
                  id="receipt-notes"
                  disabled={isReceiptLocked}
                  value={formData.notes ?? ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Instruksi logistik untuk penerimaan ini…"
                  className={`${destFieldClass} resize-y min-h-[5.5rem] disabled:cursor-not-allowed`}
                />
              </div>
            </section>

            <OrderFormItemSection title="Pemeriksaan fisik">
              <div className="space-y-4">
                <div className="hidden md:flex items-end gap-4 px-0 md:px-1 flex-nowrap">
                  <div className="flex-1 min-w-[12rem]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Produk
                    </p>
                  </div>
                  <div className="w-24 shrink-0 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Jumlah
                    </p>
                  </div>
                  <div className="w-24 shrink-0 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Diterima
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 md:min-w-[8rem]">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      Catatan
                    </p>
                  </div>
                </div>

                {formData.items?.map((item, idx) => {
                  const line = readOnlyData.items.find(row => row.id === item.id);
                  if (!line) return null;
                  const isLastPemeriksaanRow = !formData.items?.some((laterItem, j) => {
                    if (j <= idx) return false;
                    return readOnlyData.items.some(row => row.id === laterItem.id);
                  });
                  return (
                    <div key={item.id} className="min-w-0">
                      <div className="md:hidden rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 dark:border-primary/30 dark:bg-primary/10">
                        <div>
                          <p className={pemeriksaanStackLabelClass}>Produk</p>
                          <p className="font-bold leading-snug text-gray-900 dark:text-gray-100">{line.product.name}</p>
                          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{line.unit.name}</p>
                        </div>
                        <div>
                          <p className={pemeriksaanStackLabelClass}>Jumlah</p>
                          <div className="w-full rounded-lg bg-gray-100 py-2 text-center text-sm font-mono font-medium tabular-nums text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            {line.quantity}
                          </div>
                        </div>
                        <div>
                          <p className={pemeriksaanStackLabelClass}>Diterima</p>
                          <input
                            type="number"
                            min={0}
                            max={line.quantity}
                            disabled={isReceiptLocked}
                            value={item.quantity_received}
                            onChange={e => updateItem(idx, 'quantity_received', Number(e.target.value))}
                            className={`w-full text-center text-sm font-bold ${lineControlClass}`}
                          />
                        </div>
                        <div>
                          <p className={pemeriksaanStackLabelClass}>Catatan</p>
                          <input
                            type="text"
                            disabled={isReceiptLocked}
                            placeholder="Catatan logistik per barang…"
                            value={item.notes}
                            onChange={e => updateItem(idx, 'notes', e.target.value)}
                            className={`w-full ${lineControlClass}`}
                          />
                        </div>
                      </div>

                      <div
                        className={`hidden md:flex md:items-center md:gap-4 md:px-1 md:pb-4 ${
                          isLastPemeriksaanRow
                            ? ''
                            : 'md:border-b md:border-gray-100 dark:md:border-gray-700'
                        }`}
                      >
                        <div className="min-w-[12rem] flex-1">
                          <p className="font-bold leading-snug text-gray-900 dark:text-gray-100">{line.product.name}</p>
                          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{line.unit.name}</p>
                        </div>
                        <div className="w-24 shrink-0 self-center text-center text-sm font-mono font-medium tabular-nums text-gray-500 bg-gray-100 dark:bg-gray-800 py-2 rounded-lg">
                          {line.quantity}
                        </div>
                        <div className="w-24 shrink-0 self-center">
                          <input
                            type="number"
                            min={0}
                            max={line.quantity}
                            disabled={isReceiptLocked}
                            value={item.quantity_received}
                            onChange={e => updateItem(idx, 'quantity_received', Number(e.target.value))}
                            className={`w-full text-center text-sm font-bold ${lineControlClass}`}
                          />
                        </div>
                        <div className="min-w-0 w-full flex-1 self-center md:min-w-[8rem]">
                          <input
                            type="text"
                            disabled={isReceiptLocked}
                            placeholder="Catatan logistik per barang…"
                            value={item.notes}
                            onChange={e => updateItem(idx, 'notes', e.target.value)}
                            className={`w-full ${lineControlClass}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </OrderFormItemSection>

            {!isReceiptLocked && <OrderFormSaveFooter saving={saving} mode="shipment"/>}
          </form>
        </div>
      </fieldset>

      {receiptActionDialog && (
        <OrderActionDialog
          mode="receipt"
          action={receiptActionDialog === 'done' ? 'confirm' : 'cancel'}
          orderNumber={readOnlyData.number}
          saving={saving}
          actionError={actionError}
          confirmDetail="Ini akan menandai penerimaan sebagai selesai."
          onClose={closeReceiptActionDialog}
          onSubmit={handleReceiptAction}
        />
      )}
    </div>
  );
}
