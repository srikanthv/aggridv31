import React from 'react';
import { 
  FilterX, 
  RotateCcw, 
  Maximize2, 
  ChevronDownSquare, 
  ChevronUpSquare,
  Database,
  Layout,
  Eye,
  MoreVertical,
  Download,
  FileJson,
  Printer,
  Settings2,
  Undo2,
  Redo2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GridApi } from 'ag-grid-community';
import { GridConfig } from '../../types';
import { SPRING_PRESETS } from '../../lib/motionConfig';

interface GridToolbarProps {
  gridApi: GridApi | null;
  columnApi: any | null;
  config: Required<GridConfig>;
  activeFilterCount: number;
  quickFilterText: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearFilters: () => void;
  onReset: () => void;
  onAutosize: () => void;
}

const Group = ({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
  <div className="flex items-center gap-2 px-3 py-1 border-r border-slate-200 last:border-0 h-full">
    <div className="flex items-center gap-1.5 mr-1 select-none">
      <Icon size={12} className="text-slate-400" />
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</span>
    </div>
    <div className="flex items-center gap-0.5">
      {children}
    </div>
  </div>
);

const ActionButton = ({ 
  onClick, 
  disabled, 
  icon: Icon, 
  label, 
  active = false,
  isReady
}: { 
  onClick: () => void, 
  disabled?: boolean, 
  icon: any, 
  label: string,
  active?: boolean,
  isReady: boolean
}) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.96 }}
    transition={SPRING_PRESETS.fast}
    onClick={onClick}
    disabled={!isReady || disabled}
    title={label}
    className={`
      px-2 py-1 rounded motion-hover flex items-center gap-1.5 whitespace-nowrap group
      ${active 
        ? 'bg-brand-accent/10 text-brand-accent' 
        : 'text-[var(--text-main)] hover:bg-[var(--row-hover)] opacity-80 hover:opacity-100'
      }
      disabled:opacity-20 disabled:cursor-not-allowed disabled:grayscale disabled:transform-none
    `}
  >
    <Icon size={14} className={`${active ? "animate-pulse" : "group-hover:scale-110 transition-transform"}`} />
    {label && <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>}
  </motion.button>
);

