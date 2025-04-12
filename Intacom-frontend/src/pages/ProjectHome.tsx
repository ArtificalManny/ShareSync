import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description: string;
  members: string[];
  timeline: { date: string; event: string }[];
}

interface Post {
  _id: string;
  content: string;
  image?: string;
  userId: string;
  username: string;
  createdAt: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assignedTo: string;
  username: string;
  createdAt: string;
}

interface FileData {
  _id: string;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

interface Activity {
  _id: string;
  type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'project_create' | 'member_request' | 'member_approved' | 'timeline';
  content: string;
  createdAt: string;
}

interface User {
  _id: string;
  username: string;
}

interface ProjectHomeProps {
  user: User | null;
}

const ProjectHome: React.FC<ProjectHomeProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [newTimelineEvent, setNewTimelineEvent] = useState({ date: '', event: '' });

  const fetchProject = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
      setProject(response.data.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchPosts = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/project/${id}`);
      setPosts(response.data.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/project/${id}`);
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchFiles = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/files/project/${id}`);
      setFiles(response.data.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchActivities = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/activities/project/${id}`);
      setActivities(response.data.data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    try {
      const formData = new FormData();
      formData.append('content', newPost);
      formData.append('projectId', id);
      formData.append('userId', user._id);
      if (newPostImage) {
        formData.append('file', newPostImage, newPostImage.name);
      }
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setPosts([response.data.data, ...posts]);
      setNewPost('');
      setNewPostImage(null);
      setActivities([
        ...activities,
        {
          _id: `${activities.length + 1}`,
          type: 'post',
          content: `${user.username} created a new post`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/tasks`, {
        title: newTask.title,
        description: newTask.description,
        projectId: id,
        assignedTo: user._id,
      });
      setTasks([response.data.data, ...tasks]);
      setNewTask({ title: '', description: '' });
      setActivities([
        ...activities,
        {
          _id: `${activities.length + 1}`,
          type: 'task',
          content: `${user.username} created a new task`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTimelineSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    try {
      const updatedTimeline = [...(project?.timeline || []), newTimelineEvent];
      await axios.put(`${import.meta.env.VITE_API_URL}/projects/${id}`, {
        timeline: updatedTimeline,
      });
      setProject({ ...project!, timeline: updatedTimeline });
      setNewTimelineEvent({ date: '', event: '' });
      setActivities([
        ...activities,
        {
          _id: `${activities.length + 1}`,
          type: 'timeline',
          content: `${user.username} edited a timeline event`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Error updating timeline:', error);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchPosts();
    fetchTasks();
    fetchFiles();
    fetchActivities();
  }, [id]);

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>

      <h2>Posts</h2>
      <form onSubmit={handlePostSubmit}>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Write a post..."
        />
        <input
          type="file"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewPostImage(e.target.files ? e.target.files[0] : null)
          }
        />
        <button type="submit">Post</button>
      </form>
      {posts.map((post) => (
        <div key={post._id}>
          <p>{post.content}</p>
          {post.image && <img src={post.image} alt="Post" />}
          <p>Posted by: {post.username}</p>
          <p>Posted at: {new Date(post.createdAt).toLocaleString()}</p>
        </div>
      ))}

      <h2>Tasks</h2>
      <form onSubmit={handleTaskSubmit}>
        <input
          type="text"
          placeholder="Task Title"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
        />
        <textarea
          placeholder="Task Description"
          value={newTask.description}
          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
        />
        <button type="submit">Add Task</button>
      </form>
      {tasks.map((task) => (
        <div key={task._id}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>
          <p>Status: {task.status}</p>
          <p>Assigned to: {task.username}</p>
          <p>Created at: {new Date(task.createdAt).toLocaleString()}</p>
        </div>
      ))}

      <h2>Files</h2>
      {files.map((file) => (
        <div key={file._id}>
          <a href={file.url} target="_blank" rel="noopener noreferrer">
            {file.url}
          </a>
          <p>Uploaded by: {file.uploadedBy}</p>
          <p>Uploaded at: {new Date(file.createdAt).toLocaleString()}</p>
        </div>
      ))}

      <h2>Timeline</h2>
      <form onSubmit={handleTimelineSubmit}>
        <input
          type="date"
          value={newTimelineEvent.date}
          onChange={(e) =>
            setNewTimelineEvent({ ...newTimelineEvent, date: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Event"
          value={newTimelineEvent.event}
          onChange={(e) =>
            setNewTimelineEvent({ ...newTimelineEvent, event: e.target.value })
          }
        />
        <button type="submit">Add Event</button>
      </form>
      {project.timeline.map((event, index) => (
        <div key={index}>
          <p>{event.date}: {event.event}</p>
        </div>
      ))}

      <h2>Activity</h2>
      {activities.map((activity) => (
        <div key={activity._id}>
          <p>{activity.content}</p>
          <p>{new Date(activity.createdAt).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default ProjectHome;