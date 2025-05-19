import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

// Helper function to render a simple task progress infographic
const TaskProgressInfographic = ({ tasks }) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="mt-4 p-4 bg-dark-navy rounded-lg shadow-inner flex justify-center">
      <div className="flex flex-col items-center">
        <h4 className="text-lg font-display text-vibrant-pink mb-2 flex items-center space-x-2">
          <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Task Progress</span>
        </h4>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 36 36">
            <path
              className="fill-none stroke-gray-800 stroke-2"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="fill-none stroke-neon-blue stroke-2"
              strokeDasharray={`${progressPercentage}, 100`}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="20" className="text-vibrant-pink text-sm font-bold" textAnchor="middle">{`${progressPercentage.toFixed(1)}%`}</text>
          </svg>
        </div>
        <p className="text-white mt-2 text-sm flex items-center space-x-2">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{completedTasks} of {totalTasks} tasks completed</span>
        </p>
      </div>
    </div>
  );
};

// Helper function to render a team contribution infographic (mock data for now)
const TeamContributionInfographic = ({ teams }) => {
  const mockContributions = teams.map((team, idx) => ({
    name: team.name,
    contributions: Math.floor(Math.random() * 50) + 10, // Mock data
  }));

  const maxContributions = Math.max(...mockContributions.map(c => c.contributions), 1);

  return (
    <div className="mt-4 p-4 bg-dark-navy rounded-lg shadow-inner">
      <h4 className="text-lg font-display text-vibrant-pink mb-4 flex items-center space-x-2">
        <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <span>Team Contributions</span>
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {mockContributions.map((team, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="fill-none stroke-gray-800 stroke-2"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="fill-none stroke-vibrant-pink stroke-2"
                  strokeDasharray={`${(team.contributions / maxContributions) * 100}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20" className="text-neon-blue text-xs font-bold" textAnchor="middle">{team.contributions}</text>
              </svg>
            </div>
            <span className="text-white text-sm mt-2 flex items-center space-x-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
              <span>{team.name}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [forceUpdate, setForceUpdate] = useState(0);
  const [teamMemberTab, setTeamMemberTab] = useState('teams'); // State for Teams/Members toggle
  const [showGrokSidebar, setShowGrokSidebar] = useState(false);
  const [grokQuery, setGrokQuery] = useState('');
  const [grokResponse, setGrokResponse] = useState('');
  const [grokError, setGrokError] = useState('');

  console.log('ProjectHome component rendered at', new Date().toISOString());
  console.log('User prop:', user);
  console.log('Project state:', project);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching project details for ID:', id);
        const projectData = await getProject(id);
        console.log('Project data:', projectData);
        setProject(projectData);
        console.log('Project state updated:', projectData);

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

  useEffect(() => {
    console.log('Project state changed:', project);
  }, [project]);

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
      if (!newPost.title.trim() || !newPost.content.trim()) {
        throw new Error('Post title and content are required.');
      }

      const postData = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category: newPost.category,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      console.log('Submitting post:', postData);
      const updatedProject = await addPost(id, postData);
      console.log('Updated project after adding post:', updatedProject);
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
      setError(`Failed to add post: ${err.message}. Please try again.`);
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
      const teamData = {
        ...newTeam,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await addTeam(id, teamData);
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

  const handleUpdateTeam = async (teamId) => {
    try {
      const updatedProject = await updateTeam(id, teamId, editTeam);
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
        name: newFile.name,
        url: newFile.url,
        uploadedBy: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
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
      const fileData = {
        name: newFile.name,
        url: newFile.url,
        requestedBy: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedProject = await requestFile(id, fileData);
      setProject(updatedProject);
      setNewFile({ name: '', url: '' });

      const newActivity = {
        action: 'file_requested',
        details: `Requested file: ${newFile.name}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'File requested', `A file "${newFile.name}" was requested in project "${updatedProject.title}" by ${user?.username}.`);
    } catch (err) {
      console.error('Request file error:', err.message);
      setError('Failed to request file. Please try again.');
    }
  };

  const handleShareProject = async () => {
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

  const handleRequestShare = async () => {
    try {
      const updatedProject = await requestShare(id, shareUserId);
      setProject(updatedProject);
      setShareUserId('');
      setShowShareModal(false);

      const newActivity = {
        action: 'share_requested',
        details: `Requested to share project with user: ${shareUserId}`,
        userId: user?.id || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      const updatedActivityLog = [...(updatedProject?.activityLog || []), newActivity];
      await updateProject(id, { activityLog: updatedActivityLog });

      await notifyMembers(updatedProject, 'Share requested', `A request to share project "${updatedProject.title}" with user ${shareUserId} was made by ${user?.username}.`);
    } catch (err) {
      console.error('Request share error:', err.message);
      setError('Failed to request share. Please try again.');
    }
  };

  const handleUpdateNotificationPrefs = async () => {
    try {
      await updateNotificationPreferences(notificationPrefs);
      setShowSettingsModal(false);
      if (typeof setUser === 'function') {
        setUser(prev => ({ ...prev, notificationPreferences: notificationPrefs }));
        localStorage.setItem('user', JSON.stringify({ ...user, notificationPreferences: notificationPrefs }));
      }
    } catch (err) {
      console.error('Update notification preferences error:', err.message);
      setError('Failed to update notification preferences. Please try again.');
    }
  };

  const notifyMembers = async (project, title, message) => {
    console.log('Notifying members:', { project, title, message });
  };

  const filteredActivityLog = (project?.activityLog || []).filter(activity => {
    if (activityFilter === 'all') return true;
    return activity.action.includes(activityFilter);
  });

  const handleGrokQuery = async (e) => {
    e.preventDefault();
    try {
      setGrokError('');
      setGrokResponse('');
      const context = {
        projectId: id,
        posts: project?.posts || [],
        tasks: project?.tasks || [],
        metrics: metrics,
      };
      const response = await mockGrokApi(grokQuery, context);
      setGrokResponse(response);
    } catch (err) {
      setGrokError('Failed to get a response from Grok. Please try again.');
      console.error('Grok API error:', err.message);
    }
  };

  const mockGrokApi = async (query, context) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Mock response from Grok: I analyzed the query "${query}" with context ${JSON.stringify(context)}. Here's a summary...`);
      }, 1000);
    });
  };

  const isAdmin = user?.role === 'admin' || project?.admins?.includes(user?.id);

  if (loading) {
    return (
      <div className="text-white text-center mt-10 flex items-center justify-center space-x-2 animate-shimmer">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-white text-center mt-10 flex items-center justify-center space-x-2">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-white text-center mt-10 flex items-center justify-center space-x-2">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span>Project not found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <nav className="bg-dark-navy p-4 flex justify-between items-center shadow-lg">
        <Link to="/" className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
          </svg>
          <h1 className="text-2xl font-display text-vibrant-pink">ShareSync</h1>
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/profile" className="text-white hover:text-vibrant-pink transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>Profile</span>
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              if (typeof setUser === 'function') setUser(null);
              navigate('/login');
            }}
            className="btn-secondary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span>Logout</span>
          </button>
          <Link to="/profile">
            <img
              src={user?.profilePicture || 'https://via.placeholder.com/40'}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-vibrant-pink"
              onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
            />
          </Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Posts Section - Moved to Top */}
          <section className="mb-8">
            <div className="card glassmorphic animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-display text-vibrant-pink flex items-center space-x-2">
                  <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L14.172 4.172z"></path>
                  </svg>
                  <span>[Updated] Project Posts Feed</span>
                </h2>
                <button
                  onClick={() => {
                    setGrokQuery('Summarize the posts in this project');
                    setShowGrokSidebar(true);
                  }}
                  className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <span>Ask Grok About Posts</span>
                </button>
              </div>
              <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
                <form onSubmit={handleAddPost} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profilePicture || 'https://via.placeholder.com/40'}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="w-full">
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L14.172 4.172z"></path>
                        </svg>
                        <span>Post Title</span>
                      </label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                        required
                        placeholder="Enter post title"
                        className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span>Post Content</span>
                    </label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      required
                      placeholder="What's on your mind?"
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                        </svg>
                        <span>Category</span>
                      </label>
                      <select
                        value={newPost.category}
                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      >
                        <option value="Announcement">Announcement</option>
                        <option value="Question">Question</option>
                        <option value="Update">Update</option>
                        <option value="Idea">Idea</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L14.172 4.172z"></path>
                      </svg>
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>

              {(!project?.posts || project.posts.length === 0) ? (
                <p className="text-white flex items-center space-x-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>No posts yet.</span>
                </p>
              ) : (
                <div className="space-y-6">
                  {project.posts.map(post => (
                    <div key={post._id} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow p-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={'https://via.placeholder.com/32'}
                          alt="User Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h3 className="text-lg font-display text-vibrant-pink flex items-center space-x-2">
                            <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L14.172 4.172z"></path>
                            </svg>
                            <span>{post.title}</span>
                          </h3>
                          <p className="text-sm text-white flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>By: {post.userId}</span>
                          </p>
                          <p className="text-sm text-gray-300 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>{new Date(post.createdAt).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                      <p className="text-white mt-2 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>{post.content}</span>
                      </p>
                      <p className="text-sm text-gray-300 mt-2 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                        </svg>
                        <span>Category: {post.category}</span>
                      </p>
                      <div className="flex space-x-3 mt-3">
                        <button
                          onClick={() => handleLikePost(post._id)}
                          className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                          </svg>
                          <span>{post.likes || 0} Likes</span>
                        </button>
                        <button
                          onClick={() => setShowComments(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                          className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                          </svg>
                          <span>{post.comments?.length || 0} Comments</span>
                        </button>
                        <button
                          onClick={() => handleSharePost(post._id)}
                          className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                          </svg>
                          <span>Share</span>
                        </button>
                      </div>
                      {showComments[post._id] && (
                        <div className="mt-4">
                          {post.comments && post.comments.length > 0 ? (
                            <div className="space-y-3">
                              {post.comments.map((comment, idx) => (
                                <div key={idx} className="flex items-start space-x-3">
                                  <img
                                    src={'https://via.placeholder.com/24'}
                                    alt="Commenter Avatar"
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <div>
                                    <p className="text-sm text-white flex items-center space-x-2">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                      </svg>
                                      <span>{comment.userId}</span>
                                    </p>
                                    <p className="text-sm text-gray-300 flex items-center space-x-2">
                                      <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                    </p>
                                    <p className="text-white mt-1 flex items-center space-x-2">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                      </svg>
                                      <span>{comment.content}</span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-white flex items-center space-x-2">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              <span>No comments yet.</span>
                            </p>
                          )}
                          <div className="mt-4 flex items-center space-x-3">
                            <img
                              src={user?.profilePicture || 'https://via.placeholder.com/24'}
                              alt="User Avatar"
                              className="w-6 h-6 rounded-full"
                            />
                            <div className="w-full">
                              <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                </svg>
                                <span>Add a Comment</span>
                              </label>
                              <input
                                type="text"
                                value={newComment[post._id] || ''}
                                onChange={(e) => setNewComment({ ...newComment, [post._id]: e.target.value })}
                                placeholder="Enter your comment"
                                className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                              />
                            </div>
                            <button
                              onClick={() => handleAddPostComment(post._id)}
                              className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                              </svg>
                              <span>Comment</span>
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

          {/* Tasks Section */}
          <section className="mb-8">
            <div className="card glassmorphic animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-display text-vibrant-pink flex items-center space-x-2">
                  <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path>
                  </svg>
                  <span>Tasks</span>
                </h2>
                <button
                  onClick={() => {
                    setGrokQuery('Summarize the tasks in this project');
                    setShowGrokSidebar(true);
                  }}
                  className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <span>Ask Grok About Tasks</span>
                </button>
              </div>
              <TaskProgressInfographic tasks={project.tasks || []} />
              <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
                <form onSubmit={handleAddTask} className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={user?.profilePicture || 'https://via.placeholder.com/40'}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="w-full">
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path>
                        </svg>
                        <span>Task Title</span>
                      </label>
                      <input
                        type="text"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        required
                        placeholder="Enter task title"
                        className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span>Task Description</span>
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      required
                      placeholder="Enter task description"
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span>Assigned To</span>
                      </label>
                      <input
                        type="text"
                        value={newTask.assignedTo.join(', ')}
                        onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value.split(',').map(id => id.trim()) })}
                        placeholder="User IDs (comma-separated)"
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>Due Date</span>
                      </label>
                      <input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Priority</span>
                      </label>
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
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
                        </svg>
                        <span>Attach File</span>
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setNewTask({ ...newTask, file: e.target.files[0] })}
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    <span>Add Task</span>
                  </button>
                </form>
              </div>

              {(!project?.tasks || project.tasks.length === 0) ? (
                <p className="text-white flex items-center space-x-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>No tasks yet.</span>
                </p>
              ) : (
                <div className="space-y-6">
                  {project.tasks.map(task => (
                    <div key={task._id} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow p-4">
                      {editTask && editTask._id === task._id ? (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-full">
                              <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path>
                                </svg>
                                <span>Task Title</span>
                              </label>
                              <input
                                type="text"
                                value={editTask.title}
                                onChange={(e) => setEditTask({ ...editTask, title: e.target.value })}
                                required
                                placeholder="Enter task title"
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <span>Task Description</span>
                            </label>
                            <textarea
                              value={editTask.description}
                              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
                              required
                              placeholder="Enter task description"
                              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span>Assigned To</span>
                              </label>
                              <input
                                type="text"
                                value={editTask.assignedTo.join(', ')}
                                onChange={(e) => setEditTask({ ...editTask, assignedTo: e.target.value.split(',').map(id => id.trim()) })}
                                placeholder="User IDs (comma-separated)"
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span>Due Date</span>
                              </label>
                              <input
                                type="date"
                                value={editTask.dueDate}
                                onChange={(e) => setEditTask({ ...editTask, dueDate: e.target.value })}
                                className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>Priority</span>
                              </label>
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
                              <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <span>Status</span>
                              </label>
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
                          </div>
                          <div>
                            <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
                              </svg>
                              <span>Attach File</span>
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setEditTask({ ...editTask, file: e.target.files[0] })}
                              className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                            />
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleUpdateTask(task._id, editTask)}
                              className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                              </svg>
                              <span>Save</span>
                            </button>
                            <button
                              onClick={() => setEditTask(null)}
                              className="btn-secondary neumorphic hover:scale-105 transition-transform flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-3">
                            <img
                              src={'https://via.placeholder.com/32'}
                              alt="Task Icon"
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <h3 className="text-lg font-display text-vibrant-pink flex items-center space-x-2">
                                <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path>
                                </svg>
                                <span>{task.title}</span>
                              </h3>
                              <p className="text-sm text-white flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <span>By: {task.userId}</span>
                              </p>
                              <p className="text-sm text-gray-300 flex items-center space-x-2">
                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <span>{new Date(task.createdAt).toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                          <p className="text-white mt-2 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>{task.description}</span>
                          </p>
                          <p className="text-sm text-gray-300 mt-2 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <span>Assigned to: {task.assignedTo?.join(', ') || 'None'}</span>
                          </p>
                          <p className="text-sm text-gray-300 mt-2 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</span>
                          </p>
                          <p className="text-sm text-gray-300 mt-2 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>Priority: {task.priority}</span>
                          </p>
                          <p className="text-sm text-gray-300 mt-2 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <span>Status: {task.status}</span>
                          </p>
                          <div className="flex space-x-3 mt-3">
                            <button
                              onClick={() => handleLikeTask(task._id)}
                              className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                              </svg>
                              <span>{task.likes || 0} Likes</span>
                            </button>
                            <button
                              onClick={() => setShowComments(prev => ({ ...prev, [task._id]: !prev[task._id] }))}
                              className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                              </svg>
                              <span>{task.comments?.length || 0} Comments</span>
                            </button>
                            <button
                              onClick={() => handleShareTask(task._id)}
                              className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                              </svg>
                              <span>Share</span>
                            </button>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
                              </svg>
                              <span>Edit</span>
                            </button>
                          </div>
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-md font-display text-vibrant-pink mb-2 flex items-center space-x-2">
                                <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                </svg>
                                <span>Subtasks</span>
                              </h4>
                              <div className="space-y-3">
                                {task.subtasks.map(subtask => (
                                  <div key={subtask._id} className="pl-6">
                                    <p className="text-white flex items-center space-x-2">
                                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                      </svg>
                                      <span>{subtask.title}</span>
                                    </p>
                                    <p className="text-sm text-gray-300 flex items-center space-x-2">
                                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                      </svg>
                                      <span>{subtask.description}</span>
                                    </p>
                                    <p className="text-sm text-gray-300 flex items-center space-x-2">
                                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                      <span>Status: {subtask.status}</span>
                                    </p>
                                    <div className="flex space-x-3 mt-2">
                                      <button
                                        onClick={() => handleLikeSubtask(task._id, subtask._id)}
                                        className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                        </svg>
                                        <span>{subtask.likes || 0} Likes</span>
                                      </button>
                                      <button
                                        onClick={() => setShowComments(prev => ({ ...prev, [subtask._id]: !prev[subtask._id] }))}
                                        className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                        </svg>
                                        <span>{subtask.comments?.length || 0} Comments</span>
                                      </button>
                                    </div>
                                    {showComments[subtask._id] && (
                                      <div className="mt-2">
                                        {subtask.comments && subtask.comments.length > 0 ? (
                                          <div className="space-y-2">
                                            {subtask.comments.map((comment, idx) => (
                                              <div key={idx} className="flex items-start space-x-2">
                                                <img
                                                  src={'https://via.placeholder.com/20'}
                                                  alt="Commenter Avatar"
                                                  className="w-5 h-5 rounded-full"
                                                />
                                                <div>
                                                  <p className="text-sm text-white flex items-center space-x-2">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                                    </svg>
                                                    <span>{comment.userId}</span>
                                                  </p>
                                                  <p className="text-sm text-gray-300 flex items-center space-x-2">
                                                    <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                                    </svg>
                                                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                                  </p>
                                                  <p className="text-white mt-1 flex items-center space-x-2">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                                    </svg>
                                                    <span>{comment.content}</span>
                                                  </p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-white flex items-center space-x-2">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            <span>No comments yet.</span>
                                          </p>
                                        )}
                                        <div className="mt-2 flex items-center space-x-2">
                                          <img
                                            src={user?.profilePicture || 'https://via.placeholder.com/20'}
                                            alt="User Avatar"
                                            className="w-5 h-5 rounded-full"
                                          />
                                          <div className="w-full">
                                            <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                              </svg>
                                              <span>Add a Comment</span>
                                            </label>
                                            <input
                                              type="text"
                                              value={subtaskComment[subtask._id] || ''}
                                              onChange={(e) => setSubtaskComment({ ...subtaskComment, [subtask._id]: e.target.value })}
                                              placeholder="Enter your comment"
                                              className="w-full p-2 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                            />
                                          </div>
                                          <button
                                            onClick={() => handleAddSubtaskComment(task._id, subtask._id)}
                                            className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                            </svg>
                                            <span>Comment</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-4">
                            <h4 className="text-md font-display text-vibrant-pink mb-2 flex items-center space-x-2">
                              <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                              </svg>
                              <span>Add Subtask</span>
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                  </svg>
                                  <span>Subtask Title</span>
                                </label>
                                <input
                                  type="text"
                                  value={newSubtask[task._id]?.title || ''}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], title: e.target.value } })}
                                  placeholder="Enter subtask title"
                                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  <span>Subtask Description</span>
                                </label>
                                <textarea
                                  value={newSubtask[task._id]?.description || ''}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], description: e.target.value } })}
                                  placeholder="Enter subtask description"
                                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                  <span>Status</span>
                                </label>
                                <select
                                  value={newSubtask[task._id]?.status || 'To Do'}
                                  onChange={(e) => setNewSubtask({ ...newSubtask, [task._id]: { ...newSubtask[task._id], status: e.target.value } })}
                                  className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                >
                                  <option value="To Do">To Do</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </div>
                              <button
                                onClick={() => handleAddSubtask(task._id)}
                                className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span>Add Subtask</span>
                              </button>
                            </div>
                          </div>
                          {showComments[task._id] && (
                            <div className="mt-4">
                              {task.comments && task.comments.length > 0 ? (
                                <div className="space-y-3">
                                  {task.comments.map((comment, idx) => (
                                    <div key={idx} className="flex items-start space-x-3">
                                      <img
                                        src={'https://via.placeholder.com/24'}
                                        alt="Commenter Avatar"
                                        className="w-6 h-6 rounded-full"
                                      />
                                      <div>
                                        <p className="text-sm text-white flex items-center space-x-2">
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                          </svg>
                                          <span>{comment.userId}</span>
                                        </p>
                                        <p className="text-sm text-gray-300 flex items-center space-x-2">
                                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                          </svg>
                                          <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                        </p>
                                        <p className="text-white mt-1 flex items-center space-x-2">
                                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                          </svg>
                                          <span>{comment.content}</span>
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-white flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                  </svg>
                                  <span>No comments yet.</span>
                                </p>
                              )}
                              <div className="mt-4 flex items-center space-x-3">
                                <img
                                  src={user?.profilePicture || 'https://via.placeholder.com/24'}
                                  alt="User Avatar"
                                  className="w-6 h-6 rounded-full"
                                />
                                <div className="w-full">
                                  <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                                    </svg>
                                    <span>Add a Comment</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={taskComment[task._id] || ''}
                                    onChange={(e) => setTaskComment({ ...taskComment, [task._id]: e.target.value })}
                                    placeholder="Enter your comment"
                                    className="w-full p-3 rounded-full bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                  />
                                </div>
                                <button
                                  onClick={() => handleAddTaskComment(task._id)}
                                  className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                  </svg>
                                  <span>Comment</span>
                                </button>
                              </div>
                            </div>
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
        <div className="md:col-span-1">
          <div className="card glassmorphic animate-fade-in mb-8">
            <div className="p-4 border-b border-gray-600">
              <Link to="/profile">
                <img
                  src={user?.profilePicture || 'https://via.placeholder.com/40'}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-full border-2 border-vibrant-pink mx-auto"
                  onError={(e) => (e.target.src = 'https://via.placeholder.com/40')}
                />
              </Link>
            </div>
            <div className="flex space-x-4 border-b border-gray-600">
              <button
                onClick={() => setActiveTab('activity')}
                className={`p-3 ${activeTab === 'activity' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Activity</span>
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`p-3 ${activeTab === 'metrics' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <span>Metrics</span>
              </button>
              <button
                onClick={() => setActiveTab('teams-members')}
                className={`p-3 ${activeTab === 'teams-members' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>Teams & Members</span>
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`p-3 ${activeTab === 'files' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Files</span>
              </button>
              <button
                onClick={() => setActiveTab('grok')}
                className={`p-3 ${activeTab === 'grok' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span>Grok</span>
              </button>
            </div>

            {/* Sidebar Content */}
            {activeTab === 'activity' && (
              <div className="pt-4">
                <h2 className="text-2xl font-display text-vibrant-pink mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Activity Log</span>
                </h2>
                <div className="mb-4">
                  <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    <span>Filter Activity</span>
                  </label>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  >
                    <option value="all">All</option>
                    <option value="post">Posts</option>
                    <option value="task">Tasks</option>
                    <option value="team">Teams</option>
                    <option value="file">Files</option>
                    <option value="share">Shares</option>
                  </select>
                </div>
                {filteredActivityLog.length === 0 ? (
                  <p className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>No activity yet.</span>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredActivityLog.map((activity, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <img
                          src={'https://via.placeholder.com/24'}
                          alt="Activity Icon"
                          className="w-6 h-6 rounded-full"
                        />
                        <div>
                          <p className="text-white flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>{activity.userId}</span>
                          </p>
                          <p className="text-sm text-gray-300 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>{new Date(activity.createdAt).toLocaleString()}</span>
                          </p>
                          <p className="text-white mt-1 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>{activity.details}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-display text-vibrant-pink flex items-center space-x-2">
                    <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span>Project Metrics</span>
                  </h2>
                  <button
                    onClick={() => {
                      setGrokQuery('Analyze the project metrics');
                      setShowGrokSidebar(true);
                    }}
                    className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span>Ask Grok About Metrics</span>
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="bg-dark-navy p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg text-white flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                      <span>Total Projects</span>
                    </h3>
                    <p className="text-2xl font-bold text-vibrant-pink flex items-center space-x-2">
                      <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                      </svg>
                      <span>{metrics.totalProjects}</span>
                    </p>
                  </div>
                  <div className="bg-dark-navy p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg text-white flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path>
                      </svg>
                      <span>Current Projects</span>
                    </h3>
                    <p className="text-2xl font-bold text-vibrant-pink flex items-center space-x-2">
                      <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                      </svg>
                      <span>{metrics.currentProjects}</span>
                    </p>
                  </div>
                  <div className="bg-dark-navy p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg text-white flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                      </svg>
                      <span>Past Projects</span>
                    </h3>
                    <p className="text-2xl font-bold text-vibrant-pink flex items-center space-x-2">
                      <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                      </svg>
                      <span>{metrics.pastProjects}</span>
                    </p>
                  </div>
                  <div className="bg-dark-navy p-4 rounded-lg shadow-lg">
                    <h3 className="text-lg text-white flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span>Tasks Completed</span>
                    </h3>
                    <p className="text-2xl font-bold text-vibrant-pink flex items-center space-x-2">
                      <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                      </svg>
                      <span>{metrics.tasksCompleted}</span>
                    </p>
                  </div>
                </div>
                <TeamContributionInfographic teams={project.teams || []} />
              </div>
            )}

            {activeTab === 'teams-members' && (
              <div className="pt-4">
                {/* Toggle between Teams and Project Members */}
                <div className="flex space-x-4 border-b border-gray-600 mb-4">
                  <button
                    onClick={() => setTeamMemberTab('teams')}
                    className={`p-2 ${teamMemberTab === 'teams' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>Teams</span>
                  </button>
                  <button
                    onClick={() => setTeamMemberTab('members')}
                    className={`p-2 ${teamMemberTab === 'members' ? 'text-vibrant-pink border-b-2 border-vibrant-pink' : 'text-white'} hover:text-neon-blue transition-colors flex items-center space-x-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    <span>Members</span>
                  </button>
                </div>

                {teamMemberTab === 'teams' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-display text-vibrant-pink flex items-center space-x-2">
                        <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span>Teams</span>
                      </h2>
                      <button
                        onClick={() => {
                          setGrokQuery('Summarize the teams in this project');
                          setShowGrokSidebar(true);
                        }}
                        className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <span>Ask Grok About Teams</span>
                      </button>
                    </div>
                    <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
                      <form onSubmit={handleAddTeam} className="space-y-4">
                        <div>
                          <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <span>Team Name</span>
                          </label>
                          <input
                            type="text"
                            value={newTeam.name}
                            onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                            required
                            placeholder="Enter team name"
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>Team Description</span>
                          </label>
                          <textarea
                            value={newTeam.description}
                            onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                            required
                            placeholder="Enter team description"
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            <span>Team Members</span>
                          </label>
                          <input
                            type="text"
                            value={newTeam.members.join(', ')}
                            onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value.split(',').map(id => id.trim()) })}
                            placeholder="Member IDs (comma-separated)"
                            className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                          />
                        </div>
                        <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                          </svg>
                          <span>Add Team</span>
                        </button>
                      </form>
                    </div>
                    {(!project?.teams || project.teams.length === 0) ? (
                      <p className="text-white flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>No teams yet.</span>
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {project.teams.map(team => (
                          <div key={team._id} className="card glassmorphic transform hover:scale-105 transition-transform animate-pulse-glow p-4">
                            {editTeam && editTeam._id === team._id ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                    <span>Team Name</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={editTeam.name}
                                    onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                                    required
                                    placeholder="Enter team name"
                                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    <span>Team Description</span>
                                  </label>
                                  <textarea
                                    value={editTeam.description}
                                    onChange={(e) => setEditTeam({ ...editTeam, description: e.target.value })}
                                    required
                                    placeholder="Enter team description"
                                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                  />
                                </div>
                                <div>
                                  <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                    </svg>
                                    <span>Team Members</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={editTeam.members.join(', ')}
                                    onChange={(e) => setEditTeam({ ...editTeam, members: e.target.value.split(',').map(id => id.trim()) })}
                                    placeholder="Member IDs (comma-separated)"
                                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                                  />
                                </div>
                                <div className="flex space-x-3">
                                  <button
                                    onClick={() => handleUpdateTeam(team._id)}
                                    className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                    </svg>
                                    <span>Save</span>
                                  </button>
                                  <button
                                    onClick={() => setEditTeam(null)}
                                    className="btn-secondary neumorphic hover:scale-105 transition-transform flex items-center space-x-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                    <span>Cancel</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <h3 className="text-lg font-display text-vibrant-pink flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                  </svg>
                                  <span>{team.name}</span>
                                </h3>
                                <p className="text-white mt-1 flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                  </svg>
                                  <span>{team.description}</span>
                                </p>
                                <p className="text-sm text-gray-300 mt-1 flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                  </svg>
                                  <span>Members: {team.members?.join(', ') || 'None'}</span>
                                </p>
                                <p className="text-sm text-gray-300 mt-1 flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                  <span>Created: {new Date(team.createdAt).toLocaleString()}</span>
                                </p>
                                <div className="flex space-x-3 mt-3">
                                  <button
                                    onClick={() => handleEditTeam(team)}
                                    className="text-vibrant-pink hover:text-neon-blue animate-pulse-glow transition-colors flex items-center space-x-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z"></path>
                                    </svg>
                                    <span>Edit</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {teamMemberTab === 'members' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-display text-vibrant-pink flex items-center space-x-2">
                        <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <span>Project Members</span>
                      </h2>
                      <button
                        onClick={() => {
                          setShowShareModal(true);
                        }}
                        className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        <span>Add Member</span>
                      </button>
                    </div>
                    {(!project?.members || project.members.length === 0) ? (
                      <p className="text-white flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>No members yet.</span>
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {project.members.map((member, idx) => (
                          <div key={idx} className="flex items-center space-x-3">
                            <img
                              src={'https://via.placeholder.com/32'}
                              alt="Member Avatar"
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-white flex items-center space-x-2">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                                <span>{member}</span>
                              </p>
                              {project.admins?.includes(member) && (
                                <p className="text-sm text-gray-300 flex items-center space-x-2">
                                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                  </svg>
                                  <span>Admin</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-display text-vibrant-pink flex items-center space-x-2">
                    <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>Files</span>
                  </h2>
                  <button
                    onClick={() => {
                      setGrokQuery('Summarize the files in this project');
                      setShowGrokSidebar(true);
                    }}
                    className="btn-primary neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span>Ask Grok About Files</span>
                  </button>
                </div>
                <div className="mb-6 space-y-4 p-4 bg-dark-navy rounded-lg shadow-inner">
                  <form onSubmit={handleAddFile} className="space-y-4">
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>File Name</span>
                      </label>
                      <input
                        type="text"
                        value={newFile.name}
                        onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                        required
                        placeholder="Enter file name"
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                        <span>File URL</span>
                      </label>
                      <input
                        type="text"
                        value={newFile.url}
                        onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                        required
                        placeholder="Enter file URL"
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      <span>Add File</span>
                    </button>
                  </form>
                  <form onSubmit={handleRequestFile} className="space-y-4">
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span>Request File Name</span>
                      </label>
                      <input
                        type="text"
                        value={newFile.name}
                        onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
                        required
                        placeholder="Enter file name to request"
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                        </svg>
                        <span>Request File URL (optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newFile.url}
                        onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
                        placeholder="Enter file URL (optional)"
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                      />
                    </div>
                    <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                      </svg>
                      <span>Request File</span>
                    </button>
                  </form>
                </div>
                {(!project?.files || project.files.length === 0) ? (
                  <p className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>No files yet.</span>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {project.files.map((file, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <img
                          src={'https://via.placeholder.com/32'}
                          alt="File Icon"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-vibrant-pink hover:text-neon-blue transition-colors flex items-center space-x-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>{file.name}</span>
                          </a>
                          <p className="text-sm text-gray-300 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>Uploaded by: {file.uploadedBy}</span>
                          </p>
                          <p className="text-sm text-gray-300 flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span>{new Date(file.createdAt).toLocaleString()}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'grok' && (
              <div className="pt-4">
                <h2 className="text-2xl font-display text-vibrant-pink mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  <span>Ask Grok</span>
                </h2>
                <p className="text-white text-sm mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Powered by <a href="https://x.ai" target="_blank" rel="noopener noreferrer" className="text-vibrant-pink hover:text-neon-blue">xAI</a>.</span>
                </p>
                <form onSubmit={handleGrokQuery} className="space-y-4">
                  <div>
                    <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                      <span>Ask Grok</span>
                    </label>
                    <textarea
                      value={grokQuery}
                      onChange={(e) => setGrokQuery(e.target.value)}
                      placeholder="e.g., 'Summarize the project progress'"
                      className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all h-32"
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    <span>Send to Grok</span>
                  </button>
                </form>
                {grokResponse && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-lg text-vibrant-pink mb-2 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                      </svg>
                      <span>Grok's Response</span>
                    </h3>
                    <p className="text-white">{grokResponse}</p>
                  </div>
                )}
                {grokError && (
                  <div className="mt-4 p-4 bg-red-500 rounded-lg">
                    <p className="text-white flex items-center space-x-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                      <span>{grokError}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowShareModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="modal glassmorphic p-6">
              <h2 className="text-2xl font-display text-vibrant-pink mb-4 flex items-center space-x-2">
                <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                </svg>
                <span>Share Project</span>
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-medium flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>User ID to Share With</span>
                  </label>
                  <input
                    type="text"
                    value={shareUserId}
                    onChange={(e) => setShareUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-full p-3 rounded-lg bg-gray-800 text-white border border-vibrant-pink focus:outline-none focus:border-neon-blue transition-all"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleShareProject}
                    className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                    </svg>
                    <span>Share</span>
                  </button>
                  <button
                    onClick={handleRequestShare}
                    className="btn-secondary w-full neumorphic hover:scale-105 transition-transform flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                    </svg>
                    <span>Request Share</span>
                  </button>
                </div>
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
              <h2 className="text-2xl font-display text-vibrant-pink mb-4 flex items-center space-x-2">
                <svg className="w-6 h-6 text-vibrant-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <span>Notification Settings</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.email}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    <span>Email Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.sms}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, sms: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span>SMS Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.push}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                    </svg>
                    <span>Push Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.tasks}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, tasks: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"></path>
                    </svg>
                    <span>Task Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.posts}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, posts: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L14.172 4.172z"></path>
                    </svg>
                    <span>Post Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.files}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, files: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <span>File Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.shares}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, shares: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                    </svg>
                    <span>Share Notifications</span>
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.teams}
                    onChange={(e) => setNotificationPrefs({ ...notificationPrefs, teams: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-vibrant-pink border-vibrant-pink focus:ring-vibrant-pink"
                  />
                  <label className="text-white flex items-center space-x-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>Team Notifications</span>
                  </label>
                </div>
                <button
                  onClick={handleUpdateNotificationPrefs}
                  className="btn-primary w-full neumorphic hover:scale-105 transition-transform animate-pulse-glow flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                  </svg>
                  <span>Save Settings</span>
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