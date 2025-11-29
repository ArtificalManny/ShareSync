// src/pages/ProjectsCreate.jsx
import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Plus, Shield, Globe, Sparkles, Target, Users as UsersIcon, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../api/projects";
import { toast } from "../components/ui/toast";

export default function ProjectsCreate({ onClose, onProjectCreated }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("In Progress");
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

  // Prevent Enter key from submitting unless explicitly on submit button
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.type !== 'submit') {
      e.preventDefault();
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-purple-500/20">
          
          {/* Header - Fixed */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-purple-500/20 bg-slate-900/50 backdrop-blur-sm rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-white">Create New Project</Dialog.Title>
                <p className="text-xs text-slate-400">Start building your next big thing</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 hover:bg-slate-700/50 transition-colors group"
              aria-label="Close create project dialog"
            >
              <X className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Scrollable Content */}
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              
              {/* Project Basics */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Project Basics</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Project Title <span className="text-fuchsia-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., ShareSync Mobile App"
                      className="w-full rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      aria-required="true"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., SaaS, Personal, School"
                      className="w-full rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-purple-300 mb-2">
                      Description <span className="text-fuchsia-400">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What are you building? What problem does it solve? What's your goal?"
                      rows={4}
                      className="w-full rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      💡 Tip: A clear description helps your team understand the vision
                    </p>
                  </div>
                </div>
              </section>

              {/* Privacy Settings */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Privacy</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrivacy("Private")}
                    className={`rounded-xl border px-5 py-4 text-left transition-all ${
                      privacy === "Private"
                        ? "ring-2 ring-purple-500 border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                        : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-purple-500/50"
                    }`}
                    aria-pressed={privacy === "Private"}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="text-base font-semibold text-white">Private</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Only invited members can view and collaborate
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrivacy("Public")}
                    className={`rounded-xl border px-5 py-4 text-left transition-all ${
                      privacy === "Public"
                        ? "ring-2 ring-purple-500 border-purple-400 bg-purple-500/10 shadow-lg shadow-purple-500/20"
                        : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-purple-500/50"
                    }`}
                    aria-pressed={privacy === "Public"}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <span className="text-base font-semibold text-white">Public</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Anyone can view read-only status and progress
                    </p>
                  </button>
                </div>
              </section>

              {/* Team Members */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <UsersIcon className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Team Members</h3>
                  <span className="text-xs text-slate-500">(Optional)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_100px] gap-3">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="teammate@email.com"
                    className="rounded-xl border border-purple-500/30 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="rounded-xl border border-purple-500/30 bg-slate-800/50 px-3 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option>Member</option>
                    <option>Manager</option>
                    <option>Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={addMember}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/20 hover:bg-purple-600/30 px-3 py-3 text-sm font-medium text-white transition-all"
                    aria-label="Add member"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {members.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.email}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 border border-purple-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
                            {m.email[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">{m.email}</span>
                            <span className="text-xs text-slate-400 ml-2">({m.role})</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMember(m.email)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          aria-label={`Remove ${m.email}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  💡 Tip: You can invite more members after creating the project
                </p>
              </section>

            </div>
          </form>

          {/* Footer - Fixed */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-t border-purple-500/20 bg-slate-900/50 backdrop-blur-sm rounded-b-2xl">
            <div className="text-xs text-slate-400">
              <Zap className="w-3 h-3 inline mr-1 text-purple-400" />
              Press ESC to cancel
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 px-5 py-2.5 text-sm font-medium text-white transition-all"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className={`rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition-all ${
                  submitting ? "opacity-70 cursor-wait" : "hover:scale-105"
                }`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </div>

        </Dialog.Panel>
      </div>
    </Dialog>
  );
}