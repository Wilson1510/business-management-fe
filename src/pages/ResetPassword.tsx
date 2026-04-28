import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { resetPassword, type ResetPassword } from '../services/users';
import { ErrorAlert } from '../components/ErrorAlert';
import { FormActionButton } from '../components/FormActionButton';
import { PageHeading } from '../components/PageHeading';
import { toast } from 'sonner'

export default function ResetPassword() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState<ResetPassword>({
    new_password: '',
    confirm_password: ''
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!formData.new_password.trim()) {
      setError('Kata sandi baru wajib diisi');
      return;
    }
    if (!formData.confirm_password.trim()) {
      setError('Kata sandi konfirmasi wajib diisi');
      return;
    }
    if (formData.new_password !== formData.confirm_password) {
      setError('Kata sandi baru tidak cocok dengan kata sandi konfirmasi');
      return;
    }
    setSaving(true);
    try {
      await resetPassword(Number(id), formData);
      navigate(`/settings/users/${id}`);
      toast.success('Kata sandi berhasil diatur ulang');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyetel ulang kata sandi');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <fieldset disabled={saving} className="min-w-0 border-0 p-0 m-0 space-y-6">
        <div className="flex items-center gap-4">
          <PageHeading
            title="Atur Ulang Kata Sandi Pengguna"
            description="Atur ulang kata sandi untuk pengguna ini."
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <ErrorAlert message={error} variant="form" />}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Masukkan kata sandi baru"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="password"
                    required
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="Konfirmasi kata sandi baru"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <FormActionButton variant="cancel" text="Batal" onClick={() => navigate(-1)} />
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
