import React, { useState, useEffect, useMemo } from 'react';
import { Truck } from 'lucide-react';
import { TableSearchInput } from '../components/TableSearchInput';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierList, type SupplierListItem, type SupplierDetail, type SupplierCreate, type SupplierUpdate } from '../services/suppliers';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { formatDate, formatMoney } from '../utils/format';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FormActionButton } from '../components/FormActionButton';
import { PageHeading } from '../components/PageHeading';
import { toastSuccessCreate, toastSuccessDelete, toastSuccessUpdate } from '../utils/toast';

export default function Suppliers() {
  const emptySupplierData: SupplierCreate = {
    name: '',
    business_entity: 'pt',
    email: '',
    phone: '',
    address: ''
  };

  const [suppliers, setSuppliers] = useState<SupplierList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierListItem | null>(null);
  const [formData, setFormData] = useState<SupplierCreate>(emptySupplierData);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(function () {
    let cancelled = false;
    async function loadSuppliers() {
      setLoading(true);
      setError(null);
      try {
        const suppliers = await getSuppliers();
        if (!cancelled) {
          setSuppliers(suppliers);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat pemasok');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSuppliers();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const query = searchQuery.toLowerCase();
    return suppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(query) || supplier.phone.toLowerCase().includes(query)
    );
  }, [suppliers, searchQuery]);

  function openForm(supplier?: SupplierListItem) {
    setFormError(null);
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        business_entity: supplier.business_entity,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      });
    } else {
      setEditingSupplier(null);
      setFormData(emptySupplierData);
    }
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingSupplier(null);
    setFormData(emptySupplierData);
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama wajib diisi');
      return;
    }
    if (!formData.business_entity) {
      setFormError('Jenis entitas bisnis wajib diisi');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email wajib diisi');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor telepon wajib diisi');
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      if (editingSupplier) {
        const payload: SupplierUpdate = {
          name: formData.name.trim(),
          business_entity: formData.business_entity,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        };
        const updated = await updateSupplier(editingSupplier.id, payload);
        setSuppliers((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
        );
        toastSuccessUpdate(updated.name);
      } else {
        const payload: SupplierCreate = { name: formData.name.trim(), business_entity: formData.business_entity, email: formData.email, phone: formData.phone, address: formData.address };
        const created = await createSupplier(payload);
        const newRow: SupplierListItem = {
          ...created,
          count_purchase_orders: 0,
          last_purchase_order_date: null,
          total_purchase_amount: 0,
        };
        setSuppliers((prev) => [...prev, newRow]);
        toastSuccessCreate(created.name);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  function openDelete(supplier: SupplierDetail) {
    setDeleteError(null);
    setDeletingSupplier(supplier);
    setIsDeleteOpen(true);
  }
  
  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingSupplier(null);
    setDeleteError(null);
    setIsDeleting(false);
  }

  async function handleDelete() {
    if (!deletingSupplier) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const id = deletingSupplier.id;
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      closeDelete();
      toastSuccessDelete(deletingSupplier.name);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus pemasok');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="w-full min-w-0 sm:flex-1 sm:pr-1">
          <PageHeading title="Daftar Pemasok" description="Mengelola pemasok" />
        </div>
        <div className="shrink-0 self-end sm:self-auto">
          <AddItemButton text="Tambah Pemasok" onClick={() => openForm()} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <TableSearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau nomor telepon..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama & Entitas</th>
                <th className="px-6 py-4 font-semibold">Info Kontak</th>
                <th className="px-4 py-4 font-semibold text-center">Jumlah Pembelian</th>
                <th className="px-4 py-4 font-semibold text-center">Pembelian Terakhir</th>
                <th className="px-6 py-4 font-semibold text-right">Total Pembelian</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Memuat pemasok...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {suppliers.length === 0 ? 'Belum ada pemasok' : 'Tidak ada pemasok yang cocok dengan pencarian Anda'}
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                    onClick={() => openForm(supplier)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{supplier.name}</div>
                      <div className="text-xs font-semibold capitalize text-primary/80 mt-1 inline-flex items-center px-2 py-0.5 rounded bg-primary/10 dark:bg-primary/20">
                        {supplier.business_entity.length <= 2 ? supplier.business_entity.toUpperCase() : supplier.business_entity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-gray-200 font-medium">{supplier.phone || '—'}</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">{supplier.email || '—'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-2.5 py-0.5 rounded-full text-xs">
                        {supplier.count_purchase_orders}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-gray-600 dark:text-gray-400">
                      {supplier.last_purchase_order_date ? formatDate(supplier.last_purchase_order_date) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                      {formatMoney(supplier.total_purchase_amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeleteIconButton
                        onClick={(e) => { e.stopPropagation(); openDelete(supplier); }}
                        aria-label="Hapus pemasok"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0">
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Truck className="text-primary" size={24} /> 
                  {editingSupplier ? 'Edit Pemasok' : 'Tambah Pemasok'}
                </h2>
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                {formError && <ErrorAlert message={formError} variant="inline" />}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Perusahaan/Individu</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Jenis Entitas Bisnis</label>
                    <select
                      value={formData.business_entity}
                      required
                      onChange={(e) => setFormData({ ...formData, business_entity: e.target.value as SupplierDetail['business_entity'] })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100"
                    >
                      <option value="pt">PT (Perseroan Terbatas)</option>
                      <option value="cv">CV (Commanditaire Vennootschap)</option>
                      <option value="perorangan">Personal / Individual</option>
                      <option value="ud">UD (Usaha Dagang)</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nomor Telepon</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alamat</label>
                    <textarea
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                  <FormActionButton variant="cancel" text="Batal" onClick={closeForm} />
                <FormActionButton variant="primary" text={saving ? 'Menyimpan...' : 'Simpan'}/>
                </div>
              </form>
            </fieldset>
          </div>
        </div>
      )}

      {isDeleteOpen && deletingSupplier && (
        <ConfirmDeleteModal
          title="Hapus Pemasok"
          itemName={deletingSupplier.name}
          errorMessage={deleteError}
          deleting={isDeleting}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
