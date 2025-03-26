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
  type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file';
  content: string;
  createdAt: string;
}

interface File {
  _id: string;
  url: string;
  name: string;
  uploadedBy: string;
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
  const [files, setFiles] = useState<File[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file'>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'settings' | 'activity' | 'files'>('home');
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
        if (response.data && response.data.data && response.data.data.project) {
          setProject(response.data.data.project);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (error: any) {
        console.error('Failed to fetch project:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || 'Failed to load project. Please ensure the backend server is running and the project exists.');
      }
    };

    const fetchFiles = async () => {
      try {
        // Mocked for now; in a real app, you'd have a backend endpoint like GET /files/project/:id
        setFiles([
          { _id: '1', url: 'https://via.placeholder.com/150', name: 'project-plan.pdf', uploadedBy: 'ArtificalManny', createdAt: new Date().toISOString() },
        ]);
      } catch (error) {
        console.error('Failed to fetch files:', error);
        setFiles([]);
      }
    };

    fetchProject();
    fetchFiles();

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
        setErrorMessage(error.response?.data?.error || 'Failed to upload image. Please ensure the backend server is running.');
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
    return <div className="error-message">{errorMessage}</div>;
  }

  if (!project) {
    return <div className="loading">Loading project...</div>;
  }

  const filteredActivities = activities.filter((activity) => activityFilter === 'all' || activity.type === activityFilter);

  return (
    <div className="project-container">
      <h2>{project.name}</h2>
      <p>{project.description || 'No description'}</p>
      <div className="project-tabs">
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('home')}>Home</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('upload')}>Upload</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('settings')}>Settings</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('activity')}>Activity Log</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('files')}>Files</button>
      </div>
      {activeTab === 'home' && (
        <div>
          {/* Task Management Section */}
          <div className="section glassmorphic">
            <h3>Tasks</h3>
            <form onSubmit={handleAddTask}>
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
              <button type="submit" className="neumorphic">Add Task</button>
            </form>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}
            {tasks.length === 0 ? (
              <p>No tasks yet. Add a task to get started!</p>
            ) : (
              <div className="task-grid">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="project-card glassmorphic"
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
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                    {/* Subtasks Section */}
                    <div className="subtasks">
                      <h5>Subtasks</h5>
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <ul className="subtask-list">
                          {task.subtasks.map((subtask) => (
                            <li
                              key={subtask._id}
                            >
                              <div>
                                <strong>{subtask.title}</strong>
                                <p>{subtask.description}</p>
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
                        <p>No subtasks yet.</p>
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
                        <button type="submit" className="neumorphic">Add Subtask</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Posts Section */}
          <div className="section glassmorphic">
            <h3>Posts</h3>
            <form onSubmit={handleAddPost}>
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
              <button type="submit" className="neumorphic">Post</button>
            </form>
            {posts.length === 0 ? (
              <p>No posts yet. Share an update!</p>
            ) : (
              <div className="post-grid">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="project-card glassmorphic"
                    style={{ borderLeft: '4px solid var(--primary-color)' }}
                  >
                    <div className="post-header">
                      <div
                        className="post-author-pic"
                      >
                        {post.author[0]}
                      </div>
                      <div>
                        <p>{post.author}</p>
                        <p>
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p>{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post"
                        className="post-image"
                      />
                    )}
                    <div className="post-actions">
                      <button
                        onClick={() => handleLikePost(post._id!)}
                        className="neumorphic"
                        style={{
                          background: post.likes.includes(user?.username || '') ? 'var(--primary-color)' : 'var(--card-background)',
                          color: post.likes.includes(user?.username || '') ? '#fff' : 'var(--text-color)',
                        }}
                      >
                        Like ({post.likes.length})
                      </button>
                      <button className="neumorphic">
                        Comment ({post.comments.length})
                      </button>
                    </div>
                    {/* Comments Section */}
                    <div className="comments">
                      {post.comments.length > 0 && (
                        <ul className="comment-list">
                          {post.comments.map((comment) => (
                            <li
                              key={comment._id}
                            >
                              <div
                                className="comment-author-pic"
                              >
                                {comment.author[0]}
                              </div>
                              <div>
                                <p>{comment.author}</p>
                                <p>{comment.content}</p>
                                <p>
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
                        <button type="submit" className="neumorphic">Comment</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'upload' && <Upload projects={projects} />}
      {activeTab === 'settings' && <Settings />}
      {activeTab === 'activity' && (
        <div className="section glassmorphic">
          <h3>Activity Log</h3>
          <div className="activity-filters">
            <button onClick={() => setActivityFilter('all')} className="neumorphic" style={{ background: activityFilter === 'all' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              All
            </button>
            <button onClick={() => setActivityFilter('post')} className="neumorphic" style={{ background: activityFilter === 'post' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Posts
            </button>
            <button onClick={() => setActivityFilter('comment')} className="neumorphic" style={{ background: activityFilter === 'comment' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Comments
            </button>
            <button onClick={() => setActivityFilter('like')} className="neumorphic" style={{ background: activityFilter === 'like' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Likes
            </button>
            <button onClick={() => setActivityFilter('task')} className="neumorphic" style={{ background: activityFilter === 'task' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Tasks
            </button>
            <button onClick={() => setActivityFilter('subtask')} className="neumorphic" style={{ background: activityFilter === 'subtask' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Subtasks
            </button>
            <button onClick={() => setActivityFilter('file')} className="neumorphic" style={{ background: activityFilter === 'file' ? 'var(--primary-color)' : 'var(--card-background)' }}>
              Files
            </button>
          </div>
          {filteredActivities.length === 0 ? (
            <p>No activities to display.</p>
          ) : (
            <ul className="activity-list">
              {filteredActivities.map((activity) => (
                <li
                  key={activity._id}
                >
                  {activity.content} - {new Date(activity.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === 'files' && (
        <div className="section glassmorphic">
          <h3>Files</h3>
          {files.length === 0 ? (
            <p>No files uploaded yet.</p>
          ) : (
            <div className="file-grid">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="project-card glassmorphic"
                  style={{ borderLeft: '4px solid var(--primary-color)' }}
                >
                  <div className="file-header">
                    <div
                      className="file-author-pic"
                    >
                      {file.uploadedBy[0]}
                    </div>
                    <div>
                      <p>{file.uploadedBy}</p>
                      <p>
                        {new Date(file.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p>{file.name}</p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectHome;