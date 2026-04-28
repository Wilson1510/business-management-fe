import { DeleteIconButton } from '../DeleteIconButton';
import { InlineAddItemButton } from '../InlineAddItemButton';
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
  'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium text-gray-900 dark:bg-gray-900/40 dark:border-gray-600 dark:text-gray-100 disabled:opacity-70';

/** Satu baris item: produk, jumlah, satuan, harga — satu kelompok dalam kartu */
const orderLineItemCardClass =
  'rounded-xl border border-primary/40 bg-primary/5 px-3 py-3 shadow-sm dark:border-primary-800/60 dark:bg-primary-950/30 md:px-4 md:py-3.5';

const mobileLineLabelClass =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 md:hidden';

const orderLineHeaderRowClass =
  'mb-2 hidden gap-4 border-b border-gray-100 pb-2 dark:border-gray-700 md:flex md:items-end';

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
    <section className="mb-2 space-y-4">
      <div className="flex flex-col items-start gap-3 border-b border-gray-100 pb-3 dark:border-gray-700 sm:flex-row sm:items-end sm:justify-between">
        <div className="border-l-4 border-primary pl-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{sectionTitle}</h3>
        </div>
        {!isOrderLocked && (
          <div className="shrink-0 self-end sm:self-auto">
            <InlineAddItemButton tone="primary" text="Tambah Produk" onClick={onAddItem} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-5">
            <div className={orderLineHeaderRowClass}>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Produk
                </span>
              </div>
              <div className="w-24 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Jumlah
                </span>
              </div>
              <div className="w-36 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Satuan
                </span>
              </div>
              <div className="w-40 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Harga satuan
                </span>
              </div>
              <div className="w-36 shrink-0 text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Total harga produk
                </span>
              </div>
              {!isOrderLocked && <div className="w-10 shrink-0" aria-hidden />}
            </div>

            {items.map((item, i) => {
              const lineTotal = Number(item.quantity) * Number(item.price);

              return (
                <div
                  key={i}
                  className={`${orderLineItemCardClass} flex flex-col gap-2.5 md:flex-row md:items-center md:gap-4`}
                >
                  <div className="min-w-0 md:flex-1">
                    <span className={mobileLineLabelClass}>Produk</span>
                    <select
                      value={item.product_id}
                      disabled={isOrderLocked}
                      onChange={e => onProductChange(i, Number(e.target.value))}
                      className={controlClass}
                    >
                      <option value={0} disabled>
                        Pilih Produk...
                      </option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:w-24 md:shrink-0">
                    <span className={mobileLineLabelClass}>Jumlah</span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      disabled={isOrderLocked}
                      onChange={e => onQuantityChange(i, Number(e.target.value))}
                      className={controlClass}
                    />
                  </div>

                  <div className="md:w-36 md:shrink-0">
                    <span className={mobileLineLabelClass}>Satuan</span>
                    <select
                      value={item.unit_id}
                      disabled={isOrderLocked}
                      onChange={e => onUnitChange(i, Number(e.target.value))}
                      className={controlClass}
                    >
                      <option value={0} disabled>
                        Satuan
                      </option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:w-40 md:shrink-0">
                    <span className={mobileLineLabelClass}>Harga satuan</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 font-medium text-sm text-gray-500 dark:text-gray-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={formatQty(Number(item.price))}
                        disabled={isOrderLocked}
                        onChange={e =>
                          onPriceChange(i, Number(e.target.value.replace(/[^0-9]/g, '')))
                        }
                        className={`${controlClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div className="hidden shrink-0 text-right tabular-nums md:flex md:w-36 md:flex-col md:items-end md:justify-center md:leading-tight">
                    <span className="sr-only">Total harga produk</span>
                    <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatMoney(lineTotal)}
                    </div>
                  </div>

                  {!isOrderLocked && (
                    <div className="hidden w-10 shrink-0 md:flex md:justify-center">
                      <DeleteIconButton onClick={() => onRemoveItem(i)} aria-label="Hapus baris" />
                    </div>
                  )}

                  <div className="border-t border-gray-200/90 pt-3 dark:border-gray-600/80 md:hidden">
                    {isOrderLocked ? (
                      <div className="flex flex-row items-baseline justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Total harga produk
                        </span>
                        <div className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
                          {formatMoney(lineTotal)}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-row items-center justify-between gap-3">
                        <div>
                          <span className={mobileLineLabelClass}>Total harga produk</span>
                          <div className="text-base font-bold tabular-nums text-gray-900 dark:text-gray-100">
                            {formatMoney(lineTotal)}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <DeleteIconButton onClick={() => onRemoveItem(i)} aria-label="Hapus baris" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
