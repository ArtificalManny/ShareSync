// src/components/community/TemplateCreation.jsx - Week 9 Day 1-2
import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Send } from 'lucide-react';
import { toast } from '../ui/toast';

/**
 * TemplateCreation - Create a shareable project template
 * "College semester template", "Startup launch template", etc.
 */
const TemplateCreation = ({ onSubmit, onClose }) => {
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    category: 'school',
    tasks: [],
    milestones: [],
    isPublic: true
  });
  const [newTaskInput, setNewTaskInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'school', label: '🎓 School', color: 'blue' },
    { value: 'work', label: '💼 Work', color: 'purple' },
    { value: 'personal', label: '✨ Personal', color: 'pink' },
    { value: 'health', label: '💪 Health', color: 'emerald' },
    { value: 'creative', label: '🎨 Creative', color: 'orange' }
  ];

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      setTemplate({
        ...template,
        tasks: [...template.tasks, { title: newTaskInput.trim(), completed: false }]
      });
      setNewTaskInput('');
    }
  };

  const handleRemoveTask = (index) => {
    setTemplate({
      ...template,
      tasks: template.tasks.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async () => {
    if (!template.name.trim()) {
      toast({ title: 'Add a template name', variant: 'error' });
      return;
    }

    if (template.tasks.length === 0) {
      toast({ title: 'Add at least one task', variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.({
        ...template,
        createdAt: new Date(),
        author: 'currentUser' // Will be replaced with actual user
      });

      toast({ 
        title: '🎉 Template created!', 
        description: template.isPublic ? 'Others can now use your template' : 'Template saved',
        variant: 'success' 
      });
      onClose?.();
    } catch (error) {
      toast({ title: 'Failed to create template', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Create Template</h2>
              <p className="text-sm text-slate-400">Share your workflow with the community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Template Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => setTemplate({ ...template, name: e.target.value })}
            placeholder="College Semester Template"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">Description</label>
          <textarea
            value={template.description}
            onChange={(e) => setTemplate({ ...template, description: e.target.value })}
            placeholder="Describe how to use this template..."
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setTemplate({ ...template, category: cat.value })}
                className={`px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  template.category === cat.value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 bg-slate-800/30 hover:border-purple-500/50'
                }`}
              >
                <div className="font-semibold text-white">{cat.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-3">
            Tasks <span className="text-red-400">*</span>
          </label>
          
          {/* Add Task Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
              placeholder="Add a task..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleAddTask}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {template.tasks.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No tasks yet. Add tasks above.</p>
            ) : (
              template.tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700"
                >
                  <div className="w-6 h-6 rounded border-2 border-slate-600" />
                  <span className="flex-1 text-white">{task.title}</span>
                  <button
                    onClick={() => handleRemoveTask(index)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Public Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={template.isPublic}
              onChange={(e) => setTemplate({ ...template, isPublic: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-fuchsia-500 transition-all" />
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
            <div>
              <div className="text-sm font-medium text-white">
                {template.isPublic ? 'Public Template' : 'Private Template'}
              </div>
              <div className="text-xs text-slate-400">
                {template.isPublic ? 'Anyone can use this template' : 'Only you can use this template'}
              </div>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!template.name.trim() || template.tasks.length === 0 || submitting}
            className="flex-1 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Creating...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCreation;
