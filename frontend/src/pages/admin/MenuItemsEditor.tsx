import { useState } from 'react';
import { ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { MenuDietType, MenuItemRecord } from './clientStore';

const categories = ['Starters', 'Main Course', 'Breads', 'Desserts', 'Beverages', 'Other'];
const inputClass = 'mt-2 w-full rounded-lg border border-white/10 bg-[#17211e] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#728079] focus:border-[#e8783c] focus:ring-2 focus:ring-[#e8783c]/20';
const labelClass = 'text-sm font-semibold text-[#dce5df]';

function blankItem(): MenuItemRecord {
  return { id: '', name: '', description: '', price: '', category: 'Main Course', dietType: 'veg', image: '', available: true };
}

async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Image must be smaller than 12 MB.');

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This image could not be processed.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.78);
}

export default function MenuItemsEditor({ items, onChange }: { items: MenuItemRecord[]; onChange: (items: MenuItemRecord[]) => void }) {
  const [draft, setDraft] = useState<MenuItemRecord>(blankItem);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  async function chooseImage(file?: File) {
    if (!file) return;
    setError('');
    setIsCompressing(true);
    try {
      const image = await compressImage(file);
      setDraft((current) => ({ ...current, image }));
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'Image upload failed.');
    } finally {
      setIsCompressing(false);
    }
  }

  function saveItem() {
    if (!draft.name.trim() || !draft.price || Number(draft.price) < 0) {
      setError('Add an item name and a valid price to continue.');
      return;
    }
    const savedItem = { ...draft, id: editingId ?? crypto.randomUUID(), name: draft.name.trim(), description: draft.description.trim() };
    onChange(editingId ? items.map((item) => item.id === editingId ? savedItem : item) : [...items, savedItem]);
    setDraft(blankItem());
    setEditingId(null);
    setError('');
  }

  function editItem(item: MenuItemRecord) {
    setDraft(item);
    setEditingId(item.id);
    setError('');
  }

  function cancelEdit() {
    setDraft(blankItem());
    setEditingId(null);
    setError('');
  }

  function toggleAvailability(id: string) {
    onChange(items.map((item) => item.id === id ? { ...item, available: !item.available } : item));
  }

  return (
    <section className="admin-panel rounded-2xl border p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-white">Menu items</h2>
          <p className="mt-1 text-xs text-[#94a39d]">Add a photo, price, and details that guests will see on the public menu.</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#b8c4be]">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 text-center">
              <span className="mb-3 rounded-xl bg-[#e8783c]/10 p-3 text-[#f29a66]"><ImagePlus size={22} /></span>
              <p className="font-semibold text-white">Your menu is ready for its first item</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[#94a39d]">Items added here will appear on this client’s customer-facing menu.</p>
            </div>
          ) : items.map((item) => (
            <article key={item.id} className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 sm:gap-4 sm:p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#17211e] sm:h-24 sm:w-24">
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#77857f]"><ImagePlus size={20} /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="truncate font-bold text-white">{item.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#9eaaa4]">{item.description || 'No description added.'}</p></div>
                  <span className="shrink-0 font-bold text-[#ffc19e]">₹{Number(item.price).toLocaleString('en-IN')}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[#c3cec8]">{item.category}</span>
                  <span className={`rounded-md px-2 py-1 ${item.dietType === 'non-veg' ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}>{item.dietType === 'non-veg' ? 'Non-veg' : item.dietType === 'vegan' ? 'Vegan' : 'Veg'}</span>
                  <button type="button" onClick={() => toggleAvailability(item.id)} className={`rounded-md px-2 py-1 transition ${item.available ? 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20' : 'bg-amber-300/10 text-amber-200 hover:bg-amber-300/20'}`}>{item.available ? 'Available' : 'Unavailable'}</button>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <button type="button" onClick={() => editItem(item)} aria-label={`Edit ${item.name}`} title="Edit item" className="rounded-lg p-2 text-[#aab7b2] transition hover:bg-white/10 hover:text-white"><Pencil size={16} /></button>
                <button type="button" onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} aria-label={`Remove ${item.name}`} title="Remove item" className="rounded-lg p-2 text-[#aab7b2] transition hover:bg-rose-400/10 hover:text-rose-300"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>

        <aside className="rounded-xl border border-white/[0.08] bg-[#19231f] p-4">
          <div className="mb-4 flex items-center justify-between gap-2"><h3 className="text-sm font-bold text-white">{editingId ? 'Edit item' : 'New item'}</h3>{editingId && <button type="button" onClick={cancelEdit} aria-label="Cancel edit" className="rounded-md p-1.5 text-[#94a39d] hover:bg-white/10 hover:text-white"><X size={16} /></button>}</div>
          <label className="group relative mb-4 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-[#121a17] transition hover:border-[#e8783c]/60">
            {draft.image ? <img src={draft.image} alt="Menu item preview" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-xs font-semibold text-[#aab7b2]"><ImagePlus size={22} className="text-[#f29a66]" />{isCompressing ? 'Processing image…' : 'Choose item photo'}</span>}
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => void chooseImage(event.currentTarget.files?.[0])} />
          </label>
          <label className={labelClass}>Item name<input className={inputClass} value={draft.name} maxLength={70} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Paneer tikka" /></label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className={labelClass}>Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} placeholder="250" /></label>
            <label className={labelClass}>Diet<select className={inputClass} value={draft.dietType} onChange={(event) => setDraft((current) => ({ ...current, dietType: event.target.value as MenuDietType }))}><option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option></select></label>
          </div>
          <label className={`${labelClass} mt-4 block`}>Category<select className={inputClass} value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className={`${labelClass} mt-4 block`}>Description<textarea className={`${inputClass} min-h-20 resize-y`} maxLength={240} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Ingredients, portion size, or what makes it special" /></label>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#c5d0ca]"><input type="checkbox" className="accent-[#e8783c]" checked={draft.available} onChange={(event) => setDraft((current) => ({ ...current, available: event.target.checked }))} /> Available to order</label>
          {error && <p role="alert" className="mt-3 text-xs font-medium text-rose-300">{error}</p>}
          <button type="button" disabled={isCompressing} onClick={saveItem} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8783c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#f18b50] disabled:cursor-wait disabled:opacity-60">{editingId ? <><Pencil size={16} />Save item</> : <><Plus size={17} />Add menu item</>}</button>
        </aside>
      </div>
    </section>
  );
}
