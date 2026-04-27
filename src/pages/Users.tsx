import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCog, Clock } from 'lucide-react';
import { DeleteIconButton } from '../components/DeleteIconButton';
import { getUsers, deleteUser, type UserList, type UserListItem } from '../services/users';
import { RoleBadge } from '../components/RoleBadge';
import { ErrorAlert } from '../components/ErrorAlert';
import { AddItemButton } from '../components/AddItemButton';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { formatDate } from '../utils/format';
import { PageHeading } from '../components/PageHeading';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserList>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);  

  useEffect(function () {
    let cancelled = false;
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const users = await getUsers();
        if (!cancelled) {
          setUsers(users);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load users');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadUsers();
    return function cleanup() {
      cancelled = true;
    }
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter((user) => 
      user.name.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  function openDelete(user: UserListItem) {
    setDeleteError(null);
    setDeletingUser(user);
    setIsDeleteOpen(true);
  };

  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingUser(null);
  }

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleteError(null);
    try {
      await deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      closeDelete();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete user');
    }
  }

  return (
    <div className="space-y-6">
      {error && <ErrorAlert message={error} />}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading
          title={
            <span className="flex items-center gap-2">
              <UserCog className="text-primary" size={24} />
              User Management
            </span>
          }
          description="Manage system access, administrative privileges, and staff accounts"
        />
        
        <AddItemButton text="Add User" onClick={() => navigate('/settings/users/new')} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or role..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/50 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-colors" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Account</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">System Role</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Status</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 dark:border-gray-700">Last Active</th>
                <th className="px-6 py-4 font-semibold text-right border-b border-gray-100 dark:border-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Loading system accounts...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                    onClick={() => navigate(`/settings/users/${user.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white transition-colors">{user.name}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 transition-colors">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
                          : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle text-gray-500 dark:text-gray-400 transition-colors text-xs">
                      {user.last_login ? (
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                          {formatDate(user.last_login, true)}
                        </div>
                      ) : (
                        'Never logged in'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DeleteIconButton
                          onClick={(e) => { e.stopPropagation(); openDelete(user); }}
                          aria-label="Hapus pengguna"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDeleteOpen && deletingUser && (
        <ConfirmDeleteModal
          title="Delete User"
          itemName={deletingUser.username}
          errorMessage={deleteError}
          onCancel={closeDelete}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
