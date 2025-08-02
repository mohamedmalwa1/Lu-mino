export default function ConfirmDialog({ open, title, message, onYes, onNo }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-md w-80 p-6 space-y-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p>{message}</p>
        <div className="flex justify-end gap-3">
          <button className="btn-primary" onClick={onNo}>Cancel</button>
          <button className="btn-primary" onClick={onYes}>Yes</button>
        </div>
      </div>
    </div>
  );
}

