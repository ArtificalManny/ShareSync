// src/pages/Roadmap.jsx
// ═══════════════════════════════════════════════════════════════════════════════
// Main Roadmap Page - Project milestone planning and tracking
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Map,
  Plus,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import RoadmapView from '../components/roadmap/RoadmapView';
import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../api/milestones';
import { toast } from '../components/ui/toast';

/* ─────────────────────────────────────────────────────────────────────────
   MILESTONE MODAL (Placeholder - can be expanded)
───────────────────────────────────────────────────────────────────────── */
const MilestoneModal = ({ milestone, projectId, onClose, onSave }) => {
  const [title, setTitle] = useState(milestone?.title || '');
  const [description, setDescription] = useState(milestone?.description || '');
  const [dueDate, setDueDate] = useState(
    milestone?.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState(milestone?.status || 'planned');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(milestone?._id || milestone?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        status,
      };

      await onSave(data, milestone?._id || milestone?.id);
      toast({
        title: isEditing ? 'Milestone updated' : 'Milestone created',
        variant: 'success',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to save milestone',
        description: error?.message || 'Please try again',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-lg bg-surface-1 border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEditing ? 'Edit Milestone' : 'Create Milestone'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter milestone title..."
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:border-brand/50 focus:outline-none
                transition-colors
              "
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this milestone..."
              rows={3}
              className="
                w-full px-4 py-2.5 rounded-lg resize-none
                bg-surface-2 border border-white/[0.06]
                text-text-primary placeholder:text-text-tertiary
                focus:border-brand/50 focus:outline-none
                transition-colors
              "
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-surface-2 border border-white/[0.06]
                text-text-primary
                focus:border-brand/50 focus:outline-none
                transition-colors
              "
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="
                w-full px-4 py-2.5 rounded-lg
                bg-surface-2 border border-white/[0.06]
                text-text-primary
                focus:border-brand/50 focus:outline-none
                transition-colors
              "
            >
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 py-2.5 rounded-lg
                bg-surface-2 text-text-secondary
                hover:bg-surface-3 hover:text-text-primary
                transition-colors
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="
                flex-1 py-2.5 rounded-lg
                bg-brand text-white font-medium
                hover:bg-brand-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors flex items-center justify-center gap-2
              "
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   DELETE CONFIRMATION MODAL
───────────────────────────────────────────────────────────────────────── */
const DeleteConfirmModal = ({ milestone, onClose, onConfirm, isDeleting }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
    <div className="w-full max-w-sm bg-surface-1 border border-white/[0.08] rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        Delete Milestone?
      </h3>
      <p className="text-sm text-text-secondary mb-6">
        Are you sure you want to delete "{milestone?.title || 'this milestone'}"? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="
            flex-1 py-2.5 rounded-lg
            bg-surface-2 text-text-secondary
            hover:bg-surface-3 hover:text-text-primary
            transition-colors
          "
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="
            flex-1 py-2.5 rounded-lg
            bg-error-500 text-white font-medium
            hover:bg-error-600
            disabled:opacity-50
            transition-colors flex items-center justify-center gap-2
          "
        >
          {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────────────────────────────────── */
const Roadmap = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [deletingMilestone, setDeletingMilestone] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch project info (optional - for breadcrumb)
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`);
      return response.json();
    },
    enabled: Boolean(projectId),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => createMilestone(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones', projectId]);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMilestone(projectId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['milestones', projectId]);
    },
  });

  // Delete handler
  const handleDelete = async () => {
    if (!deletingMilestone) return;
    
    setIsDeleting(true);
    try {
      const id = deletingMilestone._id || deletingMilestone.id;
      await deleteMilestone(projectId, id);
      queryClient.invalidateQueries(['milestones', projectId]);
      toast({ title: 'Milestone deleted', variant: 'success' });
      setDeletingMilestone(null);
    } catch (error) {
      toast({
        title: 'Failed to delete milestone',
        description: error?.message || 'Please try again',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Save handler (create or update)
  const handleSave = useCallback(async (data, milestoneId) => {
    if (milestoneId) {
      await updateMutation.mutateAsync({ id: milestoneId, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  }, [createMutation, updateMutation]);

  // Click handlers
  const handleMilestoneClick = useCallback((milestoneId, milestone) => {
    // Navigate to milestone detail or open edit modal
    setEditingMilestone(milestone);
  }, []);

  const handleEditMilestone = useCallback((milestoneId, milestone) => {
    setEditingMilestone(milestone);
  }, []);

  const handleDeleteMilestone = useCallback((milestoneId, milestone) => {
    setDeletingMilestone(milestone);
  }, []);

  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="
              flex items-center gap-1.5 text-sm text-text-tertiary
              hover:text-text-primary transition-colors
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Map className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                Roadmap
              </h1>
              {project?.name && (
                <p className="text-sm text-text-tertiary">{project.name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Roadmap View */}
      <RoadmapView
        projectId={projectId}
        onMilestoneClick={handleMilestoneClick}
        onCreateMilestone={() => setShowCreateModal(true)}
        onEditMilestone={handleEditMilestone}
        onDeleteMilestone={handleDeleteMilestone}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <MilestoneModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Edit Modal */}
      {editingMilestone && (
        <MilestoneModal
          milestone={editingMilestone}
          projectId={projectId}
          onClose={() => setEditingMilestone(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      {deletingMilestone && (
        <DeleteConfirmModal
          milestone={deletingMilestone}
          onClose={() => setDeletingMilestone(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

export default Roadmap;
