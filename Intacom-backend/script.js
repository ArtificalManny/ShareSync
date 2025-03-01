// script.js

let projects = [];
let currentUser = null;
let selectedProjectId = 1;

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username && password) {
        try {
            // In a real app, send credentials to backend for authentication
            currentUser = { username, profilePic: 'default-profile.jpg' }; // Mock user data
            document.getElementById('login').style.display = 'none';
            document.querySelector('.user-profile').src = currentUser.profilePic;
            await loadUserDashboard();
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Check credentials or backend.');
        }
    } else {
        alert('Please enter username and password.');
    }
}

async function loadUserDashboard() {
    try {
        const response = await fetch('http://localhost:3000/projects');
        projects = await response.json();
        renderProjects();
        renderAnnouncements(selectedProjectId);
        renderTasks(selectedProjectId);
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
        </div>
    `).join('');
}

function selectProject(id) {
    selectedProjectId = id;
    const project = projects.find(p => p.id === id);
    document.getElementById('project-title').textContent = project.name;
    renderAnnouncements(id);
    renderTasks(id);
}

async function createNewProject() {
    const name = prompt('Enter project name:');
    const description = prompt('Enter project description:');
    if (name && description && currentUser) {
        try {
            const response = await fetch('http://localhost:3000/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, admin: currentUser.username, announcements: [], tasks: [] })
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
                // For now, use a temporary URL; real backend would handle file upload
                mediaUrl = URL.createObjectURL(media);
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
                body: JSON.stringify({ title, assignee, dueDate, status, user: currentUser.username })
            });
            const updatedProject = await response.json();
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) projects[projectIndex] = updatedProject;
            renderTasks(projectId);
            document.getElementById('task-title').value = '';
            document.getElementById('task-assignee').value = '';
            document.getElementById('task-due-date').value = '';
            document.getElementById('new-task').style.display = 'none';
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
        announcementsDiv.innerHTML = project.announcements.map(ann => `
            <div class="announcement">
                <p><strong>${ann.user || 'Anonymous'}</strong>: ${ann.content || ''}</p>
                ${ann.media ? `<img src="${ann.media}" alt="Media" style="max-width: 200px;">` : ''}
                <button onclick="likeAnnouncement(${ann.id}, ${projectId})">Like (${ann.likes || 0})</button>
                <div class="comments">${(ann.comments || []).map(c => `<p><strong>${c.user || 'Anonymous'}</strong>: ${c.text}</p>`).join('')}</div>
                <input type="text" id="comment-${ann.id}" placeholder="Add comment">
                <button onclick="addComment(${ann.id}, ${projectId})">Comment</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering announcements:', error);
    }
}

async function renderTasks(projectId) {
    try {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const tasksDiv = document.getElementById(`tasks-${projectId}`);
        tasksDiv.innerHTML = project.tasks.map(task => `
            <div class="task">
                <h3>${task.title}</h3>
                <p>Assignee: <img src="default-profile.jpg" alt="${task.assignee}" style="width: 30px; border-radius: 50%;"> ${task.assignee} | Due: ${task.dueDate} | Status: ${task.status}</p>
                <button onclick="toggleTaskStatus(${task.id}, ${projectId})">Mark ${task.status === 'Completed' ? 'Incomplete' : 'Complete'}</button>
                <div class="comments">${(task.comments || []).map(c => `<p><strong>${c.user || 'Anonymous'}</strong>: ${c.text}</p>`).join('')}</div>
                <input type="text" id="task-comment-${task.id}" placeholder="Add comment">
                <button onclick="addTaskComment(${task.id}, ${projectId})">Comment</button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering tasks:', error);
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
            renderAnnouncements(projectId);
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
    } catch (error) {
        console.error('Error toggling task status:', error);
        alert('Failed to update task status. Check if the backend is running.');
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // For a real backend, upload the file using FormData
        alert('File upload not fully implemented. Use backend for persistent storage.');
        const reader = new FileReader();
        reader.onload = (e) => submitAnnouncement(selectedProjectId, null, e.target.result);
        reader.readAsDataURL(file);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function showNotifications() {
    document.getElementById('notifications').style.display = 'block';
}

function showProfile() {
    document.getElementById('profile').style.display = 'block';
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
    } else {
        body.style.background = 'linear-gradient(135deg, #1A1A2E, #16213E)';
        body.style.color = '#FFFFFF';
        document.querySelectorAll('.button-primary').forEach(btn => btn.style.background = 'linear-gradient(45deg, #6A5ACD, #8A2BE2)');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('login').style.display = 'block';
    document.querySelector('.user-profile').src = 'default-profile.jpg';
    projects = [];
    document.getElementById('project-list').innerHTML = '';
    document.getElementById('announcements-1').innerHTML = '';
    document.getElementById('tasks-1').innerHTML = '';
    document.getElementById('notifications').style.display = 'none';
    document.getElementById('profile').style.display = 'none';
    document.getElementById('settings').style.display = 'none';
}

// Load dashboard on page load
window.onload = () => {
    document.getElementById('login').style.display = 'block';
};