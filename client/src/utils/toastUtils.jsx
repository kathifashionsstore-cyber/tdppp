import toast from 'react-hot-toast';

export const confirmToast = ({
  title = 'Confirm action',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel'
} = {}) => new Promise((resolve) => {
  const toastId = toast.custom((t) => (
    <div className={`${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} w-[min(92vw,360px)] rounded-lg border border-slate-200 bg-white p-4 shadow-2xl transition`}>
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700"
          onClick={() => {
            toast.dismiss(toastId);
            resolve(false);
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="rounded-lg bg-tdp-red px-3 py-2 text-sm font-black text-white"
          onClick={() => {
            toast.dismiss(toastId);
            resolve(true);
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  ), { duration: Infinity });
});

export const toastSuccess = (message = 'Saved successfully', options) => toast.success(message, options);

export const toastError = (error, fallback = 'Failed') => {
  const message = typeof error === 'string' ? error : error?.message || fallback;
  return toast.error(`Failed - ${message}`);
};
