import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Check, Save, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getClients, saveClient, type ClientRecord } from './clientStore';

type SettingsDraft = Pick<ClientRecord, 'businessName' | 'menuSlug' | 'website' | 'status' | 'plan' | 'billingCycle' | 'monthlyPrice'>;

const plans = ['Starter', 'Basic', 'Pro', 'Premium', 'Enterprise'];
const categories: Record<ClientRecord['category'], string> = { restaurants: 'Restaurant', dhabas: 'Dhaba', cafes: 'Cafe' };
const inputClass = 'mt-2 w-full rounded-lg border border-white/10 bg-[#17211e] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-[#728079] focus:border-[#e8783c] focus:ring-2 focus:ring-[#e8783c]/20';
const labelClass = 'block text-sm font-semibold text-[#dce5df]';

function toDraft(client?: ClientRecord): SettingsDraft {
  return {
    businessName: client?.businessName ?? '',
    menuSlug: client?.menuSlug ?? '',
    website: client?.website ?? '',
    status: client?.status ?? 'Active',
    plan: client?.plan ?? 'Starter',
    billingCycle: client?.billingCycle ?? 'Monthly',
    monthlyPrice: client?.monthlyPrice ?? '',
  };
}

export default function Settings() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState(() => toDraft());
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const selectedClient = clients.find((client) => client.id === selectedId);

  useEffect(() => {
    let isCurrent = true;
    void getClients().then((records) => {
      if (!isCurrent) return;
      setClients(records);
      setSelectedId(records[0]?.id ?? '');
      setDraft(toDraft(records[0]));
    }).catch((loadError: unknown) => {
      if (isCurrent) setError(loadError instanceof Error ? loadError.message : 'Could not load settings.');
    }).finally(() => {
      if (isCurrent) setIsLoading(false);
    });
    return () => { isCurrent = false; };
  }, []);

  function selectClient(id: string) {
    const client = clients.find((entry) => entry.id === id);
    setSelectedId(id);
    setDraft(toDraft(client));
    setError('');
    setSaved(false);
  }

  function update<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;

    const businessName = draft.businessName.trim();
    const menuSlug = draft.menuSlug.trim().toLowerCase();
    const monthlyPrice = draft.monthlyPrice.trim();
    if (!businessName) {
      setError('Business name is required.');
      return;
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(menuSlug)) {
      setError('Menu URL must use lowercase letters, numbers, and single hyphens.');
      return;
    }
    if (clients.some((client) => client.id !== selectedId && client.menuSlug === menuSlug)) {
      setError('That menu URL is already in use. Choose another one.');
      return;
    }
    if (monthlyPrice && (!Number.isFinite(Number(monthlyPrice)) || Number(monthlyPrice) < 0)) {
      setError('Price must be zero or greater.');
      return;
    }

    const updatedClient = { ...selectedClient, ...draft, businessName, menuSlug, monthlyPrice };
    setIsSaving(true);
    try {
      const savedClient = await saveClient(updatedClient);
      setClients((current) => current.map((client) => client.id === selectedId ? savedClient : client));
      setDraft(toDraft(savedClient));
      setError('');
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save settings.');
      setSaved(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <div className="flex items-center gap-3 text-[#f29a66]"><Building2 size={20} /><span className="text-xs font-bold uppercase tracking-[0.16em]">Account management</span></div>
        <h1 className="mt-2 text-3xl font-black text-white">Settings</h1>
        <p className="mt-2 text-sm text-[#aab7b2]">Manage a saved business profile, menu URL, status, and subscription.</p>
      </header>

      {isLoading ? <p className="text-sm text-[#94a39d]">Loading account settings…</p> : clients.length === 0 ? (
        <section className="admin-panel flex min-h-72 flex-col items-center justify-center rounded-2xl border p-8 text-center">
          <span className="mb-4 rounded-xl bg-[#e8783c]/10 p-3 text-[#f29a66]"><Store size={24} /></span>
          <h2 className="font-bold text-white">No businesses to manage</h2>
          <p className="mt-2 max-w-sm text-sm text-[#94a39d]">Create a restaurant, dhaba, or cafe to manage its profile and subscription here.</p>
          <Link to="/admin/clients/new/business" className="mt-5 rounded-lg bg-[#e8783c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#f18b50]">Onboard a business</Link>
        </section>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <section className="admin-panel rounded-2xl border p-5 sm:p-7">
            <label className={labelClass}>Choose business
              <select value={selectedId} onChange={(event) => selectClient(event.target.value)} className={inputClass}>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.businessName} · {categories[client.category]}</option>)}
              </select>
            </label>
          </section>

          {selectedClient && <>
            <section className="admin-panel rounded-2xl border p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-[#e8783c]/10 p-2.5 text-[#f29a66]"><Building2 size={19} /></span><div><h2 className="font-bold text-white">Business profile</h2><p className="mt-1 text-xs text-[#94a39d]">Update the public details used by this menu.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Business name<input className={inputClass} value={draft.businessName} onChange={(event) => update('businessName', event.target.value)} required /></label>
                <label className={labelClass}>Menu URL slug<input className={inputClass} value={draft.menuSlug} onChange={(event) => update('menuSlug', event.target.value)} required /></label>
                <label className={labelClass}>Website<input className={inputClass} type="url" value={draft.website} onChange={(event) => update('website', event.target.value)} placeholder="https://example.com" /></label>
                <label className={labelClass}>Account status
                  <select className={inputClass} value={draft.status} onChange={(event) => update('status', event.target.value)}><option>Active</option><option>Trial</option><option>Pending</option><option>Paused</option></select>
                </label>
              </div>
            </section>

            <section className="admin-panel rounded-2xl border p-5 sm:p-7">
              <div className="mb-6 flex items-center gap-3"><span className="rounded-lg bg-emerald-400/10 p-2.5 text-emerald-300"><Store size={19} /></span><div><h2 className="font-bold text-white">Subscription</h2><p className="mt-1 text-xs text-[#94a39d]">Manage the plan and billing for this business.</p></div></div>
              <div className="grid gap-5 sm:grid-cols-3">
                <label className={labelClass}>Plan<select className={inputClass} value={draft.plan} onChange={(event) => update('plan', event.target.value)}>{plans.map((plan) => <option key={plan}>{plan}</option>)}</select></label>
                <label className={labelClass}>Billing cycle<select className={inputClass} value={draft.billingCycle} onChange={(event) => update('billingCycle', event.target.value)}><option>Monthly</option><option>Quarterly</option><option>Yearly</option></select></label>
                <label className={labelClass}>Price per cycle<input className={inputClass} type="number" min="0" step="0.01" value={draft.monthlyPrice} onChange={(event) => update('monthlyPrice', event.target.value)} placeholder="0" /></label>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div aria-live="polite">{error ? <p className="text-sm text-rose-300">{error}</p> : saved ? <p className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><Check size={16} />Settings saved</p> : null}</div>
              <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#e8783c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#f18b50] disabled:cursor-wait disabled:opacity-60"><Save size={17} />{isSaving ? 'Saving…' : 'Save settings'}</button>
            </div>
          </>}
        </form>
      )}
    </div>
  );
}
