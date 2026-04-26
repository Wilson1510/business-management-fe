import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield, User as UserIcon, Mail, Key, AtSign } from 'lucide-react';
import { getUser, createUser, updateUser, type UserCreate, type UserDetail } from '../services/users';
import { ErrorAlert } from '../components/ErrorAlert';

export default function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    name: '',
    email: '',
    role: 'staff',
    is_active: true
  });

  useEffect(function () {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        if (isEditing && id) {
          const user = await getUser(Number(id));
          if (user) {
            setFormData({
              username: user.username,
              name: user.name,
              email: user.email,
              role: user.role,
              is_active: user.is_active
            });
          } else {
            setError('User not found.');
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return function cleanup() {
      cancelled = true;
    }
  }, [id, isEditing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.username) {
      setError('Username is required.');
      return;
    }
    if (!formData.name) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    
    try {
      if (isEditing && id) {
        await updateUser(Number(id), formData);
      } else {
        await createUser(formData);
      }
      navigate('/settings/users');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400 dark:text-gray-500">Loading user data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/settings/users')}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditing ? 'Update internal account details.' : 'Create a new internal system account.'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <ErrorAlert message={error} variant="form" />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="jane.doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                System Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserDetail['role'] })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white appearance-none"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Status
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => navigate(`/settings/users/${id}/password`)}
                  className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 font-medium rounded-xl transition-colors"
                >
                  <Key size={18} />
                  Reset Password
                </button>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/settings/users')}
                className="flex-1 sm:flex-none px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save User'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
