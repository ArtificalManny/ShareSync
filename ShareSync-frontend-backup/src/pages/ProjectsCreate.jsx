import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { PlusCircle, UserPlus } from 'lucide-react';
import './ProjectsCreate.css';
import axios from 'axios';
import { getAccessToken } from '../utils/tokenUtils'; // ✅ Good placement

const ProjectsCreate = ({ onProjectCreated }) => {
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

  const handleInputChange = (e) => {
    setProjectDetails({ ...projectDetails, [e.target.name]: e.target.value });
  };

  const addMember = () => {
    if (!newMember.email) return;
    setMembers([...members, newMember]);
    setNewMember({ email: '', role: 'member' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIX: get fresh token inside submit handler
    const token = getAccessToken(); 

    if (!token) {
      alert('Please log in to create a project.');
      navigate('/login');
      return;
    }

    if (!projectDetails.title || !projectDetails.description || !projectDetails.category) {
      alert('Please fill all required fields: Title, Description, and Category.');
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:3000/api/projects',
        {
          title: projectDetails.title,
          description: projectDetails.description,
          category: projectDetails.category,
          status: projectDetails.status,
          privacy: projectDetails.privacy,
          members: members,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );      
      if (onProjectCreated) onProjectCreated(res.data);
      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      alert('Failed to create project: ' + (err.response?.data?.message || err.message || 'Error'));
    }
  };

  return (
    <div className="projects-create-container" style={{ background: '#3C2F5D' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6 text-center flex items-center justify-center">
          <PlusCircle className="w-6 h-6 mr-2" /> Create New Project
        </h1>
        <div className="p-6 bg-white bg-opacity-10 rounded-lg">
          <div className="space-y-4">
            <input
              type="text"
              name="title"
              value={projectDetails.title}
              onChange={handleInputChange}
              placeholder="Project Title"
              className="w-full p-2 rounded-full border border-gray-300"
              required
            />
            <textarea
              name="description"
              value={projectDetails.description}
              onChange={handleInputChange}
              placeholder="Project Description"
              className="w-full p-2 h-24 rounded-lg border border-gray-300"
              required
            />
            <input
              type="text"
              name="category"
              value={projectDetails.category}
              onChange={handleInputChange}
              placeholder="Category"
              className="w-full p-2 rounded-full border border-gray-300"
              required
            />
            <select
              name="status"
              value={projectDetails.status}
              onChange={handleInputChange}
              className="w-full p-2 rounded-full border border-gray-300"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-white">Privacy:</label>
              <select
                name="privacy"
                value={projectDetails.privacy}
                onChange={handleInputChange}
                className="flex-1 p-2 rounded-full border border-gray-300"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="members-section">
              <h2 className="text-xl text-teal-300 mb-2 flex items-center">
                <UserPlus className="w-5 h-5 mr-2" /> Add Members
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="Member email..."
                  className="flex-1 p-2 rounded-full border border-gray-300"
                />
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="p-2 rounded-full border border-gray-300"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button onClick={addMember} className="p-2 bg-blue-600 text-white rounded-full flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" /> Add
                </button>
              </div>
              {members.length > 0 && (
                <ul className="space-y-2">
                  {members.map((member, index) => (
                    <li key={index} className="flex items-center gap-2 text-white">
                      <span>{member.email}</span> - <span className="text-yellow-400">{member.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="w-full p-2 bg-green-500 text-white rounded-full mt-4" onClick={handleSubmit}>
              <PlusCircle className="w-5 h-5 mr-2 inline" /> Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsCreate;