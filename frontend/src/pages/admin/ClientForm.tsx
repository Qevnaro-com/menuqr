import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Check, Clock3, CreditCard, MapPin, Save, UserRound, ImagePlus } from 'lucide-react';
import { getClient, getClientDraft, removeClientDraft, saveClient, saveClientDraft, type ClientCategory, type ClientRecord } from './clientStore';
import MenuItemsEditor, { compressImage } from './MenuItemsEditor';

const categories: { value: ClientCategory; label: string }[] = [
  { value: 'restaurants', label: 'Restaurant' },
  { value: 'dhabas', label: 'Dhaba' },
  { value: 'cafes', label: 'Cafe' },
];

const plans = ['Starter', 'Basic', 'Pro', 'Premium', 'Enterprise'];
const serviceOptions = ['Dine-in', 'Takeaway', 'Delivery', 'Table reservations'];
const steps = [
  { slug: 'business', title: 'Business', detail: 'Venue profile' },
  { slug: 'menu', title: 'Menu items', detail: 'Photos & prices' },
  { slug: 'contact', title: 'Contact', detail: 'Owner details' },
  { slug: 'location', title: 'Location', detail: 'Address & hours' },
  { slug: 'plan', title: 'Plan', detail: 'Subscription' },
];

const emptyClient: Omit<ClientRecord, 'id' | 'createdAt'> = {
  businessName: '', category: 'restaurants', ownerName: '', email: '', phone: '', website: '',
  address: '', city: '', state: '', postalCode: '', country: 'India', menuSlug: '', plan: 'Starter',
  billingCycle: 'Monthly', monthlyPrice: '', openingHours: '', services: ['Dine-in'], menuItems: [], heroImage: '', status: 'Active', notes: '',
};

const inputClass = 'mt-2 w-full rounded-lg border border-white/10 bg-[#17211e] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#728079] focus:border-[#e8783c] focus:ring-2 focus:ring-[#e8783c]/20';
const labelClass = 'text-sm font-semibold text-[#dce5df]';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className={labelClass}>{label}</span>{children}</label>;
}

