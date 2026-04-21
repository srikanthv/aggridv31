export interface Task {
  id: string;
  name: string;
  path: string[];
  order: number;
  type: 'task' | 'folder';
  status: 'todo' | 'doing' | 'done';
  value?: string | number;
}

export type DropPosition = 'above' | 'below' | 'into';

export interface DragTarget {
  id: string;
  position: DropPosition;
}
