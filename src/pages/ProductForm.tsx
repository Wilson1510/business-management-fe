import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { formatQty } from '../utils/format';
import { ErrorAlert } from '../components/ErrorAlert';
import { FormActionButton } from '../components/FormActionButton';
import { InlineAddItemButton } from '../components/InlineAddItemButton';
import { PageHeading } from '../components/PageHeading';
import {
  getProduct,
  createProduct,
  updateProduct,
  type ProductUnit,
  type ProductPrice,
  type ProductCreate,
  type ProductUpdate,
} from '../services/products';
import { getCategories, type CategoryListItem } from '../services/categories';
import { getUnits, type UnitListItem } from '../services/units';
import { toastSuccessCreate, toastSuccessUpdate } from '../utils/toast';

const productPriceRowGridClass =
  'grid w-full min-w-0 [grid-template-columns:minmax(0,1.5fr)_minmax(5.5rem,0.38fr)_minmax(0,1.05fr)_2.5rem] gap-3 sm:gap-4';

const stackedFieldLabelClass =
  'block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 dark:text-gray-400';

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [unitsList, setUnitsList] = useState<UnitListItem[]>([]);
  
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    category_id: 0,
    units: [],
    prices: []
  });
  const [skuNumber, setSkuNumber] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(function () {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [cats, uns] = await Promise.all([getCategories(), getUnits()]);
        setCategories(cats);
        setUnitsList(uns);

        if (isEditing && id) {
          const product = await getProduct(Number(id));
          setFormData({
            name: product.name,
            category_id: product.category.id,
            units: product.units.map(
              u => ({
                id: u.id,
                unit_id: u.unit.id,
                multiplier: u.multiplier,
                is_base_unit: u.is_base_unit
              })
            ),
            prices: product.prices.map(
              p => ({
                id: p.id,
                unit_id: p.unit.id,
                minimum_quantity: p.minimum_quantity,
                price: p.price
              })
            )
          });
          setSkuNumber(product.sku_number);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Gagal memuat data produk');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return function cleanup() {
      cancelled = true;
    };
  }, [id, isEditing]);

  // --- Units Logic ---
  function addProductUnit() {
    setFormData({
      ...formData,
      units: [
        ...formData.units,
        {
          unit_id: 0,
          multiplier: 1,
          is_base_unit: formData.units.length === 0
        }
      ]
    });
  }

  function updateProductUnit(index: number, field: keyof ProductUnit, value: number | boolean) {
    const newUnits = [...formData.units];
    newUnits[index] = { ...newUnits[index], [field]: value };
    setFormData({ ...formData, units: newUnits });
  };

  function removeProductUnit(index: number) {
    const newUnits = formData.units.filter((_, i) => i !== index);
    if (newUnits.length > 0) {
      newUnits[0].is_base_unit = true;
      newUnits[0].multiplier = 1;
      for (let i = 1; i < newUnits.length; i++) {
        newUnits[i].is_base_unit = false;
      }
    }
    setFormData({ ...formData, units: newUnits });
  };

  // --- Prices Logic ---
  function addProductPrice() {
    setFormData({
      ...formData,
      prices: [
        ...formData.prices,
        {
          unit_id: 0,
          minimum_quantity: 1,
          price: 0
        }
      ]
    });
  };

  function updateProductPrice(index: number, field: keyof ProductPrice, value: number) {
    const newPrices = [...formData.prices];
    newPrices[index] = { ...newPrices[index], [field]: value };
    setFormData({ ...formData, prices: newPrices });
  };

  function removeProductPrice(index: number) {
    const newPrices = formData.prices.filter((_, i) => i !== index);
    setFormData({ ...formData, prices: newPrices });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Nama wajib diisi');
      return;
    }

    if (formData.units.length === 0) {
      setError('Minimal satu satuan wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload: ProductCreate = {
        name: formData.name,
        category_id: formData.category_id,
        units: formData.units,
        prices: formData.prices
      };

      if (isEditing && id) {
        await updateProduct(Number(id), payload as ProductUpdate);
        toastSuccessUpdate(formData.name);
      } else {
        await createProduct(payload);
        toastSuccessCreate(formData.name);
      }
      navigate('/catalog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-12 text-center text-gray-500 dark:text-gray-400">
        Memuat form...
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0">
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <PageHeading
            title={isEditing ? 'Edit Produk' : 'Tambah Produk'}
            description={isEditing ? skuNumber : undefined}
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          <form id="product-form" onSubmit={handleSubmit} className="p-8 space-y-10">
            {error && <ErrorAlert message={error} variant="form" />}

            {/* SECTION: GENERAL INFO */}
            <section className="space-y-5">
              <div className="border-l-4 border-primary pl-3 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Informasi Umum</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="e.g. Minuman Mineral"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kategori</label>
                  <select
                    required
                    value={formData.category_id || ''}
                    onChange={e => setFormData({ ...formData, category_id: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100"
                  >
                    <option value="" disabled hidden>Pilih kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* SECTION: UNITS CONFIGURATION */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
                <div className="min-w-0 w-full border-l-4 border-indigo-500 pl-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Konversi Satuan ke Satuan Dasar</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasikan bagaimana satuan lebih kecil/lebih besar berkorelasi dengan satuan dasar</p>
                </div>
                <div className="flex w-full shrink-0 justify-end md:w-auto md:justify-start">
                  <InlineAddItemButton tone="indigo" text="Tambah Satuan" onClick={addProductUnit} />
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900/30 p-6 shadow-sm">
                {formData.units.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Belum ada satuan yang ditambahkan. Anda harus mengkonfigurasi minimal satu satuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.units.map((u, index) => {
                      const baseUnitObj = formData.units.find(u => u.is_base_unit);
                      const baseUnitName = baseUnitObj ? unitsList.find(ul => ul.id === baseUnitObj.unit_id)?.name : 'satuan dasar';
                      const isBase = u.is_base_unit;
                      const rowKey = u.id != null ? `unit-${u.id}` : `unit-new-${index}`;

                      const unitSelectClass =
                        'w-full min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100';

                      const multiplierInputClass = `min-w-0 flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium text-gray-900 dark:text-gray-100 ${isBase ? 'bg-gray-100/50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-900/50'}`;

                      return (
                        <div key={rowKey} className="min-w-0">
                          <div className="md:hidden rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 dark:border-indigo-500/30 p-4 space-y-3">
                            <div>
                              <label className={stackedFieldLabelClass}>Satuan</label>
                              <select
                                required
                                value={u.unit_id || ''}
                                onChange={e => updateProductUnit(index, 'unit_id', Number(e.target.value))}
                                className={unitSelectClass}
                              >
                                <option value="" disabled hidden>
                                  Pilih satuan...
                                </option>
                                {unitsList.map(ul => (
                                  <option key={ul.id} value={ul.id}>
                                    {ul.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={stackedFieldLabelClass}>Pengali ke satuan dasar</label>
                              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                <span className="shrink-0 text-gray-400 dark:text-gray-500 font-bold" aria-hidden>
                                  =
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  readOnly={isBase}
                                  value={isBase ? 1 : u.multiplier}
                                  onChange={e => updateProductUnit(index, 'multiplier', Number(e.target.value))}
                                  className={multiplierInputClass}
                                />
                                <span className="shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400 min-w-0 text-right sm:min-w-[4.5rem]">
                                  {baseUnitName}
                                </span>
                                {!isBase && (
                                  <DeleteIconButton
                                    onClick={() => removeProductUnit(index)}
                                    aria-label="Hapus satuan"
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hidden md:flex w-full min-w-0 items-center gap-3 sm:gap-4">
                            <select
                              required
                              value={u.unit_id || ''}
                              onChange={e => updateProductUnit(index, 'unit_id', Number(e.target.value))}
                              className="min-w-0 flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100"
                            >
                              <option value="" disabled hidden>
                                Pilih satuan...
                              </option>
                              {unitsList.map(ul => (
                                <option key={ul.id} value={ul.id}>
                                  {ul.name}
                                </option>
                              ))}
                            </select>

                            <span className="shrink-0 text-gray-400 dark:text-gray-500 font-bold" aria-hidden>
                              =
                            </span>

                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <input
                                type="number"
                                min="1"
                                readOnly={isBase}
                                value={isBase ? 1 : u.multiplier}
                                onChange={e => updateProductUnit(index, 'multiplier', Number(e.target.value))}
                                className={multiplierInputClass}
                              />
                              <span className="shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400 min-w-0 text-right sm:min-w-[4.5rem]">
                                {baseUnitName}
                              </span>
                            </div>

                            <div className="w-10 shrink-0 flex justify-center">
                              {!isBase && (
                                <DeleteIconButton
                                  onClick={() => removeProductUnit(index)}
                                  aria-label="Hapus satuan"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      *Baris pertama secara otomatis berfungsi sebagai satuan terkecil/dasar (Pengali = 1)
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION: PRICING CONFIGURATION */}
            <section className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
                <div className="min-w-0 w-full border-l-4 border-emerald-500 pl-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Harga Jual</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasikan daftar harga dasar di seluruh satuan yang dikonfigurasi</p>
                </div>
                <div className="flex w-full shrink-0 justify-end md:w-auto md:justify-start">
                  <InlineAddItemButton tone="emerald" text="Tambah Harga Jual" onClick={addProductPrice} />
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900/30 p-6 shadow-sm">
                {formData.prices.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Belum ada harga jual yang dikonfigurasi</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`hidden md:grid ${productPriceRowGridClass} mb-1 items-end border-b border-gray-100 pb-2.5 dark:border-gray-700`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Satuan Jual</span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                        title="Jumlah Minimum"
                      >
                        Jml. min.
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Harga</span>
                      <span className="w-10 shrink-0" />
                    </div>

                    {formData.prices.map((p, i) => {
                      const rowKey = p.id != null ? `price-${p.id}` : `price-new-${i}`;
                      const priceSelectClass =
                        'w-full min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium text-gray-900 dark:text-gray-100';
                      const priceInputClass =
                        'w-full min-w-0 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium text-gray-900 dark:text-gray-100';
                      const priceAmountClass =
                        'w-full min-w-0 pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500';

                      return (
                        <div key={rowKey} className="min-w-0">
                          <div className="md:hidden rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 dark:border-emerald-500/30 p-4 space-y-3">
                            <div>
                              <label htmlFor={`price-unit-m-${rowKey}`} className={stackedFieldLabelClass}>
                                Satuan jual
                              </label>
                              <select
                                id={`price-unit-m-${rowKey}`}
                                required
                                value={p.unit_id || ''}
                                onChange={e => updateProductPrice(i, 'unit_id', Number(e.target.value))}
                                className={priceSelectClass}
                              >
                                <option value="" disabled hidden>
                                  Pilih satuan jual...
                                </option>
                                {unitsList.map(ul => (
                                  <option key={ul.id} value={ul.id}>
                                    {ul.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor={`price-minqty-m-${rowKey}`} className={stackedFieldLabelClass}>
                                Jumlah minimum
                              </label>
                              <input
                                id={`price-minqty-m-${rowKey}`}
                                type="number"
                                min="1"
                                value={p.minimum_quantity}
                                onChange={e => updateProductPrice(i, 'minimum_quantity', Number(e.target.value))}
                                className={priceInputClass}
                              />
                            </div>
                            <div>
                              <label htmlFor={`price-amount-m-${rowKey}`} className={stackedFieldLabelClass}>
                                Harga
                              </label>
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="relative min-w-0 flex-1">
                                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                                    Rp
                                  </span>
                                  <input
                                    id={`price-amount-m-${rowKey}`}
                                    type="text"
                                    value={formatQty(Number(p.price))}
                                    onChange={e =>
                                      updateProductPrice(i, 'price', Number(e.target.value.replace(/[^0-9]/g, '')))
                                    }
                                    placeholder="0.00"
                                    className={priceAmountClass}
                                  />
                                </div>
                                <DeleteIconButton
                                  onClick={() => removeProductPrice(i)}
                                  aria-label="Hapus baris harga"
                                />
                              </div>
                            </div>
                          </div>

                          <div className={`hidden md:grid ${productPriceRowGridClass} items-center`}>
                            <div className="min-w-0">
                              <label htmlFor={`price-unit-${rowKey}`} className="sr-only">
                                Satuan jual
                              </label>
                              <select
                                id={`price-unit-${rowKey}`}
                                required
                                value={p.unit_id || ''}
                                onChange={e => updateProductPrice(i, 'unit_id', Number(e.target.value))}
                                className={priceSelectClass}
                              >
                                <option value="" disabled hidden>
                                  Pilih satuan jual...
                                </option>
                                {unitsList.map(ul => (
                                  <option key={ul.id} value={ul.id}>
                                    {ul.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="min-w-0">
                              <label htmlFor={`price-minqty-${rowKey}`} className="sr-only">
                                Jumlah minimum
                              </label>
                              <input
                                id={`price-minqty-${rowKey}`}
                                type="number"
                                min="1"
                                value={p.minimum_quantity}
                                onChange={e => updateProductPrice(i, 'minimum_quantity', Number(e.target.value))}
                                className={priceInputClass}
                              />
                            </div>
                            <div className="min-w-0">
                              <label htmlFor={`price-amount-${rowKey}`} className="sr-only">
                                Harga
                              </label>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                                  Rp
                                </span>
                                <input
                                  id={`price-amount-${rowKey}`}
                                  type="text"
                                  value={formatQty(Number(p.price))}
                                  onChange={e =>
                                    updateProductPrice(i, 'price', Number(e.target.value.replace(/[^0-9]/g, '')))
                                  }
                                  placeholder="0.00"
                                  className={priceAmountClass}
                                />
                              </div>
                            </div>
                            <div className="flex w-10 shrink-0 justify-center">
                              <DeleteIconButton
                                onClick={() => removeProductPrice(i)}
                                aria-label="Hapus baris harga"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Footer Controls */}
            <div className="flex items-center justify-end gap-3 pt-6 mt-10 border-t border-gray-100 dark:border-gray-700">
              <FormActionButton
                variant="cancel"
                text="Batal"
                onClick={() => navigate('/catalog')}
              />
              <FormActionButton
                variant="primary"
                text={saving ? 'Menyimpan...' : 'Simpan'}
              />
            </div>
          </form>
        </div>
      </fieldset>
    </div>
  );
}
