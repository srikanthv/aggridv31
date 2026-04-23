import React from 'react';
import { LayoutGrid, BarChart3, Users, ShieldAlert, Code2, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReusableGrid, { defaultGridConfig } from './components/ReusableGrid/ReusableGrid';
import ConfigViewer from './components/ConfigViewer/ConfigViewer';
import { gridConfigs } from './gridConfigs';
import { assetData, userData, auditData } from './sampleData';
import { SPRING_PRESETS } from './lib/motionConfig';

type PageType = 'assets' | 'users' | 'audit';

export default function App() {
  const [activePage, setActivePage] = React.useState<PageType>('assets');
  const [showConfig, setShowConfig] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const getActiveConfig = () => {
    switch (activePage) {
      case 'assets': return gridConfigs.assets;
      case 'users': return gridConfigs.users;
      case 'audit': return gridConfigs.audit;
      default: return gridConfigs.assets;
    }
  };

  const activeConfig = getActiveConfig();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text motion-theme">
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-brand-sidebar text-white flex flex-col shrink-0 font-sans z-20 motion-theme">
        <div className="p-6 border-b border-slate-800 font-bold text-sm tracking-widest flex items-center gap-3">
          <div className="p-1 bg-brand-accent rounded">
            <ShieldAlert size={18} className="text-white" />
          </div>
          CORE ADMIN
        </div>
        
        <nav className="py-4 flex-1">
          <div className="px-6 py-3 text-xs opacity-40 uppercase font-black tracking-widest mb-2">Main Menu</div>
          <NavItem 
            icon={<LayoutGrid size={16} />} 
            label="Dashboard" 
            onClick={() => setActivePage('audit')} 
            active={activePage === 'audit'} 
            index={0}
          />
          <NavItem 
            icon={<BarChart3 size={16} />} 
            label="Hierarchy" 
            onClick={() => setActivePage('assets')} 
            active={activePage === 'assets'} 
            index={1}
          />
          <NavItem 
            icon={<Users size={16} />} 
            label="Members" 
            onClick={() => setActivePage('users')} 
            active={activePage === 'users'} 
            index={2}
          />
        </nav>

        <div className="px-4 py-2 flex flex-col gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold motion-hover active:scale-95
              ${showConfig ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'}
            `}
          >
            <Code2 size={14} />
            {showConfig ? 'Hide Config' : 'View Config'}
          </button>
          
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50 motion-hover active:scale-95"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
        
        <div className="p-6 text-[10px] opacity-30 font-mono">
          PROD-V31.3.4
        </div>
      </aside>

      {/* Dynamic Content View */}
      <main className="flex-1 flex min-w-0 border-l border-brand-border h-full relative overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 h-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {activePage === 'assets' && (
                <ReusableGrid 
                  {...gridConfigs.assets}
                  initialRowData={assetData}
                  className="flex-1"
                />
              )}
              
              {activePage === 'users' && (
                <ReusableGrid 
                  {...gridConfigs.users}
                  initialRowData={userData}
                  className="flex-1"
                />
              )}

              {activePage === 'audit' && (
                <ReusableGrid 
                  {...gridConfigs.audit}
                  initialRowData={auditData}
                  className="flex-1"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Unified App Footer */}
          <footer className="h-8 bg-brand-bg border-t border-brand-border flex items-center justify-between px-4 text-[10px] text-slate-400 shrink-0 z-10 motion-theme">
            <div className="flex gap-4">
              <div className="text-brand-accent font-bold uppercase tracking-widest">Enterprise Component System</div>
              <div className="bg-slate-50 border border-slate-100 px-2 rounded">Active Node: {activePage.toUpperCase()}</div>
            </div>
            <div>Grid v31.3.4 • Unified Persistence Engine</div>
          </footer>
        </div>

        {/* Config Viewer Side Panel */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SPRING_PRESETS.medium}
              className="w-96 shrink-0 h-full z-30"
            >
              <ConfigViewer 
                gridId={activeConfig.gridId}
                schema={activeConfig.schema}
                configOverrides={activeConfig.configOverrides}
                defaultConfig={defaultGridConfig}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  onClick, 
  active = false,
  index = 0
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  active?: boolean;
  index?: number;
}) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ...SPRING_PRESETS.fast, delay: index * 0.05 }}
      onClick={onClick}
      className={`
        px-6 py-3 flex items-center gap-3 text-sm cursor-pointer motion-hover border-l-4 active:scale-98
        ${active ? 'bg-slate-800/50 text-white border-brand-accent' : 'text-white/60 border-transparent hover:text-white/90 hover:bg-slate-800/20'}
      `}>
      {icon}
      <span>{label}</span>
    </motion.div>
  );
}
