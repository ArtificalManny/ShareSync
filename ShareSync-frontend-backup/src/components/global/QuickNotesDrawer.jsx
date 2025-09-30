// /src/components/global/QuickNotesDrawer.jsx
import React, { useState } from "react";
import { X, Plus, StickyNote, Pin, PinOff, Trash2 } from "lucide-react";
import { useNotes } from "../../context/NotesContext";
import MessengerPanel from "../messenger/MessengerPanel";

export default function QuickNotesDrawer() {
  const {
    notes,
    activeNoteId,
    createNote,
    updateNote,
    deleteNote,
    pinNote,
    setActiveNote,
    getActiveNote,
  } = useNotes();

  const [open, setOpen] = useState(false);
  const active = getActiveNote();

  const handleNew = () => {
    const id = createNote({ title: "Untitled", content: "" });
    setActiveNote(id);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 right-4 z-40 h-10 w-10 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label="Open Quick Notes"
      >
        <StickyNote className="h-5 w-5" />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-[360px] max-w-full z-50 transform bg-white dark:bg-slate-900 shadow-xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="complementary"
        aria-label="Quick Notes Drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Quick Notes
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              title="New note"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notes list */}
        <div className="h-full flex">
          <nav className="w-36 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {notes.map((n) => (
                <li
                  key={n.id}
                  onClick={() => setActiveNote(n.id)}
                  className={`px-3 py-2 cursor-pointer text-sm truncate ${
                    n.id === activeNoteId
                      ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {n.title || "Untitled"}
                </li>
              ))}
            </ul>
          </nav>

          {/* Editor */}
          {active ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                <input
                  value={active.title}
                  onChange={(e) =>
                    updateNote(active.id, { title: e.target.value })
                  }
                  placeholder="Title"
                  className="flex-1 text-sm font-medium bg-transparent focus:outline-none text-slate-900 dark:text-slate-100"
                />
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => pinNote(active.id, !active.pinned)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={active.pinned ? "Unpin" : "Pin"}
                  >
                    {active.pinned ? (
                      <PinOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Pin className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteNote(active.id)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/40"
                    title="Delete note"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
              <textarea
                value={active.content}
                onChange={(e) =>
                  updateNote(active.id, { content: e.target.value })
                }
                placeholder="Write your note here..."
                className="flex-1 p-3 text-sm bg-transparent focus:outline-none resize-none text-slate-900 dark:text-slate-100"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
              Select or create a note
            </div>
          )}
        </div>
      </aside>
      <MessengerPanel />
    </>
  );
}
