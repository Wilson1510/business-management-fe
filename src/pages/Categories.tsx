import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { toastSuccessCreate, toastSuccessUpdate, toastSuccessDelete } from '../utils/toast';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FormActionButton } from '../components/FormActionButton';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryList,
  type CategoryListItem,
  type CategoryDetail,
  type CategoryCreate,
  type CategoryUpdate,
} from '../services/categories';

export default function Categories() {
  const [categories, setCategories] = useState<CategoryList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
  const [formData, setFormData] = useState<CategoryCreate>({ name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;
    async function loadCategories() {
      setLoading(true);
      setError(null);
      try {
        const categories = await getCategories();
        if (!cancelled) {
          setCategories(categories);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat kategori');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCategories();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  function openForm(category?: CategoryListItem) {
    setFormError(null);
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name });
    } else {
      setEditingCategory(null);
      setFormData({ name: '' });
    }
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCategory(null);
    setFormData({ name: '' });
    setFormError(null);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama wajib diisi');
      return;
    }
    setFormError(null);

    try {
      if (editingCategory) {
        const payload: CategoryUpdate = { name: formData.name.trim() };
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toastSuccessUpdate(updated.name);
      } else {
        const payload: CategoryCreate = { name: formData.name.trim() };
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        toastSuccessCreate(created.name);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan kategori');
    }
  };

  function openDelete(category: CategoryDetail) {
    setDeleteError(null);
    setDeletingCategory(category);
    setIsDeleteOpen(true);
  };

  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingCategory(null);
  };

  async function handleDelete() {
    if (!deletingCategory) return;
    setDeleteError(null);
    try {
      const id = deletingCategory.id;
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      closeDelete();
      toastSuccessDelete(deletingCategory.name);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus kategori');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && <ErrorAlert message={error} />}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Kategori</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola kategori produk</p>
        </div>
        <AddItemButton text="Tambah Kategori" onClick={() => openForm()} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50/50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-4 font-medium">Nama</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">Memuat kategori...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">Tidak ada kategori yang ditemukan.</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    onClick={() => openForm(category)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{category.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDelete(category); }}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {formError && <ErrorAlert message={formError} variant="inline" />}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Kategori
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    required
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="e.g. Elektronik"
                    autoFocus
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <FormActionButton variant="cancel" text="Batal" onClick={closeForm} />
                <FormActionButton variant="primary" text="Simpan" className="min-w-[80px]" />
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && deletingCategory && (
        <ConfirmDeleteModal
          title="Hapus Kategori"
          itemName={deletingCategory.name}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
