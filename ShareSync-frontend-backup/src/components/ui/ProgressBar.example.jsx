import React from 'react';
import ProgressBar from './ProgressBar';

/**
 * ProgressBar Usage Examples
 * Copy these examples into your components
 */

// Example 1: Simple progress bar
<ProgressBar value={75} />

// Example 2: With label
<ProgressBar value={60} showLabel />

// Example 3: Success color (green)
<ProgressBar value={85} color="success" showLabel />

// Example 4: Warning color (amber)
<ProgressBar value={45} color="warning" size="lg" />

// Example 5: Danger color (red)
<ProgressBar value={20} color="danger" showLabel />

// Example 6: Custom max value
<ProgressBar value={7} max={10} color="primary" showLabel />
// Shows: 70% (7 out of 10)

// Example 7: Small size for tight spaces
<ProgressBar value={90} size="sm" color="success" />

// Example 8: Large size for emphasis
<ProgressBar value={95} size="lg" color="primary" showLabel />
