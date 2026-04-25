import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Trash2, Truck } from 'lucide-react';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier, type SupplierList, type SupplierListItem, type SupplierDetail, type SupplierCreate, type SupplierUpdate } from '../services/suppliers';
import { ErrorAlert } from '../components/ErrorAlert';
import { formatDate, formatMoney } from '../utils/format';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

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

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
          setError(e instanceof Error ? e.message : 'Failed to load suppliers');
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
      supplier.name.toLowerCase().includes(query) ||
      supplier.email.toLowerCase().includes(query) ||
      supplier.phone.toLowerCase().includes(query)
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
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && !value.trim()) {
        setFormError(`${key} is required`);
        return;
      }
    }
    setFormError(null);

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
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
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
  }

  async function handleDelete() {
    if (!deletingSupplier) return;
    setDeleteError(null);
    try {
      const id = deletingSupplier.id;
      await deleteSupplier(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      closeDelete();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete supplier');
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Manage Suppliers</h2>
          <p className="text-sm text-gray-500">Track and manage inventory vendors</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 cursor-pointer"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">Name & Entity</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-4 py-4 font-semibold text-center">Total PO</th>
                <th className="px-4 py-4 font-semibold text-center">Last PO</th>
                <th className="px-6 py-4 font-semibold text-right">Total Spend</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Loading suppliers...</td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {suppliers.length === 0 ? 'No suppliers found. Start by creating one.' : 'No suppliers match your search.'}
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
                      <div className="text-xs font-semibold text-primary/80 mt-1 inline-flex items-center px-2 py-0.5 rounded bg-primary/10 dark:bg-primary/20">
                        {supplier.business_entity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-gray-200 font-medium">{supplier.email || '—'}</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">{supplier.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-2.5 py-0.5 rounded-full text-xs">
                        {supplier.count_purchase_orders}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-gray-600 dark:text-gray-400">
                      {supplier.last_purchase_order_date ? formatDate(supplier.last_purchase_order_date) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-gray-100">
                      {formatMoney(supplier.total_purchase_amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDelete(supplier); }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
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
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="text-primary" size={24} /> 
                {editingSupplier ? 'Edit Supplier' : 'New Supplier'}
              </h2>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {formError && <ErrorAlert message={formError} variant="inline" />}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Company / Individual Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Business Entity Type</label>
                  <select
                    value={formData.business_entity}
                    onChange={(e) => setFormData({ ...formData, business_entity: e.target.value as SupplierDetail['business_entity'] })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium transition-all"
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
                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Physical Address</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-70"
                >
                  {editingSupplier ? 'Save Changes' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && deletingSupplier && (
        <ConfirmDeleteModal
          title="Delete Supplier"
          itemName={deletingSupplier.name}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
