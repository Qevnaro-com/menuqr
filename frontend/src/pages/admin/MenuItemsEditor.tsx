import { useState } from 'react';
import { Download, ImagePlus, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import type { MenuDietType, MenuItemRecord } from './clientStore';

const categories = ['Starters', 'Main Course', 'Breads', 'Desserts', 'Beverages', 'Other'];
const sizeCategories = ['Breads', 'Beverages'];
const inputClass = 'mt-2 w-full rounded-lg border border-white/10 bg-[#17211e] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#728079] focus:border-[#e8783c] focus:ring-2 focus:ring-[#e8783c]/20';
const labelClass = 'text-sm font-semibold text-[#dce5df]';
const csvTemplate = 'Item Name,Category,Price,Description,Image Name or URL,Veg/Non-Veg,Half Price,Full Price,Reg Price,Med Price,Large Price\n';

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some((value) => value)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  row.push(cell.trim());
  if (row.some((value) => value)) rows.push(row);
  if (quoted) throw new Error('CSV has an unclosed quoted value.');
  return rows;
}

function csvMenuItems(text: string): MenuItemRecord[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error('CSV must include a header and at least one menu item.');
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const headers = rows[0].map(normalize);
  const column = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const nameColumn = column('itemname', 'name');
  const categoryColumn = column('category');
  if (nameColumn < 0 || categoryColumn < 0) throw new Error('CSV needs "Item Name" and "Category" columns.');

  const value = (row: string[], ...names: string[]) => {
    const index = column(...names);
    return index < 0 ? '' : row[index] ?? '';
  };
  const readPrice = (row: string[], ...names: string[]) => {
    const price = value(row, ...names);
    if (price && (!Number.isFinite(Number(price)) || Number(price) < 0)) {
      throw new Error(`Row price must be a number zero or greater.`);
    }
    return price;
  };

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    try {
      const name = row[nameColumn] ?? '';
      const category = categories.find((option) => normalize(option) === normalize(row[categoryColumn] ?? ''));
      if (!name) throw new Error('Item Name is required.');
      if (!category) throw new Error(`Category must be one of: ${categories.join(', ')}.`);

      const halfPrice = readPrice(row, 'halfprice', 'half');
      const fullPrice = readPrice(row, 'fullprice', 'full');
      const regPrice = readPrice(row, 'regularprice', 'regprice', 'reg');
      const medPrice = readPrice(row, 'mediumprice', 'medprice', 'med');
      const largePrice = readPrice(row, 'largeprice', 'large');
      const price = readPrice(row, 'price');
      const pricingType = regPrice || medPrice || largePrice
        ? 'sizes'
        : halfPrice || fullPrice
          ? 'half-full'
          : 'single';
      if (pricingType === 'sizes' && !sizeCategories.includes(category)) throw new Error('Reg/Med/Large prices are only supported for Breads and Beverages.');
      if (pricingType === 'half-full' && sizeCategories.includes(category)) throw new Error('Use Reg/Med/Large prices for Breads and Beverages.');
      if (pricingType === 'sizes' && !regPrice && !medPrice && !largePrice) throw new Error('Add at least one size price.');
      if (pricingType === 'half-full' && !halfPrice && !fullPrice) throw new Error('Add at least one Half or Full price.');
      if (pricingType === 'single' && !price) throw new Error('Add a Price, Half/Full price, or size price.');

      const rawDiet = normalize(value(row, 'vegnonveg', 'diet', 'diettype'));
      const dietType: MenuDietType = rawDiet === 'nonveg' || rawDiet === 'nonvegetarian'
        ? 'non-veg'
        : rawDiet === 'vegan'
          ? 'vegan'
          : rawDiet === 'veg' || rawDiet === 'vegetarian' || !rawDiet
            ? 'veg'
            : (() => { throw new Error('Veg/Non-Veg must be Veg, Non-Veg, or Vegan.'); })();
      const imageValue = value(row, 'imagenameorurl', 'imageurl', 'image');
      const image = /^https?:\/\//i.test(imageValue) ? imageValue : '';

      return {
        id: crypto.randomUUID(),
        name,
        description: value(row, 'description'),
        price: pricingType === 'single' ? price : '',
        pricingType,
        halfPrice,
        fullPrice,
        regPrice,
        medPrice,
        largePrice,
        category,
        dietType,
        image,
        available: true,
      };
    } catch (importError) {
      throw new Error(`Row ${rowNumber}: ${importError instanceof Error ? importError.message : 'Invalid menu item.'}`);
    }
  });
}

function blankItem(): MenuItemRecord {
  return { id: '', name: '', description: '', price: '', category: 'Main Course', dietType: 'veg', image: '', available: true };
}

