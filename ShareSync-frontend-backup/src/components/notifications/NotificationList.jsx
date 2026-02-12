// src/components/notifications/NotificationList.jsx
import React from "react";
import NotificationItem from "./NotificationItem.jsx";

export default function NotificationList({ items = [], onToggleRead }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div>
      {items.map((n) => (
        <NotificationItem key={n.id} item={n} onToggleRead={onToggleRead} />
      ))}
    </div>
  );
}
