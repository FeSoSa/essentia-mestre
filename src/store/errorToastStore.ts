import { create } from 'zustand';

interface ErrorToastState {
  message: string | null;
  showError: (message: string) => void;
  clear: () => void;
}

export const useErrorToastStore = create<ErrorToastState>((set) => ({
  message: null,
  showError: (message) => set({ message }),
  clear: () => set({ message: null }),
}));

export function extractErrorMessage(err: unknown, fallback = 'Ocorreu um erro.'): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  if (typeof data === 'string' && data.trim()) return data;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function showApiError(err: unknown, fallback?: string) {
  useErrorToastStore.getState().showError(extractErrorMessage(err, fallback));
}