export async function compressImage(file: File): Promise<string> {
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
  const [importMessage, setImportMessage] = useState('');

  async function importCsv(file?: File) {
    if (!file) return;
    setImportMessage('');
    try {
      const importedItems = csvMenuItems(await file.text());
      onChange([...items, ...importedItems]);
      setImportMessage(`${importedItems.length} menu ${importedItems.length === 1 ? 'item' : 'items'} imported.`);
    } catch (importError) {
      setImportMessage(importError instanceof Error ? importError.message : 'Could not import this CSV.');
    }
  }

  function downloadCsvTemplate() {
    const url = URL.createObjectURL(new Blob([csvTemplate], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'menuqr-menu-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

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
    const pt = draft.pricingType || 'single';
    if (!draft.name.trim()) {
      setError('Add an item name to continue.');
      return;
    }
    if (pt === 'single' && (!draft.price || Number(draft.price) < 0)) {
      setError('Add a valid price to continue.');
      return;
    }
    if (pt === 'half-full' && (!draft.halfPrice && !draft.fullPrice)) {
      setError('Add at least one portion price (Half or Full).');
      return;
    }
    if (pt === 'sizes' && (!draft.regPrice && !draft.medPrice && !draft.largePrice)) {
      setError('Add at least one size price (Reg, Med, or Large).');
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
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={downloadCsvTemplate} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c3cec8] transition hover:bg-white/[0.06]"><Download size={15} />CSV template</button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#e8783c] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#f18b50]"><Upload size={15} />Upload CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { void importCsv(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} /></label>
          <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-[#b8c4be]">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>
      {importMessage && <p role="status" className={`-mt-3 mb-5 text-xs font-medium ${importMessage.includes('imported.') ? 'text-emerald-300' : 'text-rose-300'}`}>{importMessage}</p>}
      <p className="-mt-3 mb-5 text-xs text-[#94a39d]">Use existing categories. Add Half/Full or Reg/Med/Large price columns when needed; image columns accept URLs.</p>

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
                  <div className="shrink-0 text-right">
                    {(!item.pricingType || item.pricingType === 'single') && <span className="block font-bold text-[#ffc19e]">₹{Number(item.price).toLocaleString('en-IN')}</span>}
                    {item.pricingType === 'half-full' && (
                      <div className="text-xs font-semibold text-[#ffc19e]">
                        {item.halfPrice && <span>Half: ₹{item.halfPrice} </span>}
                        {item.fullPrice && <span>Full: ₹{item.fullPrice}</span>}
                      </div>
                    )}
                    {item.pricingType === 'sizes' && (
                      <div className="text-[10px] font-semibold text-[#ffc19e]">
                        {item.regPrice && <span>Reg: ₹{item.regPrice} </span>}
                        {item.medPrice && <span>Med: ₹{item.medPrice} </span>}
                        {item.largePrice && <span>Lrg: ₹{item.largePrice}</span>}
                      </div>
                    )}
                  </div>
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
          <label className={`${labelClass} mt-4 block`}>Category<select className={inputClass} value={draft.category} onChange={(event) => setDraft((current) => {
            const newCat = event.target.value;
            let pt = current.pricingType || 'single';
            if (sizeCategories.includes(newCat) && pt === 'half-full') pt = 'sizes';
            if (!sizeCategories.includes(newCat) && pt === 'sizes') pt = 'half-full';
            return { ...current, category: newCat, pricingType: pt as any };
          })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          
          <label className={`${labelClass} mt-4 block`}>Pricing Options
            <select className={inputClass} value={draft.pricingType || 'single'} onChange={(event) => setDraft((current) => ({ ...current, pricingType: event.target.value as any }))}>
              <option value="single">Single Price (None)</option>
              {sizeCategories.includes(draft.category) ? (
                <option value="sizes">Sizes (Reg, Med, Large)</option>
              ) : (
                <option value="half-full">Portions (Half, Full)</option>
              )}
            </select>
          </label>

          {(!draft.pricingType || draft.pricingType === 'single') && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className={labelClass}>Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} placeholder="250" /></label>
              <label className={labelClass}>Diet<select className={inputClass} value={draft.dietType} onChange={(event) => setDraft((current) => ({ ...current, dietType: event.target.value as MenuDietType }))}><option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option></select></label>
            </div>
          )}

          {draft.pricingType === 'half-full' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className={labelClass}>Half Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.halfPrice || ''} onChange={(event) => setDraft((current) => ({ ...current, halfPrice: event.target.value }))} placeholder="150" /></label>
              <label className={labelClass}>Full Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.fullPrice || ''} onChange={(event) => setDraft((current) => ({ ...current, fullPrice: event.target.value }))} placeholder="250" /></label>
              <label className={`${labelClass} col-span-2`}>Diet<select className={inputClass} value={draft.dietType} onChange={(event) => setDraft((current) => ({ ...current, dietType: event.target.value as MenuDietType }))}><option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option></select></label>
            </div>
          )}

          {draft.pricingType === 'sizes' && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              <label className={labelClass}>Reg Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.regPrice || ''} onChange={(event) => setDraft((current) => ({ ...current, regPrice: event.target.value }))} placeholder="100" /></label>
              <label className={labelClass}>Med Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.medPrice || ''} onChange={(event) => setDraft((current) => ({ ...current, medPrice: event.target.value }))} placeholder="150" /></label>
              <label className={labelClass}>Large Price<input className={inputClass} type="number" min="0" step="0.01" value={draft.largePrice || ''} onChange={(event) => setDraft((current) => ({ ...current, largePrice: event.target.value }))} placeholder="200" /></label>
              <label className={`${labelClass} col-span-3`}>Diet<select className={inputClass} value={draft.dietType} onChange={(event) => setDraft((current) => ({ ...current, dietType: event.target.value as MenuDietType }))}><option value="veg">Veg</option><option value="non-veg">Non-veg</option><option value="vegan">Vegan</option></select></label>
            </div>
          )}
          <label className={`${labelClass} mt-4 block`}>Description<textarea className={`${inputClass} min-h-20 resize-y`} maxLength={240} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Ingredients, portion size, or what makes it special" /></label>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#c5d0ca]"><input type="checkbox" className="accent-[#e8783c]" checked={draft.available} onChange={(event) => setDraft((current) => ({ ...current, available: event.target.checked }))} /> Available to order</label>
          {error && <p role="alert" className="mt-3 text-xs font-medium text-rose-300">{error}</p>}
          <button type="button" disabled={isCompressing} onClick={saveItem} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8783c] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#f18b50] disabled:cursor-wait disabled:opacity-60">{editingId ? <><Pencil size={16} />Save item</> : <><Plus size={17} />Add menu item</>}</button>
        </aside>
      </div>
    </section>
  );
}
