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
  memberRequests?: { userId: string; requestedBy: string; status: 'pending' | 'approved' | 'denied' }[];
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
  projectId: string;
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
  type: 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'project_create' | 'member_request' | 'member_approved';
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

interface TimelineEvent {
  _id: string;
  type: 'task' | 'post' | 'file' | 'comment' | 'member_request' | 'member_approved';
  content: string;
  createdAt: string;
}

interface TeamMember {
  userId: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  username: string;
  profilePic?: string;
  email?: string;
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
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'post' | 'comment' | 'like' | 'task' | 'subtask' | 'file' | 'member_request' | 'member_approved'>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'upload' | 'settings' | 'activity' | 'files' | 'timeline' | 'team'>('home');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState<{ username: string; _id: string; email?: string } | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [badges, setBadges] = useState<string[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingTimelineEvent, setEditingTimelineEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log(`Fetching project with ID: ${id}`);
        const response = await axios.get(`http://localhost:3000/projects/by-id/${id}`);
        console.log('Fetch project response:', response.data);
        if (response.data && response.data.data && response.data.data.project) {
          const fetchedProject = response.data.data.project;
          setProject(fetchedProject);

          // Populate team members with email addresses
          const members: TeamMember[] = [];
          if (fetchedProject.admin) {
            const adminResponse = await axios.get(`http://localhost:3000/users/by-username/${fetchedProject.admin}`);
            const adminUser = adminResponse.data.data.user;
            members.push({
              userId: adminUser._id,
              username: fetchedProject.admin,
              role: 'Admin',
              profilePic: adminUser.profilePic || 'https://via.placeholder.com/40',
              email: adminUser.email,
            });
          }
          if (fetchedProject.sharedWith && fetchedProject.sharedWith.length > 0) {
            for (const member of fetchedProject.sharedWith) {
              const userResponse = await axios.get(`http://localhost:3000/users/by-username/${member.userId}`);
              const memberUser = userResponse.data.data.user;
              members.push({
                userId: memberUser._id,
                username: member.userId,
                role: member.role,
                profilePic: memberUser.profilePic || 'https://via.placeholder.com/40',
                email: memberUser.email,
              });
            }
          }
          setTeamMembers(members);
        } else {
          throw new Error('Invalid response structure');
        }
      } catch (error: any) {
        console.error('Failed to fetch project:', error.response?.data || error.message);
        setErrorMessage(error.response?.data?.error || `Failed to load project with ID ${id}. Please ensure the project exists in the database.`);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/posts/project/${id}`);
        setPosts(response.data || []);
      } catch (error: any) {
        console.error('Failed to fetch posts:', error.response?.data || error.message);
        setPosts([]);
      }
    };

    const fetchFiles = async () => {
      try {
        setFiles([
          { _id: '1', url: 'https://via.placeholder.com/150', name: 'project-plan.pdf', uploadedBy: 'ArtificalManny', createdAt: new Date().toISOString() },
        ]);
      } catch (error) {
        console.error('Failed to fetch files:', error);
        setFiles([]);
      }
    };

    const fetchActivities = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/activities/project/${id}`);
        setActivities(response.data || []);
      } catch (error: any) {
        console.error('Failed to fetch activities:', error.response?.data || error.message);
        setActivities([]);
      }
    };

    const fetchTimelineEvents = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/activities/project/${id}`);
        const events = response.data.map((activity: Activity) => ({
          _id: activity._id,
          type: activity.type,
          content: activity.content,
          createdAt: activity.createdAt,
        }));
        setTimelineEvents(events || []);
      } catch (error: any) {
        console.error('Failed to fetch timeline events:', error.response?.data || error.message);
        setTimelineEvents([]);
      }
    };

    fetchProject();
    fetchPosts();
    fetchFiles();
    fetchActivities();
    fetchTimelineEvents();

    // Fetch tasks (mocked for now)
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
    const taskId = `${tasks.length + 1}`;
    setTasks([...tasks, { ...newTask, _id: taskId }]);
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'task', content: `${user?.username} created task "${newTaskTitle}"`, createdAt: new Date().toISOString() },
    ]);
    setTimelineEvents([
      ...timelineEvents,
      { _id: `${timelineEvents.length + 1}`, type: 'task', content: `${user?.username} created task "${newTaskTitle}"`, createdAt: new Date().toISOString() },
    ]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskAssignedTo([]);
    setSuccessMessage('Task added successfully');
    setErrorMessage('');
    // Notify project members
    notifyProjectMembers({
      type: 'task',
      content: `${user?.username} created task "${newTaskTitle}" in project "${project?.name}"`,
      projectId: id!,
    });
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    setTasks(tasks.map((task) => (task._id === taskId ? { ...task, status: newStatus } : task)));
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'task', content: `${user?.username} updated task status to "${newStatus}"`, createdAt: new Date().toISOString() },
    ]);
    setTimelineEvents([
      ...timelineEvents,
      { _id: `${timelineEvents.length + 1}`, type: 'task', content: `${user?.username} updated task status to "${newStatus}"`, createdAt: new Date().toISOString() },
    ]);
    if (newStatus === 'Done') {
      if (!badges.includes('Task Master')) {
        setBadges([...badges, 'Task Master']);
        setSuccessMessage('🎉 Congratulations! You earned the "Task Master" badge for completing a task!');
      }
    }
    // Notify project members
    notifyProjectMembers({
      type: 'task',
      content: `${user?.username} updated task status to "${newStatus}" in project "${project?.name}"`,
      projectId: id!,
    });
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
    setTimelineEvents([
      ...timelineEvents,
      { _id: `${timelineEvents.length + 1}`, type: 'task', content: `${user?.username} added subtask "${subtaskTitle}"`, createdAt: new Date().toISOString() },
    ]);
    // Notify project members
    notifyProjectMembers({
      type: 'subtask',
      content: `${user?.username} added subtask "${subtaskTitle}" in project "${project?.name}"`,
      projectId: id!,
    });
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
    setTimelineEvents([
      ...timelineEvents,
      { _id: `${timelineEvents.length + 1}`, type: 'task', content: `${user?.username} updated subtask status to "${newStatus}"`, createdAt: new Date().toISOString() },
    ]);
    // Notify project members
    notifyProjectMembers({
      type: 'subtask',
      content: `${user?.username} updated subtask status to "${newStatus}" in project "${project?.name}"`,
      projectId: id!,
    });
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
      projectId: id!,
      content: newPostContent,
      image: imageUrl,
      author: user?.username || 'Unknown',
      createdAt: new Date().toISOString(),
      likes: [],
      comments: [],
    };
    try {
      const response = await axios.post('http://localhost:3000/posts', newPost);
      const createdPost = response.data;
      setPosts([createdPost, ...posts]);
      setActivities([
        ...activities,
        { _id: `${activities.length + 1}`, type: 'post', content: `${user?.username} posted an update`, createdAt: new Date().toISOString() },
      ]);
      setTimelineEvents([
        ...timelineEvents,
        { _id: `${timelineEvents.length + 1}`, type: 'post', content: `${user?.username} posted an update`, createdAt: new Date().toISOString() },
      ]);
      setNewPostContent('');
      setNewPostImage(null);
      setSuccessMessage('Post created successfully');
      setErrorMessage('');
      // Notify project members
      notifyProjectMembers({
        type: 'post',
        content: `${user?.username} posted an update in project "${project?.name}"`,
        projectId: id!,
      });
    } catch (error: any) {
      console.error('Create post error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'Failed to create post. Please ensure the backend server is running.');
    }
  };

  const handleLikePost = async (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    if (!post) return;
    const updatedLikes = post.likes.includes(user?.username || '')
      ? post.likes.filter((username) => username !== user?.username)
      : [...post.likes, user?.username || ''];
    try {
      const response = await axios.put(`http://localhost:3000/posts/${postId}`, { likes: updatedLikes });
      const updatedPost = response.data;
      setPosts(posts.map((p) => (p._id === postId ? updatedPost : p)));
      setActivities([
        ...activities,
        { _id: `${activities.length + 1}`, type: 'like', content: `${user?.username} liked a post`, createdAt: new Date().toISOString() },
      ]);
      setTimelineEvents([
        ...timelineEvents,
        { _id: `${timelineEvents.length + 1}`, type: 'post', content: `${user?.username} liked a post`, createdAt: new Date().toISOString() },
      ]);
      // Notify project members
      notifyProjectMembers({
        type: 'like',
        content: `${user?.username} liked a post in project "${project?.name}"`,
        projectId: id!,
      });
    } catch (error: any) {
      console.error('Like post error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'Failed to like post.');
    }
  };

  const handleAddComment = async (postId: string, commentContent: string) => {
    const post = posts.find((p) => p._id === postId);
    if (!post) return;
    const newComment: Comment = {
      content: commentContent,
      author: user?.username || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...post.comments, { ...newComment, _id: `${postId}-${post.comments.length + 1}` }];
    try {
      const response = await axios.put(`http://localhost:3000/posts/${postId}`, { comments: updatedComments });
      const updatedPost = response.data;
      setPosts(posts.map((p) => (p._id === postId ? updatedPost : p)));
      setActivities([
        ...activities,
        { _id: `${activities.length + 1}`, type: 'comment', content: `${user?.username} commented on a post`, createdAt: new Date().toISOString() },
      ]);
      setTimelineEvents([
        ...timelineEvents,
        { _id: `${timelineEvents.length + 1}`, type: 'comment', content: `${user?.username} commented on a post`, createdAt: new Date().toISOString() },
      ]);
      // Notify project members
      notifyProjectMembers({
        type: 'comment',
        content: `${user?.username} commented on a post in project "${project?.name}"`,
        projectId: id!,
      });
    } catch (error: any) {
      console.error('Add comment error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'Failed to add comment.');
    }
  };

  // Admin Functions
  const handleDeleteTask = async (taskId: string) => {
    if (!isAdmin()) return;
    setTasks(tasks.filter((task) => task._id !== taskId));
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'task', content: `${user?.username} deleted a task`, createdAt: new Date().toISOString() },
    ]);
    setTimelineEvents([
      ...timelineEvents,
      { _id: `${timelineEvents.length + 1}`, type: 'task', content: `${user?.username} deleted a task`, createdAt: new Date().toISOString() },
    ]);
    // Notify project members
    notifyProjectMembers({
      type: 'task',
      content: `${user?.username} deleted a task in project "${project?.name}"`,
      projectId: id!,
    });
  };

  const handleEditTask = async (taskId: string, updatedTask: Partial<Task>) => {
    if (!isAdmin()) return;
    setTasks(tasks.map((task) => (task._id === taskId ? { ...task, ...updatedTask } : task)));
    setEditingTask(null);
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'task', content: `${user?.username} edited a task`, createdAt: new Date().toISOString() },
    ]);
    setTimelineEvents([
      ...timelineEvents,
      { _id: `${timelineEvents.length + 1}`, type: 'task', content: `${user?.username} edited a task`, createdAt: new Date().toISOString() },
    ]);
    // Notify project members
    notifyProjectMembers({
      type: 'task',
      content: `${user?.username} edited a task in project "${project?.name}"`,
      projectId: id!,
    });
  };

  const handleEditTimelineEvent = async (eventId: string, updatedContent: string) => {
    if (!isAdmin()) return;
    setTimelineEvents(timelineEvents.map((event) => (event._id === eventId ? { ...event, content: updatedContent } : event)));
    setEditingTimelineEvent(null);
    setActivities([
      ...activities,
      { _id: `${activities.length + 1}`, type: 'timeline', content: `${user?.username} edited a timeline event`, createdAt: new Date().toISOString() },
    ]);
    // Notify project members
    notifyProjectMembers({
      type: 'timeline',
      content: `${user?.username} edited a timeline event in project "${project?.name}"`,
      projectId: id!,
    });
  };

  const handleMemberRequest = async (request: { userId: string; requestedBy: string }, action: 'approve' | 'deny') => {
    if (!isAdmin()) return;
    try {
      const updatedProject = {
        ...project,
        memberRequests: project?.memberRequests?.map((req) =>
          req.userId === request.userId && req.requestedBy === request.requestedBy
            ? { ...req, status: action === 'approve' ? 'approved' : 'denied' }
            : req
        ),
        sharedWith: action === 'approve'
          ? [...(project?.sharedWith || []), { userId: request.userId, role: 'Viewer' }]
          : project?.sharedWith,
      };
      const response = await axios.put(`http://localhost:3000/projects/${id}`, updatedProject);
      setProject(response.data);
      if (action === 'approve') {
        const userResponse = await axios.get(`http://localhost:3000/users/by-username/${request.userId}`);
        const newMember = userResponse.data.data.user;
        setTeamMembers([
          ...teamMembers,
          {
            userId: newMember._id,
            username: request.userId,
            role: 'Viewer',
            profilePic: newMember.profilePic || 'https://via.placeholder.com/40',
            email: newMember.email,
          },
        ]);
      }
      setActivities([
        ...activities,
        {
          _id: `${activities.length + 1}`,
          type: 'member_approved',
          content: `${user?.username} ${action === 'approve' ? 'approved' : 'denied'} a member request from ${request.requestedBy} for ${request.userId}`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setTimelineEvents([
        ...timelineEvents,
        {
          _id: `${timelineEvents.length + 1}`,
          type: 'member_approved',
          content: `${user?.username} ${action === 'approve' ? 'approved' : 'denied'} a member request from ${request.requestedBy} for ${request.userId}`,
          createdAt: new Date().toISOString(),
        },
      ]);
      // Notify project members
      notifyProjectMembers({
        type: 'member_approved',
        content: `${user?.username} ${action === 'approve' ? 'approved' : 'denied'} a member request from ${request.requestedBy} for ${request.userId} in project "${project?.name}"`,
        projectId: id!,
      });
    } catch (error: any) {
      console.error('Member request error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'Failed to process member request.');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3000/users/by-email/${newMemberEmail}`);
      const invitedUser = response.data.data.user;
      if (!invitedUser) {
        setErrorMessage('User not found.');
        return;
      }
      const updatedProject = {
        ...project,
        memberRequests: [
          ...(project?.memberRequests || []),
          { userId: invitedUser.username, requestedBy: user?.username, status: 'pending' },
        ],
      };
      const projectResponse = await axios.put(`http://localhost:3000/projects/${id}`, updatedProject);
      setProject(projectResponse.data);
      setActivities([
        ...activities,
        {
          _id: `${activities.length + 1}`,
          type: 'member_request',
          content: `${user?.username} invited ${invitedUser.username} to the project`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setTimelineEvents([
        ...timelineEvents,
        {
          _id: `${timelineEvents.length + 1}`,
          type: 'member_request',
          content: `${user?.username} invited ${invitedUser.username} to the project`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewMemberEmail('');
      setSuccessMessage('Invitation sent successfully.');
      // Notify project members
      notifyProjectMembers({
        type: 'member_request',
        content: `${user?.username} invited ${invitedUser.username} to project "${project?.name}"`,
        projectId: id!,
      });
      // Notify the invited user
      await axios.post('http://localhost:3000/notifications', {
        userId: invitedUser._id,
        message: `${user?.username} invited you to project "${project?.name}"`,
        type: 'project_invite',
        projectId: id,
        action: 'accept',
        status: 'pending',
      });
    } catch (error: any) {
      console.error('Invite member error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || 'Failed to invite member.');
    }
  };

  // Helper Functions
  const isAdmin = () => {
    return project?.admin === user?.username || project?.sharedWith?.some((member) => member.userId === user?.username && member.role === 'Admin');
  };

  const notifyProjectMembers = async (activity: { type: string; content: string; projectId: string }) => {
    try {
      // Log activity
      await axios.post('http://localhost:3000/activities', {
        userId: user?._id,
        type: activity.type,
        content: activity.content,
        projectId: activity.projectId,
      });

      // Send notifications to project members
      const members = [project?.admin, ...(project?.sharedWith?.map((m) => m.userId) || [])].filter((m) => m !== user?.username);
      for (const member of members) {
        const memberUser = teamMembers.find((m) => m.username === member);
        if (memberUser) {
          await axios.post('http://localhost:3000/notifications', {
            userId: memberUser.userId,
            message: activity.content,
            type: activity.type,
            projectId: activity.projectId,
          });
          // Send email (mocked for now; implement with a service like SendGrid in production)
          console.log(`Sending email to ${memberUser.email}: ${activity.content}`);
        }
      }
    } catch (error: any) {
      console.error('Notification error:', error.response?.data || error.message);
    }
  };

  // Calculate project progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'Done').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

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
      {/* Project Summary Section */}
      <div className="section glassmorphic project-summary">
        <h3>Project Summary</h3>
        <p>Total Tasks: {totalTasks}</p>
        <p>Completed Tasks: {completedTasks}</p>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }}></div>
        </div>
        <p>Progress: {progress.toFixed(1)}%</p>
        {badges.length > 0 && (
          <div className="badges">
            <h4>Your Badges</h4>
            <ul>
              {badges.map((badge, index) => (
                <li key={index} className="badge">{badge}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="project-tabs">
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('home')}>Home</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('upload')}>Upload</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('settings')}>Settings</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('activity')}>Activity Log</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('files')}>Files</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('timeline')}>Timeline</button>
        <button className="tab-button glassmorphic" onClick={() => setActiveTab('team')}>Team Members</button>
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
                  {teamMembers.map((member) => (
                    <option key={member.userId} value={member.username}>{member.username}</option>
                  ))}
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
                    {editingTask && editingTask._id === task._id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleEditTask(task._id!, {
                            title: editingTask.title,
                            description: editingTask.description,
                            assignedTo: editingTask.assignedTo,
                          });
                        }}
                      >
                        <div className="form-group">
                          <label htmlFor={`editTaskTitle-${task._id}`}>Task Title</label>
                          <input
                            id={`editTaskTitle-${task._id}`}
                            type="text"
                            value={editingTask.title}
                            onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`editTaskDescription-${task._id}`}>Description</label>
                          <textarea
                            id={`editTaskDescription-${task._id}`}
                            value={editingTask.description}
                            onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                            required
                            rows={3}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor={`editTaskAssignedTo-${task._id}`}>Assign To</label>
                          <select
                            id={`editTaskAssignedTo-${task._id}`}
                            multiple
                            value={editingTask.assignedTo || []}
                            onChange={(e) => setEditingTask({ ...editingTask, assignedTo: Array.from(e.target.selectedOptions, (option) => option.value) })}
                          >
                            {teamMembers.map((member) => (
                              <option key={member.userId} value={member.username}>{member.username}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="neumorphic">Save</button>
                          <button type="button" className="neumorphic" onClick={() => setEditingTask(null)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
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
                        {isAdmin() && (
                          <div className="task-actions">
                            <button
                              className="neumorphic"
                              onClick={() => setEditingTask(task)}
                            >
                              Edit
                            </button>
                            <button
                              className="neumorphic"
                              onClick={() => handleDeleteTask(task._id!)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {/* Subtasks Section */}
                        <div className="subtasks">
                          <h5>Subtasks</h5>
                          {task.subtasks && task.subtasks.length > 0 ? (
                            <ul className="subtask-list">
                              {task.subtasks.map((subtask) => (
                                <li key={subtask._id}>
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
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Social Feed Section */}
          <div className="section glassmorphic">
            <h3>Project Feed</h3>
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
              <p>No posts yet. Share an update to get started!</p>
            ) : (
              <div className="post-grid">
                {posts.map((post) => (
                  <div key={post._id} className="project-card glassmorphic">
                    <div className="post-header">
                      <div className="post-author-pic">{post.author[0]}</div>
                      <div>
                        <p>{post.author}</p>
                        <p>{new Date(post.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p>{post.content}</p>
                    {post.image && <img src={post.image} alt="Post" className="post-image" />}
                    <div className="post-actions">
                      <button
                        className="neumorphic"
                        onClick={() => handleLikePost(post._id!)}
                      >
                        {post.likes.includes(user?.username || '') ? 'Unlike' : 'Like'} ({post.likes.length})
                      </button>
                    </div>
                    <div className="comments">
                      <h5>Comments</h5>
                      {post.comments.length === 0 ? (
                        <p>No comments yet.</p>
                      ) : (
                        <ul className="comment-list">
                          {post.comments.map((comment) => (
                            <li key={comment._id}>
                              <div className="comment-author-pic">{comment.author[0]}</div>
                              <div>
                                <p>{comment.author}</p>
                                <p>{comment.content}</p>
                                <p>{new Date(comment.createdAt).toLocaleString()}</p>
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
      {activeTab === 'upload' && (
        <Upload projects={projects} />
      )}
      {activeTab === 'settings' && (
        <Settings />
      )}
      {activeTab === 'activity' && (
        <div className="section glassmorphic">
          <h3>Activity Log</h3>
          <div className="activity-filters">
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('all')}
            >
              All
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('post')}
            >
              Posts
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('comment')}
            >
              Comments
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('like')}
            >
              Likes
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('task')}
            >
              Tasks
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('subtask')}
            >
              Subtasks
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('file')}
            >
              Files
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('member_request')}
            >
              Member Requests
            </button>
            <button
              className="tab-button glassmorphic"
              onClick={() => setActivityFilter('member_approved')}
            >
              Member Approvals
            </button>
          </div>
          {filteredActivities.length === 0 ? (
            <p>No activities to display.</p>
          ) : (
            <ul className="activity-list">
              {filteredActivities.map((activity) => (
                <li key={activity._id}>
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
                <div key={file._id} className="project-card glassmorphic">
                  <div className="file-header">
                    <div className="file-author-pic">{file.uploadedBy[0]}</div>
                    <div>
                      <p>{file.uploadedBy}</p>
                      <p>{new Date(file.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <p>{file.name}</p>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'timeline' && (
        <div className="section glassmorphic">
          <h3>Project Timeline</h3>
          {timelineEvents.length === 0 ? (
            <p>No events in the timeline yet.</p>
          ) : (
            <div className="timeline">
              {timelineEvents
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((event) => (
                  <div key={event._id} className="timeline-event">
                    <div className="timeline-icon">
                      {event.type === 'task' && '📋'}
                      {event.type === 'post' && '📝'}
                      {event.type === 'file' && '📁'}
                      {event.type === 'comment' && '💬'}
                      {event.type === 'member_request' && '📩'}
                      {event.type === 'member_approved' && '✅'}
                    </div>
                    {editingTimelineEvent && editingTimelineEvent._id === event._id ? (
                      <div className="timeline-content">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditTimelineEvent(event._id, editingTimelineEvent.content);
                          }}
                        >
                          <input
                            type="text"
                            value={editingTimelineEvent.content}
                            onChange={(e) => setEditingTimelineEvent({ ...editingTimelineEvent, content: e.target.value })}
                            required
                          />
                          <div className="form-actions">
                            <button type="submit" className="neumorphic">Save</button>
                            <button type="button" className="neumorphic" onClick={() => setEditingTimelineEvent(null)}>Cancel</button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="timeline-content">
                        <p>{event.content}</p>
                        <p className="timeline-date">{new Date(event.createdAt).toLocaleString()}</p>
                        {isAdmin() && (
                          <button
                            className="neumorphic"
                            onClick={() => setEditingTimelineEvent(event)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'team' && (
        <div className="section glassmorphic">
          <h3>Team Members ({teamMembers.length})</h3>
          <form onSubmit={handleInviteMember}>
            <div className="form-group">
              <label htmlFor="newMemberEmail">Invite New Member</label>
              <input
                id="newMemberEmail"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <button type="submit" className="neumorphic">Invite</button>
          </form>
          {teamMembers.length === 0 ? (
            <p>No team members yet.</p>
          ) : (
            <div className="team-members-grid">
              {teamMembers.map((member) => (
                <div key={member.userId} className="team-member-card glassmorphic">
                  {member.profilePic ? (
                    <img src={member.profilePic} alt="Profile" className="team-member-pic" />
                  ) : (
                    <div className="team-member-pic-placeholder">
                      {member.username[0]}
                    </div>
                  )}
                  <p>{member.username}</p>
                  <p className="team-member-role">{member.role}</p>
                </div>
              ))}
            </div>
          )}
          {project.memberRequests && project.memberRequests.length > 0 && isAdmin() && (
            <div className="section glassmorphic">
              <h4>Member Requests</h4>
              <ul className="member-requests-list">
                {project.memberRequests
                  .filter((req) => req.status === 'pending')
                  .map((request, index) => (
                    <li key={index}>
                      <p>{request.requestedBy} invited {request.userId}</p>
                      <div className="form-actions">
                        <button
                          className="neumorphic accept"
                          onClick={() => handleMemberRequest(request, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="neumorphic decline"
                          onClick={() => handleMemberRequest(request, 'deny')}
                        >
                          Deny
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectHome;