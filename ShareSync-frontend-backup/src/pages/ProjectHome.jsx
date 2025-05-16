import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProject,
  updateProject,
  addPost,
  addPostComment,
  likePost,
  addTask,
  updateTask,
  addSubtask,
  addTaskComment,
  likeTask,
  addTeam,
  updateTeam,
  addFile,
  requestFile,
  shareProject,
  requestShare,
  updateNotificationPreferences,
} from '../utils/api';

const ProjectHome = ({ user, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [metrics, setMetrics] = useState({ totalProjects: 0, currentProjects: 0, pastProjects: 0, tasksCompleted: 0 });
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Announcement' });
  const [newComment, setNewComment] = useState({});
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: [], dueDate: '', priority: 'Medium', file: null });
  const [editTask, setEditTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState({});
  const [taskComment, setTaskComment] = useState({});
  const [subtaskComment, setSubtaskComment] = useState({});
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: [] });
  const [editTeam, setEditTeam] = useState(null);
  const [newFile, setNewFile] = useState({ name: '', url: '' });
  const [shareUserId, setShareUserId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState(user?.notificationPreferences || { email: true, sms: false, push: true, tasks: true, posts: true, files: true, shares: true, teams: true });
  const [activityFilter, setActivityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [showComments, setShowComments] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching project details for ID:', id);
        const projectData = await getProject(id);
        console.log('Project data:', projectData);
        setProject(projectData);

        const initialComments = {};
        const initialSubtaskComments = {};
        const initialSubtasks = {};
        if (projectData?.posts && Array.isArray(projectData.posts)) {
          projectData.posts.forEach(post => {
            initialComments[post._id] = '';
          });
        }
        if (projectData?.tasks && Array.isArray(projectData.tasks)) {
          projectData.tasks.forEach(task => {
            initialComments[task._id] = '';
            initialSubtasks[task._id] = { title: '', description: '', status: 'To Do' };
            if (task.subtasks && Array.isArray(task.subtasks)) {
              task.subtasks.forEach(subtask => {
                initialSubtaskComments[subtask._id] = '';
              });
            }
          });
        }
        setNewComment(initialComments);
        setTaskComment(initialComments);
        setSubtaskComment(initialSubtaskComments);
        setNewSubtask(initialSubtasks);

        setMetrics({
          totalProjects: 10,
          currentProjects: 5,
          pastProjects: 5,
          tasksCompleted: 20,
        });
      } catch (err) {
        console.error('Failed to fetch project details:', err.message);
        setError(`Failed to load project details: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpdateProject = async (updateData) => {
    try {
      const updatedProject = await updateProject(id, updateData);
      setProject(updatedProject);
      await notifyMembers(updatedProject, 'Project updated', `Project "${updatedProject.title}" has been updated.`);
    } catch (err) {
      console.error('Update project error:', err.message);
      setError('Failed to update project. Please try again.');
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    try {
      const postData = {
        ...newPost,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await addPost(id, postData);
      setProject(updatedProject);
      setNewComment({ ...newComment, [updatedProject.posts[updatedProject.posts.length - 1]._id]: '' });
      setNewPost({ title: '', content: '', category: 'Announcement' });

      const newActivity = {
        action: 'post_added',
        details: `Added post: ${newPost.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New post added', `A new post "${newPost.title}" has been added to project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add post error:', err.message);
      setError('Failed to add post. Please try again.');
    }
  };

  const handleAddPostComment = async (postId) => {
    try {
      const commentData = {
        content: newComment[postId] || '',
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await addPostComment(id, postId, commentData);
      setProject(updatedProject);
      setNewComment({ ...newComment, [postId]: '' });

      const post = updatedProject.posts.find(p => p._id === postId);
      const newActivity = {
        action: 'post_commented',
        details: `Commented on post: ${post?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New comment on post', `A new comment was added to post "${post?.title}" in project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add post comment error:', err.message);
      setError('Failed to add comment. Please try again.');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const updatedProject = await likePost(id, postId);
      setProject(updatedProject);

      const post = updatedProject.posts.find(p => p._id === postId);
      const newActivity = {
        action: 'post_liked',
        details: `Liked post: ${post?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'Post liked', `Post "${post?.title}" in project "${updatedProject.title}" was liked by ${user?.username}.`);
    } catch (err) {
      console.error('Like post error:', err.message);
      setError('Failed to like post. Please try again.');
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const post = project?.posts?.find(p => p._id === postId);
      if (!post) throw new Error('Post not found');
      const newActivity = {
        action: 'post_shared',
        details: `Shared post: ${post.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(project?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });
      setProject(prev => ({
        ...prev,
        activityLog: updatedActivityLog,
      }));

      await notifyMembers(project, 'Post shared', `Post "${post.title}" in project "${project.title}" was shared by ${user?.username}.`);
    } catch (err) {
      console.error('Share post error:', err.message);
      setError('Failed to share post. Please try again.');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('assignedTo', JSON.stringify(newTask.assignedTo));
      formData.append('dueDate', newTask.dueDate);
      formData.append('priority', newTask.priority);
      formData.append('userId', user?.id || 'Unknown');
      formData.append('createdAt', new Date().toISOString());
      if (newTask.file) {
        formData.append('file', newTask.file);
      }

      const updatedProject = await addTask(id, formData);
      setProject(updatedProject);
      setTaskComment({ ...taskComment, [updatedProject.tasks[updatedProject.tasks.length - 1]._id]: '' });
      setSubtaskComment(prev => ({
        ...prev,
        ...updatedProject.tasks[updatedProject.tasks.length - 1].subtasks.reduce((acc, subtask) => ({
          ...acc,
          [subtask._id]: '',
        }), {}),
      }));
      setNewSubtask({ ...newSubtask, [updatedProject.tasks[updatedProject.tasks.length - 1]._id]: { title: '', description: '', status: 'To Do' } });
      setNewTask({ title: '', description: '', assignedTo: [], dueDate: '', priority: 'Medium', file: null });

      const newActivity = {
        action: 'task_added',
        details: `Added task: ${newTask.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New task added', `A new task "${newTask.title}" was added to project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add task error:', err.message);
      setError('Failed to add task. Please try again.');
    }
  };

  const handleEditTask = (task) => {
    setEditTask({ ...task, assignedTo: task.assignedTo || [], dueDate: task.dueDate || '', priority: task.priority || 'Medium', file: null });
  };

  const handleUpdateTask = async (taskId, updateData) => {
    try {
      const formData = new FormData();
      formData.append('title', updateData.title);
      formData.append('description', updateData.description);
      formData.append('assignedTo', JSON.stringify(updateData.assignedTo));
      formData.append('dueDate', updateData.dueDate);
      formData.append('priority', updateData.priority);
      formData.append('status', updateData.status);
      if (updateData.file) {
        formData.append('file', updateData.file);
      }

      const updatedProject = await updateTask(id, taskId, formData);
      setProject(updatedProject);
      setEditTask(null);

      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_updated',
        details: `Updated task: ${task?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      if (updateData.status === 'Completed') {
        await notifyMembers(updatedProject, 'Task completed', `Task "${task?.title}" in project "${updatedProject.title}" was completed by ${user?.username}.`);
      } else {
        await notifyMembers(updatedProject, 'Task updated', `Task "${task?.title}" in project "${updatedProject.title}" was updated by ${user?.username}.`);
      }
    } catch (err) {
      console.error('Update task error:', err.message);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleAddSubtask = async (taskId) => {
    try {
      const subtaskData = {
        ...newSubtask[taskId],
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await addSubtask(id, taskId, subtaskData);
      setProject(updatedProject);
      setNewSubtask({ ...newSubtask, [taskId]: { title: '', description: '', status: 'To Do' } });
      setSubtaskComment(prev => ({
        ...prev,
        [updatedProject.tasks.find(t => t._id === taskId).subtasks.slice(-1)[0]._id]: '',
      }));

      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'subtask_added',
        details: `Added subtask to task: ${task?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New subtask added', `A new subtask was added to task "${task?.title}" in project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add subtask error:', err.message);
      setError('Failed to add subtask. Please try again.');
    }
  };

  const handleAddTaskComment = async (taskId) => {
    try {
      const commentData = {
        content: taskComment[taskId] || '',
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await addTaskComment(id, taskId, commentData);
      setProject(updatedProject);
      setTaskComment({ ...taskComment, [taskId]: '' });

      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_commented',
        details: `Commented on task: ${task?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New comment on task', `A new comment was added to task "${task?.title}" in project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add task comment error:', err.message);
      setError('Failed to add task comment. Please try again.');
    }
  };

  const handleAddSubtaskComment = async (taskId, subtaskId) => {
    try {
      const commentData = {
        content: subtaskComment[subtaskId] || '',
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await addTaskComment(id, taskId, { subtaskId, ...commentData });
      setProject(updatedProject);
      setSubtaskComment({ ...subtaskComment, [subtaskId]: '' });

      const task = updatedProject.tasks.find(t => t._id === taskId);
      const subtask = task.subtasks.find(s => s._id === subtaskId);
      const newActivity = {
        action: 'subtask_commented',
        details: `Commented on subtask: ${subtask?.title || 'Untitled'} in task: ${task?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New comment on subtask', `A new comment was added to subtask "${subtask?.title}" in task "${task?.title}" in project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add subtask comment error:', err.message);
      setError('Failed to add subtask comment. Please try again.');
    }
  };

  const handleLikeTask = async (taskId) => {
    try {
      const updatedProject = await likeTask(id, taskId);
      setProject(updatedProject);

      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_liked',
        details: `Liked task: ${task?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'Task liked', `Task "${task?.title}" in project "${updatedProject.title}" was liked by ${user?.username}.`);
    } catch (err) {
      console.error('Like task error:', err.message);
      setError('Failed to like task. Please try again.');
    }
  };

  const handleLikeSubtask = async (taskId, subtaskId) => {
    try {
      const updatedProject = await likeTask(id, taskId, { subtaskId });
      setProject(updatedProject);

      const task = updatedProject.tasks.find(t => t._id === taskId);
      const subtask = task.subtasks.find(s => s._id === subtaskId);
      const newActivity = {
        action: 'subtask_liked',
        details: `Liked subtask: ${subtask?.title || 'Untitled'} in task: ${task?.title || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'Subtask liked', `Subtask "${subtask?.title}" in task "${task?.title}" in project "${updatedProject.title}" was liked by ${user?.username}.`);
    } catch (err) {
      console.error('Like subtask error:', err.message);
      setError('Failed to like subtask. Please try again.');
    }
  };

  const handleShareTask = async (taskId) => {
    try {
      const task = project?.tasks?.find(t => t._id === taskId);
      if (!task) throw new Error('Task not found');
      const newActivity = {
        action: 'task_shared',
        details: `Shared task: ${task.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(project?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });
      setProject(prev => ({
        ...prev,
        activityLog: updatedActivityLog,
      }));

      await notifyMembers(project, 'Task shared', `Task "${task.title}" in project "${project.title}" was shared by ${user?.username}.`);
    } catch (err) {
      console.error('Share task error:', err.message);
      setError('Failed to share task. Please try again.');
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await addTeam(id, newTeam);
      setProject(updatedProject);
      setNewTeam({ name: '', description: '', members: [] });

      const newActivity = {
        action: 'team_added',
        details: `Added team: ${newTeam.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New team added', `A new team "${newTeam.name}" was added to project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add team error:', err.message);
      setError('Failed to add team. Please try again.');
    }
  };

  const handleEditTeam = (team) => {
    setEditTeam({ ...team, members: team.members || [] });
  };

  const handleUpdateTeam = async (teamId, updateData) => {
    try {
      const updatedProject = await updateTeam(id, teamId, updateData);
      setProject(updatedProject);
      setEditTeam(null);

      const team = updatedProject.teams.find(t => t._id === teamId);
      const newActivity = {
        action: 'team_updated',
        details: `Updated team: ${team?.name || 'Untitled'}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'Team updated', `Team "${team?.name}" in project "${updatedProject.title}" was updated by ${user?.username}.`);
    } catch (err) {
      console.error('Update team error:', err.message);
      setError('Failed to update team. Please try again.');
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    try {
      const fileData = {
        ...newFile,
        uploadedBy: user?.id || 'Unknown',
      };
      const updatedProject = await addFile(id, fileData);
      setProject(updatedProject);
      setNewFile({ name: '', url: '' });

      const newActivity = {
        action: 'file_added',
        details: `Added file: ${newFile.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'New file added', `A new file "${newFile.name}" was added to project "${updatedProject.title}".`);
    } catch (err) {
      console.error('Add file error:', err.message);
      setError('Failed to add file. Please try again.');
    }
  };

  const handleRequestFile = async (e) => {
    e.preventDefault();
    try {
      await requestFile(id, newFile);
      setNewFile({ name: '', url: '' });

      const newActivity = {
        action: 'file_requested',
        details: `Requested to add file: ${newFile.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(project?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(project, 'File request', `A request to add file "${newFile.name}" was made in project "${project.title}" by ${user?.username}.`);
    } catch (err) {
      console.error('Request file error:', err.message);
      setError('Failed to request file. Please try again.');
    }
  };

  const handleShareProject = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await shareProject(id, shareUserId);
      setProject(updatedProject);
      setShareUserId('');
      setShowShareModal(false);

      const newActivity = {
        action: 'project_shared',
        details: `Shared project with user: ${shareUserId}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'Project shared', `Project "${updatedProject.title}" was shared with user ${shareUserId} by ${user?.username}.`);
    } catch (err) {
      console.error('Share project error:', err.message);
      setError('Failed to share project. Please try again.');
    }
  };

  const handleRequestShare = async (e) => {
    e.preventDefault();
    try {
      await requestShare(id, shareUserId);
      setShareUserId('');
      setShowShareModal(false);

      const newActivity = {
        action: 'share_requested',
        details: `Requested to share project with user: ${shareUserId}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(project?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(project, 'Share request', `A request to share project "${project.title}" with user ${shareUserId} was made by ${user?.username}.`);
    } catch (err) {
      console.error('Request share error:', err.message);
      setError('Failed to request share. Please try again.');
    }
  };

  const handleUpdateNotificationPrefs = async () => {
    try {
      await updateNotificationPreferences(notificationPrefs);
      setUser({ ...user, notificationPreferences: notificationPrefs });
      localStorage.setItem('user', JSON.stringify({ ...user, notificationPreferences: notificationPrefs }));
      setShowSettingsModal(false);
    } catch (err) {
      console.error('Update notification preferences error:', err.message);
      setError('Failed to update notification preferences. Please try again.');
    }
  };

  const notifyMembers = async (project, subject, message) => {
    console.log('Notifying members:', { project, subject, message, notificationPrefs });
  };

  const filteredActivityLog = (project?.activityLog || []).filter(activity => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'tasks') return activity.action.includes('task');
    if (activityFilter === 'posts') return activity.action.includes('post');
    if (activityFilter === 'files') return activity.action.includes('file');
    if (activityFilter === 'shares') return activity.action.includes('share');
    if (activityFilter === 'teams') return activity.action.includes('team');
    return false;
  });

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  const isAdmin = project?.admins?.includes(user?.id) || false;

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4 py-8">
      {/* Center Content */}
      <div className="md:col-span-2">
        <header className="mb-6 animate-fade-in">
          <h1 className="text-4xl font-display text-vibrant-pink">{project?.title || 'Project'}</h1>
          <p className="text-white mt-3 text-lg">{project?.description || 'No description'}</p>
          <p className="text-sm text-gray-300 mt-2">Category: {project?.category || 'N/A'}</p>
          <div className="flex items-center mt-2">
            <p className="text-sm text-gray-300">Status: </p>
            {isAdmin ? (
              <select
                value={project?.status || 'Active'}
                onChange={(e) => handleUpdateProject({ status: e.target.value })}
                className="ml-2 p-1 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
              >
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            ) : (
              <p className="ml-2 text-sm text-gray-300">{project?.status || 'N/A'}</p>
            )}
          </div>
        </header>

        <section className="mb-8 animate-fade-in">
          <div className="card glassmorphic">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Project Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
                <h3 className="text-lg text-white">Total Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.totalProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
                <h3 className="text-lg text-white">Current Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.currentProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
                <h3 className="text-lg text-white">Past Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.pastProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform animate-pulse-glow">
                <h3 className="text-lg text-white">Tasks Completed</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.tasksCompleted}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 animate-fade-in">
          <div className="card glassmorphic">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Announcement</h2>
            <p className="text-white">{project?.announcement || 'No announcement'}</p>
            {isAdmin && (
              <div className="mt-4">
                <textarea
                  value={project?.announcement || ''}
                  onChange={(e) => handleUpdateProject({ announcement: e.target.value })}
                  className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  placeholder="Post an announcement..."
                />
              </div>
            )}
          </div>
        </section>

        <section className="mb-8 animate-fade-in">
          <div className="card glassmorphic">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Snapshot</h2>
            <p className="text-white">{project?.snapshot || 'No snapshot'}</p>
            {isAdmin && (
              <div className="mt-4">
                <input
                  type="text"
                  value={project?.snapshot || ''}
                  onChange={(e) => handleUpdateProject({ snapshot: e.target.value })}
                  className="w-full p-3 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  placeholder="Update the project snapshot..."
                />
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="card glassmorphic animate-fade-in">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Posts</h2>
            <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
              <div className="flex items-center space-x-3">
                <img
                  src={user?.profilePicture || 'https://via.placeholder.com/40'}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
                />
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="What's on your mind?"
                  className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              <div className="space-y-4">
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Add more details..."
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="p-2 rounded-lg bg-dark-navy text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  >
                    <option value="Announcement">Announcement</option>
                    <option value="Poll">Poll</option>
                    <option value="Picture">Picture</option>
                  </select>
                  <button onClick={handleAddPost} className="btn-primary px-6 py-2 neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                    Post
                  </button>
                </div>
              </div>
            </div>

            {(!project?.posts || project.posts.length === 0) ? (
              <p className="text-white">No posts yet.</p>
            ) : (
              <div className="space-y-6">
                {project.posts.map(post => (
                  <div key={post._id} className="card glassmorphic animate-fade-in p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <img
                        src={'https://via.placeholder.com/40'}
                        alt="Post Author"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="text-white font-medium">{post.userId}</p>
                        <p className="text-sm text-gray-300">{new Date(post.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <h3 className="text-lg font-display text-vibrant-pink mb-2">{post.title}</h3>
                    <p className="text-gray-300">{post.content}</p>
                    {post.category !== 'Announcement' && (
                      <p className="text-sm text-white mt-2">Category: {post.category}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-3 border-t border-gray-600 pt-3">
                      <button
                        onClick={() => handleLikePost(post._id)}
                        className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-1"
                      >
                        <span>Like</span>
                        <span>({post.likes || 0})</span>
                      </button>
                      <button
                        onClick={() => setShowComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                        className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                      >
                        Comment
                      </button>
                      <button
                        onClick={() => handleSharePost(post._id)}
                        className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                      >
                        Share
                      </button>
                    </div>
                    {showComments[post._id] && (
                      <div className="mt-4">
                        <h4 className="text-lg text-vibrant-pink mb-2">Comments</h4>
                        {(!post.comments || post.comments.length === 0) ? (
                          <p className="text-white">No comments yet.</p>
                        ) : (
                          post.comments.map((comment, idx) => (
                            <div key={idx} className="flex items-start space-x-3 mb-2">
                              <img
                                src={'https://via.placeholder.com/32'}
                                alt="Comment Author"
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="bg-gray-800 p-2 rounded-lg">
                                <p className="text-white font-medium">{comment.userId}</p>
                                <p className="text-gray-300">{comment.content}</p>
                                <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          ))
                        )}
                        <div className="flex items-center space-x-3 mt-3">
                          <img
                            src={user?.profilePicture || 'https://via.placeholder.com/32'}
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full"
                          />
                          <input
                            type="text"
                            value={newComment[post._id] || ''}
                            onChange={(e) => setNewComment({ ...newComment, [post._id]: e.target.value })}
                            placeholder="Write a comment..."
                            className="w-full p-2 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                          <button
                            onClick={() => handleAddPostComment(post._id)}
                            className="btn-primary px-4 py-1 neumorphic hover:scale-105 transition-transform"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="card glassmorphic animate-fade-in">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Tasks</h2>
            <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={user?.profilePicture || 'https://via.placeholder.com/40'}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full"
                  />
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                    placeholder="Add a new task..."
                    className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Description (Markdown Supported)</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Enter task description (e.g., **bold**, *italic*, - list item)"
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Attach File</label>
                  <input
                    type="file"
                    onChange={(e) => setNewTask({ ...newTask, file: e.target.files[0] })}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  />
                  {newTask.file && (
                    <p className="text-gray-300 mt-1">Selected: {newTask.file.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Assigned To</label>
                  <select
                    multiple
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: Array.from(e.target.selectedOptions, option => option.value) })}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  >
                    {(project?.sharedWith || []).map(userId => (
                      <option key={userId} value={userId}>{userId}</option>
                    ))}
                    {(project?.teams || []).map(team => (
                      <option key={`team-${team._id}`} value={`team-${team._id}`}>{team.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                  Add Task
                </button>
              </form>
            </div>

            {(!project?.tasks || project.tasks.length === 0) ? (
              <p className="text-white">No tasks yet.</p>
            ) : (
              <div className="space-y-6">
                {project.tasks.map(task => (
                  <div key={task._id} className="card glassmorphic animate-fade-in p-4">
                    {editTask && editTask._id === task._id ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user?.profilePicture || 'https://via.placeholder.com/40'}
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full"
                          />
                          <input
                            type="text"
                            value={editTask.title}
                            onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                            className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Description (Markdown Supported)</label>
                          <textarea
                            value={editTask.description}
                            onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Attach File</label>
                          <input
                            type="file"
                            onChange={(e) => setEditTask({ ...editTask, file: e.target.files[0] })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                          {editTask.file && (
                            <p className="text-gray-300 mt-1">Selected: {editTask.file.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Due Date</label>
                          <input
                            type="date"
                            value={editTask.dueDate}
                            onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Priority</label>
                          <select
                            value={editTask.priority}
                            onChange={(e) => setEditTask({ ...editTask, priority: e.target.value })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Assigned To</label>
                          <select
                            multiple
                            value={editTask.assignedTo}
                            onChange={(e) => setEditTask({ ...editTask, assignedTo: Array.from(e.target.selectedOptions, option => option.value) })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          >
                            {(project?.sharedWith || []).map(userId => (
                              <option key={userId} value={userId}>{userId}</option>
                            ))}
                            {(project?.teams || []).map(team => (
                              <option key={`team-${team._id}`} value={`team-${team._id}`}>{team.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Status</label>
                          <select
                            value={editTask.status}
                            onChange={(e) => setEditTask({ ...editTask, status: e.target.value })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUpdateTask(task._id, editTask)}
                            className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditTask(null)}
                            className="btn-secondary neumorphic hover:scale-105 transition-transform"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={'https://via.placeholder.com/40'}
                            alt="Task Creator"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <p className="text-white font-medium">{task.userId}</p>
                            <p className="text-sm text-gray-300">{new Date(task.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <h3 className="text-lg font-display text-vibrant-pink">{task.title}</h3>
                        <p className="text-gray-300 mt-2">{task.description}</p>
                        {task.fileUrl && (
                          <div className="mt-4">
                            <a
                              href={task.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-vibrant-pink hover:text-neon-blue transition-colors"
                            >
                              View Attached File
                            </a>
                          </div>
                        )}
                        <p className="text-sm text-white mt-2">Status: {task.status}</p>
                        <p className="text-sm text-white">Due Date: {task.dueDate || 'Not set'}</p>
                        <p className="text-sm text-white">Priority: {task.priority || 'Medium'}</p>
                        <p className="text-sm text-white">Assigned To: {task.assignedTo || 'None'}</p>
                        <p className="text-sm text-white">Likes: {task.likes || 0}</p>
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                          className="w-full mt-3 p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <div className="flex space-x-3 mt-3">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleLikeTask(task._id)}
                            className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                          >
                            Like
                          </button>
                          <button
                            onClick={() => handleShareTask(task._id)}
                            className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                          >
                            Share
                          </button>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-lg text-vibrant-pink">Subtasks</h4>
                          {(!task.subtasks || task.subtasks.length === 0) ? (
                            <p className="text-white">No subtasks yet.</p>
                          ) : (
                            task.subtasks.map((subtask, idx) => (
                              <div key={idx} className="ml-4 mt-2 card glassmorphic p-3">
                                <div className="flex items-center space-x-3 mb-2">
                                  <img
                                    src={'https://via.placeholder.com/32'}
                                    alt="Subtask Creator"
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div>
                                    <p className="text-white font-medium">{subtask.userId}</p>
                                    <p className="text-xs text-gray-300">{new Date(subtask.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                <p className="text-gray-300">{subtask.title} - {subtask.status}</p>
                                <p className="text-sm text-gray-300">{subtask.description}</p>
                                <p className="text-sm text-white mt-1">Likes: {subtask.likes || 0}</p>
                                <div className="flex space-x-3 mt-2">
                                  <button
                                    onClick={() => handleLikeSubtask(task._id, subtask._id)}
                                    className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                                  >
                                    Like
                                  </button>
                                </div>
                                <div className="mt-2">
                                  <h5 className="text-sm text-vibrant-pink">Comments</h5>
                                  {(!subtask.comments || subtask.comments.length === 0) ? (
                                    <p className="text-white text-sm">No comments yet.</p>
                                  ) : (
                                    subtask.comments.map((comment, cIdx) => (
                                      <div key={cIdx} className="flex items-start space-x-2 mt-1">
                                        <img
                                          src={'https://via.placeholder.com/24'}
                                          alt="Comment Author"
                                          className="w-6 h-6 rounded-full"
                                        />
                                        <div className="bg-gray-800 p-1 rounded-lg">
                                          <p className="text-white text-sm font-medium">{comment.userId}</p>
                                          <p className="text-gray-300 text-sm">{comment.content}</p>
                                          <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <img
                                      src={user?.profilePicture || 'https://via.placeholder.com/24'}
                                      alt="User Avatar"
                                      className="w-6 h-6 rounded-full"
                                    />
                                    <input
                                      type="text"
                                      value={subtaskComment[subtask._id] || ''}
                                      onChange={(e) => setSubtaskComment({ ...subtaskComment, [subtask._id]: e.target.value })}
                                      placeholder="Add a comment..."
                                      className="w-full p-1 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                    />
                                    <button
                                      onClick={() => handleAddSubtaskComment(task._id, subtask._id)}
                                      className="btn-primary text-sm neumorphic hover:scale-105 transition-transform"
                                    >
                                      Post
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                          <div className="mt-3 ml-4 space-y-3">
                            <input
                              type="text"
                              placeholder="Subtask Title"
                              value={newSubtask[task._id]?.title || ''}
                              onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], title: e.target.value } })}
                              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              value={newSubtask[task._id]?.description || ''}
                              onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], description: e.target.value } })}
                              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                            />
                            <select
                              value={newSubtask[task._id]?.status || 'To Do'}
                              onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], status: e.target.value } })}
                              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                            <button
                              onClick={() => handleAddSubtask(task._id)}
                              className="btn-primary mt-2 neumorphic hover:scale-105 transition-transform"
                            >
                              Add Subtask
                              </button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h4 className="text-lg text-vibrant-pink">Comments</h4>
                          {(!task.comments || task.comments.length === 0) ? (
                            <p className="text-white">No comments yet.</p>
                          ) : (
                            task.comments.map((comment, idx) => (
                              <div key={idx} className="flex items-start space-x-3 mb-2">
                                <img
                                  src={'https://via.placeholder.com/32'}
                                  alt="Comment Author"
                                  className="w-8 h-8 rounded-full"
                                />
                                <div className="bg-gray-800 p-2 rounded-lg">
                                  <p className="text-white font-medium">{comment.userId}</p>
                                  <p className="text-gray-300">{comment.content}</p>
                                  <p className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                          <div className="flex items-center space-x-3 mt-3">
                            <img
                              src={user?.profilePicture || 'https://via.placeholder.com/32'}
                              alt="User Avatar"
                              className="w-8 h-8 rounded-full"
                            />
                            <input
                              type="text"
                              value={taskComment[task._id] || ''}
                              onChange={(e) => setTaskComment({ ...taskComment, [task._id]: e.target.value })}
                              placeholder="Add a comment..."
                              className="w-full p-2 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                            />
                            <button
                              onClick={() => handleAddTaskComment(task._id)}
                              className="btn-primary px-4 py-1 neumorphic hover:scale-105 transition-transform"
                            >
                              Post
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-8">
          <div className="card glassmorphic animate-fade-in">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Project Members</h2>
            <div className="space-y-4">
              {[...(project?.admins || []), ...(project?.sharedWith || [])].length === 0 ? (
                <p className="text-white">No members yet.</p>
              ) : (
                [...new Set([...(project?.admins || []), ...(project?.sharedWith || [])])].map(memberId => (
                  <div key={memberId} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow">
                    <div className="flex items-center space-x-3">
                      <img
                        src={'https://via.placeholder.com/40'}
                        alt="Member Avatar"
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h3 className="text-lg font-display text-vibrant-pink">{memberId}</h3>
                        <p className="text-sm text-white">Role: {project?.admins?.includes(memberId) ? 'Admin' : 'Member'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="card glassmorphic animate-fade-in">
            <h2 className="text-2xl font-display text-vibrant-pink mb-4">Teams</h2>
            {isAdmin && (
              <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
                <form onSubmit={handleAddTeam} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profilePicture || 'https://via.placeholder.com/40'}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <input
                      type="text"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      required
                      placeholder="Team Name"
                      className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Description</label>
                    <textarea
                      value={newTeam.description}
                      onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                      required
                      placeholder="Team Description"
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Members</label>
                    <select
                      multiple
                      value={newTeam.members}
                      onChange={(e) => setNewTeam({ ...newTeam, members: Array.from(e.target.selectedOptions, option => option.value) })}
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    >
                      {(project?.sharedWith || []).map(userId => (
                        <option key={userId} value={userId}>{userId}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                    Add Team
                  </button>
                </form>
              </div>
            )}

            {(!project?.teams || project.teams.length === 0) ? (
              <p className="text-white">No teams yet.</p>
            ) : (
              <div className="space-y-4">
                {project.teams.map(team => (
                  <div key={team._id} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow p-4">
                    {editTeam && editTeam._id === team._id ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user?.profilePicture || 'https://via.placeholder.com/40'}
                            alt="User Avatar"
                            className="w-10 h-10 rounded-full"
                          />
                          <input
                            type="text"
                            value={editTeam.name}
                            onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                            className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Description</label>
                          <textarea
                            value={editTeam.description}
                            onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium">Members</label>
                          <select
                            multiple
                            value={editTeam.members}
                            onChange={(e) => setEditTeam({ ...editTeam, members: Array.from(e.target.selectedOptions, option => option.value) })}
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          >
                            {(project?.sharedWith || []).map(userId => (
                              <option key={userId} value={userId}>{userId}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleUpdateTeam(team._id, editTeam)}
                            className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditTeam(null)}
                            className="btn-secondary neumorphic hover:scale-105 transition-transform"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <img
                            src={'https://via.placeholder.com/40'}
                            alt="Team Icon"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h3 className="text-lg font-display text-vibrant-pink">{team.name}</h3>
                            <p className="text-gray-300 mt-2">{team.description}</p>
                            <p className="text-sm text-white mt-2">Members: {team.members?.join(', ') || 'None'}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors mt-3"
                          >
                            Edit Team
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Sidebar with Tabs */}
      <div className="md:col-span-2">
        <div className="card glassmorphic animate-fade-in mb-8">
          <div className="flex space-x-4 border-b border-gray-600">
            <button
              onClick={() => setActiveTab('activity')}
              className={`p-3 ${activeTab === 'activity' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`p-3 ${activeTab === 'files' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors`}
            >
              Files
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-3 ${activeTab === 'settings' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors`}
            >
              Settings
            </button>
          </div>

          {activeTab === 'activity' && (
            <div className="pt-4">
              <h2 className="text-2xl font-display text-vibrant-pink mb-4">Activity Log</h2>
              <div className="mb-4">
                <label className="block text-white mb-2 font-medium">Filter Activity</label>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                >
                  <option value="all">All</option>
                  <option value="tasks">Tasks</option>
                  <option value="posts">Posts</option>
                  <option value="files">Files</option>
                  <option value="shares">Shares</option>
                  <option value="teams">Teams</option>
                </select>
              </div>
              {filteredActivityLog.length === 0 ? (
                <p className="text-white">No activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {filteredActivityLog.map((activity, idx) => (
                    <div key={idx} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={'https://via.placeholder.com/32'}
                          alt="Activity Icon"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-white">{activity.details}</p>
                          <p className="text-sm text-gray-300">By: {activity.userId}</p>
                          <p className="text-sm text-gray-300">{new Date(activity.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="pt-4">
              <h2 className="text-2xl font-display text-vibrant-pink mb-4">Files</h2>
              <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
                <form onSubmit={handleAddFile} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profilePicture || 'https://via.placeholder.com/40'}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <input
                      type="text"
                      value={newFile.name}
                      onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                      required
                      placeholder="File Name"
                      className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">File URL</label>
                    <input
                      type="text"
                      value={newFile.url}
                      onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                      required
                      placeholder="File URL"
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                    Add File
                  </button>
                </form>
                <form onSubmit={handleRequestFile} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profilePicture || 'https://via.placeholder.com/40'}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <input
                      type="text"
                      value={newFile.name}
                      onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                      required
                      placeholder="Request File Name"
                      className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Request File URL</label>
                    <input
                      type="text"
                      value={newFile.url}
                      onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                      required
                      placeholder="Request File URL"
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <button type="submit" className="btn-secondary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                    Request File
                  </button>
                </form>
              </div>

              {(!project?.files || project.files.length === 0) ? (
                <p className="text-white">No files yet.</p>
              ) : (
                <div className="space-y-4">
                  {project.files.map(file => (
                    <div key={file._id} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={'https://via.placeholder.com/32'}
                          alt="File Icon"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h3 className="text-lg font-display text-vibrant-pink">{file.name}</h3>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors"
                          >
                            Open File
                          </a>
                          <p className="text-sm text-white mt-2">Uploaded by: {file.uploadedBy}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="pt-4">
              <h2 className="text-2xl font-display text-vibrant-pink mb-4">Project Settings</h2>
              <button
                onClick={() => setShowShareModal(true)}
                className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow mb-4"
              >
                Share Project
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow"
              >
                Update Notification Preferences
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowShareModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="modal glassmorphic p-6">
              <h2 className="text-2xl font-display text-vibrant-pink mb-6">Share Project</h2>
              <div className="mb-6">
                <label className="block text-white mb-3 font-medium">User ID to Share With</label>
                <input
                  type="text"
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                />
              </div>
              <div className="flex space-x-3">
                <button onClick={handleShareProject} className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                  Share
                </button>
                <button onClick={handleRequestShare} className="btn-secondary neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                  Request Share
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="btn-secondary neumorphic hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowSettingsModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="modal glassmorphic p-6">
              <h2 className="text-2xl font-display text-vibrant-pink mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.email}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-white">Email Notifications</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.sms}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, sms: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-white">SMS Notifications</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.push}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
                    className="mr-2"
                  />
                  <label className="text-white">Push Notifications</label>
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Notify me about:</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.tasks}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, tasks: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-white">Task Updates</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.posts}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, posts: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-white">Post Updates</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.files}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, files: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-white">File Updates</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.shares}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, shares: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-white">Share Requests</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.teams}
                      onChange={(e) => setNotificationPrefs({ ...notificationPrefs, teams: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-white">Team Updates</label>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button onClick={handleUpdateNotificationPrefs} className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow">
                  Save
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-secondary neumorphic hover:scale-105 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectHome;