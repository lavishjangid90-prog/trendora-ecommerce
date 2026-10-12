import { useEffect, useMemo, useState } from 'react';

type DealPlacement = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  pricePerDay: number;
  defaultDays: number;
  accent?: string;
};

type Props = {
  open: boolean;
  initialAmount?: number;
  initialDays?: number;
  placements?: DealPlacement[];
  onClose: () => void;
  onSubmit: (amount: number, days: number, placement: string) => void | Promise<void>;
};

const defaultPlacements: DealPlacement[] = [
  { id: 'mega-deals', title: 'Mega Deals', subtitle: 'High value steals', price: 299, pricePerDay: 49, defaultDays: 7 },
  { id: 'today-deals', title: 'Today Deals', subtitle: 'Daily limited offers', price: 199, pricePerDay: 35, defaultDays: 5 },
  { id: 'flash-sale', title: 'Flash Sale', subtitle: 'Urgency-driven picks', price: 249, pricePerDay: 40, defaultDays: 4 },
  { id: 'best-price', title: 'Best Price', subtitle: 'Budget-friendly value', price: 179, pricePerDay: 30, defaultDays: 3 },
];

export default function PromoteModal({ open, initialAmount = 299, initialDays = 7, placements, onClose, onSubmit }: Props) {
  const normalizedPlacements = useMemo(() => placements?.length ? placements : defaultPlacements, [placements]);
  const [selectedPlacement, setSelectedPlacement] = useState<string>(normalizedPlacements[0]?.id || 'mega-deals');
  const [amount, setAmount] = useState<number>(initialAmount);
  const [days, setDays] = useState<number>(initialDays);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const selected = normalizedPlacements.find((placement) => placement.id === selectedPlacement) || normalizedPlacements[0];
      setSelectedPlacement(selected?.id || 'mega-deals');
      setAmount(Math.max(initialAmount, selected?.price || initialAmount));
      setDays(Math.max(1, Number(selected?.defaultDays || initialDays || 7)));
    }
  }, [open, initialAmount, initialDays, normalizedPlacements, selectedPlacement]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-3 text-lg font-bold">Promote product</h3>
        <p className="mb-4 text-sm text-gray-600">Choose a deal box and pay the placement fee set by the admin.</p>

        <label className="block text-sm font-medium text-gray-700">Deal box</label>
        <select
          value={selectedPlacement}
          onChange={(event) => {
            const next = normalizedPlacements.find((placement) => placement.id === event.target.value) || normalizedPlacements[0];
            setSelectedPlacement(next.id);
            setAmount(Math.max(initialAmount, next.price));
            setDays(Math.max(1, next.defaultDays));
          }}
          className="mt-1 w-full rounded-md border border-gray-200 bg-white p-2 text-sm shadow-sm"
        >
          {normalizedPlacements.map((placement) => (
            <option key={placement.id} value={placement.id}>{placement.title} · ₹{placement.price}</option>
          ))}
        </select>

        <label className="mt-3 block text-sm font-medium text-gray-700">Amount (INR)</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value || 0))}
          className="mt-1 w-full rounded-md border-gray-200 p-2 shadow-sm"
        />

        <label className="mt-3 block text-sm font-medium text-gray-700">Days</label>
        <input
          type="number"
          min={1}
          max={30}
          value={days}
          onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value || 1))))}
          className="mt-1 w-full rounded-md border-gray-200 p-2 shadow-sm"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-gray-700" disabled={loading}>Cancel</button>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await onSubmit(amount, days, selectedPlacement);
              } finally {
                setLoading(false);
              }
            }}
            className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Promote'}
          </button>
        </div>
      </div>
    </div>
  );
}
