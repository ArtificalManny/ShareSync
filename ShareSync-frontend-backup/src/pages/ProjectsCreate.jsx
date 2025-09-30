// src/pages/ProjectsCreate.jsx
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Plus, Shield, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/projects";
import { toast } from "../components/ui/toast";

export default function ProjectsCreate({ onClose, onProjectCreated }) {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [privacy, setPrivacy] = useState("Private");
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
        privacy,
        members,
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
        err?.normalizedMessage ||
        err?.response?.data?.message ||
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Centered panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* Narrower shell so it doesn’t take over the screen */}
        <Dialog.Panel className="relative w-full max-w-3xl rounded-xl border border-border bg-white dark:bg-slate-900 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Dialog.Title className="text-base font-semibold">Create New Project</Dialog.Title>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close create project dialog"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit}
            className="px-5 py-6 space-y-6 w-full max-w-none"
          >
            {/* DETAILS */}
            <section className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full max-w-none">
              {/* Title (6) */}
              <div className="md:col-span-6">
                <label className="block text-sm text-slate-500">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Project title"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-required="true"
                  autoFocus
                />
              </div>

              {/* Category (3) */}
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-500">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Personal, School, Work"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status (3) */}
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-500">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Not Started</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </div>

              {/* Description (12) */}
              <div className="md:col-span-12">
                <label className="block text-sm text-slate-500">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What are you building? Why now?"
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </section>

            {/* PRIVACY */}
            <section className="w-full max-w-none">
              <label className="block text-sm text-slate-500 mb-2">Privacy</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrivacy("Private")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    privacy === "Private"
                      ? "ring-2 ring-indigo-500 border-indigo-300 bg-white/90 dark:bg-slate-900/90"
                      : "border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  aria-pressed={privacy === "Private"}
                  aria-label="Set privacy to Private"
                >
                  <div className="inline-flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-semibold">Private</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Only invited members can access.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPrivacy("Public")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    privacy === "Public"
                      ? "ring-2 ring-indigo-500 border-indigo-300 bg-white/90 dark:bg-slate-900/90"
                      : "border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  aria-pressed={privacy === "Public"}
                  aria-label="Set privacy to Public"
                >
                  <div className="inline-flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="text-sm font-semibold">Public</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Share read-only status externally.</p>
                </button>
              </div>
            </section>

            {/* MEMBERS */}
            <section className="w-full max-w-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Add Members</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_120px] gap-3">
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="member@email.com"
                  className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Member</option>
                  <option>Manager</option>
                  <option>Viewer</option>
                </select>
                <button
                  type="button"
                  onClick={addMember}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  aria-label="Add member"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {members.length > 0 && (
                <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 overflow-hidden">
                  {members.map((m) => (
                    <li key={m.email} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>
                        {m.email} <span className="text-slate-500">({m.role})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(m.email)}
                        className="text-rose-600 hover:underline"
                        aria-label={`Remove ${m.email}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 ${
                  submitting ? "opacity-70 cursor-wait" : ""
                }`}
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
