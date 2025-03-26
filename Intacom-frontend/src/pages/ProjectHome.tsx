import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Upload from '../Upload';
import Settings from '../Settings';

interface Project {
  _id: string;
  name: string;
  description?: string;
  admin?: string;
  color?: string;
  sharedWith?: { userId: string; role: 'Admin' | 'Editor' | 'Viewer' }[];
}

interface Task {
  _id?: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  projectId: string;
  assignedTo?: string[];
  subtasks?: Subtask[];
}

interface Subtask {
  _id?: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
}

interface Post {
  _id?: string;
  content: string;
  image?: string;
  author: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

interface Comment {
  _id?: string;
  content: string;
  author: string;
  createdAt: string;
}

interface Activity {
  _id: string;
  type: 'post' | 'comment' | 'like' | 'task' | 'subtask';
  content: string;
  createdAt: string;
}

interface ProjectHomeProps {
  projects: Project[] | undefined;
}

const ProjectHome: React.FC<ProjectHomeProps> = ({ projects }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'post' | 'comment' | 'like' | 'task' | 'subtask'>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'settings' | 'activity'>('home');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<{ username: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log(`Fetching project with ID: ${id}`);
        const response = await axios.get(`http://localhost:3000/projects/by-id/${id}`);
        console.log('Fetch project response:', response.data);
        setProject(response.data.data.project);
      } catch (error: any) {
        console.error('Failed to fetch project:', error.response?.data || error.message);
        setErrorMessage('Failed to load project. Please try again later.');
      }
    };
    fetchProject();

    // Fetch tasks (mocked for now; in a real app, you'd have a backend endpoint)
    setTasks([
      {
        _id: '1',
        title: 'Design UI',
        description: 'Create wireframes for the homepage',
        status: 'To Do',
        projectId: id!,
        assignedTo: ['ArtificalManny'],
        subtasks: [
          { _id: '1-1', title: 'Create wireframe for header', description: 'Design the header section', status: 'To Do' },
        ],
      },
      {
        _id: '2',
        title: 'Implement API',
        description: 'Set up API endpoints for tasks',
        status: 'In Progress',
        projectId: id!,
        assignedTo: ['ArtificalManny'],
        subtasks: [],
      },
    ]);

    // Fetch posts (mocked for now; in a real app, you'd have a backend endpoint)
    setPosts([
      {
        _id: '1',
        content: 'Working on the project design!',
        image: 'https://via.placeholder.com/300',
        author: 'ArtificalManny',
        createdAt: new Date().toISOString(),
        likes: ['ArtificalManny'],
        comments: [
          { _id: '1-1', content: 'Looks great!', author: 'ArtificalManny', createdAt: new Date().toISOString() },
        ],
      },
    ]);

