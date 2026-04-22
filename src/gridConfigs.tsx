import React from 'react';
import { ColDef } from 'ag-grid-community';
import { FolderClosed, FileText } from 'lucide-react';
import { ColumnSchema, GridConfig } from './types';

export interface GridDefinition {
  gridId: string;
  schema: ColumnSchema[];
  configOverrides?: GridConfig;
  autoGroupColumnDef?: ColDef;
}

export const gridConfigs: Record<string, GridDefinition> = {
  assets: {
    gridId: "asset-explorer",
    autoGroupColumnDef: { headerName: 'STRUCTURE', minWidth: 250 },
    schema: [
      { key: 'name', label: 'Asset Name', type: 'group', editable: true, flex: 2 },
      { key: 'value', label: 'Valuation', type: 'number', editable: true, flex: 1 },
      { key: 'status', label: 'Status', type: 'status', options: ['todo', 'doing', 'done'], editable: true, flex: 1 },
      { key: 'order', hide: true }
    ]
  },
  users: {
    gridId: "user-directory",
    configOverrides: { 
      enableDragDrop: false,
      enableSearch: true 
    },
    schema: [
      { key: 'name', label: 'Member Name', type: 'text', editable: true, flex: 2 },
      { key: 'value', label: 'Role / Designation', type: 'text', editable: true, flex: 1 },
      { key: 'status', label: 'Activity Status', type: 'status', options: ['available', 'busy', 'offline'], flex: 1 },
      { key: 'order', hide: true }
    ]
  },
  audit: {
    gridId: "audit-logs",
    configOverrides: { 
      enableUndoRedo: false,
      enableCRUD: false,
      enableDragDrop: false,
      enableSearch: true 
    },
    schema: [
      { key: 'name', label: 'Event Description', type: 'text', flex: 2 },
      { key: 'value', label: 'Timestamp', type: 'date', flex: 1 },
      { key: 'status', label: 'Level', type: 'status', flex: 1 },
      { key: 'order', hide: true }
    ]
  }
};
