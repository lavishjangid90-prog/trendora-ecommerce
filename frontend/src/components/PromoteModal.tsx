import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  initialAmount?: number;
  initialDays?: number;
  onClose: () => void;
  onSubmit: (amount: number, days: number) => void | Promise<void>;
};

export default function PromoteModal({ open, initialAmount = 100, initialDays = 7, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [days, setDays] = useState<number>(initialDays);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(initialAmount);
      setDays(initialDays);
    }
  }, [open, initialAmount, initialDays]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-3">Promote product</h3>
        <p className="text-sm text-gray-600 mb-4">Boost your product's visibility by placing a promotion bid.</p>

        <label className="block text-sm font-medium text-gray-700">Amount (INR)</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value || 0))}
          className="mt-1 w-full rounded-md border-gray-200 p-2 shadow-sm"
        />

        <label className="block text-sm font-medium text-gray-700 mt-3">Days</label>
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value || 1))))}
          className="mt-1 w-full rounded-md border-gray-200 p-2 shadow-sm"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border bg-white text-sm font-medium text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await onSubmit(amount, days);
              } finally {
                setLoading(false);
              }
            }}
            className="px-4 py-2 rounded-md bg-black text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Promote'}
          </button>
        </div>
      </div>
    </div>
  );
}
