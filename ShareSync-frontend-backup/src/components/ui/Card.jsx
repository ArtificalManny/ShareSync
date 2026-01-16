// src/components/ui/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// COMPATIBILITY LAYER - Re-exports from common/Card.jsx
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
} from '../common/Card';

// Legacy aliases for backward compatibility
export { CardBody as CardContent, CardMeta as CardSubtitle } from '../common/Card';
