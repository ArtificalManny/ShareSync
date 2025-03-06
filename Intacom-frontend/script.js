let projects = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let selectedProjectId = 1;

const socket = io('http://localhost:3000');

socket.on('newAnnouncement', (data) => {
    const project = projects.find(p => p.id === data.projectId);
    if (project) {
        project.announcements.push(data.announcement);
        renderAnnouncements(data.projectId);
        showNotification(`New announcement in Project ${project.name} by ${data.announcement.user}`);
    }
});

socket.on('newTask', (data) => {
    const project = projects.find(p => p.id === data.projectId);
    if (project) {
        project.tasks.push(data.task);
        renderTasks(data.projectId);
        if (currentUser && project.tasks.some(t => t.assignee === currentUser.username)) {
            showNotification(`New task '${data.task.title}' assigned to you in Project ${project.name}`);
        }
    }
});

socket.on('chatMessage', (data) => {
    if (data.projectId === selectedProjectId) {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML += `<p><img src="${data.user.profilePic || 'https://via.placeholder.com/30'}" alt="${data.user.username}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> <strong>${data.user.username}</strong>: ${data.message}</p>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('notification', (data) => {
    if (currentUser && data.user === currentUser.username) {
        showNotification(data.message);
    }
});

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (data.user) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Persist login
            document.getElementById('login').style.display = 'none';
            document.querySelector('.user-profile').src = currentUser.profilePic || 'assets/default-profile.jpg';
            await loadUserDashboard();
            updateHeader();
        } else {
            alert('Login failed. Check credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Check if the backend is running.');
    }
}

async function register() {
    const username = prompt('Enter username:');
    const password = prompt('Enter password:');
    const profilePic = prompt('Enter profile picture URL (optional):');
    if (username && password) {
        try {
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, profilePic })
            });
            const newUser = await response.json();
            if (newUser) {
                currentUser = newUser;
                localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Persist login
                document.getElementById('login').style.display = 'none';
                document.querySelector('.user-profile').src = currentUser.profilePic || 'assets/default-profile.jpg';
                await loadUserDashboard();
                updateHeader();
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Check if the backend is running.');
        }
    }
}

function updateHeader() {
    if (currentUser) {
        document.querySelector('.user-profile').src = currentUser.profilePic || 'assets/default-profile.jpg';
    }
}

async function loadUserDashboard() {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const response = await fetch('http://localhost:3000/projects');
        projects = await response.json();
        renderProjects();
        if (selectedProjectId) {
            renderAnnouncements(selectedProjectId);
            renderTasks(selectedProjectId);
            renderSharedUsers(selectedProjectId);
        }
        document.getElementById('home').style.display = 'block';
        document.getElementById('project-details').style.display = 'none';
        document.getElementById('tasks-page').style.display = 'none';
        document.getElementById('feed').style.display = 'none';
        document.getElementById('connections-page').style.display = 'none';
        document.getElementById('chat').style.display = 'none';
    } catch (error) {
        console.error('Error loading projects:', error);
        alert('Failed to load projects. Check if the backend is running.');
    }
}

function renderProjects() {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = projects.map(project => `
        <div class="project-card" onclick="selectProject(${project.id})">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
            <p>Admin: ${project.admin || 'You'}</p>
            <p>Shared With: ${project.sharedWith.join(', ') || 'None'}</p>
        </div>
    `).join('');
}

function selectProject(id) {
    selectedProjectId = id;
    const project = projects.find(p => p.id === id);
    document.getElementById('project-title').textContent = project.name;
    renderAnnouncements(id);
    renderTasks(id);
    renderSharedUsers(id);
    document.getElementById('home').style.display = 'none';
    document.getElementById('project-details').style.display = 'block';
    document.getElementById('tasks-page').style.display = 'none';
    document.getElementById('feed').style.display = 'none';
    document.getElementById('connections-page').style.display = 'none';
    document.getElementById('chat').style.display = 'none';
}

async function createNewProject() {
    const name = prompt('Enter project name:');
    const description = prompt('Enter project description:');
    if (name && description && currentUser) {
        try {
            const response = await fetch('http://localhost:3000/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, admin: currentUser.username, sharedWith: [], announcements: [], tasks: [] })
            });
            const newProject = await response.json();
            projects.push(newProject);
            renderProjects();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Failed to create project. Check if the backend is running.');
        }
    }
}

async function showShareProject(projectId) {
    const users = prompt('Enter usernames to share with (comma-separated):');
    if (users && currentUser) {
        try {
            const response = await fetch(`http://localhost:3000/projects/${projectId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ users: users.split(','), admin: currentUser.username })
            });
            const updatedProject = await response.json();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) projects[projectIndex] = updatedProject;
            renderProjects();
            renderSharedUsers(projectId);
            alert('Project shared successfully!');
        } catch (error) {
            console.error('Error sharing project:', error);
            alert('Failed to share project. Check if the backend is running.');
        }
    }
}

