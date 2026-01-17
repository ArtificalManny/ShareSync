// src/components/ui/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7: Visual Cohesion - Re-exports from common/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════

export {
  default,
  default as Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardMeta,
  CardMetric,
  CardBadge,
  CardIconBox,
  CardProgress,
} from '../common/Card';

// Legacy aliases for backward compatibility
export { CardBody as CardContent, CardMeta as CardSubtitle } from '../common/Card';
