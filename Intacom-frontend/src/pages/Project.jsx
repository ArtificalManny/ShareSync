import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './Project.css';

function Project() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [posts, setPosts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [newPost, setNewPost] = useState({ content: '', images: [] });
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
        setPosts(response.data.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/tasks/project/${id}`);
        setTasks(response.data.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    const fetchFeedback = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/feedback/project/${id}`);
        setFeedback(response.data.data);
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
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        projectId: id,
        userId: 'ArtificalManny', // Replace with actual user ID
        content: newPost.content,
        images: newPost.images,
      });
      setPosts([...posts, response.data]);
      setNewPost({ content: '', images: [] });
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleCreateTask = async () => {
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
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/feedback`, {
        projectId: id,
        userId: 'ArtificalManny', // Replace with actual user ID
        rating: newFeedback.rating,
        message: newFeedback.message,
      });
      setFeedback([...feedback, response.data.data]);
      setNewFeedback({ rating: 0, message: '' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="project">
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <p>Admin: {project.admin}</p>
      <p>Status: {project.status}</p>

      <div className="project-section">
        <h2>Posts</h2>
        <div className="post-form">
          <textarea
            placeholder="Write a post..."
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          />
          <button onClick={handleCreatePost}>Post</button>
        </div>
        {posts.map((post) => (
          <div key={post._id} className="post">
            <p>{post.content}</p>
            <p>Likes: {post.likes}</p>
            <p>Comments: {post.comments}</p>
          </div>
        ))}
      </div>

      <div className="project-section">
        <h2>Tasks</h2>
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
          <button onClick={handleCreateTask}>Add Task</button>
        </div>
        {tasks.map((task) => (
          <div key={task._id} className="task">
            <h3>{task.name}</h3>
            <p>{task.description}</p>
            <p>Assignee: {task.assignee}</p>
            <p>Due Date: {task.dueDate}</p>
            <p>Status: {task.status}</p>
          </div>
        ))}
      </div>

      <div className="project-section">
        <h2>Feedback</h2>
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
          <button onClick={handleSubmitFeedback}>Submit Feedback</button>
        </div>
        {feedback.map((fb) => (
          <div key={fb._id} className="feedback">
            <p>Rating: {fb.rating}</p>
            <p>{fb.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Project;