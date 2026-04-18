import React, { useEffect } from "react";
import { X, Plus, Pin, PinOff, Trash2 } from "lucide-react";
import { useNotes } from "../../context/NotesContext";

export default function QuickNotesDrawer({
  open = false,
  onClose = () => {},
}) {
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

  const active = getActiveNote();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleNew = () => {
    const id = createNote({ title: "Untitled", content: "" });
    setActiveNote(id);
  };

  const handleDeleteActive = () => {
    if (!active) return;
    deleteNote(active.id);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/35 backdrop-blur-[1px] dark:bg-black/55"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 right-0 z-[80] flex h-screen w-[380px] max-w-full flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 dark:border-white/10 dark:bg-[#0F172A] ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Notes"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Quick Notes
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Saved locally and synced across tabs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 p-2 text-white transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-[#0F172A]"
              title="New note"
              aria-label="New note"
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white dark:focus:ring-offset-[#0F172A]"
              title="Close Quick Notes"
              aria-label="Close Quick Notes"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="w-40 shrink-0 overflow-y-auto border-r border-slate-200 dark:border-white/10">
            {notes.length > 0 ? (
              <ul className="divide-y divide-slate-200 dark:divide-white/10">
                {notes.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      onClick={() => setActiveNote(note.id)}
                      className={`flex w-full items-center gap-2 px-3 py-3 text-left text-sm transition-colors ${
                        note.id === activeNoteId
                          ? "bg-violet-50 font-medium text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {note.title || "Untitled"}
                      </span>
                      {note.pinned ? (
                        <Pin className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-3 text-center">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  No notes yet
                </p>
                <button
                  type="button"
                  onClick={handleNew}
                  className="mt-3 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
                >
                  Create one
                </button>
              </div>
            )}
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            {active ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-white/10">
                  <input
                    value={active.title}
                    onChange={(e) =>
                      updateNote(active.id, { title: e.target.value })
                    }
                    placeholder="Title"
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                  />

                  <div className="ml-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => pinNote(active.id, !active.pinned)}
                      className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                      title={active.pinned ? "Unpin note" : "Pin note"}
                      aria-label={active.pinned ? "Unpin note" : "Pin note"}
                    >
                      {active.pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteActive}
                      className="rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={active.content}
                  onChange={(e) =>
                    updateNote(active.id, { content: e.target.value })
                  }
                  placeholder="Write your note here..."
                  className="min-h-0 flex-1 resize-none bg-transparent p-4 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Select a note to start editing
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Or create a new note from the top-right button
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