    // Fetch activities (mocked for now; in a real app, you'd have a backend endpoint)
    setActivities([
      { _id: '1', type: 'post', content: 'ArtificalManny posted an update', createdAt: new Date().toISOString() },
      { _id: '2', type: 'task', content: 'ArtificalManny completed task "Design UI"', createdAt: new Date().toISOString() },
    ]);
  }, [id]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskDescription) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    const newTask: Task = {
      title: newTaskTitle,
      description: newTaskDescription,
      status: 'To Do',
      projectId: id!,
      assignedTo: newTaskAssignedTo,
      subtasks: [],
    };
    setTasks([...tasks, { ...newTask, _id: `${tasks.length + 1}` }]);
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'task', content: `${user?.username} created task "${newTaskTitle}"`, createdAt: new Date().toISOString() },
    ]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignedTo([]);
    setSuccessMessage('Task added successfully');
    setErrorMessage('');
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    setTasks(tasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)));
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'task', content: `${user?.username} updated task status to "${newStatus}"`, createdAt: new Date().toISOString() },
    ]);
  };

  const handleAddSubtask = (taskId: string, subtaskTitle: string, subtaskDescription: string) => {
    setTasks(
      tasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              subtasks: [
                ...(task.subtasks || []),
                { _id: `${taskId}-${(task.subtasks?.length || 0) + 1}`, title: subtaskTitle, description: subtaskDescription, status: 'To Do' },
              ],
            }
          : task
      )
    );
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'subtask', content: `${user?.username} added subtask "${subtaskTitle}"`, createdAt: new Date().toISOString() },
    ]);
  };

  const handleUpdateSubtaskStatus = (taskId: string, subtaskId: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    setTasks(
      tasks.map((task) =>
        task._id === taskId
          ? {
              ...task,
              subtasks: task.subtasks?.map((subtask) =>
                subtask._id === subtaskId ? { ...subtask, status: newStatus } : subtask
              ),
            }
          : task
      )
    );
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'subtask', content: `${user?.username} updated subtask status to "${newStatus}"`, createdAt: new Date().toISOString() },
    ]);
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    let imageUrl = '';
    if (newPostImage) {
      const formData = new FormData();
      formData.append('file', newPostImage);
      try {
        const response = await axios.post<{ url: string }>('http://localhost:3000/uploads', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = response.data.url;
      } catch (error: any) {
        console.error('Image upload error:', error.response?.data || error.message);
        setErrorMessage('Failed to upload image. Please try again.');
        return;
      }
    }
    const newPost: Post = {
      content: newPostContent,
      image: imageUrl,
      author: user?.username || 'Unknown',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    setPosts([...posts, { ...newPost, _id: `${posts.length + 1}` }]);
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'post', content: `${user?.username} posted an update`, createdAt: new Date().toISOString() },
    ]);
    setNewPostContent('');
    setNewPostImage(null);
    setSuccessMessage('Post created successfully');
    setErrorMessage('');
  };

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: post.likes.includes(user?.username || '')
                ? post.likes.filter((username) => username !== user?.username)
                : [...post.likes, user?.username || ''],
            }
          : post
      )
    );
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'like', content: `${user?.username} liked a post`, createdAt: new Date().toISOString() },
    ]);
  };

  const handleAddComment = (postId: string, commentContent: string) => {
    setPosts(
      posts.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                { _id: `${postId}-${post.comments.length + 1}`, content: commentContent, author: user?.username || 'Unknown', createdAt: new Date().toISOString() },
              ],
            }
          : post
      )
    );
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'comment', content: `${user?.username} commented on a post`, createdAt: new Date().toISOString() },
    ]);
  };

  if (errorMessage) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#ff5555' }}>{errorMessage}</div>;
  }

  if (!project) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading project...</div>;
  }

  const filteredActivities = activities.filter((activity) => activityFilter === 'all' || activity.type === activityFilter);

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>{project.name}</h2>
      <p style={{ fontSize: '1rem', opacity: 0.8, marginBottom: '1.5rem' }}>
        {project.description || 'No description'}
      </p>
      <div className="project-tabs">
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('upload')}>Upload</button>
        <button onClick={() => setActiveTab('settings')}>Settings</button>
        <button onClick={() => setActiveTab('activity')}>Activity Log</button>
      </div>
      {activeTab === 'home' && (
        <div>
          {/* Task Management Section */}
          <div
            style={{
              background: 'var(--card-background)',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Tasks</h3>
            <form onSubmit={handleAddTask} style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title</label>
                <input
                  id="taskTitle"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description"
                  required
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskAssignedTo">Assign To</label>
                <select
                  id="taskAssignedTo"
                  multiple
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(Array.from(e.target.selectedOptions, (option) => option.value))}
                >
                  <option value="ArtificalManny">ArtificalManny</option>
                  {/* Add more users dynamically from project.sharedWith */}
                </select>
              </div>
              <button type="submit">Add Task</button>
            </form>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && (
              <div style={{ color: '#4caf50', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {successMessage}
              </div>
            )}
            {tasks.length === 0 ? (
              <p style={{ fontSize: '1rem', opacity: '0.8' }}>No tasks yet. Add a task to get started!</p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="project-card"
                    style={{
                      borderLeft: `4px solid ${
                        task.status === 'To Do' ? '#ff5555' : task.status === 'In Progress' ? '#ffa500' : '#4caf50'
                      }`,
                    }}
                  >
                    <h4>{task.title}</h4>
                    <p>{task.description}</p>
                    <p>Assigned To: {task.assignedTo?.join(', ') || 'None'}</p>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task._id!, e.target.value as 'To Do' | 'In Progress' | 'Done')}
                      style={{ marginTop: '0.5rem' }}
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    {/* Subtasks Section */}
                    <div style={{ marginTop: '1rem' }}>
                      <h5 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Subtasks</h5>
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: '0' }}>
                          {task.subtasks.map((subtask) => (
                            <li
                              key={subtask._id}
                              style={{
                                padding: '0.5rem 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div>
                                <strong>{subtask.title}</strong>
                                <p style={{ margin: '0', fontSize: '0.9rem', opacity: '0.8' }}>{subtask.description}</p>
                              </div>
                              <select
                                value={subtask.status}
                                onChange={(e) => handleUpdateSubtaskStatus(task._id!, subtask._id!, e.target.value as 'To Do' | 'In Progress' | 'Done')}
                              >
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '0.9rem', opacity: '0.8' }}>No subtasks yet.</p>
                      )}
                      {/* Add Subtask Form */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const subtaskTitle = (e.target as any).subtaskTitle.value;
                          const subtaskDescription = (e.target as any).subtaskDescription.value;
                          handleAddSubtask(task._id!, subtaskTitle, subtaskDescription);
                          (e.target as HTMLFormElement).reset();
                        }}
                        style={{ marginTop: '1rem' }}
                      >
                        <div className="form-group">
                          <label htmlFor={`subtaskTitle-${task._id}`}>Subtask Title</label>
                          <input
                            id={`subtaskTitle-${task._id}`}
                            name="subtaskTitle"
                            type="text"
                            placeholder="Enter subtask title"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`subtaskDescription-${task._id}`}>Description</label>
                          <textarea
                            id={`subtaskDescription-${task._id}`}
                            name="subtaskDescription"
                            placeholder="Enter subtask description"
                            required
                            rows={2}
                          />
                        </div>
                        <button type="submit">Add Subtask</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posts Section */}
          <div
            style={{
              background: 'var(--card-background)',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Posts</h3>
            <form onSubmit={handleAddPost} style={{ marginBottom: '2rem' }}>
              <div className="form-group">
                <label htmlFor="postContent">What's on your mind?</label>
                <textarea
                  id="postContent"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share an update..."
                  required
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label htmlFor="postImage">Add Image (optional)</label>
                <input
                  id="postImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPostImage(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <button type="submit">Post</button>
            </form>
            {posts.length === 0 ? (
              <p style={{ fontSize: '1rem', opacity: '0.8' }}>No posts yet. Share an update!</p>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="project-card"
                    style={{ borderLeft: '4px solid var(--primary-color)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'var(--secondary-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}
                      >
                        {post.author[0]}
                      </div>
                      <div>
                        <p style={{ margin: '0', fontWeight: 600 }}>{post.author}</p>
                        <p style={{ margin: '0', fontSize: '0.8rem', opacity: '0.8' }}>
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p>{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post"
                        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '0.5rem' }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleLikePost(post._id!)}
                        style={{
                          background: post.likes.includes(user?.username || '') ? 'var(--primary-color)' : 'var(--card-background)',
                          color: post.likes.includes(user?.username || '') ? '#fff' : 'var(--text-color)',
                        }}
                      >
                        Like ({post.likes.length})
                      </button>
                      <button style={{ background: 'var(--card-background)' }}>
                        Comment ({post.comments.length})
                      </button>
                    </div>
                    {/* Comments Section */}
                    <div style={{ marginTop: '1rem' }}>
                      {post.comments.length > 0 && (
                        <ul style={{ listStyle: 'none', padding: '0' }}>
                          {post.comments.map((comment) => (
                            <li
                              key={comment._id}
                              style={{
                                padding: '0.5rem 0',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'var(--secondary-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '1rem',
                                }}
                              >
                                {comment.author[0]}
                              </div>
                              <div>
                                <p style={{ margin: '0', fontWeight: 600, fontSize: '0.9rem' }}>{comment.author}</p>
                                <p style={{ margin: '0', fontSize: '0.9rem' }}>{comment.content}</p>
                                <p style={{ margin: '0', fontSize: '0.8rem', opacity: '0.8' }}>
                                  {new Date(comment.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const commentContent = (e.target as any).commentContent.value;
                          handleAddComment(post._id!, commentContent);
                          (e.target as HTMLFormElement).reset();
                        }}
                        style={{ marginTop: '1rem' }}
                      >
                        <div className="form-group">
                          <label htmlFor={`commentContent-${post._id}`}>Add a Comment</label>
                          <input
                            id={`commentContent-${post._id}`}
                            name="commentContent"
                            type="text"
                            placeholder="Write a comment..."
                            required
                          />
                        </div>
                        <button type="submit">Comment</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'upload' && <Upload />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'activity' && (
        <div
          style={{
            background: 'var(--card-background)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Activity Log</h3>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button onClick={() => setActivityFilter('all')} style={{ background: activityFilter === 'all' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              All
            </button>
            <button onClick={() => setActivityFilter('post')} style={{ background: activityFilter === 'post' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Posts
            </button>
            <button onClick={() => setActivityFilter('comment')} style={{ background: activityFilter === 'comment' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Comments
            </button>
            <button onClick={() => setActivityFilter('like')} style={{ background: activityFilter === 'like' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Likes
            </button>
            <button onClick={() => setActivityFilter('task')} style={{ background: activityFilter === 'task' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Tasks
            </button>
            <button onClick={() => setActivityFilter('subtask')} style={{ background: activityFilter === 'subtask' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Subtasks
            </button>
          </div>
          {filteredActivities.length === 0 ? (
            <p style={{ fontSize: '1rem', opacity: '0.8' }}>No activities to display.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: '0' }}>
              {filteredActivities.map((activity) => (
                <li
                  key={activity._id}
                  style={{
                    padding: '0.75rem 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.9rem',
                  }}
                >
                  {activity.content} - {new Date(activity.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectHome;