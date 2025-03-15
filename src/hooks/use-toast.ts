
import { useState, useEffect } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

// Define the toast structure
export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

// Create a singleton for toast state management outside of React
const TOAST_LIMIT = 20;
const TOAST_REMOVE_DELAY = 1000;

type ToasterState = {
  toasts: ToasterToast[];
};

let toasts: ToasterToast[] = [];
let listeners: ((state: ToasterState) => void)[] = [];

const emitChange = () => {
  listeners.forEach((listener) => {
    listener({ toasts });
  });
};

export const toast = (props: Omit<ToasterToast, "id">) => {
  const id = crypto.randomUUID();
  const newToast = { id, ...props };
  
  toasts = [newToast, ...toasts].slice(0, TOAST_LIMIT);
  emitChange();

  return {
    id: id,
    dismiss: () => dismiss(id),
    update: (props: Partial<ToasterToast>) => update(id, props),
  };
};

toast.dismiss = (toastId?: string) => {
  toasts = toasts.map((t) => 
    t.id === toastId || toastId === undefined
      ? { ...t, open: false }
      : t
  );
  emitChange();
};

const update = (id: string, props: Partial<ToasterToast>) => {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...props } : t));
  emitChange();
};

const dismiss = (toastId: string) => {
  toast.dismiss(toastId);
};

const remove = (toastId: string) => {
  toasts = toasts.filter((t) => t.id !== toastId);
  emitChange();
};

toast.remove = remove;

// Hook to subscribe to toast changes
export function useToast() {
  const [state, setState] = useState<ToasterState>({ toasts });

  useEffect(() => {
    const listener = (state: ToasterState) => {
      setState(state);
    };

    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: toast.dismiss,
  };
}
