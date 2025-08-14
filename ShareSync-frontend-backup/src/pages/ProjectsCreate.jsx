// /src/pages/ProjectsCreate.jsx
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/projects";
import { toast } from "../components/ui/toast";

export default function ProjectsCreate({ onClose, onProjectCreated }) {
  const navigate = useNavigate();

  // Form state (keep fields you actually render in your layout)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Not Started"); // Not Started | In Progress | Completed
  const [privacy, setPrivacy] = useState("Private");   // Private | Public
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("Member");
  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const addMember = () => {
    const email = memberEmail.trim();
    if (!email) return;
    setMembers((prev) => [...prev, { email, role: memberRole }]);
    setMemberEmail("");
    setMemberRole("Member");
  };

  const removeMember = (email) => {
    setMembers((prev) => prev.filter((m) => m.email !== email));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please add a title.", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        status,
        privacy,       // if your backend expects boolean, map here
        members,       // [{ email, role }]
      };

      const project = await createProject(payload);

      const id = project?._id || project?.id;
      if (!id) throw new Error("Backend did not return an _id");

      toast({ title: "Project created", description: `"${project.title}" is live.`, variant: "success" });

      onProjectCreated?.(project);
      navigate(`/projects/${id}`);
      onClose?.();
    } catch (err) {
      const msg =
        err?.normalizedMessage ||           // from interceptor
        err?.response?.data?.message ||     // Nest error shape
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create project";
      toast({ title: "Create failed", description: msg, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200/70 dark:border-slate-700">
            <Dialog.Title className="text-xl font-bold text-ink-900 dark:text-white">
              Create New Project
            </Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close create project dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Top row: Title / Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                  aria-required="true"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you building? Why now?"
                  className="mt-1 w-full h-[84px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                />
              </div>
            </div>

            {/* Middle row: Category / Status / Privacy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Personal, School, Work"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Privacy
                </label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <option>Private</option>
                  <option>Public</option>
                </select>
              </div>
            </div>

            {/* Add members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Add Members
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px] gap-3">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <option>Member</option>
                  <option>Manager</option>
                  <option>Viewer</option>
                </select>
                <button
                  type="button"
                  onClick={addMember}
                  className="btn btn-primary flex justify-center"
                  aria-label="Add member"
                >
                  <Plus size={16} />
                  <span className="ml-1">Add</span>
                </button>
              </div>

              {members.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.email}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2"
                    >
                      <span className="text-sm">
                        {m.email} <span className="text-slate-500">({m.role})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.email)}
                        className="text-sm text-rose-600 hover:underline"
                        aria-label={`Remove ${m.email}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200/70 dark:border-slate-700">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn btn-primary ${submitting ? "opacity-70 cursor-wait" : ""}`}
                disabled={submitting}
              >
                {submitting ? "Creating…" : "Create Project"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
