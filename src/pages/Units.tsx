import React, { useState, useEffect } from 'react';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FormActionButton } from '../components/FormActionButton';
import {
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  type UnitListItem,
  type UnitList,
  type UnitDetail,
  type UnitCreate,
  type UnitUpdate,
} from '../services/units';
import { toastSuccessCreate, toastSuccessDelete, toastSuccessUpdate } from '../utils/toast';
import { PageHeading } from '../components/PageHeading';

export default function Units() {
  const [units, setUnits] = useState<UnitList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitListItem | null>(null);
  const [formData, setFormData] = useState<UnitCreate>({ name: '' });
  const [formError, setFormError] = useState<string | null>(null);
  
  // Delete modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<UnitDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;
    async function loadUnits() {
      setLoading(true);
      setError(null);
      try {
        const units = await getUnits();
        if (!cancelled) {
          setUnits(units);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Gagal memuat satuan');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUnits();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  function openForm(unit?: UnitListItem) {
    setFormError(null);
    if (unit) {
      setEditingUnit(unit);
      setFormData({ name: unit.name });
    } else {
      setEditingUnit(null);
      setFormData({ name: '' });
    }
    setIsFormOpen(true);
  };

  function closeForm() {
    setIsFormOpen(false);
    setEditingUnit(null);
    setFormData({ name: '' });
    setFormError(null);
  };

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Nama wajib diisi');
      return;
    }
    setFormError(null);
    
    try {
      if (editingUnit) {
        const payload: UnitUpdate = { name: formData.name.trim() };
        const updated = await updateUnit(editingUnit.id, payload);
        setUnits((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        toastSuccessUpdate(updated.name);
      } else {
        const payload: UnitCreate = { name: formData.name.trim() };
        const created = await createUnit(payload);
        setUnits((prev) => [...prev, created]);
        toastSuccessCreate(created.name);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan satuan');
    }
  };

  function openDelete(unit: UnitListItem) {
    setDeleteError(null);
    setDeletingUnit(unit);
    setIsDeleteOpen(true);
  };

  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingUnit(null);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deletingUnit) return;
    setDeleteError(null);
    try {
      await deleteUnit(deletingUnit.id);
      setUnits((prev) => prev.filter((u) => u.id !== deletingUnit.id));
      closeDelete();
      toastSuccessDelete(deletingUnit.name);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus satuan');
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {error && <ErrorAlert message={error} />}
      <div className="flex justify-between items-center">
        <PageHeading title="Satuan" description="Kelola satuan pengukuran" />
        <AddItemButton text="Tambah Satuan" onClick={() => openForm()} />
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
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">Memuat satuan...</td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-400 dark:text-gray-500">Tidak ada satuan yang ditemukan.</td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr
                  key={unit.id}
                  onClick={() => openForm(unit)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{unit.name}</td>
                    <td className="px-6 py-4 text-right">
                      <DeleteIconButton
                        onClick={(e) => { e.stopPropagation(); openDelete(unit); }}
                        aria-label="Hapus satuan"
                      />
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
                {editingUnit ? 'Edit Satuan' : 'Tambah Satuan'}
              </h3>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {formError && <ErrorAlert message={formError} variant="inline" />}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Satuan
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    required
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="e.g. Pcs"
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

      {isDeleteOpen && deletingUnit && (
        <ConfirmDeleteModal
          title="Hapus Satuan"
          itemName={deletingUnit.name}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
