// src/hooks/useDragAndDrop.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 5.3: Generic drag-and-drop hook using HTML5 Drag API
// No external library dependency.
//
// Usage:
//   const dnd = useDragAndDrop({
//     items: tasks,
//     onReorder: (fromIndex, toIndex) => { ... },
//     onDrop: (item, targetId) => { ... },
//   });
//
//   <div {...dnd.getDragHandlers(index)}>Drag me</div>
//   <div {...dnd.getDropHandlers(index)}>Drop zone</div>
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';

export function useDragAndDrop({
  onReorder,
  onDrop,
  onDragStart: onDragStartCb,
  onDragEnd: onDragEndCb,
  dragDataType = 'text/plain',
  direction = 'vertical',  // 'vertical' | 'horizontal'
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'
  const dragItemRef = useRef(null);
  const dragDataRef = useRef(null);

  // ── Drag handlers (attach to draggable items) ──────────────────────
  const getDragHandlers = useCallback((index, data = null) => ({
    draggable: true,

    onDragStart: (e) => {
      setIsDragging(true);
      setDragIndex(index);
      dragItemRef.current = index;
      dragDataRef.current = data;

      // Set drag data
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData(dragDataType, JSON.stringify({ index, data }));
      } catch { /* non-fatal */ }

      // Optional ghost image customization
      if (e.target && e.dataTransfer.setDragImage) {
        // Use the element itself as ghost — browser default
      }

      onDragStartCb?.(index, data);
    },

    onDragEnd: (e) => {
      setIsDragging(false);
      setDragIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      dragItemRef.current = null;
      dragDataRef.current = null;
      onDragEndCb?.(index, data);
    },
  }), [dragDataType, onDragStartCb, onDragEndCb]);

  // ── Drop handlers (attach to drop zones) ───────────────────────────
  const getDropHandlers = useCallback((index) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      // Determine if dropping before or after this item
      const rect = e.currentTarget.getBoundingClientRect();
      const midpoint = direction === 'vertical'
        ? rect.top + rect.height / 2
        : rect.left + rect.width / 2;
      const mousePos = direction === 'vertical' ? e.clientY : e.clientX;
      const position = mousePos < midpoint ? 'before' : 'after';

      setDragOverIndex(index);
      setDropPosition(position);
    },

    onDragEnter: (e) => {
      e.preventDefault();
      setDragOverIndex(index);
    },

    onDragLeave: (e) => {
      // Only clear if leaving the actual element (not entering a child)
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        if (dragOverIndex === index) {
          setDragOverIndex(null);
          setDropPosition(null);
        }
      }
    },

    onDrop: (e) => {
      e.preventDefault();

      const fromIndex = dragItemRef.current;
      const toIndex = index;

      // Clear visual state
      setDragOverIndex(null);
      setDropPosition(null);
      setIsDragging(false);
      setDragIndex(null);

      if (fromIndex === null || fromIndex === undefined) return;
      if (fromIndex === toIndex) return;

      // Calculate actual target index based on drop position
      let adjustedToIndex = toIndex;
      if (dropPosition === 'after' && fromIndex < toIndex) {
        adjustedToIndex = toIndex;
      } else if (dropPosition === 'before' && fromIndex > toIndex) {
        adjustedToIndex = toIndex;
      }

      // Fire callbacks
      onReorder?.(fromIndex, adjustedToIndex);
      onDrop?.(dragDataRef.current, toIndex);

      dragItemRef.current = null;
      dragDataRef.current = null;
    },
  }), [direction, dragOverIndex, dropPosition, onReorder, onDrop]);

  // ── Drop zone handlers (for kanban columns / external targets) ─────
  const getZoneDropHandlers = useCallback((zoneId) => ({
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },

    onDragEnter: (e) => {
      e.preventDefault();
    },

    onDrop: (e) => {
      e.preventDefault();

      let parsed = null;
      try {
        const raw = e.dataTransfer.getData(dragDataType);
        if (raw) parsed = JSON.parse(raw);
      } catch { /* non-fatal */ }

      setDragOverIndex(null);
      setDropPosition(null);
      setIsDragging(false);
      setDragIndex(null);

      onDrop?.(parsed?.data || dragDataRef.current, zoneId);

      dragItemRef.current = null;
      dragDataRef.current = null;
    },
  }), [dragDataType, onDrop]);

  // ── Indicator helpers ──────────────────────────────────────────────
  const getIndicatorPosition = useCallback((index) => {
    if (dragOverIndex !== index || dragIndex === index) return null;
    return dropPosition; // 'before' | 'after' | null
  }, [dragOverIndex, dragIndex, dropPosition]);

  const isOver = useCallback((index) => {
    return dragOverIndex === index && dragIndex !== index;
  }, [dragOverIndex, dragIndex]);

  // ── Utility: reorder array ─────────────────────────────────────────
  const reorderArray = useCallback((arr, fromIndex, toIndex) => {
    const result = Array.from(arr);
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  }, []);

  return {
    // State
    isDragging,
    dragIndex,
    dragOverIndex,
    dropPosition,

    // Handler generators
    getDragHandlers,
    getDropHandlers,
    getZoneDropHandlers,

    // Helpers
    getIndicatorPosition,
    isOver,
    reorderArray,
  };
}

export default useDragAndDrop;
