# OpenShare Design System Audit Checklist

## Spacing Audit ✅
- [ ] Run `auditSpacing()` in console
- [ ] Fix all violations (target: 0)
- [ ] All padding uses p-2, p-4, p-6, p-8, p-12, p-16
- [ ] All margins use m-2, m-4, m-6, m-8, m-12, m-16
- [ ] All gaps use gap-2, gap-4, gap-6, gap-8, gap-12

## Color Audit ✅
- [ ] No hardcoded hex colors
- [ ] All purples use brand-{shade}
- [ ] All grays use slate-{shade}
- [ ] Status colors use success/warning/danger/info
- [ ] Backgrounds use bg-slate-800, bg-slate-900
- [ ] Borders use border-white/5, border-white/10

## Typography Audit ✅
- [ ] All headings use text-{size} (no custom values)
- [ ] Labels use text-xs font-bold uppercase tracking-widest
- [ ] Titles use font-black tracking-tighter
- [ ] Body text uses text-sm or text-base
- [ ] No inline fontSize styles

## Shadow Audit ✅
- [ ] No inline boxShadow styles
- [ ] Use shadow-lg, shadow-xl, shadow-card
- [ ] Glow effects use shadow-glow-brand/success/warning/danger
- [ ] Glass effects use shadow-glass

## Border Audit ✅
- [ ] All borders are 1px or 2px only
- [ ] Border radius uses rounded-lg, rounded-xl, rounded-2xl, rounded-3xl
- [ ] No custom border-radius values like rounded-[14px]

## Animation Audit ✅
- [ ] All transitions use transition-all duration-{time}
- [ ] Hover states use cubic-bezier(0.4, 0, 0.2, 1)
- [ ] Spring animations use Framer Motion
- [ ] No custom @keyframes (use Tailwind animate-*)

## Component Consistency ✅
- [ ] All buttons use Button component
- [ ] All cards use Card component
- [ ] All loading states use Skeleton component
- [ ] All empty states use EmptyState component

## Accessibility Audit ✅
- [ ] All interactive elements have focus states
- [ ] All images have alt text
- [ ] All buttons have aria-label if icon-only
- [ ] Color contrast ratio > 4.5:1

## Final Check ✅
- [ ] npm run build succeeds
- [ ] No console errors in production
- [ ] Lighthouse score > 90
- [ ] Visual regression test passes
