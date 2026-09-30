import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Utensils, Store, Coffee, QrCode, Settings, Menu, X, ChefHat, Sparkles, Bell, ClipboardPlus, LogOut } from 'lucide-react';
import { logoutAdmin } from '../pages/admin/clientStore';
import '../App.css';

const navItems = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/admin/clients/new', icon: ClipboardPlus, label: 'Onboard' },
  { path: '/admin/restaurants', icon: Utensils, label: 'Restaurants' },
  { path: '/admin/dhabas', icon: Store, label: 'Dhabas' },
  { path: '/admin/cafes', icon: Coffee, label: 'Cafes' },
  { path: '/admin/qr', icon: QrCode, label: 'QR Generator' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = location.pathname.startsWith('/admin/clients')
    ? 'Onboard'
    : navItems.find((item) => item.path === location.pathname)?.label ?? 'Admin Console';

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  async function signOut() {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      await logoutAdmin();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Could not sign out.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="admin-shell relative flex h-dvh overflow-hidden bg-[#151c19] font-sans text-[#e7ece9] selection:bg-orange-500/25">

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-[#17211e]/45 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Ultra Premium Dark */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-white/5 bg-[#202b28] text-white shadow-2xl shadow-black/10 transition-transform duration-300 ease-out lg:static lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="relative flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="relative rounded-xl bg-[#e8783c] p-2.5">
            <Sparkles size={13} className="absolute -right-1 -top-1 text-[#ffe5ce]" />
            <ChefHat size={25} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">Menu<span className="text-[#f29a66]">QR</span></h2>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aab7b2]">Super Admin</p>
          </div>
          <button onClick={toggleSidebar} aria-label="Close navigation" className="ml-auto rounded-lg p-2 text-[#aab7b2] transition-colors hover:bg-white/10 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="z-10 flex-1 space-y-1 overflow-y-auto px-3 py-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#899791]">Workspace</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors duration-200 ${
                  isActive ? 'font-semibold text-white' : 'font-medium text-[#b2beb9] hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavBg"
                      className="absolute inset-0 rounded-xl border-l-2 border-[#ed8b54] bg-white/[0.09]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                    <item.icon size={19} className={`relative z-10 transition-colors ${isActive ? 'text-[#f29a66]' : 'text-[#94a39d] group-hover:text-[#f29a66]'}`} />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Server Status Widget inside Sidebar */}
        <div className="m-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]">
           <p className="relative z-10 mb-3 text-[10px] font-bold uppercase tracking-[0.13em] text-[#aab7b2]">System Status</p>
           <div className="flex items-center gap-3 relative z-10">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50 motion-reduce:animate-none"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-xs font-semibold text-white">All systems operational</span>
           </div>
              </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#19211e]/95 backdrop-blur-md">
          <div className="flex min-h-[72px] items-center justify-between px-4 sm:px-6 lg:px-9">
            <div className="flex items-center gap-4">
               <button onClick={toggleSidebar} aria-label="Open navigation" className="rounded-lg border border-white/10 p-2 text-[#aebbb5] transition-colors hover:bg-white/10 lg:hidden">
                 <Menu size={22} />
               </button>
               <div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#87958e]">MenuQR / Admin</p>
                 <h1 className="mt-0.5 text-lg font-bold text-[#edf2ef]">{pageTitle}</h1>
               </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-5">
              <button aria-label="Notifications" className="relative rounded-lg p-2 text-[#a5b2ac] transition-colors hover:bg-white/10 hover:text-white">
                 <Bell size={22} />
                 <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-[#19211e] bg-[#df7040]"></span>
              </button>
              <div className="h-8 w-px bg-white/10" />
              <div className="group flex cursor-pointer items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold leading-tight text-[#edf2ef]">Vikas Admin</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#f29a66]">Super User</p>
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-[#f5e4d9] transition-transform group-hover:scale-105">
                     <img src="https://ui-avatars.com/api/?name=Vikas&background=f5e4d9&color=963e1b&bold=true" alt="Admin" className="h-full w-full object-cover" />
                </div>
                <button type="button" onClick={() => void signOut()} disabled={isLoggingOut} aria-label="Sign out" title="Sign out" className="rounded-lg p-2.5 text-[#aab7b2] transition hover:bg-white/10 hover:text-white disabled:opacity-50"><LogOut size={18} /></button>
              </div>
            </div>
          </div>
          {logoutError && <p role="alert" className="px-4 pb-2 text-right text-xs text-rose-300 sm:px-6 lg:px-9">{logoutError}</p>}
        </header>

        {/* Scrollable Content */}
        <div className="admin-scroll flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-9 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="mx-auto min-h-full max-w-[1440px]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
