import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Upload from '../Upload';
import Settings from '../Settings';
const ProjectHome = ({ projects }) => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskAssignedTo, setNewTaskAssignedTo] = useState([]);
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState(null);
    const [activities, setActivities] = useState([]);
    const [files, setFiles] = useState([]);
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [activityFilter, setActivityFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('home');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [badges, setBadges] = useState([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [editingTask, setEditingTask] = useState(null);
    const [editingTimelineEvent, setEditingTimelineEvent] = useState(null);
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
                    const members = [];
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
                }
                else {
                    throw new Error('Invalid response structure');
                }
            }
            catch (error) {
                console.error('Failed to fetch project:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.error || `Failed to load project with ID ${id}. Please ensure the project exists in the database.`);
            }
        };
        const fetchPosts = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/posts/project/${id}`);
                setPosts(response.data || []);
            }
            catch (error) {
                console.error('Failed to fetch posts:', error.response?.data || error.message);
                setPosts([]);
            }
        };
        const fetchFiles = async () => {
            try {
                setFiles([
                    { _id: '1', url: 'https://via.placeholder.com/150', name: 'project-plan.pdf', uploadedBy: 'ArtificalManny', createdAt: new Date().toISOString() },
                ]);
            }
            catch (error) {
                console.error('Failed to fetch files:', error);
                setFiles([]);
            }
        };
        const fetchActivities = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/activities/project/${id}`);
                setActivities(response.data || []);
            }
            catch (error) {
                console.error('Failed to fetch activities:', error.response?.data || error.message);
                setActivities([]);
            }
        };
        const fetchTimelineEvents = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/activities/project/${id}`);
                const events = response.data.map((activity) => ({
                    _id: activity._id,
                    type: activity.type,
                    content: activity.content,
                    createdAt: activity.createdAt,
                }));
                setTimelineEvents(events || []);
            }
            catch (error) {
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
                projectId: id,
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
                projectId: id,
                assignedTo: ['ArtificalManny'],
                subtasks: [],
            },
        ]);
    }, [id]);
    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle || !newTaskDescription) {
            setErrorMessage('Please fill in all fields');
            return;
        }
        const newTask = {
            title: newTaskTitle,
            description: newTaskDescription,
            status: 'To Do',
            projectId: id,
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
            projectId: id,
        });
    };
    const handleUpdateTaskStatus = (taskId, newStatus) => {
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
            projectId: id,
        });
    };
    const handleAddSubtask = (taskId, subtaskTitle, subtaskDescription) => {
        setTasks(tasks.map((task) => task._id === taskId
            ? {
                ...task,
                subtasks: [
                    ...(task.subtasks || []),
                    { _id: `${taskId}-${(task.subtasks?.length || 0) + 1}`, title: subtaskTitle, description: subtaskDescription, status: 'To Do' },
                ],
            }
            : task));
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
            projectId: id,
        });
    };
    const handleUpdateSubtaskStatus = (taskId, subtaskId, newStatus) => {
        setTasks(tasks.map((task) => task._id === taskId
            ? {
                ...task,
                subtasks: task.subtasks?.map((subtask) => subtask._id === subtaskId ? { ...subtask, status: newStatus } : subtask),
            }
            : task));
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
            projectId: id,
        });
    };
    const handleAddPost = async (e) => {
        e.preventDefault();
        let imageUrl = '';
        if (newPostImage) {
            const formData = new FormData();
            formData.append('file', newPostImage);
            try {
                const response = await axios.post('http://localhost:3000/uploads', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                imageUrl = response.data.url;
            }
            catch (error) {
                console.error('Image upload error:', error.response?.data || error.message);
                setErrorMessage(error.response?.data?.error || 'Failed to upload image. Please ensure the backend server is running.');
                return;
            }
        }
        const newPost = {
            projectId: id,
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
                projectId: id,
            });
        }
        catch (error) {
            console.error('Create post error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'Failed to create post. Please ensure the backend server is running.');
        }
    };
    const handleLikePost = async (postId) => {
        const post = posts.find((p) => p._id === postId);
        if (!post)
            return;
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
                projectId: id,
            });
        }
        catch (error) {
            console.error('Like post error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'Failed to like post.');
        }
    };
    const handleAddComment = async (postId, commentContent) => {
        const post = posts.find((p) => p._id === postId);
        if (!post)
            return;
        const newComment = {
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
                projectId: id,
            });
        }
        catch (error) {
            console.error('Add comment error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'Failed to add comment.');
        }
    };
    // Admin Functions
    const handleDeleteTask = async (taskId) => {
        if (!isAdmin())
            return;
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
            projectId: id,
        });
    };
    const handleEditTask = async (taskId, updatedTask) => {
        if (!isAdmin())
            return;
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
            projectId: id,
        });
    };
    const handleEditTimelineEvent = async (eventId, updatedContent) => {
        if (!isAdmin())
            return;
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
            projectId: id,
        });
    };
    const handleMemberRequest = async (request, action) => {
        if (!isAdmin())
            return;
        try {
            const updatedProject = {
                ...project,
                memberRequests: project?.memberRequests?.map((req) => req.userId === request.userId && req.requestedBy === request.requestedBy
                    ? { ...req, status: action === 'approve' ? 'approved' : 'denied' }
                    : req),
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
                projectId: id,
            });
        }
        catch (error) {
            console.error('Member request error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'Failed to process member request.');
        }
    };
    const handleInviteMember = async (e) => {
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
                projectId: id,
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
        }
        catch (error) {
            console.error('Invite member error:', error.response?.data || error.message);
            setErrorMessage(error.response?.data?.error || 'Failed to invite member.');
        }
    };
    // Helper Functions
    const isAdmin = () => {
        return project?.admin === user?.username || project?.sharedWith?.some((member) => member.userId === user?.username && member.role === 'Admin');
    };
    const notifyProjectMembers = async (activity) => {
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
        }
        catch (error) {
            console.error('Notification error:', error.response?.data || error.message);
        }
    };
    // Calculate project progress
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === 'Done').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    if (errorMessage) {
        return _jsx("div", { className: "error-message", children: errorMessage });
    }
    if (!project) {
        return _jsx("div", { className: "loading", children: "Loading project..." });
    }
    const filteredActivities = activities.filter((activity) => activityFilter === 'all' || activity.type === activityFilter);
    return (_jsxs("div", { className: "project-container", children: [_jsx("h2", { children: project.name }), _jsx("p", { children: project.description || 'No description' }), _jsxs("div", { className: "section glassmorphic project-summary", children: [_jsx("h3", { children: "Project Summary" }), _jsxs("p", { children: ["Total Tasks: ", totalTasks] }), _jsxs("p", { children: ["Completed Tasks: ", completedTasks] }), _jsx("div", { className: "progress-bar", children: _jsx("div", { className: "progress", style: { width: `${progress}%` } }) }), _jsxs("p", { children: ["Progress: ", progress.toFixed(1), "%"] }), badges.length > 0 && (_jsxs("div", { className: "badges", children: [_jsx("h4", { children: "Your Badges" }), _jsx("ul", { children: badges.map((badge, index) => (_jsx("li", { className: "badge", children: badge }, index))) })] }))] }), _jsxs("div", { className: "project-tabs", children: [_jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('home'), children: "Home" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('upload'), children: "Upload" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('settings'), children: "Settings" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('activity'), children: "Activity Log" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('files'), children: "Files" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('timeline'), children: "Timeline" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActiveTab('team'), children: "Team Members" })] }), activeTab === 'home' && (_jsxs("div", { children: [_jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Tasks" }), _jsxs("form", { onSubmit: handleAddTask, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "taskTitle", children: "Task Title" }), _jsx("input", { id: "taskTitle", type: "text", value: newTaskTitle, onChange: (e) => setNewTaskTitle(e.target.value), placeholder: "Enter task title", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "taskDescription", children: "Description" }), _jsx("textarea", { id: "taskDescription", value: newTaskDescription, onChange: (e) => setNewTaskDescription(e.target.value), placeholder: "Enter task description", required: true, rows: 3 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "taskAssignedTo", children: "Assign To" }), _jsx("select", { id: "taskAssignedTo", multiple: true, value: newTaskAssignedTo, onChange: (e) => setNewTaskAssignedTo(Array.from(e.target.selectedOptions, (option) => option.value)), children: teamMembers.map((member) => (_jsx("option", { value: member.username, children: member.username }, member.userId))) })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Add Task" })] }), errorMessage && _jsx("div", { className: "error-message", children: errorMessage }), successMessage && (_jsx("div", { className: "success-message", children: successMessage })), tasks.length === 0 ? (_jsx("p", { children: "No tasks yet. Add a task to get started!" })) : (_jsx("div", { className: "task-grid", children: tasks.map((task) => (_jsx("div", { className: "project-card glassmorphic", style: {
                                        borderLeft: `4px solid ${task.status === 'To Do' ? '#ff5555' : task.status === 'In Progress' ? '#ffa500' : '#4caf50'}`,
                                    }, children: editingTask && editingTask._id === task._id ? (_jsxs("form", { onSubmit: (e) => {
                                            e.preventDefault();
                                            handleEditTask(task._id, {
                                                title: editingTask.title,
                                                description: editingTask.description,
                                                assignedTo: editingTask.assignedTo,
                                            });
                                        }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `editTaskTitle-${task._id}`, children: "Task Title" }), _jsx("input", { id: `editTaskTitle-${task._id}`, type: "text", value: editingTask.title, onChange: (e) => setEditingTask({ ...editingTask, title: e.target.value }), required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `editTaskDescription-${task._id}`, children: "Description" }), _jsx("textarea", { id: `editTaskDescription-${task._id}`, value: editingTask.description, onChange: (e) => setEditingTask({ ...editingTask, description: e.target.value }), required: true, rows: 3 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `editTaskAssignedTo-${task._id}`, children: "Assign To" }), _jsx("select", { id: `editTaskAssignedTo-${task._id}`, multiple: true, value: editingTask.assignedTo || [], onChange: (e) => setEditingTask({ ...editingTask, assignedTo: Array.from(e.target.selectedOptions, (option) => option.value) }), children: teamMembers.map((member) => (_jsx("option", { value: member.username, children: member.username }, member.userId))) })] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "neumorphic", children: "Save" }), _jsx("button", { type: "button", className: "neumorphic", onClick: () => setEditingTask(null), children: "Cancel" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("h4", { children: task.title }), _jsx("p", { children: task.description }), _jsxs("p", { children: ["Assigned To: ", task.assignedTo?.join(', ') || 'None'] }), _jsxs("select", { value: task.status, onChange: (e) => handleUpdateTaskStatus(task._id, e.target.value), children: [_jsx("option", { value: "To Do", children: "To Do" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Done", children: "Done" })] }), isAdmin() && (_jsxs("div", { className: "task-actions", children: [_jsx("button", { className: "neumorphic", onClick: () => setEditingTask(task), children: "Edit" }), _jsx("button", { className: "neumorphic", onClick: () => handleDeleteTask(task._id), children: "Delete" })] })), _jsxs("div", { className: "subtasks", children: [_jsx("h5", { children: "Subtasks" }), task.subtasks && task.subtasks.length > 0 ? (_jsx("ul", { className: "subtask-list", children: task.subtasks.map((subtask) => (_jsxs("li", { children: [_jsxs("div", { children: [_jsx("strong", { children: subtask.title }), _jsx("p", { children: subtask.description })] }), _jsxs("select", { value: subtask.status, onChange: (e) => handleUpdateSubtaskStatus(task._id, subtask._id, e.target.value), children: [_jsx("option", { value: "To Do", children: "To Do" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Done", children: "Done" })] })] }, subtask._id))) })) : (_jsx("p", { children: "No subtasks yet." })), _jsxs("form", { onSubmit: (e) => {
                                                            e.preventDefault();
                                                            const subtaskTitle = e.target.subtaskTitle.value;
                                                            const subtaskDescription = e.target.subtaskDescription.value;
                                                            handleAddSubtask(task._id, subtaskTitle, subtaskDescription);
                                                            e.target.reset();
                                                        }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `subtaskTitle-${task._id}`, children: "Subtask Title" }), _jsx("input", { id: `subtaskTitle-${task._id}`, name: "subtaskTitle", type: "text", placeholder: "Enter subtask title", required: true })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `subtaskDescription-${task._id}`, children: "Description" }), _jsx("textarea", { id: `subtaskDescription-${task._id}`, name: "subtaskDescription", placeholder: "Enter subtask description", required: true, rows: 2 })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Add Subtask" })] })] })] })) }, task._id))) }))] }), _jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Project Feed" }), _jsxs("form", { onSubmit: handleAddPost, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "postContent", children: "What's on your mind?" }), _jsx("textarea", { id: "postContent", value: newPostContent, onChange: (e) => setNewPostContent(e.target.value), placeholder: "Share an update...", required: true, rows: 3 })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "postImage", children: "Add Image (optional)" }), _jsx("input", { id: "postImage", type: "file", accept: "image/*", onChange: (e) => setNewPostImage(e.target.files ? e.target.files[0] : null) })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Post" })] }), posts.length === 0 ? (_jsx("p", { children: "No posts yet. Share an update to get started!" })) : (_jsx("div", { className: "post-grid", children: posts.map((post) => (_jsxs("div", { className: "project-card glassmorphic", children: [_jsxs("div", { className: "post-header", children: [_jsx("div", { className: "post-author-pic", children: post.author[0] }), _jsxs("div", { children: [_jsx("p", { children: post.author }), _jsx("p", { children: new Date(post.createdAt).toLocaleString() })] })] }), _jsx("p", { children: post.content }), post.image && _jsx("img", { src: post.image, alt: "Post", className: "post-image" }), _jsx("div", { className: "post-actions", children: _jsxs("button", { className: "neumorphic", onClick: () => handleLikePost(post._id), children: [post.likes.includes(user?.username || '') ? 'Unlike' : 'Like', " (", post.likes.length, ")"] }) }), _jsxs("div", { className: "comments", children: [_jsx("h5", { children: "Comments" }), post.comments.length === 0 ? (_jsx("p", { children: "No comments yet." })) : (_jsx("ul", { className: "comment-list", children: post.comments.map((comment) => (_jsxs("li", { children: [_jsx("div", { className: "comment-author-pic", children: comment.author[0] }), _jsxs("div", { children: [_jsx("p", { children: comment.author }), _jsx("p", { children: comment.content }), _jsx("p", { children: new Date(comment.createdAt).toLocaleString() })] })] }, comment._id))) })), _jsxs("form", { onSubmit: (e) => {
                                                        e.preventDefault();
                                                        const commentContent = e.target.commentContent.value;
                                                        handleAddComment(post._id, commentContent);
                                                        e.target.reset();
                                                    }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: `commentContent-${post._id}`, children: "Add a Comment" }), _jsx("input", { id: `commentContent-${post._id}`, name: "commentContent", type: "text", placeholder: "Write a comment...", required: true })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Comment" })] })] })] }, post._id))) }))] })] })), activeTab === 'upload' && (_jsx(Upload, { projects: projects })), activeTab === 'settings' && (_jsx(Settings, {})), activeTab === 'activity' && (_jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Activity Log" }), _jsxs("div", { className: "activity-filters", children: [_jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('all'), children: "All" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('post'), children: "Posts" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('comment'), children: "Comments" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('like'), children: "Likes" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('task'), children: "Tasks" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('subtask'), children: "Subtasks" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('file'), children: "Files" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('member_request'), children: "Member Requests" }), _jsx("button", { className: "tab-button glassmorphic", onClick: () => setActivityFilter('member_approved'), children: "Member Approvals" })] }), filteredActivities.length === 0 ? (_jsx("p", { children: "No activities to display." })) : (_jsx("ul", { className: "activity-list", children: filteredActivities.map((activity) => (_jsxs("li", { children: [activity.content, " - ", new Date(activity.createdAt).toLocaleString()] }, activity._id))) }))] })), activeTab === 'files' && (_jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Files" }), files.length === 0 ? (_jsx("p", { children: "No files uploaded yet." })) : (_jsx("div", { className: "file-grid", children: files.map((file) => (_jsxs("div", { className: "project-card glassmorphic", children: [_jsxs("div", { className: "file-header", children: [_jsx("div", { className: "file-author-pic", children: file.uploadedBy[0] }), _jsxs("div", { children: [_jsx("p", { children: file.uploadedBy }), _jsx("p", { children: new Date(file.createdAt).toLocaleString() })] })] }), _jsx("p", { children: file.name }), _jsx("a", { href: file.url, target: "_blank", rel: "noopener noreferrer", children: "Download" })] }, file._id))) }))] })), activeTab === 'timeline' && (_jsxs("div", { className: "section glassmorphic", children: [_jsx("h3", { children: "Project Timeline" }), timelineEvents.length === 0 ? (_jsx("p", { children: "No events in the timeline yet." })) : (_jsx("div", { className: "timeline", children: timelineEvents
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((event) => (_jsxs("div", { className: "timeline-event", children: [_jsxs("div", { className: "timeline-icon", children: [event.type === 'task' && '📋', event.type === 'post' && '📝', event.type === 'file' && '📁', event.type === 'comment' && '💬', event.type === 'member_request' && '📩', event.type === 'member_approved' && '✅'] }), editingTimelineEvent && editingTimelineEvent._id === event._id ? (_jsx("div", { className: "timeline-content", children: _jsxs("form", { onSubmit: (e) => {
                                            e.preventDefault();
                                            handleEditTimelineEvent(event._id, editingTimelineEvent.content);
                                        }, children: [_jsx("input", { type: "text", value: editingTimelineEvent.content, onChange: (e) => setEditingTimelineEvent({ ...editingTimelineEvent, content: e.target.value }), required: true }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { type: "submit", className: "neumorphic", children: "Save" }), _jsx("button", { type: "button", className: "neumorphic", onClick: () => setEditingTimelineEvent(null), children: "Cancel" })] })] }) })) : (_jsxs("div", { className: "timeline-content", children: [_jsx("p", { children: event.content }), _jsx("p", { className: "timeline-date", children: new Date(event.createdAt).toLocaleString() }), isAdmin() && (_jsx("button", { className: "neumorphic", onClick: () => setEditingTimelineEvent(event), children: "Edit" }))] }))] }, event._id))) }))] })), activeTab === 'team' && (_jsxs("div", { className: "section glassmorphic", children: [_jsxs("h3", { children: ["Team Members (", teamMembers.length, ")"] }), _jsxs("form", { onSubmit: handleInviteMember, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "newMemberEmail", children: "Invite New Member" }), _jsx("input", { id: "newMemberEmail", type: "email", value: newMemberEmail, onChange: (e) => setNewMemberEmail(e.target.value), placeholder: "Enter email address" })] }), _jsx("button", { type: "submit", className: "neumorphic", children: "Invite" })] }), teamMembers.length === 0 ? (_jsx("p", { children: "No team members yet." })) : (_jsx("div", { className: "team-members-grid", children: teamMembers.map((member) => (_jsxs("div", { className: "team-member-card glassmorphic", children: [member.profilePic ? (_jsx("img", { src: member.profilePic, alt: "Profile", className: "team-member-pic" })) : (_jsx("div", { className: "team-member-pic-placeholder", children: member.username[0] })), _jsx("p", { children: member.username }), _jsx("p", { className: "team-member-role", children: member.role })] }, member.userId))) })), project.memberRequests && project.memberRequests.length > 0 && isAdmin() && (_jsxs("div", { className: "section glassmorphic", children: [_jsx("h4", { children: "Member Requests" }), _jsx("ul", { className: "member-requests-list", children: project.memberRequests
                                    .filter((req) => req.status === 'pending')
                                    .map((request, index) => (_jsxs("li", { children: [_jsxs("p", { children: [request.requestedBy, " invited ", request.userId] }), _jsxs("div", { className: "form-actions", children: [_jsx("button", { className: "neumorphic accept", onClick: () => handleMemberRequest(request, 'approve'), children: "Approve" }), _jsx("button", { className: "neumorphic decline", onClick: () => handleMemberRequest(request, 'deny'), children: "Deny" })] })] }, index))) })] }))] }))] }));
};
export default ProjectHome;
