// src/tasks/dto/move-task.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MOVE TASK DTO (Compatibility Wrapper)
// ═══════════════════════════════════════════════════════════════════════════════
//
// You currently define MoveTaskDto inside update-task.dto.ts.
// This file exists ONLY to satisfy the "move-task.dto.ts" structure requirement
// without changing any existing imports or risking regressions.
//
// If later you want to split DTOs cleanly, we can move the class here and update
// imports in a controlled pass.
//
// For now: re-export the existing DTO.
//
export { MoveTaskDto } from './update-task.dto';
