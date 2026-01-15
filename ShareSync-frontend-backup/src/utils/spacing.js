/**
 * Spacing System - 8px Grid
 * 
 * OpenShare's spatial design system requires all spacing to follow
 * an 8px base grid for visual consistency and rhythm.
 * 
 * Usage:
 * import { spacing } from '../utils/spacing';
 * className={spacing.padding.lg}
 * 
 * Or use Tailwind directly (recommended):
 * className="p-8 gap-4"
 */

export const spacing = {
  padding: {
    xs: 'p-2',   // 8px
    sm: 'p-4',   // 16px
    md: 'p-6',   // 24px
    lg: 'p-8',   // 32px
    xl: 'p-12',  // 48px
    '2xl': 'p-16', // 64px
  },
  margin: {
    xs: 'm-2',
    sm: 'm-4',
    md: 'm-6',
    lg: 'm-8',
    xl: 'm-12',
    '2xl': 'm-16',
  },
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
    '2xl': 'gap-16',
  },
};

/**
 * Audit function - Run in browser console to find spacing violations
 * 
 * Usage:
 * 1. Open browser DevTools console
 * 2. Type: auditSpacing()
 * 3. Review violations
 * 4. Fix each one
 * 
 * @returns {Array} List of elements with non-8px spacing
 */
export const auditSpacing = () => {
  const allElements = document.querySelectorAll('*');
  const violations = [];
  
  console.log('🔍 Starting spacing audit...');
  console.log(`Checking ${allElements.length} elements...`);

  allElements.forEach((el) => {
    const styles = window.getComputedStyle(el);
    
    // Check all padding directions
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingRight = parseFloat(styles.paddingRight);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const paddingLeft = parseFloat(styles.paddingLeft);
    
    // Check all margin directions
    const marginTop = parseFloat(styles.marginTop);
    const marginRight = parseFloat(styles.marginRight);
    const marginBottom = parseFloat(styles.marginBottom);
    const marginLeft = parseFloat(styles.marginLeft);

    // Check if divisible by 8 (and not 0)
    const checkValue = (value, property, direction) => {
      if (value !== 0 && value % 8 !== 0) {
        violations.push({
          element: el,
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          property: `${property}-${direction}`,
          value: `${value}px`,
          suggested: `${Math.round(value / 8) * 8}px`,
        });
      }
    };

    checkValue(paddingTop, 'padding', 'top');
    checkValue(paddingRight, 'padding', 'right');
    checkValue(paddingBottom, 'padding', 'bottom');
    checkValue(paddingLeft, 'padding', 'left');
    
    checkValue(marginTop, 'margin', 'top');
    checkValue(marginRight, 'margin', 'right');
    checkValue(marginBottom, 'margin', 'bottom');
    checkValue(marginLeft, 'margin', 'left');
  });

  // Print results
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Audit Complete!`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Total violations: ${violations.length}`);
  
  if (violations.length === 0) {
    console.log('🎉 Perfect! No spacing violations found.');
    console.log('Your spacing follows the 8px grid system.');
  } else {
    console.log(`⚠️  Found ${violations.length} spacing violations\n`);
    
    // Group by element type
    const groupedViolations = {};
    violations.forEach(v => {
      const key = v.tagName;
      if (!groupedViolations[key]) groupedViolations[key] = [];
      groupedViolations[key].push(v);
    });

    console.log('Violations by element type:');
    Object.entries(groupedViolations).forEach(([tag, viols]) => {
      console.log(`  ${tag}: ${viols.length} violations`);
    });

    console.log('\n📋 Top 10 violations:');
    violations.slice(0, 10).forEach((v, i) => {
      console.log(`\n${i + 1}. <${v.tagName}> ${v.className ? `class="${v.className.substring(0, 50)}"` : ''}`);
      console.log(`   ${v.property}: ${v.value} → Suggested: ${v.suggested}`);
    });

    console.table(violations.slice(0, 20));
  }

  return violations;
};

/**
 * Export violations to CSV for batch fixing
 */
export const exportViolations = (violations) => {
  const csv = [
    ['Element', 'Class', 'Property', 'Current', 'Suggested'],
    ...violations.map(v => [
      v.tagName,
      v.className,
      v.property,
      v.value,
      v.suggested
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spacing-violations.csv';
  a.click();
  
  console.log('✅ Exported violations to spacing-violations.csv');
};

// Make it available globally in browser console
if (typeof window !== 'undefined') {
  window.auditSpacing = auditSpacing;
  window.exportViolations = exportViolations;
}