function showPostForm(projectId) {
    selectedProjectId = projectId;
    document.getElementById('new-post').style.display = 'block';
}

function showTaskForm(projectId) {
    selectedProjectId = projectId;
    document.getElementById('new-task').style.display = 'block';
}

async function submitAnnouncement(projectId) {
    const content = document.getElementById('post-content').value;
    const media = document.getElementById('media-upload')?.files[0];
    if (content || media) {
        try {
            let mediaUrl = null;
            if (media) {
                const formData = new FormData();
                formData.append('file', media);
                const uploadResponse = await fetch(`http://localhost:3000/upload`, {
                    method: 'POST',
                    body: formData
                });
                mediaUrl = await uploadResponse.json();
            }
            const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, media: mediaUrl, user: currentUser.username })
            });
            const updatedProject = await response.json();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) projects[projectIndex] = updatedProject;
            renderAnnouncements(projectId);
            document.getElementById('post-content').value = '';
            document.getElementById('new-post').style.display = 'none';
            socket.emit('newAnnouncement', { projectId, announcement: updatedProject.announcements[updatedProject.announcements.length - 1] });
        } catch (error) {
            console.error('Error submitting announcement:', error);
            alert('Failed to submit announcement. Check if the backend is running.');
        }
    }
}

async function submitTask(projectId) {
    const title = document.getElementById('task-title').value;
    const assignee = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-due-date').value;
    const status = document.getElementById('task-status').value;
    if (title && assignee && dueDate) {
        try {
            const response = await fetch(`http://localhost:3000/projects/${projectId}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, assignee, dueDate, status: status || "In Progress", user: currentUser.username })
            });
            const updatedProject = await response.json();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) projects[projectIndex] = updatedProject;
            renderTasks(projectId);
            document.getElementById('task-title').value = '';
            document.getElementById('task-assignee').value = '';
            document.getElementById('task-due-date').value = '';
            document.getElementById('new-task').style.display = 'none';
            if (currentUser.username === assignee) {
                showNotification(`New task '${title}' assigned to you in Project ${updatedProject.name}`);
            }
            socket.emit('newTask', { projectId, task: updatedProject.tasks[updatedProject.tasks.length - 1] });
        } catch (error) {
            console.error('Error submitting task:', error);
            alert('Failed to submit task. Check if the backend is running.');
        }
    }
}

async function renderAnnouncements(projectId) {
    try {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const announcementsDiv = document.getElementById(`announcements-${projectId}`);
        announcementsDiv.innerHTML = '<div class="loading">Loading...</div>';
        announcementsDiv.innerHTML = project.announcements.map(ann => {
            const user = await fetchUser(ann.user);
            return `
                <div class="announcement facebook-post-style">
                    <div class="user-info">
                        <img src="${user.profilePic || 'https://via.placeholder.com/40'}" alt="${ann.user}" style="width: 40px; border-radius: 50%;">
                        <strong>${ann.user || 'Anonymous'}</strong>
                    </div>
                    <div class="content">
                        <p>${ann.content || ''}</p>
                        ${ann.media ? `<img src="${ann.media}" alt="Media" style="max-width: 100%; border-radius: 4px;">` : ''}
                    </div>
                    <div class="actions">
                        <button class="button-primary" onclick="likeAnnouncement(${ann.id}, ${projectId})">Like (${ann.likes || 0})</button>
                        <button class="button-primary" onclick="addCommentForm(${ann.id}, ${projectId})">Comment</button>
                    </div>
                    <div class="comments">
                        ${(ann.comments || []).map(c => {
                            const commentUser = await fetchUser(c.user);
                            return `<p><img src="${commentUser.profilePic || 'https://via.placeholder.com/30'}" alt="${c.user}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> <strong>${c.user || 'Anonymous'}</strong>: ${c.text}</p>`;
                        }).join('')}
                        <input type="text" id="comment-${ann.id}" placeholder="Add comment" class="post-input" style="display: none;">
                        <button class="button-primary" id="comment-btn-${ann.id}" style="display: none;" onclick="addComment(${ann.id}, ${projectId})">Post Comment</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering announcements:', error);
    }
}

function addCommentForm(annId, projectId) {
    const input = document.getElementById(`comment-${annId}`);
    const btn = document.getElementById(`comment-btn-${annId}`);
    if (input.style.display === 'none') {
        input.style.display = 'block';
        btn.style.display = 'inline-block';
    } else {
        input.style.display = 'none';
        btn.style.display = 'none';
    }
}

async function renderTasks(projectId) {
    try {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const tasksDiv = document.getElementById(`tasks-${projectId}`);
        tasksDiv.innerHTML = '<div class="loading">Loading...</div>';
        tasksDiv.innerHTML = project.tasks.map(task => {
            const user = await fetchUser(task.user);
            const assignee = await fetchUser(task.assignee);
            return `
                <div class="task">
                    <h3>${task.title}</h3>
                    <p>Assignee: <img src="${assignee.profilePic || 'https://via.placeholder.com/30'}" alt="${task.assignee}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> ${task.assignee} | Due: ${task.dueDate} | Status: ${task.status}</p>
                    <button class="button-primary" onclick="toggleTaskStatus(${task.id}, ${projectId})">Mark ${task.status === 'Completed' ? 'Incomplete' : 'Complete'}</button>
                    <div class="comments">${(task.comments || []).map(c => {
                        const commentUser = await fetchUser(c.user);
                        return `<p><img src="${commentUser.profilePic || 'https://via.placeholder.com/30'}" alt="${c.user}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> <strong>${c.user || 'Anonymous'}</strong>: ${c.text}</p>`;
                    }).join('')}</div>
                    <input type="text" id="task-comment-${task.id}" placeholder="Add comment" class="post-input">
                    <button class="button-primary" onclick="addTaskComment(${task.id}, ${projectId})">Comment</button>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering tasks:', error);
    }
}

async function renderSharedUsers(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const sharedList = document.getElementById('shared-list');
    sharedList.innerHTML = project.sharedWith.map(user => {
        const userData = fetchUser(user);
        return `<li><img src="${userData.profilePic || 'https://via.placeholder.com/30'}" alt="${user}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> ${user}</li>`;
    }).join('');
}

async function showUserTasks() {
    if (!currentUser) {
        alert('Please log in to view your tasks.');
        return;
    }
    const tasksDiv = document.getElementById('user-tasks');
    tasksDiv.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const userTasks = [];
        projects.forEach(project => {
            project.tasks.forEach(task => {
                if (task.assignee === currentUser.username) {
                    userTasks.push({ projectName: project.name, ...task });
                }
            });
        });
        tasksDiv.innerHTML = userTasks.map(task => `
            <div class="task">
                <h3>${task.title} (Project: ${task.projectName})</h3>
                <p>Assignee: <img src="${currentUser.profilePic || 'https://via.placeholder.com/30'}" alt="${currentUser.username}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> ${currentUser.username} | Due: ${task.dueDate} | Status: ${task.status}</p>
                <button class="button-primary" onclick="toggleTaskStatus(${task.id}, projects.find(p => p.name === task.projectName).id)">Mark ${task.status === 'Completed' ? 'Incomplete' : 'Complete'}</button>
                <div class="comments">${(task.comments || []).map(c => {
                    const commentUser = await fetchUser(c.user);
                    return `<p><img src="${commentUser.profilePic || 'https://via.placeholder.com/30'}" alt="${c.user}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> <strong>${c.user || 'Anonymous'}</strong>: ${c.text}</p>`;
                }).join('')}</div>
                <input type="text" id="task-comment-${task.id}" placeholder="Add comment" class="post-input">
                <button class="button-primary" onclick="addTaskComment(${task.id}, projects.find(p => p.name === task.projectName).id)">Comment</button>
            </div>
        `).join('');
        document.getElementById('home').style.display = 'none';
        document.getElementById('project-details').style.display = 'none';
        document.getElementById('tasks-page').style.display = 'block';
        document.getElementById('feed').style.display = 'none';
        document.getElementById('connections-page').style.display = 'none';
        document.getElementById('chat').style.display = 'none';
    } catch (error) {
        console.error('Error loading user tasks:', error);
        alert('Failed to load tasks. Check if the backend is running.');
    }
}

async function showGlobalFeed() {
    const feedDiv = document.getElementById('activity-feed');
    feedDiv.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const activities = await fetchActivities();
        feedDiv.innerHTML = activities.map(activity => `
            <div class="announcement facebook-post-style">
                <div class="user-info">
                    <img src="${activity.user.profilePic || 'https://via.placeholder.com/40'}" alt="${activity.user.username}" style="width: 40px; border-radius: 50%;">
                    <strong>${activity.user.username}</strong>
                </div>
                <div class="content">
                    <p>${activity.message} (${new Date(activity.timestamp).toLocaleTimeString()})</p>
                </div>
            </div>
        `).join('');
        document.getElementById('home').style.display = 'none';
        document.getElementById('project-details').style.display = 'none';
        document.getElementById('tasks-page').style.display = 'none';
        document.getElementById('feed').style.display = 'block';
        document.getElementById('connections-page').style.display = 'none';
        document.getElementById('chat').style.display = 'none';
    } catch (error) {
        console.error('Error loading feed:', error);
        alert('Failed to load feed. Check if the backend is running.');
    }
}

async function showConnections() {
    if (!currentUser) {
        alert('Please log in to view connections.');
        return;
    }
    const connectionsDiv = document.getElementById('connection-list');
    connectionsDiv.innerHTML = '<div class="loading">Loading...</div>';
    try {
        const connections = await fetchConnections();
        connectionsDiv.innerHTML = connections.map(conn => `
            <li><img src="${conn.profilePic || 'https://via.placeholder.com/30'}" alt="${conn.username}" style="width: 30px; border-radius: 50%; margin-right: 10px;"> ${conn.username}</li>
        `).join('');
        document.getElementById('home').style.display = 'none';
        document.getElementById('project-details').style.display = 'none';
        document.getElementById('tasks-page').style.display = 'none';
        document.getElementById('feed').style.display = 'none';
        document.getElementById('connections-page').style.display = 'block';
        document.getElementById('chat').style.display = 'none';
    } catch (error) {
        console.error('Error loading connections:', error);
        alert('Failed to load connections. Check if the backend is running.');
    }
}

function showChat(projectId) {
    if (!currentUser) {
        alert('Please log in to chat.');
        return;
    }
    selectedProjectId = projectId;
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '<div class="loading">Loading...</div>';
    document.getElementById('home').style.display = 'none';
    document.getElementById('project-details').style.display = 'none';
    document.getElementById('tasks-page').style.display = 'none';
    document.getElementById('feed').style.display = 'none';
    document.getElementById('connections-page').style.display = 'none';
    document.getElementById('chat').style.display = 'block';
    chatMessages.innerHTML = ''; // Clear loading after initial render
}

function sendChatMessage(projectId) {
    if (!currentUser) {
        alert('Please log in to send a message.');
        return;
    }
    const message = document.getElementById('chat-input').value;
    if (message) {
        socket.emit('chatMessage', { projectId, message, user: { username: currentUser.username, profilePic: currentUser.profilePic || 'https://via.placeholder.com/30' } });
        document.getElementById('chat-input').value = '';
    }
}

async function likeAnnouncement(annId, projectId) {
    try {
        const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements/${annId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser.username })
        });
        const updatedProject = await response.json();
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) projects[projectIndex] = updatedProject;
        renderAnnouncements(projectId);
        showNotification(`You liked an announcement in Project ${updatedProject.name}`);
    } catch (error) {
        console.error('Error liking announcement:', error);
        alert('Failed to like announcement. Check if the backend is running.');
    }
}

async function addComment(annId, projectId) {
    const comment = document.getElementById(`comment-${annId}`).value;
    if (comment && currentUser) {
        try {
            const response = await fetch(`http://localhost:3000/projects/${projectId}/announcements/${annId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: comment, user: currentUser.username })
            });
            const updatedProject = await response.json();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) projects[projectIndex] = updatedProject;
            document.getElementById(`comment-${annId}`).value = '';
            document.getElementById(`comment-${annId}`).style.display = 'none';
            document.getElementById(`comment-btn-${annId}`).style.display = 'none';
            renderAnnouncements(projectId);
            showNotification(`You commented on an announcement in Project ${updatedProject.name}`);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Check if the backend is running.');
        }
    }
}

