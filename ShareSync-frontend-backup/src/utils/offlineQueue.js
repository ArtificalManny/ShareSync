// src/utils/offlineQueue.js
import client from "../api/client";

const queue = [];

export function sendOrQueue(action) {
  if (navigator.onLine) {
    return client.request(action).catch((err) => {
      // If online but request fails, queue it
      queue.push(action);
      return Promise.reject(err);
    });
  } else {
    queue.push(action);
    return Promise.resolve({ offline: true });
  }
}

// Flush on reconnect
window.addEventListener("online", () => {
  const toSend = [...queue];
  queue.length = 0;
  toSend.forEach((action) => {
    client.request(action).catch(() => {
      // If still fails, put back
      queue.push(action);
    });
  });
});