import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, updateProject, addPost, addPostComment, likePost, addTask, updateTask, addSubtask, addTaskComment, likeTask, addTeam, addFile, requestFile, shareProject, requestShare, updateNotificationPreferences, getUserDetails } from '../utils/api';

const ProjectHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({ totalProjects: 0, currentProjects: 0, pastProjects: 0, tasksCompleted: 0 });
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Announcement' });
  const [newComment, setNewComment] = useState({});
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: [] });
  const [editTask, setEditTask] = useState(null);
  const [newSubtask, setNewSubtask] = useState({});
  const [taskComment, setTaskComment] = useState({});
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: [] });
  const [newFile, setNewFile] = useState({ name: '', url: '' });
  const [shareUserId, setShareUserId] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user details
        try {
          console.log('Fetching user details...');
          const userData = await getUserDetails();
          setUser(userData);
          setNotificationPrefs(userData.notificationPreferences || []);
        } catch (err) {
          console.error('Failed to fetch user details:', err.message);
          if (err.message.includes('Invalid token')) {
            localStorage.removeItem('token');
            navigate('/login', { replace: true });
            return;
          }
          setError('Failed to load user data.');
        }

        // Fetch project details
        try {
          console.log('Fetching project details...');
          const projectData = await getProject(id);
          setProject(projectData);

          const initialComments = {};
          const initialSubtasks = {};
          projectData.posts.forEach(post => {
            initialComments[post._id] = '';
          });
          projectData.tasks.forEach(task => {
            initialComments[task._id] = '';
            initialSubtasks[task._id] = { title: '', description: '', status: 'To Do' };
          });
          setNewComment(initialComments);
          setTaskComment(initialComments);
          setNewSubtask(initialSubtasks);
        } catch (err) {
          console.error('Failed to fetch project details:', err.message);
          setError('Failed to load project details.');
        }

        // Skip getProjectMetrics due to consistent failure
        setMetrics({ totalProjects: 0, currentProjects: 0, pastProjects: 0, tasksCompleted: 0 });
      } catch (err) {
        console.error('ProjectHome unexpected error:', err.message);
        setError('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleUpdateProject = async (updateData) => {
    try {
      const updatedProject = await updateProject(id, updateData);
      setProject(updatedProject);
    } catch (err) {
      setError(`Failed to update project: ${err.message}`);
      console.error('Update project error:', err.message);
    }
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await addPost(id, newPost);
      setProject(updatedProject);
      setNewComment({ ...newComment, [updatedProject.posts[updatedProject.posts.length - 1]._id]: '' });
      setNewPost({ title: '', content: '', category: 'Announcement' });

      // Log the action in activity log
      const newActivity = {
        action: 'post_added',
        details: `Added post: ${newPost.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(project?.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add post: ${err.message}`);
      console.error('Add post error:', err.message);
    }
  };

  const handleAddPostComment = async (postId) => {
    try {
      const updatedProject = await addPostComment(id, postId, { content: newComment[postId] || '' });
      setProject(updatedProject);
      setNewComment({ ...newComment, [postId]: '' });

      // Log the action in activity log
      const post = updatedProject.posts.find(p => p._id === postId);
      const newActivity = {
        action: 'post_commented',
        details: `Commented on post: ${post.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add comment: ${err.message}`);
      console.error('Add post comment error:', err.message);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const updatedProject = await likePost(id, postId);
      setProject(updatedProject);

      // Log the action in activity log
      const post = updatedProject.posts.find(p => p._id === postId);
      const newActivity = {
        action: 'post_liked',
        details: `Liked post: ${post.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to like post: ${err.message}`);
      console.error('Like post error:', err.message);
    }
  };

  const handleSharePost = async (postId) => {
    try {
      const post = project.posts.find(p => p._id === postId);
      const newActivity = {
        action: 'post_shared',
        details: `Shared post: ${post.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(project.activityLog || []), newActivity] });
      setProject(prev => ({
        ...prev,
        activityLog: [...(prev.activityLog || []), newActivity],
      }));
    } catch (err) {
      setError(`Failed to share post: ${err.message}`);
      console.error('Share post error:', err.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await addTask(id, newTask);
      setProject(updatedProject);
      setTaskComment({ ...taskComment, [updatedProject.tasks[updatedProject.tasks.length - 1]._id]: '' });
      setNewSubtask({ ...newSubtask, [updatedProject.tasks[updatedProject.tasks.length - 1]._id]: { title: '', description: '', status: 'To Do' } });
      setNewTask({ title: '', description: '', assignedTo: [] });

      // Log the action in activity log
      const newActivity = {
        action: 'task_added',
        details: `Added task: ${newTask.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add task: ${err.message}`);
      console.error('Add task error:', err.message);
    }
  };

  const handleEditTask = (task) => {
    setEditTask({ ...task, assignedTo: task.assignedTo || [] });
  };

  const handleUpdateTask = async (taskId, updateData) => {
    try {
      const updatedProject = await updateTask(id, taskId, updateData);
      setProject(updatedProject);
      setEditTask(null);

      // Log the action in activity log
      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_updated',
        details: `Updated task: ${task.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
      console.error('Update task error:', err.message);
    }
  };

  const handleAddSubtask = async (taskId) => {
    try {
      const subtaskData = newSubtask[taskId] || { title: '', description: '', status: 'To Do' };
      const updatedProject = await addSubtask(id, taskId, subtaskData);
      setProject(updatedProject);
      setNewSubtask({ ...newSubtask, [taskId]: { title: '', description: '', status: 'To Do' } });

      // Log the action in activity log
      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'subtask_added',
        details: `Added subtask to task: ${task.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add subtask: ${err.message}`);
      console.error('Add subtask error:', err.message);
    }
  };

  const handleAddTaskComment = async (taskId) => {
    try {
      const updatedProject = await addTaskComment(id, taskId, { content: taskComment[taskId] || '' });
      setProject(updatedProject);
      setTaskComment({ ...taskComment, [taskId]: '' });

      // Log the action in activity log
      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_commented',
        details: `Commented on task: ${task.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add task comment: ${err.message}`);
      console.error('Add task comment error:', err.message);
    }
  };

  const handleLikeTask = async (taskId) => {
    try {
      const updatedProject = await likeTask(id, taskId);
      setProject(updatedProject);

      // Log the action in activity log
      const task = updatedProject.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_liked',
        details: `Liked task: ${task.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to like task: ${err.message}`);
      console.error('Like task error:', err.message);
    }
  };

  const handleShareTask = async (taskId) => {
    try {
      const task = project.tasks.find(t => t._id === taskId);
      const newActivity = {
        action: 'task_shared',
        details: `Shared task: ${task.title}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(project.activityLog || []), newActivity] });
      setProject(prev => ({
        ...prev,
        activityLog: [...(prev.activityLog || []), newActivity],
      }));
    } catch (err) {
      setError(`Failed to share task: ${err.message}`);
      console.error('Share task error:', err.message);
    }
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await addTeam(id, newTeam);
      setProject(updatedProject);
      setNewTeam({ name: '', description: '', members: [] });

      // Log the action in activity log
      const newActivity = {
        action: 'team_added',
        details: `Added team: ${newTeam.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add team: ${err.message}`);
      console.error('Add team error:', err.message);
    }
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await addFile(id, newFile);
      setProject(updatedProject);
      setNewFile({ name: '', url: '' });

      // Log the action in activity log
      const newActivity = {
        action: 'file_added',
        details: `Added file: ${newFile.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to add file: ${err.message}`);
      console.error('Add file error:', err.message);
    }
  };

  const handleRequestFile = async (e) => {
    e.preventDefault();
    try {
      await requestFile(id, newFile);
      setNewFile({ name: '', url: '' });

      // Log the action in activity log
      const newActivity = {
        action: 'file_requested',
        details: `Requested to add file: ${newFile.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(project?.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to request file: ${err.message}`);
      console.error('Request file error:', err.message);
    }
  };

  const handleShareProject = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await shareProject(id, shareUserId);
      setProject(updatedProject);
      setShareUserId('');
      setShowShareModal(false);

      // Log the action in activity log
      const newActivity = {
        action: 'project_shared',
        details: `Shared project with user: ${shareUserId}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(updatedProject.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to share project: ${err.message}`);
      console.error('Share project error:', err.message);
    }
  };

  const handleRequestShare = async (e) => {
    e.preventDefault();
    try {
      await requestShare(id, shareUserId);
      setShareUserId('');
      setShowShareModal(false);

      // Log the action in activity log
      const newActivity = {
        action: 'share_requested',
        details: `Requested to share project with user: ${shareUserId}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      await updateProject(id, { activityLog: [...(project?.activityLog || []), newActivity] });
    } catch (err) {
      setError(`Failed to request share: ${err.message}`);
      console.error('Request share error:', err.message);
    }
  };

  const handleUpdateNotificationPrefs = async () => {
    try {
      await updateNotificationPreferences(notificationPrefs);
      setShowSettingsModal(false);
    } catch (err) {
      setError(`Failed to update notification preferences: ${err.message}`);
      console.error('Update notification preferences error:', err.message);
    }
  };

  const filteredActivityLog = project?.activityLog?.filter(activity => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'tasks') return activity.action.includes('task');
    if (activityFilter === 'posts') return activity.action.includes('post');
    if (activityFilter === 'files') return activity.action.includes('file');
    if (activityFilter === 'shares') return activity.action.includes('share');
    if (activityFilter === 'teams') return activity.action.includes('team');
    return false;
  }) || [];

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  const isAdmin = project && user && project.admins.includes(user.id);

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
      {/* Center Content */}
      <div className="md:col-span-2">
        <header className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-display text-vibrant-pink">{project?.title || 'Project'}</h1>
          <p className="text-white mt-2">{project?.description || 'No description'}</p>
          <p className="text-sm text-white">Category: {project?.category || 'N/A'}</p>
          <p className="text-sm text-white">Status: {project?.status || 'N/A'}</p>
        </header>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Project Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Total Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.totalProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Current Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.currentProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Past Projects</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.pastProjects}</p>
              </div>
              <div className="bg-dark-navy p-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 className="text-lg text-white">Tasks Completed</h3>
                <p className="text-2xl font-bold text-vibrant-pink">{metrics.tasksCompleted}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Announcement</h2>
            <p className="text-white">{project?.announcement || 'No announcement'}</p>
            {isAdmin && (
              <div className="mt-2">
                <textarea
                  value={project?.announcement || ''}
                  onChange={(e) => handleUpdateProject({ announcement: e.target.value })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </section>

        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Snapshot</h2>
            <p className="text-white">{project?.snapshot || 'No snapshot'}</p>
            {isAdmin && (
              <div className="mt-2">
                <input
                  type="text"
                  value={project?.snapshot || ''}
                  onChange={(e) => handleUpdateProject({ snapshot: e.target.value })}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="card animate-fade-in">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Posts</h2>
            <form onSubmit={handleAddPost} className="mb-4">
              <div className="mb-2">
                <label className="block text-white mb-1">Title</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-white mb-1">Content</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  required
                />
              </div>
              <div className="mb-2">
                <label className="block text-white mb-1">Category</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Poll">Poll</option>
                  <option value="Picture">Picture</option>
                </select>
              </div>
              <button type="submit" className="btn-primary w-full">
                Add Post
              </button>
            </form>

            {project?.posts.length === 0 ? (
              <p className="text-white">No posts yet.</p>
            ) : (
              <div className="space-y-4">
                {project.posts.map(post => (
                  <div key={post._id} className="card transform hover:scale-105 transition-transform">
                    <h3 className="text-lg font-display text-vibrant-pink">{post.title}</h3>
                    <p className="text-gray-300">{post.content}</p>
                    <p className="text-sm text-white">Category: {post.category}</p>
                    <p className="text-sm text-white">Posted by: {post.userId}</p>
                    <p className="text-sm text-white">Likes: {post.likes}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLikePost(post._id)}
                        className="text-vibrant-pink hover:underline"
                      >
                        Like
                      </button>
                      <button
                        onClick={() => handleSharePost(post._id)}
                        className="text-vibrant-pink hover:underline"
                      >
                        Share
                      </button>
                    </div>
                    <div className="mt-2">
                      <h4 className="text-lg text-vibrant-pink">Comments</h4>
                      {post.comments.map((comment, idx) => (
                        <div key={idx} className="text-gray-300">
                          <p>{comment.content} - by {comment.userId}</p>
                        </div>
                      ))}
                      <input
                        type="text"
                        value={newComment[post._id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [post._id]: e.target.value })}
                        placeholder="Add a comment..."
                        className="w-full mt-2"
                      />
                      <button
                        onClick={() => handleAddPostComment(post._id)}
                        className="btn-primary mt-2"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="card animate-fade-in">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Tasks</h2>
            {isAdmin && (
              <form onSubmit={handleAddTask} className="mb-4">
                <div className="mb-2">
                  <label className="block text-white mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">Assigned To</label>
                  <select
                    multiple
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: Array.from(e.target.selectedOptions, option => option.value) })}
                    className="w-full"
                  >
                    {project?.sharedWith.map(userId => (
                      <option key={userId} value={userId}>{userId}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full">
                  Add Task
                </button>
              </form>
            )}

            {project?.tasks.length === 0 ? (
              <p className="text-white">No tasks yet.</p>
            ) : (
              <div className="space-y-4">
                {project.tasks.map(task => (
                  <div key={task._id} className="card transform hover:scale-105 transition-transform">
                    {editTask && editTask._id === task._id ? (
                      <div>
                        <div className="mb-2">
                          <label className="block text-white mb-1">Title</label>
                          <input
                            type="text"
                            value={editTask.title}
                            onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-white mb-1">Description</label>
                          <textarea
                            value={editTask.description}
                            onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div className="mb-2">
                          <label className="block text-white mb-1">Status</label>
                          <select
                            value={editTask.status}
                            onChange={(e) => setEditTask({ ...editTask, status: e.target.value })}
                            className="w-full"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="block text-white mb-1">Assigned To</label>
                          <select
                            multiple
                            value={editTask.assignedTo}
                            onChange={(e) => setEditTask({ ...editTask, assignedTo: Array.from(e.target.selectedOptions, option => option.value) })}
                            className="w-full"
                          >
                            {project?.sharedWith.map(userId => (
                              <option key={userId} value={userId}>{userId}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleUpdateTask(task._id, editTask)}
                          className="btn-primary mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditTask(null)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-display text-vibrant-pink">{task.title}</h3>
                        <p className="text-gray-300">{task.description}</p>
                        <p className="text-sm text-white">Status: {task.status}</p>
                        <p className="text-sm text-white">Assigned To: {task.assignedTo.join(', ') || 'None'}</p>
                        <p className="text-sm text-white">Likes: {task.likes}</p>
                        {(task.assignedTo.includes(user?.id) || isAdmin) && (
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateTask(task._id, { status: e.target.value })}
                            className="w-full mt-2"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        )}
                        <div className="flex space-x-2 mt-2">
                          {isAdmin && (
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-vibrant-pink hover:underline"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleLikeTask(task._id)}
                            className="text-vibrant-pink hover:underline"
                          >
                            Like
                          </button>
                          <button
                            onClick={() => handleShareTask(task._id)}
                            className="text-vibrant-pink hover:underline"
                          >
                            Share
                          </button>
                        </div>
                        <div className="mt-2">
                          <h4 className="text-lg text-vibrant-pink">Subtasks</h4>
                          {task.subtasks.map((subtask, idx) => (
                            <div key={idx} className="text-gray-300">
                              <p>{subtask.title} - {subtask.status}</p>
                            </div>
                          ))}
                          {isAdmin && (
                            <div className="mt-2">
                              <input
                                type="text"
                                placeholder="Subtask Title"
                                value={newSubtask[task._id]?.title || ''}
                                onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], title: e.target.value } })}
                                className="w-full"
                              />
                              <input
                                type="text"
                                placeholder="Description"
                                value={newSubtask[task._id]?.description || ''}
                                onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], description: e.target.value } })}
                                className="w-full mt-2"
                              />
                              <select
                                value={newSubtask[task._id]?.status || 'To Do'}
                                onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], status: e.target.value } })}
                                className="w-full mt-2"
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <button
                                onClick={() => handleAddSubtask(task._id)}
                                className="btn-primary mt-2"
                              >
                                Add Subtask
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <h4 className="text-lg text-vibrant-pink">Comments</h4>
                          {task.comments.map((comment, idx) => (
                            <div key={idx} className="text-gray-300">
                              <p>{comment.content} - by {comment.userId}</p>
                            </div>
                          ))}
                          <input
                            type="text"
                            value={taskComment[task._id] || ''}
                            onChange={(e) => setTaskComment({ ...taskComment, [task._id]: e.target.value })}
                            placeholder="Add a comment..."
                            className="w-full mt-2"
                          />
                          <button
                            onClick={() => handleAddTaskComment(task._id)}
                            className="btn-primary mt-2"
                          >
                            Comment
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="card animate-fade-in">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Teams</h2>
            {isAdmin && (
              <form onSubmit={handleAddTeam} className="mb-4">
                <div className="mb-2">
                  <label className="block text-white mb-1">Team Name</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">Description</label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">Members</label>
                  <select
                    multiple
                    value={newTeam.members}
                    onChange={(e) => setNewTeam({ ...newTeam, members: Array.from(e.target.selectedOptions, option => option.value) })}
                    className="w-full"
                  >
                    {project?.sharedWith.map(userId => (
                      <option key={userId} value={userId}>{userId}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full">
                  Add Team
                </button>
              </form>
            )}

            {project?.teams.length === 0 ? (
              <p className="text-white">No teams yet.</p>
            ) : (
              <div className="space-y-4">
                {project.teams.map(team => (
                  <div key={team._id} className="card transform hover:scale-105 transition-transform">
                    <h3 className="text-lg font-display text-vibrant-pink">{team.name}</h3>
                    <p className="text-gray-300">{team.description}</p>
                    <p className="text-sm text-white">Members: {team.members.join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="card animate-fade-in">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Files</h2>
            {isAdmin ? (
              <form onSubmit={handleAddFile} className="mb-4">
                <div className="mb-2">
                  <label className="block text-white mb-1">File Name</label>
                  <input
                    type="text"
                    value={newFile.name}
                    onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">File URL</label>
                  <input
                    type="text"
                    value={newFile.url}
                    onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Add File
                </button>
              </form>
            ) : (
              <form onSubmit={handleRequestFile} className="mb-4">
                <div className="mb-2">
                  <label className="block text-white mb-1">File Name</label>
                  <input
                    type="text"
                    value={newFile.name}
                    onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="block text-white mb-1">File URL</label>
                  <input
                    type="text"
                    value={newFile.url}
                    onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full">
                  Request File Addition
                </button>
              </form>
            )}

            {project?.files.length === 0 ? (
              <p className="text-white">No files yet.</p>
            ) : (
              <div className="space-y-4">
                {project.files.map(file => (
                  <div key={file._id} className="card transform hover:scale-105 transition-transform">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-vibrant-pink hover:underline">
                      {file.name}
                    </a>
                    <p className="text-sm text-white">Uploaded by: {file.uploadedBy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="card animate-fade-in">
            <h2 className="text-xl font-display text-vibrant-pink mb-4">Activity Log</h2>
            <div className="mb-4">
              <label className="block text-white mb-1">Filter:</label>
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-full"
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
              <p className="text-white">No activities yet.</p>
            ) : (
              <div className="space-y-4">
                {filteredActivityLog.map((activity, idx) => (
                  <div key={idx} className="card transform hover:scale-105 transition-transform">
                    <p className="text-white">{activity.action}: {activity.details}</p>
                    <p className="text-sm text-gray-300">By: {activity.userId} at {new Date(activity.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mb-6 animate-fade-in">
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-primary w-full"
          >
            Share Project
          </button>
          {showShareModal && (
            <>
              <div className="modal-overlay" onClick={() => setShowShareModal(false)}></div>
              <div className="modal">
                <h2 className="text-2xl font-display text-vibrant-pink mb-4">Share Project</h2>
                <form onSubmit={isAdmin ? handleShareProject : handleRequestShare}>
                  <div className="mb-4">
                    <label className="block text-white mb-1">User ID to Share With</label>
                    <input
                      type="text"
                      value={shareUserId}
                      onChange={(e) => setShareUserId(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary mr-2">
                    {isAdmin ? 'Share' : 'Request Share'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </>
          )}
        </section>

        <section className="mb-6 animate-fade-in">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-primary w-full"
          >
            Notification Settings
          </button>
          {showSettingsModal && (
            <>
              <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}></div>
              <div className="modal">
                <h2 className="text-2xl font-display text-vibrant-pink mb-4">Notification Settings</h2>
                <div className="mb-4">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes('email_task_completion')}
                      onChange={() => {
                        const updatedPrefs = notificationPrefs.includes('email_task_completion')
                          ? notificationPrefs.filter(pref => pref !== 'email_task_completion')
                          : [...notificationPrefs, 'email_task_completion'];
                        setNotificationPrefs(updatedPrefs);
                      }}
                      className="mr-2"
                    />
                    Email on Task Completion
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes('email_new_post')}
                      onChange={() => {
                        const updatedPrefs = notificationPrefs.includes('email_new_post')
                          ? notificationPrefs.filter(pref => pref !== 'email_new_post')
                          : [...notificationPrefs, 'email_new_post'];
                        setNotificationPrefs(updatedPrefs);
                      }}
                      className="mr-2"
                    />
                    Email on New Post
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes('email_file_request')}
                      onChange={() => {
                        const updatedPrefs = notificationPrefs.includes('email_file_request')
                          ? notificationPrefs.filter(pref => pref !== 'email_file_request')
                          : [...notificationPrefs, 'email_file_request'];
                        setNotificationPrefs(updatedPrefs);
                      }}
                      className="mr-2"
                    />
                    Email on File Request (Admins Only)
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes('email_share_request')}
                      onChange={() => {
                        const updatedPrefs = notificationPrefs.includes('email_share_request')
                          ? notificationPrefs.filter(pref => pref !== 'email_share_request')
                          : [...notificationPrefs, 'email_share_request'];
                        setNotificationPrefs(updatedPrefs);
                      }}
                      className="mr-2"
                    />
                    Email on Share Request (Admins Only)
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes('email_team_update')}
                      onChange={() => {
                        const updatedPrefs = notificationPrefs.includes('email_team_update')
                          ? notificationPrefs.filter(pref => pref !== 'email_team_update')
                          : [...notificationPrefs, 'email_team_update'];
                        setNotificationPrefs(updatedPrefs);
                      }}
                      className="mr-2"
                    />
                    Email on Team Updates
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.includes('email_activity_log')}
                      onChange={() => {
                        const updatedPrefs = notificationPrefs.includes('email_activity_log')
                          ? notificationPrefs.filter(pref => pref !== 'email_activity_log')
                          : [...notificationPrefs, 'email_activity_log'];
                        setNotificationPrefs(updatedPrefs);
                      }}
                      className="mr-2"
                    />
                    Email on Activity Log Updates
                  </label>
                </div>
                <button
                  onClick={handleUpdateNotificationPrefs}
                  className="btn-primary mr-2"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Right Sidebar */}
      <div className="md:col-span-1">
        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-2">Quick Actions</h2>
            <button
              onClick={() => navigate('/create-project')}
              className="btn-primary w-full mb-2"
            >
              Create New Project
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-primary w-full"
            >
              Share Project
            </button>
          </div>
        </section>

        <section className="mb-6 animate-fade-in">
          <div className="card">
            <h2 className="text-xl font-display text-vibrant-pink mb-2">Team Activity</h2>
            <p className="text-white">No recent updates.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProjectHome;