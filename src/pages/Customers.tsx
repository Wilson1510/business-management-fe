import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Users } from 'lucide-react';
import { AddItemButton } from '../components/AddItemButton';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerList,
  type CustomerListItem,
  type CustomerDetail,
  type CustomerCreate,
  type CustomerUpdate,
} from '../services/customers';
import { ErrorAlert } from '../components/ErrorAlert';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { FormActionButton } from '../components/FormActionButton';
import { formatDate, formatMoney } from '../utils/format';

export default function Customers() {
  const emptyCustomerData: CustomerCreate = {
    name: '',
    business_entity: 'pt',
    email: '',
    phone: '',
    address: ''
  };

  const [customers, setCustomers] = useState<CustomerList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerListItem | null>(null);
  const [formData, setFormData] = useState<CustomerCreate>(emptyCustomerData);
  const [formError, setFormError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(function () {
    let cancelled = false;
    async function loadCustomers() {
      setLoading(true);
      setError(null);
      try {
        const customers = await getCustomers();
        if (!cancelled) {
          setCustomers(customers);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load customers');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCustomers();
    return function cleanup() {
      cancelled = true;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase();
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  function openForm(customer?: CustomerListItem) {
    setFormError(null);
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        business_entity: customer.business_entity,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      });
    } else {
      setEditingCustomer(null);
      setFormData(emptyCustomerData);
    }
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingCustomer(null);
    setFormData(emptyCustomerData);
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
      if (editingCustomer) {
        const payload: CustomerUpdate = {
          name: formData.name.trim(),
          business_entity: formData.business_entity,
          email: formData.email,
          phone: formData.phone,
          address: formData.address
        };
        const updated = await updateCustomer(editingCustomer.id, payload);
        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
        );
      } else {
        const payload: CustomerCreate = { name: formData.name.trim(), business_entity: formData.business_entity, email: formData.email, phone: formData.phone, address: formData.address };
        const created = await createCustomer(payload);
        const newRow: CustomerListItem = {
          ...created,
          count_sales_orders: 0,
          last_sales_order_date: null,
          total_sales_amount: 0,
        };
        setCustomers((prev) => [...prev, newRow]);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  function openDelete(customer: CustomerDetail) {
    setDeleteError(null);
    setDeletingCustomer(customer);
    setIsDeleteOpen(true);
  }
  
  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingCustomer(null);
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deletingCustomer) return;
    setDeleteError(null);
    try {
      const id = deletingCustomer.id;
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      closeDelete();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manage Customers</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage client organizations</p>
        </div>
        <AddItemButton text="Add Customer" onClick={() => openForm()} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold">Name & Entity</th>
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-4 py-4 font-semibold text-center">Total SO</th>
                <th className="px-4 py-4 font-semibold text-center">Last SO</th>
                <th className="px-6 py-4 font-semibold text-right">Total Revenue</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {customers.length === 0 ? 'No customers found. Start by creating one.' : 'No customers match your search.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                    onClick={() => openForm(customer)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{customer.name}</div>
                      <div className="text-xs font-semibold text-primary/80 mt-1 inline-flex items-center px-2 py-0.5 rounded bg-primary/10 dark:bg-primary/20">
                        {customer.business_entity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-gray-200 font-medium">{customer.email || '—'}</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">{customer.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-2.5 py-0.5 rounded-full text-xs">
                        {customer.count_sales_orders}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-gray-600 dark:text-gray-400">
                      {customer.last_sales_order_date ? formatDate(customer.last_sales_order_date) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-gray-200">
                      {formatMoney(customer.total_sales_amount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDelete(customer); }}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="text-primary" size={24} /> 
                {editingCustomer ? 'Edit Customer' : 'New Customer'}
              </h2>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
              {formError && <ErrorAlert message={formError} variant="inline" />}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Company / Individual Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Business Entity Type</label>
                  <select
                    value={formData.business_entity}
                    onChange={(e) => setFormData({ ...formData, business_entity: e.target.value as CustomerDetail['business_entity'] })}
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
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Physical Address</label>
                  <textarea
                    rows={3}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <FormActionButton variant="cancel" text="Cancel" onClick={closeForm} />
                <FormActionButton
                  variant="primary"
                  text={editingCustomer ? 'Save Changes' : 'Create Customer'}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteOpen && deletingCustomer && (
        <ConfirmDeleteModal
          title="Delete Customer"
          itemName={deletingCustomer.name}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
