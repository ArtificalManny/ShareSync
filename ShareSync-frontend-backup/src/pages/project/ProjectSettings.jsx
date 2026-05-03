// src/pages/project/ProjectSettings.jsx - Project-specific settings
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings, Image, Bell, AlertTriangle, ArrowLeft,
  Save, Upload, X, Camera, Trash2, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProjectOverview } from '../../hooks/useProjectOverview';
import { toast } from '../../components/ui/toast';
import client from '../../api/client';

// ─────────────────────────────────────────────────────────────────────────────
// PROJECT BRANDING FRONTEND BRIDGE
// ─────────────────────────────────────────────────────────────────────────────
// The backend stores uploaded image URLs as relative values like:
//   /uploads/project-branding-...
// The browser is running on Vite, so previews need the backend asset origin.
const RAW_PROJECT_ASSET_BASE =
  client?.defaults?.baseURL ||
  import.meta?.env?.VITE_API_URL ||
  import.meta?.env?.VITE_BACKEND_URL ||
  'http://localhost:5050/api';

const PROJECT_ASSET_ORIGIN = String(RAW_PROJECT_ASSET_BASE)
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

function resolveProjectAssetUrl(value) {
  if (!value || typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
    return `${PROJECT_ASSET_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
  }

  return trimmed;
}


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
    icon: '📁',
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
  const [uploadingBranding, setUploadingBranding] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const logoFileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  // 1. DETERMINE ROLE & PERMISSIONS
  const currentUserId = user?.id ? String(user.id) : '';
  const rawOwnerId =
    project?.ownerId?._id ||
    project?.ownerId ||
    project?.owner?._id ||
    project?.owner ||
    '';

  // Find current user in the project members list to determine role
  const currentMember = project?.members?.find(
    (m) => String(m?.userId?._id || m?.userId || '') === currentUserId
  );

  const isOwnerByDirectId = !!currentUserId && String(rawOwnerId) === currentUserId;
  const role = isOwnerByDirectId ? 'owner' : (currentMember?.role || 'viewer');

  // Logic: Only Owners and Admins can edit Project Info
  const canEditProjectInfo = role === 'owner' || role === 'admin';

  // 2. SYNC STATE WITH DATABASE
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        icon: project.icon || project.emoji || '📁',
        picture: project.logoUrl || project.logo || project.avatarUrl || project.picture || '',
        banner: project.bannerUrl || project.banner || project.coverUrl || project.coverImageUrl || '',
        description: project.description || ''
      });

      setNotificationSettings({
        taskAssigned: true,
        taskCompleted: true,
        announcements: true,
        mentions: true,
        deadlines: true,
        weeklyDigest: false,
        ...(currentMember?.preferences || {})
      });
    }
  }, [project, currentMember]);

  // 3. API ACTIONS
  const handleSaveProject = async () => {
    if (!canEditProjectInfo) return;
    setSaving(true);
    try {
      await client.put(`/projects/${id}`, {
        name: formData.name,
        description: formData.description,
        icon: formData.icon || '📁',
        emoji: formData.icon || '📁',
        logoUrl: formData.picture || '',
        bannerUrl: formData.banner || ''
      });
      toast({ title: '✅ Project updated!', variant: 'success' });
      refresh(); // Reload data via hook
    } catch (error) {
      toast({
        title: 'Failed to update project',
        description: error.response?.data?.message || error.message,
        variant: 'error'
      });
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
      toast({
        title: 'Failed to save preferences',
        description: error.response?.data?.message || error.message,
        variant: 'error'
      });
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
    if (!canEditProjectInfo || uploadingBranding) return;

    if (type === 'banner') {
      bannerFileInputRef.current?.click();
      return;
    }

    logoFileInputRef.current?.click();
  };

  const handleBrandingFileSelected = async (type, event) => {
    if (!canEditProjectInfo) return;

    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith('image/')) {
      toast({
        title: 'Please choose an image file',
        variant: 'error'
      });
      event.target.value = '';
      return;
    }

    const normalizedType = type === 'banner' ? 'banner' : 'logo';
    const body = new FormData();
    body.append('file', file);
    body.append('kind', normalizedType);

    setUploadingBranding(true);

    try {
      const response = await client.post(`/projects/${id}/branding-image`, body, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const payload = response?.data?.data || response?.data || {};
      const url =
        payload.url ||
        payload.project?.[normalizedType === 'banner' ? 'bannerUrl' : 'logoUrl'] ||
        '';

      if (!url) {
        throw new Error('Upload succeeded, but no image URL was returned.');
      }

      setFormData((prev) => ({
        ...prev,
        ...(normalizedType === 'banner'
          ? { banner: url }
          : { picture: url }),
      }));

      toast({
        title: normalizedType === 'banner' ? '✅ Project banner uploaded!' : '✅ Project logo uploaded!',
        variant: 'success'
      });

      refresh();
    } catch (error) {
      toast({
        title: 'Image upload failed',
        description: error.response?.data?.message || error.message,
        variant: 'error'
      });
    } finally {
      setUploadingBranding(false);
      if (event?.target) event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-white pb-20 transition-colors">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <input
          ref={logoFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleBrandingFileSelected('logo', event)}
        />
        <input
          ref={bannerFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleBrandingFileSelected('banner', event)}
        />

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
              Project Settings
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-md border ${role === 'owner' ? 'border-warning-500 text-warning-500' : 'border-slate-500 text-slate-400'}`}>
                {role.toUpperCase()}
              </span>
              <p className="text-slate-400 dark:text-slate-500 dark:text-slate-400 text-sm">{project?.name}</p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 1: PROJECT INFO (Role-Based Access)        */}
        {/* ══════════════════════════════════════════════════ */}
        <div className={`bg-slate-800/50 backdrop-blur-xl border ${canEditProjectInfo ? 'border-brand-500/20' : 'border-slate-700/50'} rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden`}>

          {!canEditProjectInfo && (
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 rounded-full border border-slate-700 text-xs text-slate-400">
                <Lock className="w-3 h-3" />
                <span>Moderator Access Only</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <Settings className={`w-5 h-5 ${canEditProjectInfo ? 'text-brand-400' : 'text-slate-500'}`} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Project Information</h2>
          </div>

          <div className={!canEditProjectInfo ? 'opacity-60 pointer-events-none grayscale-[0.5]' : ''}>
            {/* Banner */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Project Banner</label>
              <div className="relative h-40 rounded-xl overflow-hidden bg-slate-700 group">
                {formData.banner ? (
                  <img src={resolveProjectAssetUrl(formData.banner)} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    No banner set
                  </div>
                )}
                {canEditProjectInfo && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleImageUpload('banner')}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg font-semibold transition-all flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                    {formData.banner && (
                      <button
                        onClick={() => setFormData({ ...formData, banner: '' })}
                        className="px-4 py-2 bg-error-600 hover:bg-error-500 rounded-lg font-semibold transition-all flex items-center gap-2"
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
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Project Logo / Icon</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold relative group overflow-hidden">
                    {formData.picture ? (
                      <img
                        src={resolveProjectAssetUrl(formData.picture)}
                        alt={`${formData.name || 'Project'} logo`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{formData.icon || '📁'}</span>
                    )}

                    {canEditProjectInfo && (
                      <button
                        onClick={() => handleImageUpload('picture')}
                        disabled={uploadingBranding}
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <Camera className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      disabled={!canEditProjectInfo}
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Enter emoji fallback, e.g. 📁"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-brand-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Project Name</label>
                <input
                  type="text"
                  disabled={!canEditProjectInfo}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors disabled:bg-slate-800 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Description</label>
              <textarea
                value={formData.description}
                disabled={!canEditProjectInfo}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 resize-none transition-colors disabled:bg-slate-800 disabled:text-slate-500"
              />
            </div>

            {canEditProjectInfo && (
              <button
                onClick={handleSaveProject}
                disabled={saving || uploadingBranding}
                className="w-full px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : uploadingBranding ? 'Uploading image...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 2: NOTIFICATIONS (User Specific)           */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200 dark:border-blue-500/20 rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your Notification Preferences</h2>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Control what you hear from this project. These settings are personal to you and will not affect the rest of the team.
          </p>

          <div className="space-y-4 mb-6">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/[0.04]">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
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
                  />
                  <div className="w-12 h-6 bg-slate-700 rounded-full peer-checked:bg-blue-500 transition-all" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6" />
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* SECTION 3: DANGER ZONE                             */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="bg-error-500/10 border border-error-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-error-400" />
            <h2 className="text-xl font-bold text-error-400">Danger Zone</h2>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Once you leave this project, you will lose access to all project data and won't be able to rejoin unless invited again.
            {role === 'owner' && (project?.members?.filter(m => String(m?.userId?._id || m?.userId || '') !== currentUserId).length > 0
              ? <span className="font-bold text-error-300 block mt-2">⚠️ You are the Owner. Transfer ownership to another member first.</span>
              : <span className="font-bold text-amber-300 block mt-2">⚠️ You are the only member. Leaving will archive this project.</span>
            )}
          </p>

          {showLeaveConfirm ? (
            <div className="bg-white dark:bg-slate-900/80 rounded-xl p-5 border border-error-200 dark:border-error-500/50">
              <p className="text-white font-semibold mb-4">Are you absolutely sure you want to leave {project?.name}?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveProject}
                  disabled={role === 'owner' && project?.members?.filter(m => String(m?.userId?._id || m?.userId || '') !== currentUserId).length > 0}
                  className="flex-1 px-4 py-2.5 bg-error-600 hover:bg-error-500 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-error-500/20"
                >
                  {role === 'owner' && (!project?.members || project.members.length === 0) ? 'Yes, Archive & Leave' : 'Yes, Leave Project'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="px-6 py-3 bg-error-600 hover:bg-error-500 rounded-xl font-bold transition-all shadow-lg shadow-error-500/20"
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
