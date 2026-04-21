import { Task, DropPosition } from './types';

/**
 * Movement Engine handles hierarchical data transformations.
 * It uses a prefix-mapping strategy with deterministic sibling ordering.
 */
export const MovementEngine = {
  /**
   * Transforms the data state based on drag-and-drop intent.
   * Returns a brand new array with updated paths and order attributes.
   */
  moveTasks(
    allTasks: Task[],
    movingIds: string[],
    targetId: string,
    position: DropPosition
  ): Task[] {
    const targetTask = allTasks.find(t => t.id === targetId);
    if (!targetTask) return allTasks;

    // 1. Sanitize Selection: Keep only highest-level ancestors in the moving set
    const topLevelMovingIds = movingIds.filter(id => {
      const task = allTasks.find(t => t.id === id);
      if (!task) return false;
      return !movingIds.some(otherId => id !== otherId && task.path.includes(otherId));
    });

    if (topLevelMovingIds.length === 0) return allTasks;

    // 2. Cycle Detection
    if (topLevelMovingIds.some(mId => targetTask.path.includes(mId))) {
      console.warn("Invalid drop: Target is a descendant of a moving node.");
      return allTasks;
    }

    // 3. Identify all nodes in the moving subtrees
    const movingSubtreeIds = new Set<string>();
    topLevelMovingIds.forEach(mId => {
      const movingNode = allTasks.find(t => t.id === mId)!;
      const prefix = [...movingNode.path];
      allTasks.forEach(t => {
        if (this.isPrefixOf(prefix, t.path)) movingSubtreeIds.add(t.id);
      });
    });

    // 4. PRE-REMOVAL: Create remaining dataset with moved nodes excluded
    const remainingTasks = allTasks.filter(t => !movingSubtreeIds.has(t.id));

    // 5. Determine New Lineage
    const newParentPath = position === 'into' 
      ? [...targetTask.path] 
      : targetTask.path.slice(0, -1);

    // 6. TRANSFORM SUBTREES
    // We create the updated moving tasks separately
    const updatedMovingTasks: Task[] = [];
    topLevelMovingIds.forEach(mId => {
      const movingNode = allTasks.find(t => t.id === mId)!;
      const oldPrefix = [...movingNode.path];
      
      allTasks.forEach(task => {
        if (this.isPrefixOf(oldPrefix, task.path)) {
          const suffix = task.path.slice(oldPrefix.length);
          updatedMovingTasks.push({
            ...task,
            path: [...newParentPath, mId, ...suffix]
          });
        }
      });
    });

    // 7. SIBLING RE-INDEXING
    // Get root moving nodes (those that were dragged) with their updated paths
    const movingRoots = updatedMovingTasks.filter(t => topLevelMovingIds.includes(t.id));
    
    // Get stationary siblings at the target level, sorted by their existing order
    const stationarySiblings = remainingTasks
      .filter(t => this.isDirectChild(t.path, newParentPath))
      .sort((a, b) => a.order - b.order);

    // Calculate insertion index
    let insertIdx = 0;
    if (position === 'into') {
      insertIdx = stationarySiblings.length;
    } else {
      const refIdx = stationarySiblings.findIndex(s => s.id === targetId);
      insertIdx = position === 'above' ? refIdx : refIdx + 1;
    }

    // Splice moving roots into the stationary sibling list as a single block
    stationarySiblings.splice(insertIdx, 0, ...movingRoots);

    // EXPLICIT RE-INDEX: Apply 0..n order to ALL siblings at this level
    stationarySiblings.forEach((node, i) => {
      node.order = i;
    });

    // 8. FINAL MERGE
    // The final set is:
    // - stationarySiblings (which now has updated order and includes moved roots)
    // - moving descendants (nodes in updatedMovingTasks but not in movingRoots)
    // - all other remainingTasks (not in stationarySiblings)
    
    const movingRootIds = new Set(movingRoots.map(r => r.id));
    const movingDescendants = updatedMovingTasks.filter(t => !movingRootIds.has(t.id));
    
    const stationarySiblingIds = new Set(stationarySiblings.map(s => s.id));
    const otherTasks = remainingTasks.filter(t => !stationarySiblingIds.has(t.id));

    return [...otherTasks, ...stationarySiblings, ...movingDescendants];
  },

  addNode(allTasks: Task[], parentId: string | null): Task[] {
    const newId = Math.random().toString(36).substring(2, 9);
    let parentPath: string[] = [];
    
    if (parentId) {
      const parent = allTasks.find(t => t.id === parentId);
      if (parent) parentPath = parent.path;
    }

    const newNode: Task = {
      id: newId,
      name: `New ${parentId ? 'Child' : 'Root'} Node`,
      path: [...parentPath, newId],
      order: 0,
      type: 'task',
      status: 'todo'
    };

    // Get current siblings to determine the new order
    const siblings = allTasks
      .filter(t => this.isDirectChild(t.path, parentPath))
      .sort((a, b) => a.order - b.order);

    newNode.order = siblings.length;
    
    return [...allTasks, newNode];
  },

  deleteNode(allTasks: Task[], nodeId: string): Task[] {
    const nodeToDelete = allTasks.find(t => t.id === nodeId);
    if (!nodeToDelete) return allTasks;

    const parentPath = nodeToDelete.path.slice(0, -1);
    const prefix = [...nodeToDelete.path];

    // Remove node and all descendants
    const remainingTasks = allTasks.filter(t => !this.isPrefixOf(prefix, t.path));

    // Reindex remaining siblings
    const siblings = remainingTasks
      .filter(t => this.isDirectChild(t.path, parentPath))
      .sort((a, b) => a.order - b.order);

    siblings.forEach((s, i) => {
      s.order = i;
    });

    return remainingTasks;
  },

  updateNode(allTasks: Task[], nodeId: string, updates: Partial<Pick<Task, 'name' | 'status' | 'type' | 'value'>>): Task[] {
    return allTasks.map(t => {
      if (t.id === nodeId) {
        return { ...t, ...updates };
      }
      return t;
    });
  },

  isPrefixOf(prefix: string[], path: string[]): boolean {
    if (path.length < prefix.length) return false;
    return prefix.every((key, i) => path[i] === key);
  },

  isDirectChild(path: string[], parentPath: string[]): boolean {
    return path.length === parentPath.length + 1 && this.isPrefixOf(parentPath, path);
  }
};
