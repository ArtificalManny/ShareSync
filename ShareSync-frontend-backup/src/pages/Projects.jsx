import React, { useState, useEffect, useContext } from 'react';
   import { Link, useNavigate } from 'react-router-dom';
   import { AuthContext } from '../AuthContext';
   import { FolderPlus, Folder, AlertCircle, X } from 'lucide-react';
   import './Projects.css';

   const Projects = () => {
     const navigate = useNavigate();
     const { user, isAuthenticated, isLoading, authError, addProject, setIntendedRoute } = useContext(AuthContext);
     const [projects, setProjects] = useState([]);
     const [error, setError] = useState('');
     const [showCreateForm, setShowCreateForm] = useState(false);
     const [newProjectTitle, setNewProjectTitle] = useState('');
     const [newProjectDescription, setNewProjectDescription] = useState('');
     const [isCreating, setIsCreating] = useState(false);

     useEffect(() => {
       if (isLoading) {
         console.log('Projects - Waiting for AuthContext to finish loading');
         return;
       }

       if (!isAuthenticated) {
         console.log('Projects - User not authenticated, redirecting to login');
         setIntendedRoute('/projects');
         navigate('/login', { replace: true });
         return;
       }

       if (!user || !user.email) {
         console.log('Projects - User data not available');
         setError('User data not available. Please log in again.');
         setIntendedRoute('/projects');
         navigate('/login', { replace: true });
         return;
       }

       console.log('Projects - Fetching user projects:', user.projects);
       if (user.projects && Array.isArray(user.projects)) {
         setProjects(user.projects);
       } else {
         console.log('Projects - No projects found for user');
         setProjects([]);
       }
     }, [isAuthenticated, user, isLoading, navigate, setIntendedRoute]);

     const handleCreateProject = async (e) => {
       e.preventDefault();
       if (!newProjectTitle.trim()) {
         setError('Project title is required.');
         return;
       }

       setIsCreating(true);
       setError('');

       const newProject = {
         title: newProjectTitle,
         description: newProjectDescription || 'A new project',
       };

       try {
         const createdProject = await addProject(newProject);
         setProjects([...projects, createdProject]);
         setShowCreateForm(false);
         setNewProjectTitle('');
         setNewProjectDescription('');
         navigate(`/projects/${createdProject.id}`);
       } catch (err) {
         console.error('Projects - Failed to create project:', err.message);
         setError('Failed to create project: ' + err.message);
       } finally {
         setIsCreating(false);
       }
     };

     if (isLoading) {
       console.log('Projects - Rendering loading state');
       return <div className="projects-container"><p className="text-holo-gray">Loading...</p></div>;
     }

     if (authError) {
       console.log('Projects - Rendering auth error state:', authError);
       return (
         <div className="projects-container">
           <p className="text-red-500">{authError}</p>
           <Link to="/login" className="text-holo-blue hover:underline">Login</Link>
         </div>
       );
     }

     return (
       <div className="projects-container">
         <div className="projects-header py-8 px-6 rounded-b-3xl text-center">
           <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">Your Projects</h1>
           <p className="text-holo-gray mb-4">Manage your projects with ease.</p>
           <button
             onClick={() => setShowCreateForm(true)}
             className="btn-primary rounded-full flex items-center mx-auto animate-glow"
           >
             <FolderPlus className="w-5 h-5 mr-2" /> Create New Project
           </button>
         </div>

         <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
           {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
           {projects.length === 0 ? (
             <p className="text-holo-gray flex items-center gap-2 justify-center">
               <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No projects yet. Create one to get started!
             </p>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {projects.map((project) => (
                 <Link
                   key={project.id}
                   to={`/projects/${project.id}`}
                   className="project-card card p-6 glassmorphic holographic-effect"
                 >
                   <h2 className="text-xl font-inter text-holo-blue mb-2 flex items-center">
                     <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> {project.title || 'Untitled Project'}
                   </h2>
                   <p className="text-holo-gray text-sm mb-2">{project.description || 'No description'}</p>
                   <p className="text-holo-gray text-sm">Status: {project.status || 'Not Started'}</p>
                 </Link>
               ))}
             </div>
           )}
         </div>

         {showCreateForm && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
             <div className="bg-holo-bg-light p-6 rounded-lg max-w-md w-full glassmorphic relative z-[60]">
               <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-inter text-holo-blue">Create a New Project</h2>
                 <button onClick={() => setShowCreateForm(false)} className="text-holo-gray hover:text-holo-blue">
                   <X className="w-6 h-6" />
                 </button>
               </div>
               <form onSubmit={handleCreateProject} className="space-y-4">
                 <div>
                   <label className="text-holo-gray text-sm">Project Title</label>
                   <input
                     type="text"
                     value={newProjectTitle}
                     onChange={(e) => setNewProjectTitle(e.target.value)}
                     placeholder="Enter project title"
                     className="input-field w-full rounded-full"
                     required
                   />
                 </div>
                 <div>
                   <label className="text-holo-gray text-sm">Description</label>
                   <textarea
                     value={newProjectDescription}
                     onChange={(e) => setNewProjectDescription(e.target.value)}
                     placeholder="Enter project description (optional)"
                     className="input-field w-full h-24 rounded-lg"
                   />
                 </div>
                 <button
                   type="submit"
                   disabled={isCreating}
                   className="btn-primary rounded-full w-full animate-glow flex items-center justify-center"
                 >
                   {isCreating ? (
                     <span>Creating...</span>
                   ) : (
                     <>
                       <FolderPlus className="w-5 h-5 mr-2" /> Create Project
                     </>
                   )}
                 </button>
               </form>
             </div>
           </div>
         )}
       </div>
     );
   };

   export default Projects;