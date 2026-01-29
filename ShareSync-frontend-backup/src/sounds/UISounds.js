// src/sounds/UISounds.js
// ═══════════════════════════════════════════════════════════════════════════════
// PHASE F: The Sound of Progress - UI Sounds
// ═══════════════════════════════════════════════════════════════════════════════
//
// Subtle audio feedback for UI interactions.
// Makes the interface feel responsive and tactile.
//
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useSounds } from '../hooks/useSounds';

// ═══════════════════════════════════════════════════════════════════════════════
// SOUND DEFINITIONS (Extended from soundConfig.js)
// These provide additional context and usage guidance
// ═══════════════════════════════════════════════════════════════════════════════

export const UI_SOUNDS = {
  // Primary interactions
  click: {
    id: 'click',
    description: 'Standard button click',
    useCase: 'Primary buttons, important actions',
  },
  
  hover: {
    id: 'hover',
    description: 'Subtle hover feedback',
    useCase: 'Interactive elements (disabled by default)',
  },
  
  // Toggles and switches
  toggle_on: {
    id: 'toggle_on',
    description: 'Toggle activated',
    useCase: 'Switches, checkboxes being enabled',
  },
  
  toggle_off: {
    id: 'toggle_off',
    description: 'Toggle deactivated',
    useCase: 'Switches, checkboxes being disabled',
  },
  
  // Navigation
  expand: {
    id: 'expand',
    description: 'Menu/panel expanding',
    useCase: 'Dropdowns, accordions, drawers opening',
  },
  
  collapse: {
    id: 'collapse',
    description: 'Menu/panel collapsing',
    useCase: 'Dropdowns, accordions, drawers closing',
  },
  
  // Feedback
  error: {
    id: 'error',
    description: 'Error/invalid action',
    useCase: 'Form validation, failed operations',
  },
  
  success: {
    id: 'task_complete',
    description: 'Success confirmation',
    useCase: 'Form submission success, save complete',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT HELPERS
// Higher-order functions to add sounds to existing handlers
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Wraps a click handler with sound
 * @example
 * <button onClick={withClickSound(handleSubmit)}>Submit</button>
 */
export function createClickSoundWrapper(playClick) {
  return (handler) => (...args) => {
    playClick();
    if (handler) return handler(...args);
  };
}

/**
 * Wraps a toggle handler with sound
 * @example
 * <Switch onChange={withToggleSound(setEnabled)} />
 */
export function createToggleSoundWrapper(playToggleOn, playToggleOff) {
  return (handler) => (value, ...args) => {
    if (value) {
      playToggleOn();
    } else {
      playToggleOff();
    }
    if (handler) return handler(value, ...args);
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIALIZED HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Hook for button with click sound
 * Returns props to spread on any button element
 * 
 * @example
 * function MyButton({ onClick, children }) {
 *   const soundProps = useSoundedButton(onClick);
 *   return <button {...soundProps}>{children}</button>;
 * }
 */
export function useSoundedButton(onClick, options = {}) {
  const { playClick, playHover } = useUISounds();
  const { enableHover = false, disabled = false } = options;
  
  const handleClick = useCallback((e) => {
    if (disabled) return;
    playClick();
    if (onClick) onClick(e);
  }, [onClick, playClick, disabled]);
  
  const handleMouseEnter = useCallback(() => {
    if (disabled || !enableHover) return;
    playHover();
  }, [playHover, enableHover, disabled]);
  
  return useMemo(() => ({
    onClick: handleClick,
    onMouseEnter: enableHover ? handleMouseEnter : undefined,
  }), [handleClick, handleMouseEnter, enableHover]);
}

/**
 * Hook for toggle/switch with sound
 * 
 * @example
 * function MySwitch({ checked, onChange }) {
 *   const handleChange = useSoundedToggle(onChange);
 *   return <Switch checked={checked} onChange={handleChange} />;
 * }
 */
export function useSoundedToggle(onChange, options = {}) {
  const { playToggleOn, playToggleOff } = useUISounds();
  const { disabled = false } = options;
  
  return useCallback((newValue, ...args) => {
    if (disabled) return;
    
    if (newValue) {
      playToggleOn();
    } else {
      playToggleOff();
    }
    
    if (onChange) onChange(newValue, ...args);
  }, [onChange, playToggleOn, playToggleOff, disabled]);
}

/**
 * Hook for expandable panel/accordion
 * 
 * @example
 * function Accordion({ isOpen, onToggle }) {
 *   const handleToggle = useSoundedExpand(onToggle, isOpen);
 *   return <div onClick={handleToggle}>...</div>;
 * }
 */
export function useSoundedExpand(onToggle, isCurrentlyOpen) {
  const { playExpand, playCollapse } = useUISounds();
  
  return useCallback(() => {
    if (isCurrentlyOpen) {
      playCollapse();
    } else {
      playExpand();
    }
    
    if (onToggle) onToggle();
  }, [onToggle, isCurrentlyOpen, playExpand, playCollapse]);
}

/**
 * Hook for form validation feedback
 * 
 * @example
 * function Form() {
 *   const { playError, playSuccess } = useSoundedForm();
 *   
 *   const handleSubmit = async () => {
 *     const errors = validate();
 *     if (errors.length) {
 *       playError();
 *       return;
 *     }
 *     await submit();
 *     playSuccess();
 *   };
 * }
 */
export function useSoundedForm() {
  const { playError } = useUISounds();
  const { playTaskComplete } = useSounds();
  
  return useMemo(() => ({
    playError,
    playSuccess: playTaskComplete,
  }), [playError, playTaskComplete]);
}

/**
 * Hook for navigation sounds
 * 
 * @example
 * function NavItem({ onClick, href }) {
 *   const handleNav = useSoundedNavigation(onClick);
 *   return <a href={href} onClick={handleNav}>...</a>;
 * }
 */
export function useSoundedNavigation(onNavigate) {
  const { playClick } = useUISounds();
  
  return useCallback((e) => {
    playClick();
    if (onNavigate) onNavigate(e);
  }, [onNavigate, playClick]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESET CONFIGS
// Common configurations for different UI patterns
// ═══════════════════════════════════════════════════════════════════════════════

export const UI_SOUND_PRESETS = {
  // Primary action button
  primaryButton: {
    onClick: 'click',
    enableHover: false,
  },
  
  // Secondary/ghost button
  secondaryButton: {
    onClick: 'click',
    enableHover: false,
  },
  
  // Icon button
  iconButton: {
    onClick: 'click',
    enableHover: true,
  },
  
  // Menu item
  menuItem: {
    onClick: 'click',
    enableHover: true,
  },
  
  // Toggle switch
  toggle: {
    onEnable: 'toggle_on',
    onDisable: 'toggle_off',
  },
  
  // Dropdown
  dropdown: {
    onOpen: 'expand',
    onClose: 'collapse',
  },
  
  // Modal
  modal: {
    onOpen: 'expand',
    onClose: 'collapse',
  },
  
  // Sidebar
  sidebar: {
    onExpand: 'expand',
    onCollapse: 'collapse',
  },
  
  // Form
  form: {
    onError: 'error',
    onSuccess: 'task_complete',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get recommended sound for a UI action
 */
export function getUISoundForAction(action) {
  const actionMap = {
    click: 'click',
    hover: 'hover',
    enable: 'toggle_on',
    disable: 'toggle_off',
    open: 'expand',
    close: 'collapse',
    expand: 'expand',
    collapse: 'collapse',
    error: 'error',
    success: 'task_complete',
    submit: 'click',
    cancel: 'collapse',
    save: 'task_complete',
    delete: 'error',
  };
  
  return actionMap[action] || 'click';
}

export default UI_SOUNDS;
