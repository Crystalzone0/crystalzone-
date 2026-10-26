import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

const noop = () => {};

/** "Are you sure?" dialog. Set danger for destructive actions (red confirm button). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} onClose={loading ? noop : onClose} label={title} size="md">
      <div className="p-6 sm:p-8">
        <h2 className="pr-8 font-serif text-2xl">{title}</h2>
        <div className="mt-3 text-sm leading-relaxed text-charcoal/75">{message}</div>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'dark' : 'gold'}
            loading={loading}
            onClick={onConfirm}
            className={danger ? 'bg-red-700 hover:bg-red-800' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}