// src/hooks/useShipCeremony.js
// ═══════════════════════════════════════════════════════════════════════════════
// SHIP CEREMONY - Orchestration Hook
// ⭐ Phase 4: Ruthless Efficiency (Zero-delay execution flow)
// ═══════════════════════════════════════════════════════════════════════════════
// Manages the entire ship ceremony flow:
// 1. Button state transformation (Immediate)
// 2. API call (Concurrent)
// 3. Sound effect (Upon completion)
// 4. Socket broadcast
// 5. Success/error handling
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { playShipSound, initShipSound } from '../utils/shipSound';
import { toast } from '../components/ui/toast';
import useSocket from './useSocket';

// Ceremony phases
const PHASES = {
  IDLE: 'idle',
  PREPARING: 'preparing',   // Button clicked, starting
  SHIPPING: 'shipping',     // API call in progress, card animating
  SHIPPED: 'shipped',       // Success! Card sliding off
  ERROR: 'error',           // Something went wrong
};

export default function useShipCeremony({ 
  onShip,           // async (itemId) => Promise - the actual ship action
  onComplete,       // (itemId) => void - called after ceremony completes
  broadcastToTeam = true,
}) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [shippingItemId, setShippingItemId] = useState(null);
  
  const socket = useSocket(null, {
    onEvents: {} // We're just emitting, not listening
  });

  const ship = useCallback(async (item) => {
    if (phase !== PHASES.IDLE) return; // Prevent double-shipping
    
    const itemId = item?.id || item?._id;
    const itemTitle = item?.title || item?.name || 'Item';
    
    // Initialize sound on first interaction (browser requirement)
    initShipSound();
    
    try {
      // Phase 4 Audit: Skip 'PREPARING' artificial delay. Go straight to shipping UI while API executes.
      setPhase(PHASES.SHIPPING);
      setShippingItemId(itemId);
      
      // Call the actual ship function
      if (onShip) {
        await onShip(itemId);
      }
      
      // Phase 3: Shipped! 
      setPhase(PHASES.SHIPPED);
      
      // Play the satisfying sound
      playShipSound();
      
      // Broadcast to team via socket
      if (broadcastToTeam && socket?.socket?.connected) {
        socket.socket.emit('ship:completed', {
          itemId,
          itemTitle,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Show success toast
      toast({
        title: `🚀 Shipped: ${itemTitle}`,
        variant: 'success',
        duration: 3000,
      });
      
      // Wait for card slide-off animation to complete before cleanup
      await new Promise(r => setTimeout(r, 400));
      
      // Notify parent to remove the item
      if (onComplete) {
        onComplete(itemId);
      }
      
    } catch (error) {
      console.error('Ship ceremony failed:', error);
      setPhase(PHASES.ERROR);
      
      toast({
        title: 'Failed to ship',
        description: error.message || 'Please try again',
        variant: 'error',
      });
      
      // Reset after showing error
      await new Promise(r => setTimeout(r, 2000));
      
    } finally {
      // Reset state
      setPhase(PHASES.IDLE);
      setShippingItemId(null);
    }
  }, [phase, onShip, onComplete, broadcastToTeam, socket]);

  return {
    ship,
    phase,
    shippingItemId,
    isShipping: phase === PHASES.SHIPPING || phase === PHASES.PREPARING,
    isShipped: phase === PHASES.SHIPPED,
    isError: phase === PHASES.ERROR,
    
    // Helper to check if a specific item is being shipped
    isItemShipping: (itemId) => shippingItemId === itemId && phase !== PHASES.IDLE,
    isItemShipped: (itemId) => shippingItemId === itemId && phase === PHASES.SHIPPED,
  };
}

export { PHASES };
