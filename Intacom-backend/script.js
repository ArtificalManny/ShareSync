let projects = [
    { id: 1, name: "Project 1", description: "Develop Intacom features", announcements: [], tasks: [] },
    { id: 2, name: "Project 2", description: "Marketing campaign", announcements: [], tasks: [] }
];
let currentUser = null;
let selectedProjectId = 1;

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username && password) {
        currentUser = { username };
        document.getElementById('login').style.display = 'none';
        loadUserDashboard();
    } else {
        alert('Please enter username and password.');
    }
}

function loadUserDashboard() {
    renderProjects();
    renderAnnouncements(selectedProjectId);
    renderTasks(selectedProjectId);
}

function renderProjects() {
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = projects.map(project => `
        <div class="project-card" onclick="selectProject(${project.id})">
            <h3>${project.name}</h3>
            <p>${project.description}</p>
        </div>
    `).join('');
}

function selectProject(id) {
    selectedProjectId = id;
    renderAnnouncements(id);
    renderTasks(id);
}

function createNewProject() {
    const name = prompt('Enter project name:');
    const description = prompt('Enter project description:');
    if (name && description) {
        const newProject = { id: Date.now(), name, description, announcements: [], tasks: [] };
        projects.push(newProject);
        renderProjects();
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

function submitAnnouncement(projectId) {
    const content = document.getElementById('post-content').value;
    const media = document.getElementById('media-upload')?.files[0] ? URL.createObjectURL(document.getElementById('media-upload').files[0]) : null;
    if (content || media) {
        createAnnouncement(projectId, content, media);
        document.getElementById('post-content').value = '';
        document.getElementById('new-post').style.display = 'none';
    }
}

function submitTask(projectId) {
    const title = document.getElementById('task-title').value;
    const assignee = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-due-date').value;
    if (title && assignee && dueDate) {
        createTask(projectId, title, assignee, dueDate);
        document.getElementById('task-title').value = '';
        document.getElementById('task-assignee').value = '';
        document.getElementById('task-due-date').value = '';
        document.getElementById('new-task').style.display = 'none';
    }
}

function createAnnouncement(projectId, content, media) {
    const announcement = { id: Date.now(), content, media, likes: 0, comments: [] };
    projects.find(p => p.id === projectId).announcements.push(announcement);
    renderAnnouncements(projectId);
}

function createTask(projectId, title, assignee, dueDate, status = "In Progress") {
    const task = { id: Date.now(), title, assignee, dueDate, status, comments: [] };
    projects.find(p => p.id === projectId).tasks.push(task);
    renderTasks(projectId);
}

function renderAnnouncements(projectId) {
    const announcementsDiv = document.getElementById(`announcements-${projectId}`);
    announcementsDiv.innerHTML = projects.find(p => p.id === projectId).announcements.map(ann => `
        <div class="announcement">
            <p>${ann.content || ''}</p>
            ${ann.media ? `<img src="${ann.media}" alt="Media" style="max-width: 200px;">` : ''}
            <button onclick="likeAnnouncement(${ann.id}, ${projectId})">Like (${ann.likes})</button>
            <div class="comments">${ann.comments.map(c => `<p>${c}</p>`).join('')}</div>
            <input type="text" id="comment-${ann.id}" placeholder="Add comment">
            <button onclick="addComment(${ann.id}, ${projectId})">Comment</button>
        </div>
    `).join('');
}

function renderTasks(projectId) {
    const tasksDiv = document.getElementById(`tasks-${projectId}`);
    tasksDiv.innerHTML = projects.find(p => p.id === projectId).tasks.map(task => `
        <div class="task">
            <h3>${task.title}</h3>
            <p>Assignee: ${task.assignee} | Due: ${task.dueDate} | Status: ${task.status}</p>
            <button onclick="toggleTaskStatus(${task.id}, ${projectId})">Mark Complete</button>
            <div class="comments">${task.comments.map(c => `<p>${c}</p>`).join('')}</div>
            <input type="text" id="task-comment-${task.id}" placeholder="Add comment">
            <button onclick="addTaskComment(${task.id}, ${projectId})">Comment</button>
        </div>
    `).join('');
}

function likeAnnouncement(annId, projectId) {
    const ann = projects.find(p => p.id === projectId).announcements.find(a => a.id === annId);
    if (ann) ann.likes++;
    renderAnnouncements(projectId);
}

function addComment(annId, projectId) {
    const comment = document.getElementById(`comment-${annId}`).value;
    if (comment) {
        projects.find(p => p.id === projectId).announcements.find(a => a.id === annId).comments.push(comment);
        document.getElementById(`comment-${annId}`).value = '';
        renderAnnouncements(projectId);
    }
}

function addTaskComment(taskId, projectId) {
    const comment = document.getElementById(`task-comment-${taskId}`).value;
    if (comment) {
        projects.find(p => p.id === projectId).tasks.find(t => t.id === taskId).comments.push(comment);
        document.getElementById(`task-comment-${taskId}`).value = '';
        renderTasks(projectId);
    }
}

function toggleTaskStatus(taskId, projectId) {
    const task = projects.find(p => p.id === projectId).tasks.find(t => t.id === taskId);
    if (task) task.status = task.status === "In Progress" ? "Completed" : "In Progress";
    renderTasks(projectId);
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => createAnnouncement(selectedProjectId, "New media post", e.target.result);
        reader.readAsDataURL(file);
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// Load dashboard on page load
window.onload = loadUserDashboard;