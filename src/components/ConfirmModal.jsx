export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: danger ? '#ef4444' : '#E91E8C' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
