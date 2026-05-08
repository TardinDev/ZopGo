import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  show: (input: { type: ToastType; title?: string; message: string; durationMs?: number }) => string;
  dismiss: (id: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ type, title, message, durationMs = 3500 }) => {
    const id = `t_${Date.now()}_${nextId++}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, title, message, durationMs }] }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// Convenience helpers callable from anywhere (no hook required).
export const toast = {
  success: (message: string, opts?: { title?: string; durationMs?: number }) =>
    useToastStore.getState().show({ type: 'success', message, ...opts }),
  error: (message: string, opts?: { title?: string; durationMs?: number }) =>
    useToastStore.getState().show({ type: 'error', message, ...opts }),
  info: (message: string, opts?: { title?: string; durationMs?: number }) =>
    useToastStore.getState().show({ type: 'info', message, ...opts }),
};
