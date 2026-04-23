export async function handleCommonErrors(response: Response): Promise<never> {
  let errorMessage = response.statusText;
  
  const errorData = await response.json().catch(() => null);
  
  if (errorData) {
    if (errorData.detail) {
      errorMessage = errorData.detail;
    } else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
  }
  
  throw new Error(errorMessage || 'Terjadi kesalahan pada server');
}

export function handleUnexpectedError(error: unknown): never {
  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    throw new Error('Tidak dapat terhubung ke server. Silahkan coba lagi nanti');
  }
  throw error;
}