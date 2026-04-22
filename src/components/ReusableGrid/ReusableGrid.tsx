import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { LayoutGrid, FolderClosed, FileText, Undo2, Redo2, ShieldAlert } from 'lucide-react';

import { Task, DropPosition, GridConfig, ColumnSchema } from '../../types';
import { MovementEngine } from '../../movementEngine';

export const defaultGridConfig: Required<GridConfig> = {
  enableSearch: true,
  enablePersistence: true,
  enableColumnState: true,
  enableExpandedState: true,
  enableUndoRedo: true,
  enableDragDrop: true,
  enableCRUD: true,
};

interface ReusableGridProps {
  gridId: string;
  initialRowData: Task[];
  schema: ColumnSchema[];
  autoGroupColumnDef?: ColDef;
  configOverrides?: GridConfig;
  className?: string;
}

export default function ReusableGrid({
  gridId,
  initialRowData,
  schema,
  autoGroupColumnDef: userAutoGroupColumnDef,
  configOverrides = {},
  className = ""
}: ReusableGridProps) {
  const config = { ...defaultGridConfig, ...configOverrides };
  
  // Namespaced Keys
  const STORAGE_KEY = `aggrid_${gridId}_rowdata`;
  const GRID_STATE_KEY = `aggrid_${gridId}_state`;
  const COLUMN_STATE_KEY = `aggrid_${gridId}_column_state`;
  const EXPANDED_KEY = `aggrid_${gridId}_expanded`;

  const getInitialData = (): Task[] => {
    if (config.enablePersistence) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (error) {
        console.error(`Failed to parse rowData for ${gridId}:`, error);
      }
    }
    return initialRowData;
  };

  const [rowData, setRowData] = useState<Task[]>(() => getInitialData());
  const [dropIndicator, setDropIndicator] = useState<{ targetId: string; position: DropPosition } | null>(null);
  const [isSortActive, setIsSortActive] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [history, setHistory] = useState<Task[][]>([]);
  const [future, setFuture] = useState<Task[][]>([]);
  
  const gridApiRef = useRef<GridApi | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialDataRef = useRef<Task[]>(structuredClone(initialRowData));

  // Persistence
  useEffect(() => {
    if (config.enablePersistence) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rowData));
    }
  }, [rowData, config.enablePersistence, STORAGE_KEY]);

  const saveGridState = useCallback(() => {
    if (!gridApiRef.current || !config.enablePersistence) return;
    const state = {
      columnState: gridApiRef.current.getColumnState(),
      filterModel: gridApiRef.current.getFilterModel()
    };
    localStorage.setItem(GRID_STATE_KEY, JSON.stringify(state));
  }, [config.enablePersistence, GRID_STATE_KEY]);

  const saveColumnState = useCallback(() => {
    if (!gridApiRef.current || !config.enablePersistence || !config.enableColumnState) return;
    const state = gridApiRef.current.getColumnState();
    localStorage.setItem(COLUMN_STATE_KEY, JSON.stringify(state));
  }, [config.enablePersistence, config.enableColumnState, COLUMN_STATE_KEY]);

  const saveExpandedState = useCallback(() => {
    if (!gridApiRef.current || !config.enablePersistence || !config.enableExpandedState) return;
    const expandedIds: string[] = [];
    gridApiRef.current.forEachNode((node) => {
      if (node.expanded && node.data) {
        expandedIds.push(node.data.id);
      }
    });
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(expandedIds));
  }, [config.enablePersistence, config.enableExpandedState, EXPANDED_KEY]);

  // Search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuickFilterText(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (gridApiRef.current) gridApiRef.current.setQuickFilter(value);
    }, 200);
  };

  // History
  const updateDataWithHistory = useCallback((newData: Task[], isUndoRedo = false) => {
    if (!isUndoRedo && config.enableUndoRedo) {
      setHistory(prev => [...prev, structuredClone(rowData)].slice(-20));
      setFuture([]);
    }
    setRowData(newData);
  }, [rowData, config.enableUndoRedo]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [structuredClone(rowData), ...prev]);
    setRowData(previousState);
  }, [history, rowData]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const nextState = future[0];
    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev, structuredClone(rowData)]);
    setRowData(nextState);
  }, [future, rowData]);

  // Shortcuts
  useEffect(() => {
    if (!config.enableUndoRedo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && isZ) {
        if (e.shiftKey) handleRedo(); else handleUndo();
        e.preventDefault();
      } else if (ctrlOrCmd && isY) {
        handleRedo(); e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, config.enableUndoRedo]);

  // Grid Events
  const onSortChanged = useCallback(() => {
    if (!gridApiRef.current) return;
    const columnState = gridApiRef.current.getColumnState();
    const hasUserSort = columnState.some(s => s.colId !== 'order' && s.sort != null);
    setIsSortActive(hasUserSort);
    saveGridState();
  }, [saveGridState]);

  const onColumnStateChanged = useCallback(() => {
    saveColumnState();
  }, [saveColumnState]);

  const onRowGroupOpened = useCallback(() => {
    saveExpandedState();
  }, [saveExpandedState]);

  const onGridReady = (params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    params.api.sizeColumnsToFit();

    if (config.enablePersistence) {
      // Restore Grid State
      try {
        const savedState = localStorage.getItem(GRID_STATE_KEY);
        if (savedState) {
          const { columnState, filterModel } = JSON.parse(savedState);
          if (columnState) {
            params.api.applyColumnState({ state: columnState, applyOrder: true });
            const hasUserSort = columnState.some((s: any) => s.colId !== 'order' && s.sort != null);
            setIsSortActive(hasUserSort);
          }
          if (filterModel) params.api.setFilterModel(filterModel);
        }
      } catch (e) { console.error("Restore grid state failed", e); }

      // Restore Column State
      if (config.enableColumnState) {
        try {
          const savedCol = localStorage.getItem(COLUMN_STATE_KEY);
          if (savedCol) params.api.applyColumnState({ state: JSON.parse(savedCol), applyOrder: true });
        } catch (e) { console.error("Restore col state failed", e); }
      }

      // Restore Expanded State
      if (config.enableExpandedState) {
        try {
          const savedExp = localStorage.getItem(EXPANDED_KEY);
          if (savedExp) {
            const ids = JSON.parse(savedExp);
            params.api.forEachNode(node => { if (node.data && ids.includes(node.data.id)) node.setExpanded(true); });
          } else { params.api.expandAll(); }
        } catch (e) { console.error("Restore expanded failed", e); }
      }
    }
  };

  // Drag Drop
  const getDropPosition = (event: RowDragMoveEvent | RowDragEndEvent): DropPosition => {
    const rowNode = event.overNode;
    if (!rowNode) return 'below';
    const rowElement = document.querySelector(`[row-id="${rowNode.id}"]`);
    if (!rowElement) return 'into';
    const rect = rowElement.getBoundingClientRect();
    const ratio = (event.event.clientY - rect.top) / rect.height;
    const isExpandedParent = rowNode.expanded && (rowNode.allChildrenCount ?? 0) > 0;
    const parent = rowNode.parent;
    const siblings = parent?.childrenAfterGroup || [];
    const isLastChildOfParent = siblings.length > 0 && siblings[siblings.length - 1] === rowNode;

    if (isExpandedParent && ratio > 0.8) return 'below-parent';
    if (!isExpandedParent && isLastChildOfParent && ratio > 0.6 && parent && parent.level >= 0) return 'below-parent';
    if (ratio < 0.25) return 'above';
    if (ratio > 0.75) return 'below';
    return 'into';
  };

  const onRowDragEnd = (event: RowDragEndEvent) => {
    setDropIndicator(null);
    const overNode = event.overNode;
    if (!overNode || !gridApiRef.current || !config.enableDragDrop) return;
    const movingIds = event.nodes.map(n => n.data.id);
    let targetId = overNode.data.id;
    let position = getDropPosition(event);
    const parent = overNode.parent;
    const siblings = parent?.childrenAfterGroup || [];
    const isLastChildOfParent = siblings.length > 0 && siblings[siblings.length - 1] === overNode;
    const isNotExpanded = !overNode.expanded || (overNode.allChildrenCount ?? 0) === 0;
    if (position === 'below-parent' && isLastChildOfParent && isNotExpanded && parent && parent.level >= 0) {
      targetId = parent.data.id;
    }
    updateDataWithHistory(MovementEngine.moveTasks(rowData, movingIds, targetId, position));
  };

  // CRUD
  const handleAddNode = () => {
    if (!gridApiRef.current) return;
    const parentId = gridApiRef.current.getSelectedRows()[0]?.id || null;
    updateDataWithHistory(MovementEngine.addNode(rowData, parentId));
  };

  const handleDeleteNode = () => {
    if (!gridApiRef.current) return;
    const targetId = gridApiRef.current.getSelectedRows()[0]?.id;
    if (targetId) {
      updateDataWithHistory(MovementEngine.deleteNode(rowData, targetId));
      gridApiRef.current.deselectAll();
    }
  };

  const handleReset = () => {
    if (!gridApiRef.current) return;
    gridApiRef.current.deselectAll();
    gridApiRef.current.collapseAll();
    gridApiRef.current.applyColumnState({ defaultState: { sort: null } });
    gridApiRef.current.setFilterModel(null);
    gridApiRef.current.setQuickFilter('');
    setQuickFilterText('');
    setIsSortActive(false);
    setHistory([]);
    setFuture([]);
    
    if (config.enablePersistence) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(GRID_STATE_KEY);
      localStorage.removeItem(COLUMN_STATE_KEY);
      localStorage.removeItem(EXPANDED_KEY);
    }
    setRowData(structuredClone(initialDataRef.current));
  };

  // Mapper: Schema -> ColDef
  const mappedColumnDefs = useMemo(() => {
    return schema.map(col => {
      const base: ColDef = {
        field: col.key,
        headerName: col.label ?? col.key.toUpperCase(),
        editable: col.editable,
        flex: col.flex,
        hide: col.hide,
        filter: col.type === 'number' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
      };

      if (col.type === 'group') {
        return {
          ...base,
          cellRenderer: 'agGroupCellRenderer',
          cellRendererParams: {
            innerRenderer: (params: any) => params.data ? (
              <div className="flex items-center gap-2">
                {params.data.type === 'folder' ? <FolderClosed size={14} className="text-amber-500" /> : <FileText size={14} className="text-slate-400" />}
                <span>{params.value}</span>
              </div>
            ) : null
          }
        };
      }

      if (col.type === 'status') {
        const colors: Record<string, string> = {
          DONE: 'bg-emerald-100 text-emerald-700',
          DOING: 'bg-blue-100 text-blue-700',
          TODO: 'bg-slate-100 text-slate-600',
        };
        return {
          ...base,
          cellEditor: col.editable ? 'agSelectCellEditor' : undefined,
          cellEditorParams: col.editable ? { values: col.options ?? [] } : undefined,
          cellRenderer: (params: any) => {
            const val = params.value?.toUpperCase();
            return val ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[val] || 'bg-slate-100 text-slate-600'}`}>
                {val}
              </span>
            ) : null;
          }
        };
      }

      if (col.type === 'date') {
        return {
          ...base,
          cellRenderer: (p: any) => <span className="opacity-60">{p.value}</span>
        };
      }

      return base;
    });
  }, [schema]);

  // Handle Drag Move logic with Sort Check
  const finalColumnDefs = useMemo(() => mappedColumnDefs.map(col => {
    if (col.field === 'name' || col.field === 'order') {
       // Namespaced reorder check
    }
    // We add rowDrag to the first visible column that isn't hidden
    const isFirstField = col.field === schema[0].key;
    return { ...col, rowDrag: isFirstField && !isSortActive && config.enableDragDrop };
  }), [mappedColumnDefs, isSortActive, config.enableDragDrop, schema]);

  const defaultColDef: ColDef = useMemo(() => ({
    sortable: true, filter: true, resizable: true,
    onCellValueChanged: (params) => {
      if (!params.data) return;
      const newData = MovementEngine.updateNode(rowData, params.data.id, { ...params.data });
      updateDataWithHistory(newData);
    }
  }), [rowData, updateDataWithHistory]);

  const DropIndicatorComponent = () => {
    if (!dropIndicator || !gridApiRef.current) return null;
    const rowElement = document.querySelector(`.ag-theme-quartz [row-id="${dropIndicator.targetId}"]`);
    const gridContainer = document.querySelector('.ag-theme-quartz');
    if (!rowElement || !gridContainer) return null;
    const containerRect = gridContainer.getBoundingClientRect();
    const rect = rowElement.getBoundingClientRect();
    const top = rect.top - containerRect.top;
    const height = rect.height;

    let style: React.CSSProperties = { position: 'absolute', left: 0, width: '100%', pointerEvents: 'none', zIndex: 100 };
    if (dropIndicator.position === 'above') {
      style = { ...style, top: top - 2, height: '4px', backgroundColor: '#3b82f6', boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)' };
    } else if (dropIndicator.position === 'below' || dropIndicator.position === 'below-parent') {
      style = { ...style, top: top + height - 2, height: '4px', backgroundColor: '#3b82f6', boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)' };
    } else {
      style = { ...style, top, height, backgroundColor: 'rgba(59, 130, 246, 0.12)', border: '2px solid #3b82f6', borderRadius: '2px' };
    }
    return <div style={style} />;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <header className="h-16 bg-white border-b border-brand-border flex items-center justify-between px-6 shrink-0">
        <div className="flex flex-col">
          <h2 className="font-semibold text-lg leading-tight uppercase tracking-tight">Grid Engine: {gridId}</h2>
          <p className="text-[10px] text-slate-400 font-medium">MANAGED HIERARCHICAL DATA COMPONENT</p>
        </div>
        <div className="flex gap-2 items-center">
          {config.enableSearch && (
            <input 
              type="text"
              placeholder="Search assets..."
              value={quickFilterText}
              onChange={handleSearchChange}
              className="px-3 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-brand-accent/50 w-48 transition-all"
            />
          )}
          {config.enableUndoRedo && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <div className="flex gap-1 mr-2">
                <button 
                  onClick={handleUndo} disabled={history.length === 0}
                  className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                >
                  <Undo2 size={16} />
                </button>
                <button 
                  onClick={handleRedo} disabled={future.length === 0}
                  className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                >
                  <Redo2 size={16} />
                </button>
              </div>
            </>
          )}
          {config.enableCRUD && (
            <>
              <div className="w-px h-6 bg-slate-200 mx-1" />
              <button onClick={handleAddNode} className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors shadow-sm">
                Add Node
              </button>
              <button onClick={handleDeleteNode} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded hover:bg-slate-200 transition-colors shadow-sm">
                Delete
              </button>
            </>
          )}
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button onClick={handleReset} className="px-4 py-2 text-xs font-semibold border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors shadow-sm">
            Reset
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button onClick={() => gridApiRef.current?.expandAll()} className="px-3 py-2 text-[10px] font-bold border border-slate-200 rounded uppercase">Expand</button>
          <button onClick={() => gridApiRef.current?.collapseAll()} className="px-3 py-2 text-[10px] font-bold border border-slate-200 rounded uppercase">Collapse</button>
        </div>
      </header>

      <div className="flex-1 bg-white overflow-hidden relative">
        <div className="ag-theme-quartz w-full h-full relative">
          <AgGridReact
            rowData={rowData}
            columnDefs={finalColumnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={userAutoGroupColumnDef}
            treeData={true}
            animateRows={true}
            groupDefaultExpanded={0}
            getDataPath={(data) => data.path}
            onGridReady={onGridReady}
            onSortChanged={onSortChanged}
            onFilterChanged={() => saveGridState()}
            onColumnMoved={onColumnStateChanged}
            onColumnResized={onColumnStateChanged}
            onColumnVisible={onColumnStateChanged}
            onRowGroupOpened={onRowGroupOpened}
            onRowDragMove={(e) => {
              const overNode = e.overNode;
              if (overNode) setDropIndicator({ targetId: overNode.data.id, position: getDropPosition(e) });
            }}
            onRowDragLeave={() => setDropIndicator(null)}
            onRowDragEnd={onRowDragEnd}
            getRowId={(params) => params.data.id}
            rowDragManaged={false}
            suppressMoveWhenRowDragging={true}
            rowSelection="multiple"
          />
          <DropIndicatorComponent />
        </div>
      </div>
    </div>
  );
}
