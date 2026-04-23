export interface Task {
  id: string;
  name: string;
  path: string[];
  order: number;
  type: 'task' | 'folder';
  status: 'todo' | 'doing' | 'done';
  value?: string | number;
}

export type DropPosition = 'above' | 'below' | 'into' | 'below-parent';

export interface DragTarget {
  id: string;
  position: DropPosition;
}

export interface GridConfig {
  enableSearch?: boolean;
  enablePersistence?: boolean;
  enableColumnState?: boolean;
  enableExpandedState?: boolean;
  enableUndoRedo?: boolean;
  enableDragDrop?: boolean;
  enableCRUD?: boolean;
  enableFiltering?: boolean;
  toolbar?: {
    show?: boolean;
    actions?: {
      clearFilters?: boolean;
      resetColumns?: boolean;
      autosizeColumns?: boolean;
      expandAll?: boolean;
      collapseAll?: boolean;
    };
  };
}

export type SchemaFieldType = 'text' | 'number' | 'status' | 'date' | 'group';

export interface ColumnSchema {
  key: string;
  label?: string;
  type?: SchemaFieldType;
  options?: string[]; // for status/select
  editable?: boolean;
  flex?: number;
  hide?: boolean;
  filter?: boolean;
}
