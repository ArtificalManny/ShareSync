import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface Project {
  _id: string;
  name: string;
  description: string;
}

interface Post {
  _id: string;
  content: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
}

interface Feedback {
  _id: string;
  content: string;
}

const Project: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newPost, setNewPost] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [newFeedback, setNewFeedback] = useState('');

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

  const fetchFeedbacks = async () => {
    if (!id) return;
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/feedback/project/${id}`);
      setFeedbacks(response.data.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        content: newPost,
        projectId: id,
      });
      setPosts([response.data.data, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/tasks`, {
        title: newTask.title,
        description: newTask.description,
        projectId: id,
      });
      setTasks([response.data.data, ...tasks]);
      setNewTask({ title: '', description: '' });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/feedback`, {
        content: newFeedback,
        projectId: id,
      });
      setFeedbacks([response.data.data, ...feedbacks]);
      setNewFeedback('');
    } catch (error) {
      console.error('Error creating feedback:', error);
    }
  };

  useEffect(() => {
    fetchProject();
    fetchPosts();
    fetchTasks();
    fetchFeedbacks();
  }, [id]);

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <button onClick={() => navigate(`/project/${id}/edit`)}>Edit Project</button>

      <h2>Posts</h2>
      <form onSubmit={handlePostSubmit}>
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Write a post..."
        />
        <button type="submit">Post</button>
      </form>
      {posts.map((post) => (
        <div key={post._id}>
          <p>{post.content}</p>
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
        </div>
      ))}

      <h2>Feedback</h2>
      <form onSubmit={handleFeedbackSubmit}>
        <textarea
          value={newFeedback}
          onChange={(e) => setNewFeedback(e.target.value)}
          placeholder="Provide feedback..."
        />
        <button type="submit">Submit Feedback</button>
      </form>
      {feedbacks.map((feedback) => (
        <div key={feedback._id}>
          <p>{feedback.content}</p>
        </div>
      ))}
    </div>
  );
};

export default Project;