async function addTaskComment(taskId, projectId) {
    const comment = document.getElementById(`task-comment-${taskId}`).value;
    if (comment && currentUser) {
        try {
            const response = await fetch(`http://localhost:3000/projects/${projectId}/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: comment, user: currentUser.username })
            });
            const updatedProject = await response.json();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) projects[projectIndex] = updatedProject;
            document.getElementById(`task-comment-${taskId}`).value = '';
            renderTasks(projectId);
            showNotification(`You commented on a task in Project ${updatedProject.name}`);
        } catch (error) {
            console.error('Error adding task comment:', error);
            alert('Failed to add task comment. Check if the backend is running.');
        }
    }
}

async function toggleTaskStatus(taskId, projectId) {
    try {
        const project = projects.find(p => p.id === projectId);
        const task = project.tasks.find(t => t.id === taskId);
        const newStatus = task.status === "In Progress" ? "Completed" : "In Progress";
        const response = await fetch(`http://localhost:3000/projects/${projectId}/tasks/${taskId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, user: currentUser.username })
        });
        const updatedProject = await response.json();
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) projects[projectIndex] = updatedProject;
        renderTasks(projectId);
        showNotification(`Task '${task.title}' status updated to ${newStatus} in Project ${updatedProject.name}`);
    } catch (error) {
        console.error('Error toggling task status:', error);
        alert('Failed to update task status. Check if the backend is running.');
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch(`http://localhost:3000/upload`, {
                method: 'POST',
                body: formData
            });
            const mediaUrl = await response.json();
            submitAnnouncement(selectedProjectId, null, mediaUrl);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Check if the backend is running.');
        }
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function showNotifications() {
    if (!currentUser) {
        alert('Please log in to view notifications.');
        return;
    }
    const notificationList = document.getElementById('notification-list');
    notificationList.innerHTML = '<div class="loading">Loading...</div>';
    fetchNotifications().then(notifications => {
        notificationList.innerHTML = notifications.map(notif => `<li>${notif.message} (${new Date(notif.timestamp).toLocaleTimeString()})</li>`).join('');
        document.getElementById('notifications').style.display = 'block';
    }).catch(error => {
        console.error('Error loading notifications:', error);
        alert('Failed to load notifications. Check if the backend is running.');
    });
}

