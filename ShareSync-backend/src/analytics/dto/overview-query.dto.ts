// src/analytics/dto/overview-query.dto.ts
// ═══════════════════════════════════════════════════════════════════════════════
// OVERVIEW QUERY DTO (Spec compatibility layer)
//
// IMPORTANT:
// Your canonical analytics query DTO already exists and is used across the module:
//   - src/analytics/dto/analytics.dto.ts  (AnalyticsQueryDto)
//
// To avoid breaking imports or creating duplicate/competing DTO definitions,
// we simply alias AnalyticsQueryDto here for any spec-driven imports.
// ═══════════════════════════════════════════════════════════════════════════════

export { AnalyticsQueryDto as OverviewQueryDto } from './analytics.dto';
