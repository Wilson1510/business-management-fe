import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { formatQty } from '../utils/format';
import { ErrorAlert } from '../components/ErrorAlert';
import { FormActionButton } from '../components/FormActionButton';
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
          if (product) {
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
          } else {
            setError('Produk tidak ditemukan');
          }
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

    if (!formData.name || !formData.category_id) {
      setError('Nama dan Kategori wajib diisi');
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
      } else {
        await createProduct(payload);
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
      <div className="p-12 text-center text-gray-500 dark:text-gray-400">
        Memuat form...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500 pb-12">
      <fieldset disabled={saving}>
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/catalog')}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isEditing ? 'Edit Produk' : 'Tambah Produk'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{isEditing ? skuNumber : 'Pengaturan Entri Baru'}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          <form id="product-form" onSubmit={handleSubmit} className="p-8 space-y-10">
            {error && <ErrorAlert message={error} variant="form" />}

            {/* SECTION: GENERAL INFO */}
            <section className="space-y-5">
              <div className="border-l-4 border-primary pl-3 mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Informasi Umum</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detail inti yang mengidentifikasi item ini</p>
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
              <div className="flex justify-between items-end">
                <div className="border-l-4 border-indigo-500 pl-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Konversi Satuan ke Satuan Dasar</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasikan bagaimana satuan lebih kecil/lebih besar berkorelasi dengan satuan dasar</p>
                </div>
                <button type="button" onClick={addProductUnit} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus size={16} /> Tambah Satuan
                </button>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900/30 p-6 shadow-sm">
                {formData.units.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tidak ada satuan yang ditambahkan. Anda harus mengkonfigurasi minimal satu satuan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.units.map((u, index) => {
                      const baseUnitObj = formData.units.find(u => u.is_base_unit);
                      const baseUnitName = baseUnitObj ? unitsList.find(ul => ul.id === baseUnitObj.unit_id)?.name : 'satuan dasar';
                      const isBase = u.is_base_unit;
                      const rowKey = u.id != null ? `unit-${u.id}` : `unit-new-${index}`;

                      return (
                        <div key={rowKey} className="flex items-center gap-4">
                          <select
                            required
                            value={u.unit_id || ''}
                            onChange={e => updateProductUnit(index, 'unit_id', Number(e.target.value))}
                            className="w-1/3 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            <option value="" disabled hidden>Pilih satuan...</option>
                            {unitsList.map(ul => <option key={ul.id} value={ul.id}>{ul.name}</option>)}
                          </select>
                          
                          <span className="text-gray-400 dark:text-gray-500 font-bold">=</span>
                          
                          <div className="flex items-center gap-3 w-1/3">
                            <input
                              type="number"
                              min="1"
                              readOnly={isBase}
                              value={isBase ? 1 : u.multiplier}
                              onChange={e => updateProductUnit(index, 'multiplier', Number(e.target.value))}
                              className={`w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-medium text-gray-900 dark:text-gray-100 ${isBase ? 'bg-gray-100/50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-900/50'}`}
                            />
                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-[50px]">
                              {baseUnitName}
                            </span>
                          </div>
                          
                          <div className="w-10 flex justify-center">
                            {!isBase && (
                              <button type="button" onClick={() => removeProductUnit(index)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                                <Trash2 size={18} />
                              </button>
                            )}
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
              <div className="flex justify-between items-end">
                <div className="border-l-4 border-emerald-500 pl-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Harga Jual</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasikan daftar harga dasar di seluruh satuan yang dikonfigurasi</p>
                </div>
                <button type="button" onClick={addProductPrice} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Plus size={16} /> Tambah Harga Jual
                </button>
              </div>

              <div className="border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900/30 p-6 shadow-sm">
                {formData.prices.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tidak ada harga jual yang dikonfigurasi</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Headers */}
                    <div className="flex items-center gap-4 px-2">
                      <div className="flex-1"><label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Satuan Jual</label></div>
                      <div className="w-1/4"><label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jumlah Minimum</label></div>
                      <div className="w-1/3"><label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Harga</label></div>
                      <div className="w-10"></div>
                    </div>

                    {formData.prices.map((p, i) => {
                      const rowKey = p.id != null ? `price-${p.id}` : `price-new-${i}`;
                      return (
                      <div key={rowKey} className="flex items-center gap-4">
                        <div className="flex-1">
                          <select
                            required
                            value={p.unit_id || ''}
                            onChange={e => updateProductPrice(i, 'unit_id', Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium text-gray-900 dark:text-gray-100"
                          >
                            <option value="" disabled hidden>Pilih satuan jual...</option>
                            {unitsList.map(ul => <option key={ul.id} value={ul.id}>{ul.name}</option>)}
                          </select>
                        </div>
                        <div className="w-1/4">
                          <input
                            type="number"
                            min="1"
                            value={p.minimum_quantity}
                            onChange={e => updateProductPrice(i, 'minimum_quantity', Number(e.target.value))}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-medium text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div className="w-1/3 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">Rp</span>
                          <input
                            type="text"
                            value={formatQty(Number(p.price))}
                            onChange={e =>
                              updateProductPrice(i, 'price', Number(e.target.value.replace(/[^0-9]/g, '')))
                            }
                            placeholder="0.00"
                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                        </div>
                        <div className="w-10 flex justify-center">
                          <button type="button" onClick={() => removeProductPrice(i)} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer">
                            <Trash2 size={18} />
                          </button>
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
                disabled={saving}
              />
            </div>
          </form>
        </div>
      </fieldset>
    </div>
  );
}
