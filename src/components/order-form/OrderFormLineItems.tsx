import { Plus, Trash2 } from 'lucide-react';
import type { ProductListItem } from '../../services/products';
import type { UnitListItem } from '../../services/units';
import { formatMoney, formatQty } from '../../utils/format';

export type OrderFormLineItemRow = {
  product_id: number;
  unit_id: number;
  quantity: number;
  price: number;
};

export type OrderFormLineItemsProps = {
  isOrderLocked: boolean;
  sectionTitle: string;
  emptyMessage: string;
  items: OrderFormLineItemRow[];
  products: ProductListItem[];
  units: UnitListItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onProductChange: (index: number, productId: number) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onUnitChange: (index: number, unitId: number) => void;
  onPriceChange: (index: number, price: number) => void;
};

const controlClass =
  'px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium disabled:opacity-70 dark:bg-gray-900/40 dark:border-gray-600';

export function OrderFormLineItems({
  isOrderLocked,
  sectionTitle,
  emptyMessage,
  items,
  products,
  units,
  onAddItem,
  onRemoveItem,
  onProductChange,
  onQuantityChange,
  onUnitChange,
  onPriceChange
}: OrderFormLineItemsProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-700 pb-3">
        <div className="border-l-4 border-primary pl-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{sectionTitle}</h3>
        </div>
        {!isOrderLocked && (
          <button
            type="button"
            onClick={onAddItem}
            className="text-sm font-semibold text-primary hover:text-primary/80 bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="border border-gray-200 rounded-xl bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
        {items.length === 0 ? (
          <div className="py-8 text-center text-gray-400 font-medium text-sm dark:text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 px-2">
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Product
                </label>
              </div>
              <div className="w-1/4 min-w-[80px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Quantity
                </label>
              </div>
              <div className="w-1/4 min-w-[100px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Unit
                </label>
              </div>
              <div className="w-1/4 min-w-[100px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Unit Price
                </label>
              </div>
              <div className="w-1/4 min-w-[100px] text-right">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Line Total
                </label>
              </div>
              {!isOrderLocked && <div className="w-10" aria-hidden />}
            </div>

            {items.map((item, i) => {
              const lineTotal = Number(item.quantity) * Number(item.price);

              return (
                <div key={i} className="flex items-center gap-4">
                  <select
                    value={item.product_id}
                    disabled={isOrderLocked}
                    onChange={e => onProductChange(i, Number(e.target.value))}
                    className={`flex-1 min-w-[200px] ${controlClass}`}
                  >
                    <option value={0} disabled>
                      Select Product...
                    </option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    disabled={isOrderLocked}
                    onChange={e => onQuantityChange(i, Number(e.target.value))}
                    className={`w-1/4 min-w-[80px] ${controlClass}`}
                  />

                  <select
                    value={item.unit_id}
                    disabled={isOrderLocked}
                    onChange={e => onUnitChange(i, Number(e.target.value))}
                    className={`w-1/4 min-w-[100px] ${controlClass}`}
                  >
                    <option value={0} disabled>
                      Unit
                    </option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>

                  <div className="w-1/4 min-w-[100px] relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-medium text-sm">Rp</span>
                    <input
                      type="text"
                      value={formatQty(Number(item.price))}
                      disabled={isOrderLocked}
                      onChange={e =>
                        onPriceChange(i, Number(e.target.value.replace(/[^0-9]/g, '')))
                      }
                      className={`w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium disabled:opacity-70 dark:bg-gray-900/40 dark:border-gray-600`}
                    />
                  </div>

                  <div className="w-1/4 min-w-[100px] text-right font-bold self-center tabular-nums">
                    {formatMoney(lineTotal)}
                  </div>

                  {!isOrderLocked && (
                    <div className="w-10 flex justify-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(i)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer dark:hover:bg-red-950/40"
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
    </section>
  );
}