export default function GridToolbar({ 
  gridApi, 
  columnApi,
  config, 
  activeFilterCount, 
  quickFilterText,
  onSearchChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearFilters,
  onReset,
  onAutosize
}: GridToolbarProps) {
  const [showMoreActions, setShowMoreActions] = React.useState(false);
  const moreActionsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!config.toolbar?.show) return null;

  const actions = config.toolbar.actions || {};
  const isReady = !!gridApi && !!columnApi;

  const handleExpandAll = () => {
    gridApi?.expandAll();
  };

  const handleCollapseAll = () => {
    gridApi?.collapseAll();
  };

  const handleExportCsv = () => {
    gridApi?.exportDataAsCsv();
    setShowMoreActions(false);
  };

  return (
    <div className="h-10 bg-[var(--toolbar-bg)] border-b border-brand-border flex items-center px-2 shrink-0 justify-between relative z-50 motion-theme">
      <div className="flex items-center h-full overflow-x-auto no-scrollbar flex-1 mr-2">
        {config.enableSearch && (
          <Group title="Search" icon={Search}>
            <div className="relative group flex items-center">
              <input 
                type="text"
                placeholder="Global filter..."
                value={quickFilterText}
                onChange={onSearchChange}
                disabled={!isReady}
                className="px-2 py-1 text-[10px] bg-[var(--header-bg)] text-[var(--text-main)] border border-brand-border rounded focus:outline-none focus:ring-1 focus:ring-brand-accent/50 w-32 focus:w-48 motion-interactive placeholder:text-slate-400 disabled:opacity-50"
              />
              <AnimatePresence>
                {activeFilterCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute right-1 px-1 py-0 rounded bg-brand-accent text-white text-[8px] font-black"
                    title={`${activeFilterCount} active filters`}
                  >
                    {activeFilterCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Group>
        )}

        {config.enableUndoRedo && (
          <Group title="History" icon={RotateCcw}>
             <ActionButton 
              onClick={onUndo}
              disabled={!canUndo}
              icon={Undo2}
              label="Undo"
              isReady={isReady}
            />
            <ActionButton 
              onClick={onRedo}
              disabled={!canRedo}
              icon={Redo2}
              label="Redo"
              isReady={isReady}
            />
          </Group>
        )}

        {(actions.clearFilters !== false) && (
          <Group title="Data" icon={Database}>
            <ActionButton 
              onClick={onClearFilters}
              disabled={activeFilterCount === 0}
              icon={FilterX}
              label={`Filters (${activeFilterCount})`}
              active={activeFilterCount > 0}
              isReady={isReady}
            />
          </Group>
        )}

        {(actions.resetColumns !== false || actions.autosizeColumns !== false) && (
          <Group title="Layout" icon={Layout}>
            {actions.resetColumns !== false && (
              <ActionButton 
                onClick={onReset}
                icon={RotateCcw}
                label="Reset"
                isReady={isReady}
              />
            )}
            {actions.autosizeColumns !== false && (
              <ActionButton 
                onClick={onAutosize}
                icon={Maximize2}
                label="Autosize"
                isReady={isReady}
              />
            )}
          </Group>
        )}

        {(actions.expandAll !== false || actions.collapseAll !== false) && (
          <Group title="View" icon={Eye}>
            {actions.expandAll !== false && (
              <ActionButton 
                onClick={handleExpandAll}
                icon={ChevronDownSquare}
                label="Expand"
                isReady={isReady}
              />
            )}
            {actions.collapseAll !== false && (
              <ActionButton 
                onClick={handleCollapseAll}
                icon={ChevronUpSquare}
                label="Collapse"
                isReady={isReady}
              />
            )}
          </Group>
        )}
      </div>

      <div className="relative shrink-0" ref={moreActionsRef}>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          transition={SPRING_PRESETS.fast}
          onClick={() => setShowMoreActions(!showMoreActions)}
          disabled={!isReady}
          className="p-1.5 hover:bg-[var(--row-hover)] rounded text-slate-500 motion-hover group disabled:transform-none"
          title="More Actions"
        >
          <MoreVertical size={16} className="group-hover:scale-110 transition-transform" />
        </motion.button>

        <AnimatePresence>
          {showMoreActions && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              transition={SPRING_PRESETS.fast}
              className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-[1000] py-1 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Layout size={10} />
                  Layout & View
                </span>
              </div>
              <button 
                onClick={() => { onReset(); setShowMoreActions(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 motion-hover active:bg-slate-100"
                title="Reset column sizes and positions"
              >
                <RotateCcw size={14} />
                <span>Reset Columns</span>
              </button>
              <button 
                onClick={() => { onAutosize(); setShowMoreActions(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 motion-hover active:bg-slate-100"
                title="Fit columns to content"
              >
                <Maximize2 size={14} />
                <span>Autosize All</span>
              </button>
              <button 
                onClick={() => { handleExpandAll(); setShowMoreActions(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 motion-hover active:bg-slate-100"
              >
                <ChevronDownSquare size={14} />
                <span>Expand All</span>
              </button>
              <button 
                onClick={() => { handleCollapseAll(); setShowMoreActions(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 motion-hover active:bg-slate-100"
              >
                <ChevronUpSquare size={14} />
                <span>Collapse All</span>
              </button>

              <div className="px-3 py-2 border-b border-y border-slate-100 my-1 bg-slate-50/50">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <Settings2 size={10} />
                  Data Tools
                </span>
              </div>
              <button 
                onClick={handleExportCsv}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 motion-hover active:bg-slate-100"
              >
                <Download size={14} />
                <span>Export to CSV</span>
              </button>
              <button 
                onClick={() => { setShowMoreActions(false); window.print(); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 motion-hover active:bg-slate-100"
              >
                <Printer size={14} />
                <span>Print View</span>
              </button>
              <div className="h-px bg-slate-100 my-1" />
              <button 
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-400 cursor-not-allowed"
                disabled
              >
                <FileJson size={14} />
                <span>API Export (JSON)</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