function showProfile() {
    if (!currentUser) {
        alert('Please log in to view your profile.');
        return;
    }
    document.getElementById('profile').style.display = 'block';
    document.getElementById('profile-username').textContent = currentUser?.username || 'Guest';
}

function showSettings() {
    document.getElementById('settings').style.display = 'block';
}

function toggleTheme() {
    const body = document.body;
    if (body.style.background.includes('#1A1A2E')) {
        body.style.background = '#FFFFFF';
        body.style.color = '#000000';
        document.querySelectorAll('.button-primary').forEach(btn => btn.style.background = 'linear-gradient(45deg, #4CAF50, #2E7D32)');
        document.querySelectorAll('.sidebar').forEach(s => s.style.background = '#F5F5F5');
        document.querySelectorAll('.main-content').forEach(m => m.style.background = 'rgba(245, 245, 245, 0.8)');
        document.querySelectorAll('.project-card, .task').forEach(c => c.style.background = '#FFFFFF');
        document.querySelectorAll('.feed, .notifications, .profile, .settings').forEach(f => f.style.background = '#F5F5F5');
        document.querySelectorAll('.search-bar, .chat-input, .post-input, .task-input, .task-select').forEach(input => input.style.background = '#E0E0E0');
        document.querySelectorAll('.facebook-post-style').forEach(post => {
            post.style.background = '#F5F5F5';
            post.style.color = '#000000';
            post.style.border = '1px solid #3B5998';
            post.querySelectorAll('.content, .comments').forEach(section => section.style.background = '#E9E9E9');
            post.querySelectorAll('.actions button').forEach(btn => btn.style.background = '#3B5998');
        });
    } else {
        body.style.background = 'linear-gradient(135deg, #1A1A2E, #16213E)';
        body.style.color = '#FFFFFF';
        document.querySelectorAll('.button-primary').forEach(btn => btn.style.background = 'linear-gradient(45deg, #6A5ACD, #8A2BE2, #FF69B4)');
        document.querySelectorAll('.sidebar').forEach(s => s.style.background = '#16213E');
        document.querySelectorAll('.main-content').forEach(m => m.style.background = 'rgba(26, 26, 46, 0.8)');
        document.querySelectorAll('.project-card, .task').forEach(c => c.style.background = 'linear-gradient(135deg, #2D2D44, #3A3A5E)');
        document.querySelectorAll('.feed, .notifications, .profile, .settings').forEach(f => f.style.background = 'linear-gradient(135deg, #2D2D44, #3A3A5E)');
        document.querySelectorAll('.search-bar, .chat-input, .post-input, .task-input, .task-select').forEach(input => input.style.background = '#3A3A5E');
        document.querySelectorAll('.facebook-post-style').forEach(post => {
            post.style.background = '#1A2A3B';
            post.style.color = '#FFFFFF';
            post.style.border = '1px solid #3B5998';
            post.querySelectorAll('.content, .comments').forEach(section => section.style.background = '#2E4868');
            post.querySelectorAll('.actions button').forEach(btn => btn.style.background = '#3B5998');
        });
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser'); // Clear persistent login
    document.cookie = 'userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; // Clear cookie
    document.getElementById('login').style.display = 'block';
    document.querySelector('.user-profile').src = 'assets/default-profile.jpg';
    projects = [];
    document.getElementById('project-list').innerHTML = '';
    document.getElementById('announcements-1').innerHTML = '';
    document.getElementById('tasks-1').innerHTML = '';
    document.getElementById('shared-list').innerHTML = '';
    document.getElementById('user-tasks').innerHTML = '';
    document.getElementById('activity-feed').innerHTML = '';
    document.getElementById('connection-list').innerHTML = '';
    document.getElementById('chat-messages').innerHTML = '';
    document.getElementById('notification-list').innerHTML = '';
    document.getElementById('notifications').style.display = 'none';
    document.getElementById('profile').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
    document.getElementById('home').style.display = 'block';
    document.getElementById('project-details').style.display = 'none';
    document.getElementById('tasks-page').style.display = 'none';
    document.getElementById('feed').style.display = 'none';
    document.getElementById('connections-page').style.display = 'none';
    document.getElementById('chat').style.display = 'none';
    fetch('http://localhost:3000/auth/logout', { method: 'POST' });
}

async function fetchUser(username) {
    try {
        const response = await fetch(`http://localhost:3000/users/${username}`);
        return await response.json() || { profilePic: 'https://via.placeholder.com/30', username };
    } catch (error) {
        console.error('Error fetching user:', error);
        return { profilePic: 'https://via.placeholder.com/30', username };
    }
}

async function fetchConnections() {
    const response = await fetch(`http://localhost:3000/connections/${currentUser.username}`);
    return await response.json() || [];
}

async function fetchActivities() {
    const response = await fetch('http://localhost:3000/activities');
    return await response.json() || [];
}

async function fetchNotifications() {
    const response = await fetch(`http://localhost:3000/notifications/${currentUser.username}`);
    return await response.json() || [];
}

// Load dashboard on page load, check for persistent login
window.onload = () => {
    const token = document.cookie.match(/userToken=([^;]+)/)?.[1];
    if (token) {
        currentUser = JSON.parse(decodeURIComponent(token));
        localStorage.setItem('currentUser', JSON.stringify(currentUser)); // Sync localStorage
        document.getElementById('login').style.display = 'none';
        document.querySelector('.user-profile').src = currentUser.profilePic || 'assets/default-profile.jpg';
        loadUserDashboard();
    } else {
        document.getElementById('login').style.display = 'block';
    }
};