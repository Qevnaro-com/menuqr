import { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Search, MapPin, QrCode, Star, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { deleteClient, getClients, type ClientCategory, type ClientRecord } from './clientStore';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemAnim: Variants = { hidden: { y: 40, opacity: 0, scale: 0.95 }, show: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function ClientList() {
  const location = useLocation();
  const type = location.pathname.split('/').pop() || 'restaurants';
  const category = (['restaurants', 'dhabas', 'cafes'].includes(type) ? type : 'restaurants') as ClientCategory;
  const [savedClients, setSavedClients] = useState<ClientRecord[]>([]);
  const [loadResult, setLoadResult] = useState<{ category: ClientCategory; error?: string }>();
  const isLoading = loadResult?.category !== category;
  const error = loadResult?.category === category ? loadResult.error ?? '' : '';
  const title = type.charAt(0).toUpperCase() + type.slice(1);

  useEffect(() => {
    let isCurrent = true;
    void getClients().then((records) => {
      if (isCurrent) {
        setSavedClients(records);
        setLoadResult({ category });
      }
    }).catch((loadError: unknown) => {
      if (isCurrent) setLoadResult({ category, error: loadError instanceof Error ? loadError.message : 'Could not load clients.' });
    });
    return () => { isCurrent = false; };
  }, [category]);

  const clients = savedClients.filter((client) => client.category === category).map((client) => ({
    id: client.id,
    name: client.businessName,
    location: [client.city, client.state].filter(Boolean).join(', '),
    menus: client.menuItems.length,
    status: client.status,
    plan: client.plan,
    rating: 'New',
    img: client.heroImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80',
  }));

  async function handleDelete(client: (typeof clients)[number]) {
    if (!window.confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    try {
      await deleteClient(client.id);
      setSavedClients((current) => current.filter((entry) => entry.id !== client.id));
    } catch (deleteError) {
      setLoadResult({ category, error: deleteError instanceof Error ? deleteError.message : 'Could not delete this client.' });
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-white tracking-tight drop-shadow-md"
          >
            Manage {title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-slate-400 mt-2 font-medium"
          >
            Manage menus, settings and generate QRs for {type}.
          </motion.p>
        </div>
        
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={20} />
           <input 
             type="text" 
             placeholder={`Search ${title}...`} 
             className="pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.1] rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white/[0.05] shadow-inner text-white w-full md:w-80 font-medium transition-all"
           />
        </motion.div>
      </div>

      {/* Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {clients.map((client) => (
          <motion.div 
            key={client.id} 
            variants={itemAnim}
            className="group relative rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.15] backdrop-blur-xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:-translate-y-2"
          >
            {/* Image Header with intense gradient overlay */}
            <div className="h-56 w-full relative overflow-hidden">
               <img 
                 src={client.img} 
                 alt={client.name} 
                 className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/40 to-transparent opacity-90" />
               <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <span className="bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                    {client.plan} Plan
                  </span>
                  <div className="flex items-center gap-1 text-yellow-400 bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1.5 rounded-xl">
                     <Star size={14} fill="currentColor" />
                     <span className="text-xs font-bold text-white">{client.rating}</span>
                  </div>
               </div>
               <div className="absolute bottom-0 left-0 w-full p-5 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-2xl font-black text-white tracking-wide drop-shadow-md">{client.name}</h3>
               </div>
            </div>

            {/* Card Body (Glass) */}
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-2 text-slate-400 text-sm font-bold mb-6">
                 <MapPin size={16} className="text-orange-500" />
                 {client.location}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Menu Items</p>
                    <p className="text-2xl font-black text-white">{client.menus}</p>
                 </div>
                 <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1.5">System Status</p>
                    <p className="text-lg font-black text-green-400 flex items-center gap-1.5 mt-1">
                      <ShieldCheck size={18} /> {client.status}
                    </p>
                 </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                   {typeof client.id === 'string' ? <Link to={`/admin/clients/${client.id}/business`} className="flex-1 bg-white text-black font-black py-3 rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"><Edit3 size={18} /> Edit client</Link> : <button className="flex-1 bg-white text-black font-black py-3 rounded-xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"><Edit3 size={18} /> Manage</button>}
                 {typeof client.id === 'string' ? (
                   <Link to={`/admin/qr?clientId=${encodeURIComponent(client.id)}`} className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-orange-500 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all" aria-label={`Show QR for ${client.name}`} title="Show menu QR">
                     <QrCode size={20} />
                   </Link>
                 ) : (
                   <button type="button" disabled className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/35" aria-label={`QR unavailable for sample ${client.name}`} title="QR is available for saved menus">
                     <QrCode size={20} />
                   </button>
                 )}
                <button type="button" onClick={() => handleDelete(client)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-500/10 border border-rose-400/20 text-rose-300 transition-all hover:bg-rose-500 hover:text-white" aria-label={`Delete ${client.name}`} title="Delete client">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      {!isLoading && !error && clients.length === 0 && <p className="text-sm text-slate-400">No {title.toLowerCase()} found. Onboard a client to add one.</p>}
      {isLoading && <p className="text-sm text-slate-400">Loading {title.toLowerCase()}…</p>}
    </div>
  );
}
