import React, { useState, useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ColDef, 
  GetDataPath, 
  GridApi, 
  RowDragEndEvent, 
  RowDragMoveEvent,
  GridReadyEvent
} from 'ag-grid-community';
import 'ag-grid-enterprise';
import { LayoutGrid, BarChart3, Users, ShieldAlert, Settings, FolderClosed, FileText } from 'lucide-react';

import { Task, DropPosition } from './types';
import { MovementEngine } from './movementEngine';

// Initial dummy data with order field
const INITIAL_DATA: Task[] = [
  { id: '1', name: 'Standard Procedures', path: ['1'], order: 0, type: 'folder', status: 'doing' },
  { id: '2', name: 'Operational Audit', path: ['1', '2'], order: 0, type: 'task', status: 'done' },
  { id: '3', name: 'Safety Guidelines', path: ['1', '3'], order: 1, type: 'task', status: 'doing' },
  { id: '4', name: 'Regional Expansion', path: ['4'], order: 1, type: 'folder', status: 'todo' },
  { id: '5', name: 'Market Analysis', path: ['4', '5'], order: 0, type: 'task', status: 'todo' },
  { id: '6', name: 'System Core', path: ['6'], order: 2, type: 'task', status: 'done' },
];

export default function App() {
  const initialDataRef = useRef<Task[]>(structuredClone(INITIAL_DATA));
  const [rowData, setRowData] = useState<Task[]>(INITIAL_DATA);
  const [dropIndicator, setDropIndicator] = useState<{ targetId: string; position: DropPosition } | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  // Grid Configuration
  const columnDefs: ColDef[] = useMemo(() => [
    { 
      field: 'name', 
      rowDrag: true, 
      editable: true,
      cellRenderer: 'agGroupCellRenderer',
      cellRendererParams: {
        innerRenderer: (params: any) => {
          if (!params.data) return null;
          const isFolder = params.data.type === 'folder';
          return (
            <div className="flex items-center gap-2">
              {isFolder ? (
                <FolderClosed size={16} className="text-amber-500" />
              ) : (
                <FileText size={16} className="text-slate-400" />
              )}
              <span>{params.value}</span>
            </div>
          );
        }
      },
      flex: 2,
    },
    {
      field: 'value',
      editable: true,
      flex: 1,
    },
    { 
      field: 'status', 
      flex: 1,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['todo', 'doing', 'done']
      },
      cellRenderer: (params: any) => {
        const val = params.value?.toUpperCase();
        const colors: Record<string, string> = {
          DONE: 'bg-emerald-100 text-emerald-700',
          DOING: 'bg-blue-100 text-blue-700',
          TODO: 'bg-slate-100 text-slate-600',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${colors[val] || colors.TODO}`}>
            {val}
          </span>
        );
      }
    },
    { 
      field: 'type', 
      flex: 1, 
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['task', 'folder']
      },
      cellStyle: { color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 } 
    },
    { field: 'order', hide: true, sort: 'asc' as const }
  ], []);

  const defaultColDef: ColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    onCellValueChanged: (params) => {
      if (!params.data) return;
      const newData = MovementEngine.updateNode(rowData, params.data.id, {
        name: params.data.name,
        status: params.data.status,
        type: params.data.type,
        value: params.data.value
      });
      setRowData(newData);
    }
  }), [rowData]);

  const autoGroupColumnDef: ColDef = useMemo(() => ({
    headerName: 'ASSET HIERARCHY',
    minWidth: 300,
    cellRendererParams: {
      suppressCount: true,
    },
  }), []);

  const getDataPath: GetDataPath = useCallback((data) => {
    return data.path;
  }, []);

  const onGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    params.api.sizeColumnsToFit();
  };

  const getDropPosition = (event: RowDragMoveEvent | RowDragEndEvent): DropPosition => {
    const rowNode = event.overNode;
    if (!rowNode) return 'below';

    // Get the actual DOM element for the hovered row
    const rowElement = document.querySelector(`[row-id="${rowNode.id}"]`);
    if (!rowElement) return 'into';

    const rect = rowElement.getBoundingClientRect();
    const mouseY = event.event.clientY;
    const offsetY = mouseY - rect.top;
    const ratio = offsetY / rect.height;

    // Strict 25/50/25 rule for precise UX
    if (ratio < 0.25) return 'above';
    if (ratio > 0.75) return 'below';
    return 'into';
  };

  const onRowDragMove = (event: RowDragMoveEvent) => {
    const overNode = event.overNode;
    if (!overNode) {
      setDropIndicator(null);
      return;
    }

    const pos = getDropPosition(event);
    setDropIndicator({ targetId: overNode.data.id, position: pos });
  };

  const onRowDragLeave = () => {
    setDropIndicator(null);
  };

  const onRowDragEnd = (event: RowDragEndEvent) => {
    setDropIndicator(null);
    const overNode = event.overNode;
    if (!overNode || !gridApiRef.current) return;

    const movingNodes = event.nodes;
    const movingIds = movingNodes.map(n => n.data.id);
    const targetId = overNode.data.id;
    const position = getDropPosition(event);

    const newData = MovementEngine.moveTasks(rowData, movingIds, targetId, position);
    setRowData(newData);
  };

  const handleAddNode = () => {
    if (!gridApiRef.current) return;
    const selectedRows = gridApiRef.current.getSelectedRows();
    const parentId = selectedRows.length > 0 ? selectedRows[0].id : null;
    const newData = MovementEngine.addNode(rowData, parentId);
    setRowData(newData);
  };

  const handleDeleteNode = () => {
    if (!gridApiRef.current) return;
    const selectedRows = gridApiRef.current.getSelectedRows();
    if (selectedRows.length === 0) return;
    
    // Delete first selected row for simplicity or all? User says "Delete Row"
    const targetId = selectedRows[0].id;
    const newData = MovementEngine.deleteNode(rowData, targetId);
    setRowData(newData);
    gridApiRef.current.deselectAll();
  };

  const handleReset = () => {
    if (!gridApiRef.current) return;
    
    // 1. Clear Selection
    gridApiRef.current.deselectAll();
    
    // 2. Collapse all nodes for a clean state
    gridApiRef.current.collapseAll();
    
    // 3. Restore deep cloned initial state
    const original = structuredClone(initialDataRef.current);
    setRowData(original);
  };

  // Helper component for Drop Indicator
  const DropIndicatorComponent = () => {
    if (!dropIndicator || !gridApiRef.current) return null;

    const rowElement = document.querySelector(`.ag-theme-quartz [row-id="${dropIndicator.targetId}"]`);
    if (!rowElement) return null;

    const gridContainer = document.querySelector('.ag-theme-quartz');
    if (!gridContainer) return null;

    const containerRect = gridContainer.getBoundingClientRect();
    const rect = rowElement.getBoundingClientRect();

    // Calculate position relative to the relative-positioned .ag-theme-quartz container
    const top = rect.top - containerRect.top;
    const height = rect.height;

    let style: React.CSSProperties = {
      position: 'absolute',
      left: 0,
      width: '100%',
      pointerEvents: 'none',
      zIndex: 100, // Ensure it stays on top of AG Grid overlays
    };

    if (dropIndicator.position === 'above') {
      style = { ...style, top: top - 2, height: '4px', backgroundColor: '#3b82f6', boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)' };
    } else if (dropIndicator.position === 'below') {
      style = { ...style, top: top + height - 2, height: '4px', backgroundColor: '#3b82f6', boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)' };
    } else {
      style = { 
        ...style, 
        top: top, 
        height: height, 
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        border: '2px solid #3b82f6',
        borderRadius: '2px',
        boxSizing: 'border-box'
      };
    }

    return <div style={style} />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text">
      {/* Sidebar */}
      <aside className="w-60 bg-brand-sidebar text-white flex flex-col shrink-0 font-sans">
        <div className="p-6 border-b border-slate-800 font-bold text-sm tracking-widest flex items-center gap-3">
          <div className="p-1 bg-brand-accent rounded">
            <ShieldAlert size={18} className="text-white" />
          </div>
          CORE ADMIN
        </div>
        
        <nav className="py-4 flex-1">
          <div className="px-6 py-3 text-xs opacity-40 uppercase font-black tracking-widest mb-2">Main Menu</div>
          <NavItem icon={<LayoutGrid size={16} />} label="Dashboard" />
          <NavItem icon={<BarChart3 size={16} />} label="Tree Structure" active />
          <NavItem icon={<Users size={16} />} label="Member Permissions" />
          <NavItem icon={<ShieldAlert size={16} />} label="System Audit" />
          <NavItem icon={<Settings size={16} />} label="API Settings" />
        </nav>
        
        <div className="p-6 text-[10px] opacity-30 font-mono">
          PROD-V31.3.4
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col min-w-0 border-l border-brand-border">
        {/* Header */}
        <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
          <div className="flex flex-col">
            <h2 className="font-semibold text-lg leading-tight">Enterprise Asset Hierarchy</h2>
            <p className="text-[10px] text-slate-400 font-medium">REAL-TIME HIERARCHICAL RESTRUCTURING ENGINE</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleAddNode}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Add Node
            </button>
            <button 
              onClick={handleDeleteNode}
              className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 transition-colors shadow-sm"
            >
              Delete Selected
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button 
              onClick={handleReset}
              className="px-4 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors shadow-sm"
            >
              Reset Interface
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <button 
              onClick={() => gridApiRef.current?.expandAll()}
              className="px-4 py-2 text-xs font-semibold border border-brand-border rounded hover:bg-slate-50 transition-colors"
            >
              Expand All
            </button>
            <button 
              onClick={() => gridApiRef.current?.collapseAll()}
              className="px-4 py-2 text-xs font-semibold border border-brand-border rounded hover:bg-slate-50 transition-colors"
            >
              Collapse All
            </button>
            <button className="px-4 py-2 text-xs font-semibold bg-brand-accent text-white rounded hover:opacity-90 transition-opacity ml-2 shadow-md">
              Publish Structure
            </button>
          </div>
        </header>

        {/* Grid Area */}
        <div className="flex-1 p-6 bg-brand-grid-bg overflow-hidden flex flex-col">
          <div className="flex-1 bg-white rounded shadow-sm border border-brand-border overflow-hidden flex flex-col relative">
            <div className="ag-theme-quartz flex-1 w-full h-full relative">
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                autoGroupColumnDef={autoGroupColumnDef}
                treeData={true}
                animateRows={true}
                groupDefaultExpanded={-1}
                getDataPath={getDataPath}
                onGridReady={onGridReady}
                onRowDragMove={onRowDragMove}
                onRowDragLeave={onRowDragLeave}
                onRowDragEnd={onRowDragEnd}
                getRowId={(params) => params.data.id}
                rowDragManaged={false}
                suppressMoveWhenRowDragging={true}
                rowSelection="multiple"
              />
              <DropIndicatorComponent />
              <div className="absolute top-2 right-2 px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded border border-blue-100 opacity-50 pointer-events-none">
                EVALUATION MODE
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-8 bg-brand-bg border-t border-brand-border flex items-center justify-between px-4 text-[11px] text-slate-400 shrink-0">
          <div className="flex gap-4">
            <div>Assets: {rowData.length}</div>
            <div className="text-brand-accent font-bold">Standard Enterprise Edition</div>
          </div>
          <div>React 18.2.0 • AG Grid Enterprise v31.3.4</div>
        </footer>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`
      px-6 py-3 flex items-center gap-3 text-sm cursor-pointer transition-all border-l-4
      ${active ? 'bg-slate-800/50 text-white border-brand-accent' : 'text-white/60 border-transparent hover:text-white/90 hover:bg-slate-800/20'}
    `}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
