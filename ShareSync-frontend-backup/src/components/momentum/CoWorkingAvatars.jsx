// src/components/momentum/CoWorkingAvatars.jsx
import React from "react";
import { motion } from "framer-motion";
import { useOnlineUsers } from "../../hooks/useOnlineUsers";
import Avatar from "../ui/Avatar";

export default function CoWorkingAvatars() {
  const { users, count, isLoading } = useOnlineUsers({ limit: 5 });

  if (isLoading || count === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-surface/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white/80">
      <div className="flex -space-x-2">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, x: -10 }}
            animate={{ scale: 1, x: 0 }}
            transition={{ delay: i * 0.08, type: "spring" }}
            className="relative"
          >
            <Avatar
              src={user.avatar}
              name={user.name}
              size={24}
              className="ring-2 ring-surface"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-surface">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping" />
            </span>
          </motion.div>
        ))}
        {count > 5 && (
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
            +{count - 5}
          </div>
        )}
      </div>
      <span className="ml-1">
        {count} {count === 1 ? "person" : "people"} working now
      </span>
    </div>
  );
}