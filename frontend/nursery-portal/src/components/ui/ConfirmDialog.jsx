export default function ConfirmDialog({ title, children, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{children}</p>
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
