import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import StoryCarousel from '../components/StoryCarousel';
import ProjectsCreate from './ProjectsCreate.jsx';
import {
  Folder,
  CheckCircle,
  ThumbsUp,
  MessageCircle,
  Share2,
  PlusCircle
} from 'lucide-react';

const DEFAULT_PROFILE_PIC = '/default-profile.png';

export default function Home() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      setUser({ firstName: 'User', profilePicture: DEFAULT_PROFILE_PIC });
    }
  }, []);

  useEffect(() => {
    Promise.all([
      axios.get('/api/projects'),
      axios.get('/api/feed'),
    ])
      .then(([projRes, feedRes]) => {
        setProjects(projRes.data);
        setFeedItems(feedRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const socket = io();
    socket.on('newActivity', (activity) => {
      setFeedItems((prev) => [activity, ...prev]);
    });
    return () => socket.disconnect();
  }, []);

  const handleLike = async (id) => {
    try {
      await axios.post(`/api/feed/${id}/like`);
      setFeedItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, likes: it.likes + 1 } : it))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (id) => {
    const text = prompt('Your comment:');
    if (!text) return;
    try {
      const res = await axios.post(`/api/feed/${id}/comment`, { text });
      setFeedItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { ...it, comments: it.comments + 1, lastComment: res.data }
            : it
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfilePicClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('profilePicture', file);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/profile/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      const updatedUser = { ...user, profilePicture: res.data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      alert('Failed to upload profile picture');
    }
    setUploading(false);
  };

  const handleStartProject = () => {
    setShowProjectModal(true);
  };

  const handleProjectCreated = (newProject) => {
    setShowProjectModal(false);
    setProjects((prev) => [newProject, ...prev]);
    window.location.href = `/projects/${newProject._id}`;
  };

  if (loading) {
    return <div className="ml-16 md:ml-24 p-6">Loading…</div>;
  }

  const firstName = user?.firstName || "User";

  return (
    <div className="ml-16 md:ml-24 p-6 bg-gray-100 dark:bg-gray-800 min-h-screen space-y-8">
      {showProjectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          onClick={() => setShowProjectModal(false)}
        >
          <div
            className="project-modal relative"
            style={{
              maxWidth: '420px',
              width: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '2rem',
              background: 'rgba(42,42,62,0.98)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              padding: '2rem'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setShowProjectModal(false)}
            >
              ×
            </button>
            <ProjectsCreate onProjectCreated={handleProjectCreated} />
          </div>
        </div>
      )}

      <section
        className="rounded-3xl shadow-xl p-8 flex items-center space-x-6"
        style={{ background: 'linear-gradient(135deg, #D8B4FE, #FDE68A)' }}
      >
        <div className="relative">
          <div className="profile-picture-ring">
            <img
              src={user?.profilePic || DEFAULT_PROFILE_PIC}
              alt={`${firstName}'s profile`}
              className="w-24 h-24 rounded-full ring-4 ring-indigo-500 cursor-pointer object-cover transition-all duration-300"
              onClick={handleProfilePicClick}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 rounded-full">
              <span className="text-xs text-gray-700">Uploading...</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleProfilePicChange}
          />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Welcome, {firstName}!
          </h1>
          <p className="text-gray-700 dark:text-gray-300 mt-2 flex space-x-8 text-lg">
            <span className="inline-flex items-center">
              <Folder className="w-6 h-6 mr-2 text-indigo-500" />
              {projects.length} active
            </span>
            <span className="inline-flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-500" />
              {feedItems.filter((f) => f.type === 'completed').length} completed
            </span>
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Recent Updates
          </h2>
          {(feedItems.length > 0 || projects.length > 0) && (
            <button
              className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
              onClick={handleStartProject}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Start a New Project
            </button>
          )}
        </div>
        {feedItems.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No updates yet.
            <br />
            <button
              className="mt-6 flex items-center px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
              onClick={handleStartProject}
            >
              <PlusCircle className="w-6 h-6 mr-3" />
              Start a New Project
            </button>
          </div>
        ) : (
          <StoryCarousel projects={projects} />
        )}
      </section>

      <section className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Project Activity Feed
          </h2>
          {(feedItems.length > 0 || projects.length > 0) && (
            <button
              className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
              onClick={handleStartProject}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Start a New Project
            </button>
          )}
        </div>
        {feedItems.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-8">
            No activity yet. Start by creating a project or posting an update!
            <br />
            <button
              className="mt-6 flex items-center px-6 py-3 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition"
              onClick={handleStartProject}
            >
              <PlusCircle className="w-6 h-6 mr-3" />
              Start a New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col p-6 bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transition"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={item.user.avatarUrl}
                    alt={item.user.name}
                    className="w-10 h-10 rounded-full ring-2 ring-indigo-500 object-cover"
                  />
                  <div>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {item.user.name}{' '}
                      <span className="text-indigo-500">
                        {item.type === 'update'
                          ? `Updated ${item.projectName}`
                          : item.title}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">{item.timestamp}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between text-gray-600 dark:text-gray-400 text-base">
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleLike(item.id)}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{item.likes}</span>
                  </button>
                  <button
                    className="flex items-center space-x-1"
                    onClick={() => handleComment(item.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{item.comments}</span>
                  </button>
                  <button className="flex items-center space-x-1">
                    <Share2 className="w-4 h-4" />
                    <span>{item.shares}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}