export default function ClientForm() {
  const { clientId, step: stepSlug } = useParams();
  const navigate = useNavigate();
  const existing = clientId ? getClient(clientId) : undefined;
  const [form, setForm] = useState<Omit<ClientRecord, 'id' | 'createdAt'>>(() => {
    const draft = getClientDraft(clientId ?? 'new');
    if (draft) return { ...emptyClient, ...draft, menuItems: draft.menuItems ?? [] };
    if (existing) return {
      businessName: existing.businessName, category: existing.category, ownerName: existing.ownerName,
      email: existing.email, phone: existing.phone, website: existing.website, address: existing.address,
      city: existing.city, state: existing.state, postalCode: existing.postalCode, country: existing.country,
      menuSlug: existing.menuSlug, plan: existing.plan, billingCycle: existing.billingCycle,
      monthlyPrice: existing.monthlyPrice, openingHours: existing.openingHours, services: existing.services,
      menuItems: existing.menuItems ?? [], heroImage: existing.heroImage || '', status: existing.status, notes: existing.notes,
    };
    return emptyClient;
  });
  const [slugEdited, setSlugEdited] = useState(Boolean(existing));
  const step = Math.max(0, steps.findIndex((item) => item.slug === stepSlug));
  const stepPath = (index: number) => `/admin/clients/${clientId ?? 'new'}/${steps[index].slug}`;

  useEffect(() => {
    if (clientId && !existing) navigate('/admin/restaurants', { replace: true });
    else if (stepSlug !== steps[step].slug) navigate(stepPath(0), { replace: true });
  }, [clientId, existing, navigate, step, stepSlug]);

  useEffect(() => {
    saveClientDraft(clientId ?? 'new', form);
  }, [clientId, form]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function chooseHeroImage(file?: File) {
    if (!file) return;
    try {
      const image = await compressImage(file);
      update('heroImage', image);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Image upload failed.');
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < steps.length - 1) {
      if (event.currentTarget.reportValidity()) navigate(stepPath(step + 1));
      return;
    }
    const now = new Date().toISOString();
    saveClient({ ...form, id: existing?.id ?? crypto.randomUUID(), createdAt: existing?.createdAt ?? now });
    removeClientDraft(clientId ?? 'new');
    navigate(`/admin/${form.category}`, { state: { clientSaved: form.businessName } });
  }

  return (
    <div className="admin-client-form mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#aab7b2] transition hover:text-white"><ArrowLeft size={16} /> Overview</Link>
          <h1 className="text-3xl font-black tracking-tight text-white">{existing ? 'Edit client' : 'Onboard a client'}</h1>
          <p className="mt-2 text-sm text-[#aab7b2]">Set up a client in five quick steps.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-300 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Draft saves as you go</div>
      </div>

      <nav aria-label="Onboarding steps" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((item, index) => (
          <button key={item.title} type="button" onClick={() => index < step && navigate(stepPath(index))} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${index === step ? 'border-[#e8783c]/50 bg-[#e8783c]/10' : index < step ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-white/[0.07] bg-white/[0.02]'}`}>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === step ? 'bg-[#e8783c] text-white' : index < step ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/[0.06] text-[#8d9a94]'}`}>{index < step ? <Check size={15} /> : `0${index + 1}`}</span>
            <span className="min-w-0"><span className={`block text-sm font-bold ${index === step ? 'text-white' : 'text-[#c0cbc5]'}`}>{item.title}</span><span className="mt-0.5 hidden text-[11px] text-[#87958e] sm:block">{item.detail}</span></span>
          </button>
        ))}
      </nav>

      <form onSubmit={submit} className="space-y-5">
        {step === 0 && <section className="admin-panel rounded-2xl border p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-[#e8783c]/10 p-2.5 text-[#f29a66]"><Building2 size={19} /></span><div><h2 className="font-bold text-white">Business profile</h2><p className="mt-1 text-xs text-[#94a39d]">Identify the venue and how it appears to customers.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name *"><input className={inputClass} required value={form.businessName} onChange={(e) => { update('businessName', e.target.value); if (!slugEdited) update('menuSlug', slugify(e.target.value)); }} placeholder="e.g. The Green Table" /></Field>
            <Field label="Business type *"><select className={inputClass} value={form.category} onChange={(e) => update('category', e.target.value as ClientCategory)}>{categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></Field>
            <Field label="Public menu URL *"><div className="mt-2 flex overflow-hidden rounded-lg border border-white/10 bg-[#17211e] focus-within:border-[#e8783c]"><span className="flex items-center border-r border-white/10 px-3 text-xs text-[#84938c]">menuqr.app/menu/</span><input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-[#728079]" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.menuSlug} onChange={(e) => { setSlugEdited(true); update('menuSlug', slugify(e.target.value)); }} placeholder="green-table" /></div></Field>
            <Field label="Website (optional)"><input className={inputClass} type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" /></Field>
            <div className="sm:col-span-2">
              <span className={labelClass}>Cover/Hero Image (optional)</span>
              <label className="group relative mt-2 flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-[#17211e] transition hover:border-[#e8783c]/60">
                {form.heroImage ? <img src={form.heroImage} alt="Cover preview" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-2 text-xs font-semibold text-[#aab7b2]"><ImagePlus size={22} className="text-[#f29a66]" />Choose cover photo</span>}
                <input type="file" accept="image/*" className="sr-only" onChange={(event) => void chooseHeroImage(event.currentTarget.files?.[0])} />
              </label>
            </div>
          </div>
          <fieldset className="mt-5"><legend className={labelClass}>Services offered</legend><div className="mt-3 flex flex-wrap gap-2">{serviceOptions.map((service) => { const selected = form.services.includes(service); return <label key={service} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${selected ? 'border-[#e8783c]/50 bg-[#e8783c]/10 text-[#ffc19e]' : 'border-white/10 text-[#aab7b2] hover:border-white/20'}`}><input className="accent-[#e8783c]" type="checkbox" checked={selected} onChange={(e) => update('services', e.target.checked ? [...form.services, service] : form.services.filter((item) => item !== service))} />{service}</label>; })}</div></fieldset>
        </section>}

        {step === 1 && <MenuItemsEditor items={form.menuItems} onChange={(menuItems) => update('menuItems', menuItems)} />}

        {step === 2 && <section className="admin-panel rounded-2xl border p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-sky-400/10 p-2.5 text-sky-300"><UserRound size={19} /></span><div><h2 className="font-bold text-white">Primary contact</h2><p className="mt-1 text-xs text-[#94a39d]">The person responsible for the MenuQR account.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Owner / manager name *"><input className={inputClass} required autoComplete="name" value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} placeholder="Full name" /></Field><Field label="Work email *"><input className={inputClass} required type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@business.com" /></Field><Field label="Phone number *"><input className={inputClass} required type="tel" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" /></Field><Field label="Account status"><select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}><option>Active</option><option>Trial</option><option>Pending</option><option>Paused</option></select></Field></div>
        </section>}

        {step === 3 && <section className="admin-panel rounded-2xl border p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-amber-400/10 p-2.5 text-amber-300"><MapPin size={19} /></span><div><h2 className="font-bold text-white">Location & operating hours</h2><p className="mt-1 text-xs text-[#94a39d]">Used for venue details and customer-facing information.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Street address *" className="sm:col-span-2"><input className={inputClass} required autoComplete="street-address" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Street, building, area" /></Field><Field label="City *"><input className={inputClass} required autoComplete="address-level2" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" /></Field><Field label="State *"><input className={inputClass} required autoComplete="address-level1" value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="State" /></Field><Field label="Postal code"><input className={inputClass} autoComplete="postal-code" value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} placeholder="Postal code" /></Field><Field label="Country *"><input className={inputClass} required autoComplete="country-name" value={form.country} onChange={(e) => update('country', e.target.value)} /></Field><Field label="Opening hours" className="sm:col-span-2"><div className="relative"><Clock3 className="absolute left-3.5 top-3.5 text-[#84938c]" size={16} /><textarea className={`${inputClass} min-h-24 pl-10`} value={form.openingHours} onChange={(e) => update('openingHours', e.target.value)} placeholder={'Mon–Fri: 9:00 AM – 10:00 PM\nSat–Sun: 10:00 AM – 11:00 PM'} /></div></Field></div>
        </section>}

        {step === 4 && <section className="admin-panel rounded-2xl border p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-violet-400/10 p-2.5 text-violet-300"><CreditCard size={19} /></span><div><h2 className="font-bold text-white">Plan & account setup</h2><p className="mt-1 text-xs text-[#94a39d]">Set the subscription and internal handoff details.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-3"><Field label="Subscription plan"><select className={inputClass} value={form.plan} onChange={(e) => update('plan', e.target.value)}>{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></Field><Field label="Billing cycle"><select className={inputClass} value={form.billingCycle} onChange={(e) => update('billingCycle', e.target.value)}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></Field><Field label="Price per cycle"><div className="mt-2 flex rounded-lg border border-white/10 bg-[#17211e] focus-within:border-[#e8783c]"><span className="flex items-center border-r border-white/10 px-3 text-sm text-[#aab7b2]">₹</span><input className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-[#728079]" min="0" type="number" value={form.monthlyPrice} onChange={(e) => update('monthlyPrice', e.target.value)} placeholder="0" /></div></Field><Field label="Internal onboarding notes" className="sm:col-span-3"><textarea className={`${inputClass} min-h-24`} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Menu import, custom requests, follow-up date..." /></Field></div>
        </section>}

        <div className="-mx-4 flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-9 lg:px-9">
          {step === 0 ? <Link to="/admin/dashboard" className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[#aab7b2] transition hover:bg-white/5 hover:text-white">Cancel</Link> : <button type="button" onClick={() => navigate(stepPath(step - 1))} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#aab7b2] transition hover:bg-white/5 hover:text-white"><ArrowLeft size={16} />Back</button>}
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#e8783c] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#e8783c]/15 transition hover:bg-[#f18b50] active:scale-[0.98]">{step === steps.length - 1 ? <><Save size={17} />{existing ? 'Save changes' : 'Create client'}</> : <>Continue<ArrowRight size={16} /></>}</button>
        </div>
      </form>
    </div>
  );
}