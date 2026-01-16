// src/components/ui/Card.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// COMPATIBILITY LAYER
// Re-exports from the unified Card system in common/Card.jsx
// This maintains backward compatibility for imports from 'components/ui/Card'
// ═══════════════════════════════════════════════════════════════════════════════

import Card, {
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardMeta,
  CardMetric,
  CardBadge,
  CardIconBox,
} from '../common/Card';

// Legacy named exports that some components might use
export const CardContent = CardBody;      // Alias for backward compat
export const CardSubtitle = CardMeta;     // Alias for backward compat

// Re-export everything
export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardTitle,
  CardMeta,
  CardMetric,
  CardBadge,
  CardIconBox,
};

export default Card;
