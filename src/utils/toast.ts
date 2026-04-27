import { toast } from 'sonner';

export function toastSuccessCreate(item_name: string) {
  toast.success(`${item_name} berhasil dibuat`);
}

export function toastSuccessUpdate(item_name: string) {
  toast.success(`${item_name} berhasil diperbarui`);
}

export function toastSuccessDelete(item_name: string) {
  toast.success(`${item_name} berhasil dihapus`);
}