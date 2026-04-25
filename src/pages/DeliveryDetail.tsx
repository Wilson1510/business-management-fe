import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, ArrowLeft, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { ErrorAlert } from '../components/ErrorAlert';
import { StatusBadge } from '../components/StatusBadge';
import {
  getDelivery,
  updateDelivery,
  doneDelivery,
  cancelDelivery,
  type DeliveryDetail,
  type DeliveryUpdate,
  type DeliveryProduct
} from '../services/deliveries';

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
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error loading delivery details');
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
      navigate(`/sales/deliveries`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating delivery');
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
      setActionError('Delivery not found');
      return;
    }
    setActionError(null);
    setSaving(true);
    try {
      if (deliveryActionDialog === 'done') {
        await doneDelivery(Number(id));
      } else {
        await cancelDelivery(Number(id));
      }
      const delivery = await getDelivery(Number(id));
      setStatus(delivery.status);
      closeDeliveryActionDialog();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : deliveryActionDialog === 'done'
          ? 'Error completing delivery'
          : 'Error cancelling delivery'
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
            onClick={() => navigate('/sales/deliveries')}
            className="p-2 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Truck size={24} className="text-primary"/>
              {readOnlyData.number}
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Source Order: {readOnlyData.sales_order.number || `SO ID: ${readOnlyData.sales_order.id}`}
            </p>
          </div>
        </div>

        {!isDeliveryLocked && (
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
            >
              <Save size={18} />
              Save Changes
            </button>
            <button
              disabled={saving}
              onClick={handleDeliveryAction}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/20 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              Complete Delivery
            </button>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} variant="page" />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Logistics Meta Side */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Destination</h3>
                <p>{readOnlyData.destination}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipment Method</label>
              <select
                disabled={isDeliveryLocked}
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60"
              >
                <option value="delivery">Delivery</option>
                <option value="pickup">Customer Pickup</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipment Notes</label>
              <textarea
                disabled={isDeliveryLocked}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Logistics instructions..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium disabled:opacity-60 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Product Items Execution Side */}
        <div className="md:col-span-2">
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-lg font-bold text-gray-900 border-l-4 border-primary pl-3">Physical Check</h3>
             </div>

             <div className="p-6 space-y-4">
                <div className="flex text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
                  <div className="flex-1">Product Details & Item Notes</div>
                  <div className="w-24 text-center">Scheduled</div>
                  <div className="w-28 text-center">Shipped</div>
                </div>

                {formData.items.map((item, idx) => {
                  const line = readOnlyData.items.find(row => row.id === item.id);
                  if (!line) {
                    setError('Item not found');
                    return null;
                  }
                  return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-start gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
                    <div className="flex-1 space-y-3 w-full">
                      <div>
                        <p className="font-bold text-gray-900">{line.product.name}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Unit: {line.unit.name}</p>
                      </div>
                      <input
                        type="text"
                        disabled={isDeliveryLocked}
                        placeholder="Item-level logistics note..."
                        value={item.notes}
                        onChange={e => updateItem(idx, 'notes', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-60"
                      />
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-auto w-full sm:w-auto">
                      <div className="w-24 text-center font-mono font-medium text-gray-500 bg-gray-100 py-2 rounded-lg">
                        {line.quantity}
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          min={0}
                          max={line.quantity}
                          disabled={isDeliveryLocked}
                          value={item.quantity_delivered}
                          onChange={e => updateItem(idx, 'quantity_delivered', Number(e.target.value))}
                          className="w-full text-center font-bold px-3 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                );
                })}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
