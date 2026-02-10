// src/files/dto/update-file.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// Backward/forward compatible DTO wrapper.
//
// IMPORTANT:
// - Canonical DTOs currently live in: src/files/dto/file.dto.ts
// - We re-export from there to avoid changing existing imports today,
//   while still supporting the requested file structure.
// ═══════════════════════════════════════════════════════════════════════════════

export { UpdateFileDto } from './file.dto';
