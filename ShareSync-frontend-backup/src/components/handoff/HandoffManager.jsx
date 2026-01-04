// src/components/handoff/HandoffManager.jsx - Week 8 Day 5-6
import React, { useState, useEffect } from 'react';
import HandoffNotification from './HandoffNotification';
import { X } from 'lucide-react';

/**
 * HandoffManager - Manages incoming hand-off requests
 * Shows notifications in a toast-like UI
 */
const HandoffManager = ({ userId, onAcceptHandoff, onDeclineHandoff }) => {
  const [requests, setRequests] = useState([]);

  // ⭐ WEEK 8 DAY 5-6: Listen for hand-off requests via Socket.IO
  useEffect(() => {
    // TODO: Socket.IO listener
    // socket.on('handoff:request', (request) => {
    //   setRequests(prev => [...prev, request]);
    // });

    // Mock data for testing
    // setTimeout(() => {
    //   setRequests([{
    //     id: 1,
    //     taskId: 'task123',
    //     fromUserId: 'user1',
    //     fromUserName: 'Sarah',
    //     toUserId: userId,
    //     message: "I'm stuck on the API integration. Can you take a look?",
    //     task: {
    //       _id: 'task123',
    //       title: 'Fix login API bug'
    //     },
    //     timestamp: new Date()
    //   }]);
    // }, 2000);

    return () => {
      // socket.off('handoff:request');
    };
  }, [userId]);

  const handleAccept = async (request) => {
    await onAcceptHandoff?.(request);
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleDecline = async (request) => {
    await onDeclineHandoff?.(request);
    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const handleDismiss = (requestId) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  if (requests.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
      {requests.map((request) => (
        <div key={request.id} className="relative">
          <button
            onClick={() => handleDismiss(request.id)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <HandoffNotification
            request={request}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        </div>
      ))}
    </div>
  );
};

export default HandoffManager;
