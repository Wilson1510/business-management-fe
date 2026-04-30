import { apiFetch } from './api'
import { handleCommonErrors } from '../utils/errorHandling'

type Role = 'admin' | 'staff' | 'demo';

interface UserMetadata {
  id: number
  last_login: string
}

interface BaseUser extends UserMetadata {
  username: string
  email: string
  name: string
  role: Role
  is_active: boolean
}

export type CurrentUser = BaseUser;
export interface UserCreate {
  username: string
  email: string
  name: string
  role: Role
  is_active: boolean
}
export type UserUpdate = Partial<UserCreate>;
export type UserListItem = BaseUser;
export type UserList = UserListItem[];
export type UserDetail = BaseUser;

export interface ResetPassword {
  new_password: string
  confirm_password: string
}

export interface ChangePassword {
  old_password: string
  new_password: string
  confirm_password: string
}

export async function getUsers(): Promise<UserList> {
  const response = await apiFetch('/api/users/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function getUser(id: number): Promise<UserDetail> {
  const response = await apiFetch(`/api/users/${id}/`)
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function createUser(payload: UserCreate): Promise<UserDetail> {
  const response = await apiFetch('/api/users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "unique") {
        throw new Error(`Akun dengan username '${payload.username}' sudah digunakan`);
      }
    }
    else if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk membuat pengguna");
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function updateUser(id: number, payload: UserUpdate): Promise<UserDetail> {
  const response = await apiFetch(`/api/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "unique") {
        throw new Error(`Akun dengan username '${payload.username}' sudah digunakan`);
      }
    }
    else if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk memperbarui pengguna");
    }
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function deleteUser(id: number): Promise<void> {
  const response = await apiFetch(`/api/users/${id}/`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk menghapus pengguna");
    }
    await handleCommonErrors(response)
  }
}
export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch('/api/users/me/')
  if (!response.ok) {
    await handleCommonErrors(response)
  }
  return response.json()
}

export async function changePassword(payload: ChangePassword): Promise<void> {
  const response = await apiFetch('/api/users/me/change-password/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    if (response.status === 400) {
      const errorData = await response.clone().json().catch(() => null);
      if (errorData && errorData.code === "invalid") {
        throw new Error('Kata sandi saat ini salah');
      }
    }
    else if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk mengubah kata sandi");
    }
    await handleCommonErrors(response)
  }
}

export async function resetPassword(id: number, payload: ResetPassword): Promise<void> {
  const response = await apiFetch(`/api/users/${id}/reset-password/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Anda tidak memiliki akses untuk mengatur ulang kata sandi");
    }
    await handleCommonErrors(response)
  }
}
