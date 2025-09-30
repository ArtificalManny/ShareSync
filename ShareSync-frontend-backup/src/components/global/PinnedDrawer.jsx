// /src/components/global/PinnedDrawer.jsx
import React, { useState } from "react";
import { usePinned } from "../../context/PinnedContext.jsx";
import { Bookmark } from "lucide-react"; // simple bookmark icon

export default function PinnedDrawer() {
  const { items, unpin } = usePinned();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-50 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-500 transition"
        aria-label="Open pinned items"
      >
        <Bookmark className="w-5 h-5" />
      </button>

      {/* Drawer panel */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg rounded-l-xl p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Pinned</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No pinned items</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center border rounded px-2 py-1"
                  >
                    <a
                      href={item.href || "#"}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      {item.title}
                    </a>
                    <button
                      onClick={() => unpin(item.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Unpin
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
