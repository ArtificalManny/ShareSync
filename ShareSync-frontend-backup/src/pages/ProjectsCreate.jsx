import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { PlusCircle, UserPlus, CheckCircle } from 'lucide-react';
import './ProjectsCreate.css';
import axios from 'axios';

const ProjectsCreate = () => {
  const { user, socket, addProject } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState({
    title: '',
    description: '',
    category: '',
    status: 'Not Started',
    privacy: 'private',
  });
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: '', role: 'member' });
  const [addToProfile, setAddToProfile] = useState(true);
  const [created, setCreated] = useState(false);
  const [projectColor, setProjectColor] = useState('#6b48ff');
  const [projectImage, setProjectImage] = useState('');

  const handleInputChange = (e) => {
    setProjectDetails({ ...projectDetails, [e.target.name]: e.target.value });
  };

  const addMember = () => {
    if (!newMember.email) return;
    setMembers([...members, newMember]);
    setNewMember({ email: '', role: 'member' });
  };

  const createProject = async () => {
    if (!projectDetails.title) return;
    const formData = new FormData();
    formData.append('title', projectDetails.title);
    formData.append('description', projectDetails.description);
    formData.append('category', projectDetails.category);
    formData.append('status', projectDetails.status);
    formData.append('privacy', projectDetails.privacy);
    formData.append('color', projectColor);
    if (projectImage) formData.append('image', projectImage);

    try {
      const response = await axios.post('/api/projects', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onProjectCreated(response.data);
    } catch (err) {
      alert('Failed to create project');
    }
  };

  const goToProjects = () => {
    navigate('/projects');
  };

  return (
    <div className="projects-create-container">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-4xl font-playfair text-accent-gold mb-6 text-center flex items-center justify-center">
          <PlusCircle className="w-6 h-6 mr-2" /> Create New Project
        </h1>
        <div className="card p-6">
          {created ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-accent-teal mx-auto mb-4" />
              <p className="text-primary text-lg mb-4">Project created successfully!</p>
              <button onClick={goToProjects} className="btn-primary rounded-full">Go to Projects</button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                name="title"
                value={projectDetails.title}
                onChange={handleInputChange}
                placeholder="Project Title"
                className="input-field w-full rounded-full"
              />
              <textarea
                name="description"
                value={projectDetails.description}
                onChange={handleInputChange}
                placeholder="Project Description"
                className="input-field w-full h-24"
              />
              <input
                type="text"
                name="category"
                value={projectDetails.category}
                onChange={handleInputChange}
                placeholder="Category"
                className="input-field w-full rounded-full"
              />
              <select
                name="status"
                value={projectDetails.status}
                onChange={handleInputChange}
                className="input-field w-full rounded-full"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-primary">Privacy:</label>
                <select
                  name="privacy"
                  value={projectDetails.privacy}
                  onChange={handleInputChange}
                  className="input-field flex-1 rounded-full"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="members-section">
                <h2 className="text-xl font-playfair text-accent-teal mb-2 flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" /> Add Members
                </h2>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="Member email..."
                    className="input-field flex-1 rounded-full"
                  />
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="input-field rounded-full"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button onClick={addMember} className="btn-primary rounded-full flex items-center">
                    <UserPlus className="w-5 h-5 mr-2" /> Add
                  </button>
                </div>
                {members.length > 0 && (
                  <ul className="space-y-2">
                    {members.map((member, index) => (
                      <li key={index} className="flex items-center gap-2 text-primary">
                        <img
                          src={member.profilePicture}
                          alt={member.email}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{member.email}</span> - <span className="text-accent-gold">{member.role}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <label className="flex items-center gap-2 text-primary">
                <input
                  type="checkbox"
                  checked={addToProfile}
                  onChange={(e) => setAddToProfile(e.target.checked)}
                />
                Add to my profile
              </label>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Project Color</label>
                <input
                  type="color"
                  value={projectColor}
                  onChange={e => setProjectColor(e.target.value)}
                  className="w-12 h-12 rounded-full border-2 border-gray-300"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Project Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setProjectImage(e.target.files[0])}
                  className="block"
                />
              </div>
              <button onClick={createProject} className="btn-primary rounded-full flex items-center w-full justify-center mt-4">
                <PlusCircle className="w-5 h-5 mr-2" /> Create Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsCreate;