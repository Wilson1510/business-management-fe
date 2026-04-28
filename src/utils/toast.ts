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

export function toastSuccessConfirm(item_name: string) {
  toast.success(`${item_name} berhasil dikonfirmasi`);
}

export function toastSuccessDone(item_name: string) {
  toast.success(`${item_name} berhasil diselesaikan`);
}

export function toastSuccessCancel(item_name: string) {
  toast.success(`${item_name} berhasil dibatalkan`);
}