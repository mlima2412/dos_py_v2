import { toast, ToastOptions } from 'react-toastify';

interface ToastConfig {
  position?: ToastOptions['position'];
  autoClose?: number;
  hideProgressBar?: boolean;
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  theme?: 'light' | 'dark' | 'colored' | 'auto';
}

const defaultConfig: ToastConfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'colored',
};

export const useToast = () => {
  const showSuccess = (message: string, config?: ToastConfig) => {
    toast.success(message, { ...defaultConfig, ...config });
  };

  const showError = (message: string, config?: ToastConfig) => {
    toast.error(message, { ...defaultConfig, ...config });
  };

  const showWarning = (message: string, config?: ToastConfig) => {
    toast.warning(message, { ...defaultConfig, ...config });
  };

  const showInfo = (message: string, config?: ToastConfig) => {
    toast.info(message, { ...defaultConfig, ...config });
  };

  const showDefault = (message: string, config?: ToastConfig) => {
    toast(message, { ...defaultConfig, ...config });
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    default: showDefault,
    dismiss,
    dismissAll,
  };
};

// Exportar também as funções diretamente para uso sem hook
export const toastSuccess = (message: string, config?: ToastConfig) => {
  toast.success(message, { ...defaultConfig, ...config });
};

export const toastError = (message: string, config?: ToastConfig) => {
  toast.error(message, { ...defaultConfig, ...config });
};

export const toastWarning = (message: string, config?: ToastConfig) => {
  toast.warning(message, { ...defaultConfig, ...config });
};

export const toastInfo = (message: string, config?: ToastConfig) => {
  toast.info(message, { ...defaultConfig, ...config });
};