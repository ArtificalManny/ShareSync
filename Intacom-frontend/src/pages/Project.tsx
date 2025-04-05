import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { theme } from '../styles/theme';
import './Project.css';

interface User {
  _id: string;
  username: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  admin: string;
  status: string;
  color: string;
  likes: number;
  comments: number;
  sharedWith: { userId: string; role: string }[];
}

interface Post {
  _id: string;
  content: string;
  likes: number;
  comments: number;
}

interface Task {
  _id: string;
  name: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: string;
}

interface Feedback {
  _id: string;
  rating: number;
  message: string;
}

interface ProjectProps {
  user: User | null;
}

function Project({ user }: ProjectProps) {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [newPost, setNewPost] = useState({ content: '', images: [] as string[] });
  const [newTask, setNewTask] = useState({ name: '', description: '', assignee: '', dueDate: '', status: 'todo' });
  const [newFeedback, setNewFeedback] = useState({ rating: 0, message: '' });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${id}`);
        setProject(response.data);
      } catch (error) {
        console.error('Error fetching project:', error);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/posts/project/${id}`);
        setPosts(response.data.data || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/project/${id}`);
        setTasks(response.data.data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    const fetchFeedback = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/feedback/project/${id}`);
        setFeedback(response.data.data || []);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      }
    };

    fetchProject();
    fetchPosts();
    fetchTasks();
    fetchFeedback();
  }, [id]);

  const handleCreatePost = async () => {
    if (!user) {
      alert('Please log in to create a post');
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        projectId: id,
        userId: user._id,
        content: newPost.content,
        images: newPost.images,
      });
      setPosts([...posts, response.data]);
      setNewPost({ content: '', images: [] });
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleCreateTask = async () => {
    if (!user) {
      alert('Please log in to create a task');
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/tasks`, {
        projectId: id,
        name: newTask.name,
        description: newTask.description,
        assignee: newTask.assignee,
        dueDate: newTask.dueDate,
        status: newTask.status,
      });
      setTasks([...tasks, response.data.data]);
      setNewTask({ name: '', description: '', assignee: '', dueDate: '', status: 'todo' });
      alert('Task created successfully!');
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user) {
      alert('Please log in to submit feedback');
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/feedback`, {
        projectId: id,
        userId: user._id,
        rating: newFeedback.rating,
        message: newFeedback.message,
      });
      setFeedback([...feedback, response.data.data]);
      setNewFeedback({ rating: 0, message: '' });
      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="project">
      <h1 style={{ color: theme.colors.primary }}>{project.name}</h1>
      <p>{project.description}</p>
      <p><strong>Admin:</strong> {project.admin}</p>
      <p><strong>Status:</strong> {project.status}</p>
      <p><strong>Collaborators:</strong> {project.sharedWith.map((c) => c.userId).join(', ')}</p>
      <p><strong>Likes:</strong> {project.likes}</p>
      <p><strong>Comments:</strong> {project.comments}</p>

      <div className="project-section">
        <h2 style={{ color: theme.colors.secondary }}>Posts</h2>
        <div className="post-form">
          <textarea
            placeholder="Write a post..."
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <button onClick={handleCreatePost} style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
            Post
          </button>
        </div>
        {posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="post">
              <p>{post.content}</p>
              <p>Likes: {post.likes}</p>
              <p>Comments: {post.comments}</p>
            </div>
          ))
        )}
      </div>

      <div className="project-section">
        <h2 style={{ color: theme.colors.secondary }}>Tasks</h2>
        <div className="task-form">
          <input
            type="text"
            placeholder="Task Name"
            value={newTask.name}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
          />
          <textarea
            placeholder="Description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <input
            type="text"
            placeholder="Assignee"
            value={newTask.assignee}
            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
          />
          <input
            type="date"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
          />
          <select
            value={newTask.status}
            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button onClick={handleCreateTask} style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
            Add Task
          </button>
        </div>
        {tasks.length === 0 ? (
          <p>No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="task">
              <h3>{task.name}</h3>
              <p>{task.description}</p>
              <p>Assignee: {task.assignee}</p>
              <p>Due Date: {task.dueDate}</p>
              <p>Status: {task.status}</p>
            </div>
          ))
        )}
      </div>

      <div className="project-section">
        <h2 style={{ color: theme.colors.secondary }}>Feedback</h2>
        <div className="feedback-form">
          <input
            type="number"
            min="1"
            max="5"
            placeholder="Rating (1-5)"
            value={newFeedback.rating}
            onChange={(e) => setNewFeedback({ ...newFeedback, rating: parseInt(e.target.value) })}
          />
          <textarea
            placeholder="Your feedback..."
            value={newFeedback.message}
            onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
          />
          <button onClick={handleSubmitFeedback} style={{ backgroundColor: theme.colors.accent, color: theme.colors.text }}>
            Submit Feedback
          </button>
        </div>
        {feedback.length === 0 ? (
          <p>No feedback yet.</p>
        ) : (
          feedback.map((fb) => (
            <div key={fb._id} className="feedback">
              <p>Rating: {fb.rating}</p>
              <p>{fb.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Project;