import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProject } from '../utils/api';

const ProjectHome = ({ user, setUser }) => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching project details for ID:', id);
        const projectData = await getProject(id);
        console.log('Project data:', projectData);
        setProject(projectData);
      } catch (err) {
        console.error('Failed to fetch project details:', err.message);
        setError(`Failed to load project details: ${err.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (!user) {
    return <div className="text-white text-center mt-10">User not authenticated. Please log in.</div>;
  }

  if (loading) {
    return <div className="text-white text-center mt-10 animate-shimmer">Loading...</div>;
  }

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-6 animate-fade-in">
        <h1 className="text-4xl font-display text-vibrant-pink">{project?.title || 'Project'}</h1>
        <p className="text-white mt-3 text-lg">{project?.description || 'No description'}</p>
        <p className="text-sm text-gray-300 mt-2">Category: {project?.category || 'N/A'}</p>
        <p className="text-sm text-gray-300">Status: {project?.status || 'N/A'}</p>
      </header>
    </div>
  );
};

export default ProjectHome;