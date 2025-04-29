import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProjects,
  updateProjectAnnouncement,
  updateProjectSnapshot,
  createTask,
  updateTaskStatus,
  addComment,
  likeItem,
  shareItem,
  uploadFile,
  approveFile,
  createTeam,
  inviteMember,
  updateNotificationSettings,
} from '../services/project.service';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ProjectHome = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    currentProjects: 0,
    pastProjects: 0,
    tasksCompleted: 0,
  });
  const [announcement, setAnnouncement] = useState('');
  const [announcementType, setAnnouncementType] = useState('text');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pictureUrl, setPictureUrl] = useState('');
  const [snapshot, setSnapshot] = useState('');
  const [task, setTask] = useState({ title: '', description: '', assignedTo: [], assignedTeams: [], subtasks: [] });
  const [subtask, setSubtask] = useState('');
  const [comment, setComment] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [team, setTeam] = useState({ name: '', description: '', members: [] });
  const [invite, setInvite] = useState({ email: '', role: 'member' });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    projectUpdates: true,
    taskAssignments: true,
    comments: true,
    fileUploads: true,
  });
  const [editingNotifications, setEditingNotifications] = useState(false);
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityDateFilter, setActivityDateFilter] = useState('');
  const [activityUserFilter, setActivityUserFilter] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const projects = await getProjects();
        const selectedProject = projects.find(p => p._id === projectId);
        if (!selectedProject) {
          toast.error('Project not found', { position: 'top-right', autoClose: 3000 });
          navigate('/projects');
          return;
        }
        console.log('ProjectHome - Fetched project:', selectedProject);
        setProject(selectedProject);
        setNotificationSettings(selectedProject.notificationSettings || notificationSettings);

        const total = projects.length;
        const current = projects.filter(p => p.status === 'In Progress').length;
        const past = projects.filter(p => p.status === 'Completed').length;
        const tasks = past * 10; // Placeholder: 10 tasks per completed project

        setMetrics({
          totalProjects: total,
          currentProjects: current,
          pastProjects: past,
          tasksCompleted: tasks,
        });
      } catch (error) {
        console.error('ProjectHome - Error fetching project:', error);
        toast.error('Failed to load project data', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchProject();
  }, [projectId, navigate]);

  const handleAnnouncementSubmit = async () => {
    if (announcementType === 'text' && !announcement.trim()) {
      toast.error('Announcement cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (announcementType === 'poll' && (pollOptions.some(opt => !opt.trim()) || pollOptions.length < 2)) {
      toast.error('Poll must have at least two non-empty options', { position: 'top-right', autoClose: 3000 });
      return;
    }
    if (announcementType === 'picture' && (!pictureUrl.trim() || !announcement.trim())) {
      toast.error('Picture URL and description cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      const announcementData = {
        message: announcement,
        type: announcementType,
        pollOptions: announcementType === 'poll' ? pollOptions.map(opt => ({ option: opt, votes: [] })) : undefined,
        pictureUrl: announcementType === 'picture' ? pictureUrl : undefined,
      };
      const updatedProject = await updateProjectAnnouncement(projectId, announcementData);
      console.log('ProjectHome - Announcement updated:', updatedProject);
      setProject(updatedProject);
      setAnnouncement('');
      setAnnouncementType('text');
      setPollOptions(['', '']);
      setPictureUrl('');
    } catch (error) {
      console.error('ProjectHome - Error updating announcement:', error);
      toast.error('Failed to post announcement', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleSnapshotSubmit = async () => {
    if (!snapshot.trim()) {
      toast.error('Snapshot cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const updatedProject = await updateProjectSnapshot(projectId, snapshot);
      console.log('ProjectHome - Snapshot updated:', updatedProject);
      setProject(updatedProject);
      setSnapshot('');
    } catch (error) {
      console.error('ProjectHome - Error updating snapshot:', error);
      toast.error('Failed to update snapshot', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleTaskSubmit = async () => {
    if (!task.title.trim() || !task.description.trim()) {
      toast.error('Task title and description cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const taskData = {
        ...task,
        assignedTo: task.assignedTo.map(email => project.members.find(m => m.user.email === email)?.user._id).filter(id => id),
        assignedTeams: task.assignedTeams.map(teamName => project.teams.find(t => t.name === teamName)?._id).filter(id => id),
        subtasks: task.subtasks.map(sub => ({ title: sub, status: 'To Do', assignedTo: [] })),
      };
      const updatedProject = await createTask(projectId, taskData);
      console.log('ProjectHome - Task created:', updatedProject);
      setProject(updatedProject);
      setTask({ title: '', description: '', assignedTo: [], assignedTeams: [], subtasks: [] });
      setSubtask('');
      toast.success('Task created successfully!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('ProjectHome - Error creating task:', error);
      toast.error('Failed to create task', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleTaskStatusChange = async (taskId, status) => {
    try {
      const updatedProject = await updateTaskStatus(projectId, taskId, status);
      console.log('ProjectHome - Task status updated:', updatedProject);
      setProject(updatedProject);
      if (status === 'Done') {
        setMetrics(prev => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }));
      }
    } catch (error) {
      console.error('ProjectHome - Error updating task status:', error);
      toast.error('Failed to update task status', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleCommentSubmit = async (taskId) => {
    if (!comment.trim()) {
      toast.error('Comment cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const updatedProject = await addComment(projectId, taskId, { text: comment });
      console.log('ProjectHome - Comment added:', updatedProject);
      setProject(updatedProject);
      setComment('');
    } catch (error) {
      console.error('ProjectHome - Error adding comment:', error);
      toast.error('Failed to add comment', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleLike = async (itemId, type) => {
    try {
      const updatedProject = await likeItem(projectId, itemId, type);
      console.log(`ProjectHome - ${type} liked:`, updatedProject);
      setProject(updatedProject);
    } catch (error) {
      console.error(`ProjectHome - Error liking ${type}:`, error);
      toast.error(`Failed to like ${type}`, { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleShare = async (itemId, type) => {
    try {
      const updatedProject = await shareItem(projectId, itemId, type);
      console.log(`ProjectHome - ${type} shared:`, updatedProject);
      setProject(updatedProject);
    } catch (error) {
      console.error(`ProjectHome - Error sharing ${type}:`, error);
      toast.error(`Failed to share ${type}`, { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleFileUpload = async () => {
    if (!fileName.trim() || !fileUrl.trim()) {
      toast.error('File name and URL cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const updatedProject = await uploadFile(projectId, { name: fileName, url: fileUrl });
      console.log('ProjectHome - File uploaded:', updatedProject);
      setProject(updatedProject);
      setFileName('');
      setFileUrl('');
    } catch (error) {
      console.error('ProjectHome - Error uploading file:', error);
      toast.error('Failed to upload file', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleFileApproval = async (fileId, status) => {
    try {
      const updatedProject = await approveFile(projectId, fileId, status);
      console.log('ProjectHome - File status updated:', updatedProject);
      setProject(updatedProject);
    } catch (error) {
      console.error('ProjectHome - Error updating file status:', error);
      toast.error(`Failed to ${status} file`, { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleTeamSubmit = async () => {
    if (!team.name.trim() || !team.description.trim()) {
      toast.error('Team name and description cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const teamData = {
        ...team,
        members: team.members.map(email => project.members.find(m => m.user.email === email)?.user._id).filter(id => id),
      };
      const updatedProject = await createTeam(projectId, teamData);
      console.log('ProjectHome - Team created:', updatedProject);
      setProject(updatedProject);
      setTeam({ name: '', description: '', members: [] });
      setShowTeamModal(false);
      toast.success('Team created successfully!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('ProjectHome - Error creating team:', error);
      toast.error('Failed to create team', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleInviteSubmit = async () => {
    if (!invite.email.trim()) {
      toast.error('Email cannot be empty', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const updatedProject = await inviteMember(projectId, invite);
      console.log('ProjectHome - Member invited:', updatedProject);
      setProject(updatedProject);
      setInvite({ email: '', role: 'member' });
      setShowInviteModal(false);
      toast.success('Invitation sent!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('ProjectHome - Error sending invite:', error);
      toast.error('Failed to send invitation', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings({ ...notificationSettings, [name]: checked });
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProject = await updateNotificationSettings(projectId, notificationSettings);
      console.log('ProjectHome - Notification settings updated:', updatedProject);
      setProject(updatedProject);
      setEditingNotifications(false);
      toast.success('Notification settings updated!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('ProjectHome - Error updating notification settings:', error);
      toast.error('Failed to update notification settings', { position: 'top-right', autoClose: 3000 });
    }
  };

  const filteredActivities = project?.teamActivities?.filter(activity => {
    if (activityFilter !== 'all' && activity.type !== activityFilter) return false;
    if (activityDateFilter && new Date(activity.timestamp).toISOString().split('T')[0] !== activityDateFilter) return false;
    if (activityUserFilter) {
      const userInvolved = project.members.find(m => m.user._id === activityUserFilter);
      if (!userInvolved) return false;
      return activity.message.includes(userInvolved.user.firstName) || activity.message.includes(userInvolved.user.lastName);
    }
    return true;
  }) || [];

  if (!project) return <div style={{ color: 'white', textAlign: 'center', padding: '20px', background: '#0d1a26', minHeight: '100vh' }}>Loading...</div>;

  const isAdmin = project.members.some(m => m.user._id === user._id && m.role === 'admin');

  return (
    <div style={{ padding: '30px', color: 'white', animation: 'fadeIn 1s ease-in-out' }}>
      <h2 style={{
        color: '#00d1b2',
        marginBottom: '30px',
        fontWeight: 'bold',
        fontSize: '2.5em',
        textShadow: '0 2px 4px rgba(0, 209, 178, 0.5)',
      }}>{project.title}</h2>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Description:</strong> {project.description}</p>
        <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Category:</strong> {project.category}</p>
        <p style={{ marginBottom: '10px' }}><strong style={{ color: '#00d1b2', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Status:</strong> {project.status}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {[
          { label: 'Total Projects', value: metrics.totalProjects, color: '#00d1b2' },
          { label: 'Current Projects', value: metrics.currentProjects, color: '#6c63ff' },
          { label: 'Past Projects', value: metrics.pastProjects, color: '#ff3860' },
          { label: 'Tasks Completed', value: metrics.tasksCompleted, color: '#ffd700' },
        ].map((metric, index) => (
          <div key={index} style={{
            backgroundColor: '#1a2b3c',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            boxShadow: `0 4px 8px rgba(${metric.color.slice(1)}, 0.3)`,
            border: `1px solid ${metric.color}`,
            transition: 'all 0.3s ease',
            animation: 'pulse 2s infinite',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 8px 16px rgba(${metric.color.slice(1)}, 0.5)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = `0 4px 8px rgba(${metric.color.slice(1)}, 0.3)`;
          }}
          >
            <h3 style={{ color: metric.color, textShadow: `0 1px 2px rgba(${metric.color.slice(1)}, 0.5)`, fontSize: '1.2em' }}>{metric.label}</h3>
            <p style={{ fontSize: '2em', fontWeight: 'bold', color: 'white' }}>{metric.value}</p>
          </div>
        ))}
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>Team Activities</h3>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              fontSize: '0.9em',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6c63ff';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
            }}
          >
            <option value="all">All Activities</option>
            <option value="task">Tasks</option>
            <option value="announcement">Announcements</option>
            <option value="file">Files</option>
            <option value="comment">Comments</option>
          </select>
          <input
            type="date"
            value={activityDateFilter}
            onChange={(e) => setActivityDateFilter(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              fontSize: '0.9em',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6c63ff';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
            }}
          />
          <select
            value={activityUserFilter}
            onChange={(e) => setActivityUserFilter(e.target.value)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              fontSize: '0.9em',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6c63ff';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
            }}
          >
            <option value="">All Users</option>
            {project.members.map(member => (
              <option key={member.user._id} value={member.user._id}>{member.user.firstName} {member.user.lastName}</option>
            ))}
          </select>
        </div>
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#0d1a26', borderRadius: '5px', borderLeft: `3px solid ${activity.type === 'task' ? '#ffd700' : activity.type === 'announcement' ? '#00d1b2' : activity.type === 'file' ? '#6c63ff' : '#ff3860'}` }}>
              <p style={{ fontSize: '0.9em' }}>{activity.message}</p>
              <p style={{ fontSize: '0.8em', color: '#a0a0a0' }}>{new Date(activity.timestamp).toLocaleString()}</p>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No team activities yet</p>
        )}
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>Announcements</h3>
        {isAdmin && (
          <div style={{ marginBottom: '20px' }}>
            <select
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '0.9em',
                marginBottom: '10px',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            >
              <option value="text">Text</option>
              <option value="poll">Poll</option>
              <option value="picture">Picture</option>
            </select>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder={announcementType === 'picture' ? 'Description for the picture' : 'Post an announcement'}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                minHeight: '80px',
                marginBottom: '10px',
                resize: 'vertical',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
            {announcementType === 'poll' && (
              <div style={{ marginBottom: '10px' }}>
                {pollOptions.map((option, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...pollOptions];
                        newOptions[index] = e.target.value;
                        setPollOptions(newOptions);
                      }}
                      placeholder={`Option ${index + 1}`}
                      style={{
                        flex: '1',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #00d1b2',
                        backgroundColor: '#0d1a26',
                        color: 'white',
                        fontSize: '0.9em',
                        transition: 'all 0.3s ease',
                        boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6c63ff';
                        e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#00d1b2';
                        e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                        style={{
                          padding: '8px 12px',
                          background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9em',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
                        }}
                        onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                        onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                        onMouseEnter={(e) => {
                          e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ''])}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    marginTop: '10px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Add Option
                </button>
              </div>
            )}
            {announcementType === 'picture' && (
              <input
                type="text"
                value={pictureUrl}
                onChange={(e) => setPictureUrl(e.target.value)}
                placeholder="Picture URL"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  marginBottom: '10px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
            )}
            <button
              onClick={handleAnnouncementSubmit}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Post Announcement
            </button>
          </div>
        )}
        {project.announcements?.length > 0 ? (
          project.announcements.map(ann => (
            <div key={ann._id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#0d1a26', borderRadius: '10px', borderLeft: '3px solid #00d1b2' }}>
              {ann.type === 'text' && <p style={{ fontSize: '1em', marginBottom: '5px' }}>{ann.message}</p>}
              {ann.type === 'poll' && (
                <div>
                  <p style={{ fontSize: '1em', marginBottom: '10px' }}>{ann.message}</p>
                  {ann.pollOptions.map((option, index) => (
                    <div key={index} style={{ marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <p style={{ fontSize: '0.9em' }}>{option.option} ({option.votes.length} votes)</p>
                      <button
                        onClick={() => handleLike(ann._id, 'announcements')}
                        style={{
                          padding: '5px 10px',
                          background: option.votes.includes(user._id) ? '#6c63ff' : 'transparent',
                          color: 'white',
                          border: '1px solid #6c63ff',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '0.8em',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#6c63ff';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = option.votes.includes(user._id) ? '#6c63ff' : 'transparent';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        Vote
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {ann.type === 'picture' && (
                <div>
                  <img
                    src={ann.pictureUrl}
                    alt="Announcement"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      marginBottom: '10px',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  />
                  <p style={{ fontSize: '1em', marginBottom: '5px' }}>{ann.message}</p>
                </div>
              )}
              <p style={{ fontSize: '0.8em', color: '#a0a0a0', marginBottom: '10px' }}>{new Date(ann.timestamp).toLocaleString()}</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleLike(ann._id, 'announcements')}
                  style={{
                    padding: '5px 10px',
                    background: ann.likes.includes(user._id) ? '#ff3860' : 'transparent',
                    color: 'white',
                    border: '1px solid #ff3860',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ff3860';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = ann.likes.includes(user._id) ? '#ff3860' : 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Like ({ann.likes.length})
                </button>
                <button
                  onClick={() => handleShare(ann._id, 'announcements')}
                  style={{
                    padding: '5px 10px',
                    background: ann.shares.includes(user._id) ? '#ffd700' : 'transparent',
                    color: 'white',
                    border: '1px solid #ffd700',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ffd700';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = ann.shares.includes(user._id) ? '#ffd700' : 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Share ({ann.shares.length})
                </button>
              </div>
              {ann.comments?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ color: '#00d1b2', fontSize: '1em', marginBottom: '10px' }}>Comments</h4>
                  {ann.comments.map((comm, index) => (
                    <div key={index} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#1a2b3c', borderRadius: '5px' }}>
                      <p style={{ fontSize: '0.8em' }}><strong>{comm.user.firstName} {comm.user.lastName}:</strong> {comm.text}</p>
                      <p style={{ fontSize: '0.7em', color: '#a0a0a0' }}>{new Date(comm.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No announcements yet</p>
        )}
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>Current Snapshot</h3>
        <p style={{ fontSize: '1em', marginBottom: '20px' }}>{project.snapshot || 'No snapshot available'}</p>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={snapshot}
              onChange={(e) => setSnapshot(e.target.value)}
              placeholder="Update snapshot"
              style={{
                flex: '1',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
            <button
              onClick={handleSnapshotSubmit}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Update
            </button>
          </div>
        )}
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>Tasks</h3>
        {isAdmin && (
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setTask({ ...task, title: e.target.value })}
              placeholder="Task Title"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                marginBottom: '10px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
            <textarea
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              placeholder="Task Description"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #00d1b2',
                backgroundColor: '#0d1a26',
                color: 'white',
                fontSize: '1em',
                transition: 'all 0.3s ease',
                boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                minHeight: '80px',
                marginBottom: '10px',
                resize: 'vertical',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c63ff';
                e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#00d1b2';
                e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
              }}
            />
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ color: '#00d1b2', fontSize: '1em', marginBottom: '5px' }}>Assign to Members</h4>
              {project.members.map(member => (
                <div key={member.user._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={task.assignedTo.includes(member.user.email)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTask({ ...task, assignedTo: [...task.assignedTo, member.user.email] });
                      } else {
                        setTask({ ...task, assignedTo: task.assignedTo.filter(email => email !== member.user.email) });
                      }
                    }}
                    style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
                  />
                  <label style={{ fontSize: '0.9em' }}>{member.user.firstName} {member.user.lastName} ({member.user.email})</label>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ color: '#00d1b2', fontSize: '1em', marginBottom: '5px' }}>Assign to Teams</h4>
              {project.teams.map(team => (
                <div key={team._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <input
                    type="checkbox"
                    checked={task.assignedTeams.includes(team.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTask({ ...task, assignedTeams: [...task.assignedTeams, team.name] });
                      } else {
                        setTask({ ...task, assignedTeams: task.assignedTeams.filter(name => name !== team.name) });
                      }
                    }}
                    style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
                  />
                  <label style={{ fontSize: '0.9em' }}>{team.name}</label>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ color: '#00d1b2', fontSize: '1em', marginBottom: '5px' }}>Subtasks</h4>
              {task.subtasks.map((sub, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                  <input
                    type="text"
                    value={sub}
                    onChange={(e) => {
                      const newSubtasks = [...task.subtasks];
                      newSubtasks[index] = e.target.value;
                      setTask({ ...task, subtasks: newSubtasks });
                    }}
                    placeholder={`Subtask ${index + 1}`}
                    style={{
                      flex: '1',
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid #00d1b2',
                      backgroundColor: '#0d1a26',
                      color: 'white',
                      fontSize: '0.9em',
                      transition: 'all 0.3s ease',
                      boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6c63ff';
                      e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#00d1b2';
                      e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setTask({ ...task, subtasks: task.subtasks.filter((_, i) => i !== index) })}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
                    }}
                    onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                    onMouseEnter={(e) => {
                      e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                  type="text"
                  value={subtask}
                  onChange={(e) => setSubtask(e.target.value)}
                  placeholder="New Subtask"
                  style={{
                    flex: '1',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid #00d1b2',
                    backgroundColor: '#0d1a26',
                    color: 'white',
                    fontSize: '0.9em',
                    transition: 'all 0.3s ease',
                    boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6c63ff';
                    e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#00d1b2';
                    e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (subtask.trim()) {
                      setTask({ ...task, subtasks: [...task.subtasks, subtask] });
                      setSubtask('');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Add Subtask
                </button>
              </div>
            </div>
            <button
              onClick={handleTaskSubmit}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Create Task
            </button>
          </div>
        )}
        {project.tasks?.length > 0 ? (
          project.tasks.map(task => (
            <div key={task._id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#0d1a26', borderRadius: '10px', borderLeft: '3px solid #ffd700' }}>
              <p style={{ fontSize: '1em', marginBottom: '5px' }}><strong style={{ color: '#ffd700' }}>Title:</strong> {task.title}</p>
              <p style={{ fontSize: '1em', marginBottom: '5px' }}><strong style={{ color: '#ffd700' }}>Description:</strong> {task.description}</p>
              <p style={{ fontSize: '0.9em', marginBottom: '5px' }}><strong style={{ color: '#ffd700' }}>Status:</strong> {task.status}</p>
              <select
                value={task.status}
                onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '0.9em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  marginBottom: '10px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
              <p style={{ fontSize: '0.9em', marginBottom: '5px' }}><strong style={{ color: '#ffd700' }}>Assigned To:</strong> {task.assignedTo.map(id => project.members.find(m => m.user._id === id)?.user.firstName).join(', ') || 'None'}</p>
              <p style={{ fontSize: '0.9em', marginBottom: '10px' }}><strong style={{ color: '#ffd700' }}>Assigned Teams:</strong> {task.assignedTeams.map(id => project.teams.find(t => t._id === id)?.name).join(', ') || 'None'}</p>
              {task.subtasks?.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <h4 style={{ color: '#ffd700', fontSize: '1em', marginBottom: '5px' }}>Subtasks</h4>
                  {task.subtasks.map((sub, index) => (
                    <div key={index} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#1a2b3c', borderRadius: '5px' }}>
                      <p style={{ fontSize: '0.8em' }}><strong>{sub.title}:</strong> {sub.status}</p>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                  onClick={() => handleLike(task._id, 'tasks')}
                  style={{
                    padding: '5px 10px',
                    background: task.likes.includes(user._id) ? '#ff3860' : 'transparent',
                    color: 'white',
                    border: '1px solid #ff3860',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ff3860';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = task.likes.includes(user._id) ? '#ff3860' : 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Like ({task.likes.length})
                </button>
                <button
                  onClick={() => handleShare(task._id, 'tasks')}
                  style={{
                    padding: '5px 10px',
                    background: task.shares.includes(user._id) ? '#ffd700' : 'transparent',
                    color: 'white',
                    border: '1px solid #ffd700',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ffd700';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = task.shares.includes(user._id) ? '#ffd700' : 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Share ({task.shares.length})
                </button>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #00d1b2',
                    backgroundColor: '#0d1a26',
                    color: 'white',
                    fontSize: '1em',
                    transition: 'all 0.3s ease',
                    boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                    marginBottom: '10px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6c63ff';
                    e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#00d1b2';
                    e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                  }}
                />
                <button
                  onClick={() => handleCommentSubmit(task._id)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Post Comment
                </button>
              </div>
              {task.comments?.length > 0 && (
                <div>
                  <h4 style={{ color: '#ffd700', fontSize: '1em', marginBottom: '10px' }}>Comments</h4>
                  {task.comments.map((comm, index) => (
                    <div key={index} style={{ marginBottom: '5px', padding: '5px', backgroundColor: '#1a2b3c', borderRadius: '5px' }}>
                      <p style={{ fontSize: '0.8em' }}><strong>{comm.user.firstName} {comm.user.lastName}:</strong> {comm.text}</p>
                      <p style={{ fontSize: '0.7em', color: '#a0a0a0' }}>{new Date(comm.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No tasks yet</p>
        )}
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>Files</h3>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="File Name"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              fontSize: '1em',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              marginBottom: '10px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6c63ff';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
            }}
          />
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="File URL"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #00d1b2',
              backgroundColor: '#0d1a26',
              color: 'white',
              fontSize: '1em',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
              marginBottom: '10px',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#6c63ff';
              e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#00d1b2';
              e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
            }}
          />
          <button
            onClick={handleFileUpload}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Upload File
          </button>
        </div>
        {project.files?.length > 0 ? (
          project.files.map(file => (
            <div key={file._id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#0d1a26', borderRadius: '10px', borderLeft: '3px solid #6c63ff' }}>
              <p style={{ fontSize: '1em', marginBottom: '5px' }}><strong style={{ color: '#6c63ff' }}>Name:</strong> {file.name}</p>
              <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
                <strong style={{ color: '#6c63ff' }}>URL:</strong> 
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    color: '#00d1b2', 
                    textDecoration: 'none', 
                    marginLeft: '5px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  View File
                </a>
              </p>
              <p style={{ fontSize: '0.9em', marginBottom: '10px' }}>
                <strong style={{ color: '#6c63ff' }}>Status:</strong> {file.status}
              </p>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button
                    onClick={() => handleFileApproval(file._id, 'approve')}
                    style={{
                      padding: '5px 10px',
                      background: file.status === 'Approved' ? '#00d1b2' : 'transparent',
                      color: 'white',
                      border: '1px solid #00d1b2',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.8em',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#00d1b2';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = file.status === 'Approved' ? '#00d1b2' : 'transparent';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleFileApproval(file._id, 'reject')}
                    style={{
                      padding: '5px 10px',
                      background: file.status === 'Rejected' ? '#ff3860' : 'transparent',
                      color: 'white',
                      border: '1px solid #ff3860',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.8em',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#ff3860';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = file.status === 'Rejected' ? '#ff3860' : 'transparent';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleLike(file._id, 'files')}
                  style={{
                    padding: '5px 10px',
                    background: file.likes.includes(user._id) ? '#ff3860' : 'transparent',
                    color: 'white',
                    border: '1px solid #ff3860',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ff3860';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = file.likes.includes(user._id) ? '#ff3860' : 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Like ({file.likes.length})
                </button>
                <button
                  onClick={() => handleShare(file._id, 'files')}
                  style={{
                    padding: '5px 10px',
                    background: file.shares.includes(user._id) ? '#ffd700' : 'transparent',
                    color: 'white',
                    border: '1px solid #ffd700',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.8em',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#ffd700';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = file.shares.includes(user._id) ? '#ffd700' : 'transparent';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Share ({file.shares.length})
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No files uploaded yet</p>
        )}
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>
          Teams
          {isAdmin && (
            <button
              onClick={() => setShowTeamModal(true)}
              style={{
                marginLeft: '15px',
                padding: '8px 16px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Create Team
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                marginLeft: '10px',
                padding: '8px 16px',
                background: 'linear-gradient(45deg, #6c63ff, #00d1b2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Invite Member
            </button>
          )}
        </h3>
        {showTeamModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#1a2b3c',
              padding: '20px',
              borderRadius: '15px',
              width: '400px',
              boxShadow: '0 8px 16px rgba(0, 209, 178, 0.5)',
              border: '2px solid #00d1b2',
              backdropFilter: 'blur(10px)',
            }}>
              <h4 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.2em' }}>Create Team</h4>
              <input
                type="text"
                value={team.name}
                onChange={(e) => setTeam({ ...team, name: e.target.value })}
                placeholder="Team Name"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  marginBottom: '10px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
              <textarea
                value={team.description}
                onChange={(e) => setTeam({ ...team, description: e.target.value })}
                placeholder="Team Description"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  minHeight: '80px',
                  marginBottom: '10px',
                  resize: 'vertical',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
              <div style={{ marginBottom: '10px' }}>
                <h4 style={{ color: '#00d1b2', fontSize: '1em', marginBottom: '5px' }}>Add Members</h4>
                {project.members.map(member => (
                  <div key={member.user._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={team.members.includes(member.user.email)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTeam({ ...team, members: [...team.members, member.user.email] });
                        } else {
                          setTeam({ ...team, members: team.members.filter(email => email !== member.user.email) });
                        }
                      }}
                      style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
                    />
                    <label style={{ fontSize: '0.9em' }}>{member.user.firstName} {member.user.lastName} ({member.user.email})</label>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleTeamSubmit}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowTeamModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showInviteModal && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: '#1a2b3c',
              padding: '20px',
              borderRadius: '15px',
              width: '400px',
              boxShadow: '0 8px 16px rgba(0, 209, 178, 0.5)',
              border: '2px solid #00d1b2',
              backdropFilter: 'blur(10px)',
            }}>
              <h4 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.2em' }}>Invite Member</h4>
              <input
                type="email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                placeholder="Member Email"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  marginBottom: '10px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              />
              <select
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #00d1b2',
                  backgroundColor: '#0d1a26',
                  color: 'white',
                  fontSize: '1em',
                  transition: 'all 0.3s ease',
                  boxShadow: 'inset 0 0 4px rgba(0, 209, 178, 0.2)',
                  marginBottom: '10px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6c63ff';
                  e.target.style.boxShadow = 'inset 0 0 8px rgba(108, 99, 255, 0.5)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#00d1b2';
                  e.target.style.boxShadow = 'inset 0 0 4px rgba(0, 209, 178, 0.2)';
                }}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleInviteSubmit}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Send Invite
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(45deg, #ff3860, #ff6347)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1em',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
                  }}
                  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                  onMouseEnter={(e) => {
                    e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#00d1b2', fontSize: '1.2em', marginBottom: '10px' }}>Members</h4>
          {project.members.length > 0 ? (
            project.members.map(member => (
              <div key={member.user._id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#0d1a26', borderRadius: '5px', borderLeft: `3px solid ${member.role === 'admin' ? '#ffd700' : '#00d1b2'}` }}>
                <p style={{ fontSize: '0.9em' }}>
                  <strong>{member.user.firstName} {member.user.lastName}</strong> ({member.user.email}) - {member.role}
                </p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No members in this project</p>
          )}
        </div>
        <div>
          <h4 style={{ color: '#00d1b2', fontSize: '1.2em', marginBottom: '10px' }}>Teams</h4>
          {project.teams.length > 0 ? (
            project.teams.map(team => (
              <div key={team._id} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#0d1a26', borderRadius: '10px', borderLeft: '3px solid #ffd700' }}>
                <p style={{ fontSize: '1em', marginBottom: '5px' }}><strong style={{ color: '#ffd700' }}>Name:</strong> {team.name}</p>
                <p style={{ fontSize: '0.9em', marginBottom: '10px' }}><strong style={{ color: '#ffd700' }}>Description:</strong> {team.description}</p>
                <p style={{ fontSize: '0.9em', marginBottom: '10px' }}>
                  <strong style={{ color: '#ffd700' }}>Members:</strong> 
                  {team.members.length > 0 
                    ? team.members.map(id => project.members.find(m => m.user._id === id)?.user.firstName).join(', ') 
                    : ' No members'}
                </p>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '0.9em', color: '#a0a0a0' }}>No teams created yet</p>
          )}
        </div>
      </div>
      <div style={{
        backgroundColor: '#1a2b3c',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
        border: '2px solid #00d1b2',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 209, 178, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
      }}
      >
        <h3 style={{ color: '#00d1b2', marginBottom: '15px', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)', fontSize: '1.5em' }}>
          Notification Settings
          {isAdmin && !editingNotifications && (
            <button
              onClick={() => setEditingNotifications(true)}
              style={{
                marginLeft: '15px',
                padding: '8px 16px',
                background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                e.target.style.transform = 'scale(1)';
              }}
            >
              Edit Settings
            </button>
          )}
        </h3>
        {editingNotifications ? (
          <form onSubmit={handleNotificationSubmit}>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="emailNotifications"
                checked={notificationSettings.emailNotifications}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Email Notifications</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="smsNotifications"
                checked={notificationSettings.smsNotifications}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>SMS Notifications</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="projectUpdates"
                checked={notificationSettings.projectUpdates}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Project Updates</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="taskAssignments"
                checked={notificationSettings.taskAssignments}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Task Assignments</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="comments"
                checked={notificationSettings.comments}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>Comments</label>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                name="fileUploads"
                checked={notificationSettings.fileUploads}
                onChange={handleNotificationChange}
                style={{ width: '20px', height: '20px', accentColor: '#00d1b2' }}
              />
              <label style={{ color: '#00d1b2', fontSize: '1em', textShadow: '0 1px 2px rgba(0, 209, 178, 0.5)' }}>File Uploads</label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(45deg, #00d1b2, #6c63ff)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1em',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 8px rgba(0, 209, 178, 0.3)',
                }}
                onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 6px 12px rgba(0, 209, 178, 0.5)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 209, 178, 0.3)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                Save
              </button>
              // From line 2139 to 2149 (approximate, based on your screenshot)
<button
  type="button"
  onClick={() => setEditingNotifications(false)}
  style={{
    padding: '12px 24px',
    background: 'linear-gradient(45deg, #ff3860, #ff6347)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(255, 56, 96, 0.3)',
  }}
  onMouseDown={(e) => e.target.style.transform = 'scale(0.95)'}
  onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
  onMouseEnter={(e) => {
    e.target.style.boxShadow = '0 6px 12px rgba(255, 56, 96, 0.5)';
    e.target.style.transform = 'scale(1.05)';
  }}
  onMouseLeave={(e) => {
    e.target.style.boxShadow = '0 4px 8px rgba(255, 56, 96, 0.3)';
    e.target.style.transform = 'scale(1)';
  }}
>
  Cancel
</button>
            </div>
          </form>
        ) : (
          <div>
            <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
              <strong style={{ color: '#00d1b2' }}>Email Notifications:</strong> {notificationSettings.emailNotifications ? 'Enabled' : 'Disabled'}
            </p>
            <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
              <strong style={{ color: '#00d1b2' }}>SMS Notifications:</strong> {notificationSettings.smsNotifications ? 'Enabled' : 'Disabled'}
            </p>
            <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
              <strong style={{ color: '#00d1b2' }}>Project Updates:</strong> {notificationSettings.projectUpdates ? 'Enabled' : 'Disabled'}
            </p>
            <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
              <strong style={{ color: '#00d1b2' }}>Task Assignments:</strong> {notificationSettings.taskAssignments ? 'Enabled' : 'Disabled'}
            </p>
            <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
              <strong style={{ color: '#00d1b2' }}>Comments:</strong> {notificationSettings.comments ? 'Enabled' : 'Disabled'}
            </p>
            <p style={{ fontSize: '0.9em', marginBottom: '5px' }}>
              <strong style={{ color: '#00d1b2' }}>File Uploads:</strong> {notificationSettings.fileUploads ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHome;