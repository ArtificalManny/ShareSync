// src/pages/project/ProjectSettings.jsx - Project-specific settings
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Settings, Image, Bell, AlertTriangle, ArrowLeft, 
  Save, Upload, X, Camera, Trash2, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjectOverview } from '../../hooks/useProjectOverview';
import { toast } from '../../components/ui/toast';
import client from '../../api/client';

/**
 * ProjectSettings - Project-specific settings page
 * - Role-Based Access Control (RBAC) for Project Info
 * - User-specific notification preferences
 * - Leave project (destructive)
 */
const ProjectSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch real project data via existing hook
  const { project, loading, refresh } = useProjectOverview(id);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    picture: '',
    banner: '',
    description: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    taskAssigned: true,
    taskCompleted: true,
    announcements: true,
    mentions: true,
    deadlines: true,
    weeklyDigest: false
  });

  const [saving, setSaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // 1. DETERMINE ROLE & PERMISSIONS
  // Find current user in the project members list to determine role
  const currentMember = project?.members?.find(m => m.userId?._id === user?.id || m.userId === user?.id);
  const isOwnerByDirectId = project?.ownerId === user?.id || project?.owner?._id === user?.id;
  const role = isOwnerByDirectId ? 'owner' : (currentMember?.role || 'viewer');
  
  // Logic: Only Owners and Admins can edit Project Info
  const canEditProjectInfo = role === 'owner' || role === 'admin';

  // 2. SYNC STATE WITH DATABASE
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        picture: project.icon || '📁',
        banner: project.banner || '',
        description: project.description || ''
      });

      // Load specific user preferences if they exist in the member array
      if (currentMember?.preferences) {
        setNotificationSettings(currentMember.preferences);
      }
    }
  }, [project, currentMember]);

  // 3. API ACTIONS
  const handleSaveProject = async () => {
    if (!canEditProjectInfo) return;
    setSaving(true);
    try {
      // ✅ FIX: Removed 'banner' because it doesn't exist in the backend schema
      // This stops NestJS from throwing a 400 Bad Request
      await client.put(`/projects/${id}`, {
        name: formData.name,
        description: formData.description,
        icon: formData.picture
      });
      toast({ title: '✅ Project updated!', variant: 'success' });
      refresh(); // Reload data via hook
    } catch (error) {
      toast({ title: 'Failed to update project', description: error.response?.data?.message || error.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await client.patch(`/projects/${id}/preferences`, notificationSettings);
      toast({ title: '🔔 Preferences saved!', variant: 'success' });
      refresh(); // Reload data via hook
    } catch (error) {
      toast({ title: 'Failed to save preferences', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveProject = async () => {
    try {
      await client.post(`/projects/${id}/leave`);
      toast({ title: 'Left project successfully', variant: 'default' });
      navigate('/projects'); // Navigate back to dashboard
    } catch (error) {
      toast({ 
        title: 'Could not leave project', 
        description: error.response?.data?.message || 'Are you the owner? Owners must transfer ownership first.', 
        variant: 'error' 
      });
      setShowLeaveConfirm(false);
    }
  };

  const handleImageUpload = (type) => {
    toast({ title: 'Image upload coming soon!', variant: 'default' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-zinc-100 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Project Settings
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                role === 'owner' 
                  ? 'border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400' 
                  : 'border-slate-200 text-slate-600 bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
              }`}>
                {role.toUpperCase()}
              </span>
              <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">{project?.name}</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 1: PROJECT INFO (Role-Based Access)        */}
        {/* ══════════════════════════════════════════════════ */}
        <div className={`bg-white dark:bg-[#111113] border ${canEditProjectInfo ? 'border-slate-200 dark:border-white/[0.06]' : 'border-slate-200 dark:border-white/[0.02]'} rounded-2xl p-6 shadow-sm dark:shadow-none mb-6 relative overflow-hidden transition-colors duration-300`}>
          
          {!canEditProjectInfo && (
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-[#1f1f23] rounded-full border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-zinc-400 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Moderator Access Only</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${canEditProjectInfo ? 'bg-violet-50 dark:bg-violet-500/10' : 'bg-slate-100 dark:bg-white/5'}`}>
              <Settings className={`w-4 h-4 ${canEditProjectInfo ? 'text-violet-500' : 'text-slate-500 dark:text-zinc-400'}`} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Project Information</h2>
          </div>

          <div className={!canEditProjectInfo ? 'opacity-60 pointer-events-none grayscale-[0.2]' : ''}>
            {/* Banner */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Project Banner</label>
              <div className="relative h-40 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/5 group transition-colors">
                {formData.banner ? (
                  <img src={formData.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-zinc-500 text-sm font-medium">
                    No banner set
                  </div>
                )}
                {canEditProjectInfo && (
                  <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <button
                      onClick={() => handleImageUpload('banner')}
                      className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 rounded-lg font-semibold transition-all flex items-center gap-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                    {formData.banner && (
                      <button
                        onClick={() => setFormData({ ...formData, banner: null })}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Project Picture & Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Project Icon</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-2xl font-bold relative group shadow-sm flex-shrink-0">
                    {formData.picture}
                    {canEditProjectInfo && (
                      <button
                        onClick={() => handleImageUpload('picture')}
                        className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      disabled={!canEditProjectInfo}
                      value={formData.picture}
                      onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
                      placeholder="Enter emoji or icon URL"
                      className="w-full bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400 dark:placeholder-zinc-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Project Name</label>
                <input
                  type="text"
                  disabled={!canEditProjectInfo}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400 dark:placeholder-zinc-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                disabled={!canEditProjectInfo}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400 dark:placeholder-zinc-500"
              />
            </div>

            {canEditProjectInfo && (
              <button
                onClick={handleSaveProject}
                disabled={saving}
                className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 2: NOTIFICATIONS (User Specific)           */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-[#111113] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-6 shadow-sm dark:shadow-none mb-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Your Notification Preferences</h2>
          </div>

          <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
            Control what you hear from this project. These settings are personal to you and will not affect the rest of the team.
          </p>

          <div className="space-y-3 mb-6">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-xl border border-slate-200 dark:border-white/[0.04] transition-colors">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-100 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
                    {key === 'taskAssigned' && 'Get notified when you are assigned to a task'}
                    {key === 'taskCompleted' && 'Get notified when team tasks are completed'}
                    {key === 'announcements' && 'Get notified of project-wide announcements'}
                    {key === 'mentions' && 'Get notified when you are @mentioned'}
                    {key === 'deadlines' && 'Get notified of upcoming project deadlines'}
                    {key === 'weeklyDigest' && 'Receive a weekly project summary email'}
                  </div>
                </div>
                <label className="relative inline-block w-12 h-6 cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                    className="sr-only peer"
                    aria-label={`Toggle ${key}`}
                  />
                  <div className="w-12 h-6 bg-slate-300 dark:bg-zinc-700 rounded-full peer-checked:bg-blue-500 transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-sm" />
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 3: DANGER ZONE                             */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Danger Zone</h2>
          </div>

          <p className="text-sm text-red-800/80 dark:text-red-200/70 mb-5">
            Once you leave this project, you will lose access to all project data and won't be able to rejoin unless invited again.
            {role === 'owner' && <span className="font-bold text-red-600 dark:text-red-400 block mt-2">⚠️ You are the Owner. You cannot leave until you transfer ownership.</span>}
          </p>

          {showLeaveConfirm ? (
            <div className="bg-white dark:bg-[#1f1f23] rounded-xl p-5 border border-red-200 dark:border-red-500/30 shadow-sm">
              <p className="text-slate-800 dark:text-white font-semibold mb-4 text-center">Are you absolutely sure you want to leave <span className="text-red-600 dark:text-red-400">{project?.name}</span>?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveProject}
                  disabled={role === 'owner'}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  Yes, Leave Project
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Leave Project
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProjectSettings;
