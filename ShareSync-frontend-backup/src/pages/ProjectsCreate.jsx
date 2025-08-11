import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, UserPlus, X, Trash2 } from 'lucide-react';
import './ProjectsCreate.css';
import client from '../api/client'; // ✅ use the shared axios instance
import { getAccessToken } from '../utils/tokenUtils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProjectsCreate({ onProjectCreated, onClose }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    status: 'Not Started',
    privacy: 'private',
  });

  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ email: '', role: 'member' });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const addMember = () => {
    if (!newMember.email.trim()) return;
    if (!/^\S+@\S+\.\S+$/.test(newMember.email.trim())) {
      setError('Please enter a valid member email.');
      return;
    }
    setMembers((m) => [...m, { ...newMember }]);
    setNewMember({ email: '', role: 'member' });
    setError('');
  };

  const removeMember = (idx) => {
    setMembers((m) => m.filter((_, i) => i !== idx));
  };

  const validate = () => {
    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setError('Please fill all required fields: Title, Description, and Category.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Ensure a token exists (most setups already inject via client interceptors; this is a safety net).
      const token = getAccessToken?.();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        status: form.status,
        privacy: form.privacy,
        members,
      };

      const res = await client.post(
        '/projects',
        payload,
        token
          ? { baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } }
          : { baseURL: API_BASE }
      );

      const project = res.data;
      onProjectCreated && onProjectCreated(project);
      navigate(`/projects/${project._id}`);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create project';
      if (String(err?.response?.status) === '401') {
        setError('Unauthorized. Please log in again.');
      } else {
        setError(`Failed to create project: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pc-modal">
      <div className="pc-card">
        <div className="pc-header">
          <h1 className="pc-title">
            <PlusCircle className="pc-title-icon" /> Create New Project
          </h1>
          {onClose && (
            <button className="pc-icon-btn" onClick={onClose} aria-label="Close create project">
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="pc-form">
          {error && <div className="pc-alert">{error}</div>}

          <div className="pc-grid">
            <div className="pc-field">
              <label className="pc-label">Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                placeholder="Project title"
                className="pc-input"
              />
            </div>

            <div className="pc-field pc-col-span-2">
              <label className="pc-label">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="What are you building? Why now?"
                className="pc-textarea"
                rows={4}
              />
            </div>

            <div className="pc-field">
              <label className="pc-label">Category *</label>
              <input
                name="category"
                value={form.category}
                onChange={updateField}
                placeholder="e.g., Personal, School, Work"
                className="pc-input"
              />
            </div>

            <div className="pc-field">
              <label className="pc-label">Status</label>
              <select name="status" value={form.status} onChange={updateField} className="pc-select">
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="pc-field">
              <label className="pc-label">Privacy</label>
              <select name="privacy" value={form.privacy} onChange={updateField} className="pc-select">
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          <div className="pc-divider" />

          <div className="pc-members">
            <div className="pc-members-header">
              <h2 className="pc-section-title">
                <UserPlus className="pc-section-icon" /> Add Members
              </h2>
              <div className="pc-members-row">
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="member@email.com"
                  className="pc-input"
                />
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="pc-select"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="button" className="pc-btn" onClick={addMember}>
                  <UserPlus size={16} /> Add
                </button>
              </div>
            </div>

            {members.length > 0 && (
              <ul className="pc-member-list">
                {members.map((m, i) => (
                  <li key={`${m.email}-${i}`} className="pc-member-item">
                    <span className="pc-member-email">{m.email}</span>
                    <span className="pc-member-role">{m.role}</span>
                    <button
                      type="button"
                      className="pc-icon-btn danger"
                      onClick={() => removeMember(i)}
                      aria-label="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pc-actions">
            {onClose && (
              <button type="button" className="pc-btn ghost" onClick={onClose}>
                Cancel
              </button>
            )}
            <button type="submit" className="pc-btn primary" disabled={submitting}>
              {submitting ? 'Creating…' : (<><PlusCircle size={16} /> Create Project</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
