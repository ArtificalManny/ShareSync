// src/pages/project/ProjectSettings.jsx - Project-specific settings
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Settings, Image, Bell, AlertTriangle, ArrowLeft, 
  Save, Upload, X, Camera, Trash2 
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useMobile';
import { toast } from '../../components/ui/toast';

/**
 * ProjectSettings - Project-specific settings page
 * - Change name, picture, banner
 * - Project notifications
 * - Leave project (danger zone)
 */
const ProjectSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Project state
  const [project, setProject] = useState({
    name: 'ShareSync Development',
    picture: '🚀',
    banner: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop',
    description: 'Building the future of project management'
  });

  // Settings state
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

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      // TODO: API call to update project
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: '✅ Project updated!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to update project', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // TODO: API call to update notification settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: '🔔 Notifications updated!', variant: 'success' });
    } catch (error) {
      toast({ title: 'Failed to update notifications', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveProject = async () => {
    try {
      // TODO: API call to leave project
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'Left project', variant: 'default' });
      navigate('/projects');
    } catch (error) {
      toast({ title: 'Failed to leave project', variant: 'error' });
    }
  };

  const handleImageUpload = (type) => {
    // TODO: Implement image upload
    toast({ title: 'Image upload coming soon!', variant: 'default' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617, #0f172a, #020617)' }} className="text-white pb-20">
      <div className={`max-w-4xl mx-auto ${isMobile ? 'px-4' : 'px-6'} py-8`}>
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Project Settings
            </h1>
            <p className="text-slate-400 text-sm">{project.name}</p>
          </div>
        </div>

        {/* PROJECT INFO SECTION */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">Project Information</h2>
          </div>

          {/* Banner */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Project Banner</label>
            <div className="relative h-40 rounded-xl overflow-hidden bg-slate-700 group">
              {project.banner ? (
                <img src={project.banner} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  No banner set
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button
                  onClick={() => handleImageUpload('banner')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                {project.banner && (
                  <button
                    onClick={() => setProject({ ...project, banner: null })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Project Picture & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center text-3xl font-bold relative group">
                  {project.picture}
                  <button
                    onClick={() => handleImageUpload('picture')}
                    className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={project.picture}
                    onChange={(e) => setProject({ ...project, picture: e.target.value })}
                    placeholder="Enter emoji or text"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Project Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <textarea
              value={project.description}
              onChange={(e) => setProject({ ...project, description: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <button
            onClick={handleSaveProject}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* NOTIFICATION SETTINGS */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold">Notification Preferences</h2>
          </div>

          <p className="text-sm text-slate-400 mb-6">
            These settings only affect notifications for this project.
          </p>

          <div className="space-y-4 mb-6">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                <div>
                  <div className="font-semibold text-white capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-slate-400">
                    {key === 'taskAssigned' && 'Get notified when assigned to a task'}
                    {key === 'taskCompleted' && 'Get notified when tasks are completed'}
                    {key === 'announcements' && 'Get notified of new announcements'}
                    {key === 'mentions' && 'Get notified when mentioned'}
                    {key === 'deadlines' && 'Get notified of upcoming deadlines'}
                    {key === 'weeklyDigest' && 'Receive weekly project summary'}
                  </div>
                </div>
                <label className="relative inline-block w-12 h-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-700 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-fuchsia-500 transition-all" />
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6" />
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveNotifications}
            disabled={saving}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>

        {/* DANGER ZONE */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
          </div>

          <p className="text-sm text-slate-300 mb-4">
            Once you leave this project, you will lose access to all project data and won't be able to rejoin unless invited again.
          </p>

          {showLeaveConfirm ? (
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-white font-semibold mb-4">Are you absolutely sure?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveProject}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition-all"
                >
                  Yes, Leave Project
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all"
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
