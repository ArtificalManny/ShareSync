import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProjectHome = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });
  const [newTeam, setNewTeam] = useState({ name: '', description: '', members: '' });
  const [newFile, setNewFile] = useState({ name: '', url: '' });
  const [shareUserId, setShareUserId] = useState('');
  const [activityFilter, setActivityFilter] = useState('All');
  const [notifications, setNotifications] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: true,
    taskUpdates: true,
    postUpdates: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setProject(data));
  }, [id]);

  const handleAddPost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...newPost, userId: user._id }),
    });
    setNotifications([...notifications, `New post added: ${newPost.title}`]);
    setNewPost({ title: '', content: '', category: '' });
    const updatedProject = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());
    setProject(updatedProject);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...newTask, assignedTo: newTask.assignedTo.split(','), status: 'To Do' }),
    });
    setNotifications([...notifications, `New task added: ${newTask.title}`]);
    setNewTask({ title: '', description: '', assignedTo: '' });
    const updatedProject = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());
    setProject(updatedProject);
  };

  const handleUpdateTask = async (taskId, status) => {
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    setNotifications([...notifications, `Task status updated: ${status}`]);
    const updatedProject = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());
    setProject(updatedProject);
  };

  const handleAddTeam = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...newTeam, members: newTeam.members.split(',') }),
    });
    setNotifications([...notifications, `New team added: ${newTeam.name}`]);
    setNewTeam({ name: '', description: '', members: '' });
    const updatedProject = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());
    setProject(updatedProject);
  };

  const handleAddFile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...newFile, uploadedBy: user._id }),
    });
    setNotifications([...notifications, `New file added: ${newFile.name}`]);
    setNewFile({ name: '', url: '' });
    const updatedProject = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());
    setProject(updatedProject);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: shareUserId }),
    });
    setNotifications([...notifications, `Project shared with user: ${shareUserId}`]);
    setShareUserId('');
    const updatedProject = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json());
    setProject(updatedProject);
  };

  if (!project) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{project.title}</h1>
      <p>{project.description}</p>
      <p>Category: {project.category}</p>
      <p>Status: {project.status}</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-100 rounded">
          <h2>Total Projects</h2>
          <p>1</p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <h2>Current Projects</h2>
          <p>{project.status === 'Completed' ? 0 : 1}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <h2>Past Projects</h2>
          <p>{project.status === 'Completed' ? 1 : 0}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded">
          <h2>Tasks Completed</h2>
          <p>{project.tasksCompleted}</p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-2">Announcements</h2>
      <p>{project.announcement || 'No announcements yet'}</p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ announcement: project.announcement }),
        });
        setNotifications([...notifications, `Announcement updated`]);
      }}>
        <input
          type="text"
          value={project.announcement || ''}
          onChange={(e) => setProject({ ...project, announcement: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Update Announcement"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Update Announcement
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Snapshot</h2>
      <p>{project.snapshot || 'No snapshot yet'}</p>
      <form onSubmit={async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ snapshot: project.snapshot }),
        });
        setNotifications([...notifications, `Snapshot updated`]);
      }}>
        <input
          type="text"
          value={project.snapshot || ''}
          onChange={(e) => setProject({ ...project, snapshot: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Update Snapshot"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Update Snapshot
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Posts</h2>
      {project.posts.map(post => (
        <div key={post._id} className="p-4 bg-white shadow rounded mb-2">
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <p>Category: {post.category}</p>
          <p>Posted by: {post.userId}</p>
        </div>
      ))}
      <form onSubmit={handleAddPost}>
        <input
          type="text"
          value={newPost.title}
          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Post Title"
        />
        <textarea
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Post Content"
        />
        <input
          type="text"
          value={newPost.category}
          onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Category (e.g., Announcement, Poll, Picture)"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Add Post
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Tasks</h2>
      {project.tasks.map(task => (
        <div key={task._id} className="p-4 bg-white shadow rounded mb-2">
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>Assigned to: {task.assignedTo.join(', ')}</p>
          <p>Status: {task.status}</p>
          <button
            onClick={() => handleUpdateTask(task._id, 'Completed')}
            className="p-1 bg-green-500 text-white rounded"
          >
            Mark as Completed
          </button>
        </div>
      ))}
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Task Title"
        />
        <textarea
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Task Description"
        />
        <input
          type="text"
          value={newTask.assignedTo}
          onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Assigned To (comma-separated user IDs)"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Add Task
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Teams</h2>
      {project.teams.map(team => (
        <div key={team._id} className="p-4 bg-white shadow rounded mb-2">
          <h3>{team.name}</h3>
          <p>{team.description}</p>
          <p>Members: {team.members.join(', ')}</p>
        </div>
      ))}
      <form onSubmit={handleAddTeam}>
        <input
          type="text"
          value={newTeam.name}
          onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Team Name"
        />
        <textarea
          value={newTeam.description}
          onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Team Description"
        />
        <input
          type="text"
          value={newTeam.members}
          onChange={(e) => setNewTeam({ ...newTeam, members: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="Members (comma-separated user IDs)"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Add Team
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Files</h2>
      {project.files.map(file => (
        <div key={file._id} className="p-4 bg-white shadow rounded mb-2">
          <a href={file.url} target="_blank" rel="noopener noreferrer">{file.name}</a>
          <p>Uploaded by: {file.uploadedBy}</p>
        </div>
      ))}
      <form onSubmit={handleAddFile}>
        <input
          type="text"
          value={newFile.name}
          onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="File Name"
        />
        <input
          type="text"
          value={newFile.url}
          onChange={(e) => setNewFile({ ...newFile, url: e.target.value })}
          className="p-2 border rounded mb-2 w-full"
          placeholder="File URL"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Add File
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Share Project</h2>
      <form onSubmit={handleShare}>
        <input
          type="text"
          value={shareUserId}
          onChange={(e) => setShareUserId(e.target.value)}
          className="p-2 border rounded mb-2 w-full"
          placeholder="User ID to Share With"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Share
        </button>
      </form>

      <h2 className="text-2xl font-semibold mb-2 mt-6">Activity Log</h2>
      <select
        value={activityFilter}
        onChange={(e) => setActivityFilter(e.target.value)}
        className="p-2 border rounded mb-2"
      >
        <option value="All">All</option>
        <option value="Posts">Posts</option>
        <option value="Tasks">Tasks</option>
        <option value="Teams">Teams</option>
        <option value="Files">Files</option>
      </select>
      {notifications
        .filter(note => activityFilter === 'All' || note.toLowerCase().includes(activityFilter.toLowerCase()))
        .map((note, index) => (
          <p key={index}>{note}</p>
        ))}

      <h2 className="text-2xl font-semibold mb-2 mt-6">Notification Settings</h2>
      <div>
        <label>
          <input
            type="checkbox"
            checked={notificationSettings.email}
            onChange={() => setNotificationSettings({ ...notificationSettings, email: !notificationSettings.email })}
          />
          Email Notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={notificationSettings.sms}
            onChange={() => setNotificationSettings({ ...notificationSettings, sms: !notificationSettings.sms })}
          />
          SMS Notifications
        </label>
        <label>
          <input
            type="checkbox"
            checked={notificationSettings.taskUpdates}
            onChange={() => setNotificationSettings({ ...notificationSettings, taskUpdates: !notificationSettings.taskUpdates })}
          />
          Task Updates
        </label>
        <label>
          <input
            type="checkbox"
            checked={notificationSettings.postUpdates}
            onChange={() => setNotificationSettings({ ...notificationSettings, postUpdates: !notificationSettings.postUpdates })}
          />
          Post Updates
        </label>
      </div>
    </div>
  );
};

export default ProjectHome;