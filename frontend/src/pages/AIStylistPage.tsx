import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Camera, Home, Loader2, Send, Sparkles, Shirt, UploadCloud, X } from 'lucide-react';
import { apiFetch, assetUrl } from '../config';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';
import { usePageMeta } from '../lib/usePageMeta';
import { cn } from '../lib/utils';

type AdvisorMode = 'style' | 'room';

type AdvisorResponse = {
  mode: AdvisorMode;
  imageUrl?: string;
  analysis: string;
  products: Product[];
};

const styleOptions = ['Minimal', 'Streetwear', 'Classic', 'Sporty', 'Party', 'Vintage'];
const roomStyleOptions = ['Modern', 'Minimal', 'Luxury', 'Cozy', 'Study Setup', 'Small Room'];
const occasionOptions = ['Casual', 'Office', 'Party', 'Travel', 'Date Night', 'Weekend'];
const budgetOptions = ['Under ₹1000', '₹1000-₹2500', '₹2500-₹5000', '₹5000+'];

const defaultForm = {
  gender: '',
  heightCm: '',
  weightKg: '',
  age: '',
  bodyType: '',
  budget: '',
  preferredStyle: '',
  occasion: '',
  roomType: '',
  roomSize: '',
  existingColors: '',
  question: '',
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Image read nahi ho payi.'));
    reader.readAsDataURL(file);
  });
}

export function AIStylistPage() {
  const [mode, setMode] = useState<AdvisorMode>('style');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);

  usePageMeta({
    title: 'AI Advisor | Trendora',
    description: 'Get AI fashion and room product suggestions from Trendora.',
  });

  const activeStyles = useMemo(() => (mode === 'room' ? roomStyleOptions : styleOptions), [mode]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError('');
    setSelectedFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const updateForm = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const switchMode = (nextMode: AdvisorMode) => {
    setMode(nextMode);
    setError('');
    setAnalysis('');
    setRecommended([]);
  };

  const clearPhoto = () => {
    setSelectedFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.question.trim() && !selectedFile) {
      setError(mode === 'room' ? 'Room ke baare me question likho ya photo upload karo.' : 'Apni need likho ya outfit photo upload karo.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');
    setRecommended([]);

    try {
      const imageDataUrl = selectedFile ? await fileToDataUrl(selectedFile) : '';
      const payload = {
        mode,
        ...form,
        imageDataUrl,
      };

      const data = await apiFetch<AdvisorResponse>('/api/recommendations/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setAnalysis(data.analysis || 'AI ne aapke liye suggestions prepare kar diye hain.');
      setRecommended(data.products || []);
      if (data.imageUrl) setImagePreview(assetUrl(data.imageUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI suggestion abhi load nahi ho paya.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] pb-24 text-gray-950">
      <section className="border-b border-gray-100 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-pink-600">
              <Sparkles size={15} /> Trendora AI
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#55205f] sm:text-4xl">AI Suggestion Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Fashion fit, color matching, event styling, aur room decoration ke liye photo ya details bhejo.
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => switchMode('style')}
              className={cn('flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition', mode === 'style' ? 'bg-[#55205f] text-white shadow-sm' : 'text-gray-500')}
            >
              <Shirt size={17} /> Fashion
            </button>
            <button
              type="button"
              onClick={() => switchMode('room')}
              className={cn('flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-black transition', mode === 'room' ? 'bg-[#55205f] text-white shadow-sm' : 'text-gray-500')}
            >
              <Home size={17} /> Room
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {mode === 'style' ? (
                <>
                  <select value={form.gender} onChange={(event) => updateForm('gender', event.target.value)} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#55205f]">
                    <option value="">Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                  <input value={form.age} onChange={(event) => updateForm('age', event.target.value)} placeholder="Age" type="number" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f]" />
                  <input value={form.heightCm} onChange={(event) => updateForm('heightCm', event.target.value)} placeholder="Height (cm)" type="number" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f]" />
                  <input value={form.weightKg} onChange={(event) => updateForm('weightKg', event.target.value)} placeholder="Weight (kg)" type="number" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f]" />
                  <input value={form.bodyType} onChange={(event) => updateForm('bodyType', event.target.value)} placeholder="Fit note, e.g. slim, relaxed, plus size" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f] sm:col-span-2" />
                  <select value={form.occasion} onChange={(event) => updateForm('occasion', event.target.value)} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#55205f]">
                    <option value="">Occasion</option>
                    {occasionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </>
              ) : (
                <>
                  <input value={form.roomType} onChange={(event) => updateForm('roomType', event.target.value)} placeholder="Room type, e.g. bedroom, study, hall" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f]" />
                  <input value={form.roomSize} onChange={(event) => updateForm('roomSize', event.target.value)} placeholder="Room size, e.g. 10x12 ft, small" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f]" />
                  <input value={form.existingColors} onChange={(event) => updateForm('existingColors', event.target.value)} placeholder="Existing colors/furniture" className="h-12 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#55205f] sm:col-span-2" />
                </>
              )}

              <select value={form.budget} onChange={(event) => updateForm('budget', event.target.value)} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#55205f]">
                <option value="">Budget</option>
                {budgetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <select value={form.preferredStyle} onChange={(event) => updateForm('preferredStyle', event.target.value)} className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#55205f]">
                <option value="">{mode === 'room' ? 'Room style' : 'Preferred style'}</option>
                {activeStyles.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <textarea
              value={form.question}
              onChange={(event) => updateForm('question', event.target.value)}
              placeholder={mode === 'room' ? 'Example: Mere bedroom me kaunse products useful rahenge aur color kaise match karu?' : 'Example: Mere height/weight ke hisab se party ke liye kaunsa outfit best rahega?'}
              className="mt-3 min-h-28 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm leading-6 outline-none focus:border-[#55205f]"
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-pink-200 bg-pink-50/50 px-4 py-5 text-center">
              <UploadCloud className="text-pink-600" size={28} />
              <span className="mt-3 text-sm font-black text-[#55205f]">{mode === 'room' ? 'Upload room photo' : 'Upload outfit/selfie photo'}</span>
              <span className="mt-1 text-xs font-semibold text-gray-400">Optional, but photo se suggestions better hote hain.</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            </label>

            {imagePreview && (
              <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-3 py-2">
                  <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500"><Camera size={14} /> Preview</span>
                  <button type="button" onClick={clearPhoto} className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Remove photo">
                    <X size={16} />
                  </button>
                </div>
                <img src={imagePreview} alt="AI advisor upload preview" className="max-h-[420px] w-full object-cover" />
              </div>
            )}
          </div>

          {error && <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#55205f] px-6 text-sm font-black text-white shadow-sm transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-max"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={17} />}
            {loading ? 'AI thinking...' : mode === 'room' ? 'Suggest Room Products' : 'Suggest Best Outfit'}
          </button>
        </form>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-600">{mode === 'room' ? 'Room advisor' : 'Fashion advisor'}</p>
            <h2 className="mt-2 text-xl font-black text-[#55205f]">{mode === 'room' ? 'Decor that fits your space.' : 'Looks that fit you.'}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              {mode === 'room'
                ? 'Photo, room size, budget, colors, aur question ke basis par AI layout aur product direction dega.'
                : 'Height, weight, occasion, budget, style, aur photo se AI fit/color/product suggestions dega.'}
            </p>
          </div>

          {analysis && (
            <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-600">AI Analysis</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-700">{analysis}</p>
            </div>
          )}
        </aside>
      </div>

      {recommended.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-600">Matched catalog</p>
              <h2 className="mt-1 text-xl font-black text-[#55205f]">Recommended products</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {recommended.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
