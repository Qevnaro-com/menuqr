import { motion, type Variants } from 'framer-motion';
import { Utensils, QrCode, TrendingUp, Store, Coffee, ArrowUpRight, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const summaryStats = [
  { title: 'Total Clients', value: '1,245', icon: Users, color: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.4)]', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { title: 'Active Menus', value: '890', icon: Utensils, color: 'text-orange-400', glow: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { title: 'Total Scans (30d)', value: '45.2K', icon: QrCode, color: 'text-purple-400', glow: 'shadow-[0_0_20px_rgba(192,132,252,0.4)]', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { title: 'Monthly Revenue', value: '₹4.5L', icon: TrendingUp, color: 'text-emerald-400', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.4)]', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

const clientTypes = [
  { name: 'Restaurants', count: '450', icon: Utensils, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { name: 'Dhabas', count: '320', icon: Store, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { name: 'Cafes', count: '120', icon: Coffee, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemAnim: Variants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

export default function Dashboard() {
  return (
    <div className="admin-dashboard space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-white tracking-tight drop-shadow-lg"
          >
            Business Overview
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-slate-400 mt-2 font-medium"
          >
            Monitor your SaaS growth and live metrics across all platforms.
          </motion.p>
        </div>
        <motion.div 
           whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
           className="rounded-xl bg-[#e8783c] text-white shadow-lg shadow-[#e8783c]/20 transition-colors hover:bg-[#f18b50]"
        >
          <Link to="/admin/clients/new/business" className="flex items-center gap-2 px-5 py-3 font-bold"><Users size={18} /> Onboard Client <ArrowUpRight size={16} /></Link>
        </motion.div>
      </div>

      {/* Primary Stats Grid - Glass Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryStats.map((stat, i) => (
          <motion.div key={i} variants={itemAnim} className="admin-stat-card group relative">
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/[0.05] group-hover:border-white/[0.15] backdrop-blur-xl transition-colors`} />
            <div className="relative p-6 z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.border} border ${stat.glow} transition-all duration-300 group-hover:scale-110`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                  <ArrowUpRight size={14} /> +12%
                </span>
              </div>
              <div className="mt-auto">
                <h3 className="text-4xl font-black text-white tracking-tight mb-1">{stat.value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Section */}
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="admin-panel lg:col-span-2 relative p-7 border backdrop-blur-xl">
           <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
             <Activity className="text-orange-500" /> Live Client Distribution
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {clientTypes.map((type, i) => (
                 <motion.div key={i} variants={itemAnim} className={`rounded-2xl p-6 border ${type.border} ${type.bg} flex flex-col justify-between h-44 group hover:bg-white/[0.05] transition-all duration-300`}>
                    <div className="flex items-center gap-3">
                       <div className={`w-12 h-12 rounded-xl bg-[#050508]/50 flex items-center justify-center border ${type.border} shadow-inner`}>
                          <type.icon size={24} className={type.color} />
                       </div>
                       <span className="font-bold text-white">{type.name}</span>
                    </div>
                    <div>
                       <span className={`text-5xl font-black ${type.color} drop-shadow-[0_0_15px_currentColor]`}>{type.count}</span>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Active Accounts</p>
                    </div>
                 </motion.div>
              ))}
           </div>
           
           <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <h3 className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest">Recent Activity</h3>
              <div className="space-y-3">
                 {['The Royal Dine', 'Pappu Da Dhaba', 'Brew Beans Cafe'].map((name, i) => (
                    <div key={name} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-all border border-transparent hover:border-white/[0.1] cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center font-black text-xl border border-white/5 shadow-inner">
                             {name.charAt(0)}
                          </div>
                          <div>
                             <p className="font-bold text-white text-lg">{name}</p>
                             <p className="text-xs text-slate-400 font-medium">Joined {i + 1} hours ago</p>
                          </div>
                       </div>
                       <button className="text-sm font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl hover:bg-orange-500 hover:text-white transition-colors">
                          Manage
                       </button>
                    </div>
                 ))}
              </div>
           </div>
        </motion.div>

        {/* Quick Actions / System */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="admin-panel rounded-3xl p-7 border backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-600 rounded-full mix-blend-screen filter blur-[100px] opacity-40 pointer-events-none" />
          
          <h2 className="text-xl font-bold text-white mb-2">System Resources</h2>
          <p className="text-slate-400 text-sm font-medium mb-10">Optimized and running smoothly.</p>
          
          <div className="space-y-8 relative z-10">
            <div>
              <div className="flex justify-between text-sm font-bold mb-3">
                <span className="text-slate-300">Database Load</span>
                <span className="text-orange-400">24%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: '24%' }} transition={{ duration: 1.5, ease: "easeOut" }} className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold mb-3">
                <span className="text-slate-300">Storage Capacity</span>
                <span className="text-blue-400">68%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-white/5">
                <motion.div initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }} className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
              </div>
            </div>
          </div>

          <div className="mt-12">
             <button className="w-full bg-white/[0.03] hover:bg-white/[0.1] border border-white/[0.05] text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-between group">
                Advanced Settings
                <ArrowUpRight size={20} className="text-slate-400 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
