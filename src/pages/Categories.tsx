import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, AlertCircle } from 'lucide-react';
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
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  /** Baris yang sedang diedit (punya `id` + metadata); null = mode buat baru */
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
  const [formData, setFormData] = useState<CategoryCreate>({ name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  
  // Delete modal states
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
          setError(e instanceof Error ? e.message : 'Failed to load categories');
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
      setFormError('Name is required');
      return;
    }
    setFormError(null);

    try {
      if (editingCategory) {
        const payload: CategoryUpdate = { name: formData.name.trim() };
        const updated = await updateCategory(editingCategory.id, payload);
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const payload: CategoryCreate = { name: formData.name.trim() };
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
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
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories</p>
        </div>
        <button
          onClick={() => openForm()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm shadow-primary/20"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-400">Loading categories...</td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-400">No categories found.</td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openForm(category)}
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors cursor-pointer hover:bg-primary/10 rounded-lg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => openDelete(category)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    placeholder="e.g. Electronics"
                    autoFocus
                  />
                </div>
                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors min-w-[80px] cursor-pointer shadow-sm shadow-primary/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Category</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deletingCategory.name}"</span>? This action cannot be undone.
              </p>
              
              {deleteError && (
                <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{deleteError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors min-w-[80px] cursor-pointer shadow-sm shadow-red-600/20"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
