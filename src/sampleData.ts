import { Task } from './types';

export const assetData: Task[] = [
  { id: '1', name: 'Standard Procedures', path: ['1'], order: 0, type: 'folder', status: 'doing' },
  { id: '2', name: 'Operational Audit', path: ['1', '2'], order: 0, type: 'task', status: 'done' },
  { id: '3', name: 'Safety Guidelines', path: ['1', '3'], order: 1, type: 'task', status: 'doing' },
  { id: '4', name: 'Regional Expansion', path: ['4'], order: 1, type: 'folder', status: 'todo' },
  { id: '5', name: 'Market Analysis', path: ['4', '5'], order: 0, type: 'task', status: 'todo' },
];

export const userData: Task[] = [
  { id: 'u1', name: 'Alice Johnson', path: ['u1'], order: 0, type: 'task', status: 'done', value: 'Administrator' },
  { id: 'u2', name: 'Bob Smith', path: ['u2'], order: 1, type: 'task', status: 'doing', value: 'Developer' },
  { id: 'u3', name: 'Charlie Davis', path: ['u3'], order: 2, type: 'task', status: 'todo', value: 'Guest' },
  { id: 'u4', name: 'Diana Ross', path: ['u4'], order: 3, type: 'task', status: 'done', value: 'Manager' },
];

export const auditData: Task[] = [
  { id: 'l1', name: 'System Bootstrapped', path: ['l1'], order: 0, type: 'task', status: 'done', value: '2026-04-22 10:00 AM' },
  { id: 'l2', name: 'Database Backup Completed', path: ['l2'], order: 1, type: 'task', status: 'done', value: '2026-04-22 11:00 AM' },
  { id: 'l3', name: 'User Alice logged in', path: ['l3'], order: 2, type: 'task', status: 'done', value: '2026-04-22 12:45 PM' },
  { id: 'l4', name: 'New Node Added to Assets', path: ['l4'], order: 3, type: 'task', status: 'doing', value: '2026-04-22 01:15 PM' },
];
