import React, { useState, useEffect, useContext } from 'react';
   import { useParams, useNavigate, Link } from 'react-router-dom';
   import { AuthContext } from '../AuthContext';
   import { User, Mail, Calendar, Camera, AlertCircle, Edit2, Folder } from 'lucide-react';
   import axios from 'axios';
   import './Profile.css';

   const Profile = () => {
     const { username } = useParams();
     const navigate = useNavigate();
     const { user: currentUser, isAuthenticated, isLoading, updateUserProfile, authError } = useContext(AuthContext);
     const [profile, setProfile] = useState(null);
     const [error, setError] = useState('');
     const [isEditing, setIsEditing] = useState(false);
     const [firstName, setFirstName] = useState('');
     const [lastName, setLastName] = useState('');
     const [age, setAge] = useState('');
     const [profilePicture, setProfilePicture] = useState('');

     useEffect(() => {
       const fetchProfile = async () => {
         if (isLoading) {
           console.log('Profile - Waiting for AuthContext to finish loading');
           return;
         }

         if (!isAuthenticated) {
           console.log('Profile - User not authenticated, redirecting to login');
           navigate('/login', { replace: true, state: { from: `/profile/${username}` } });
           return;
         }

         if (!currentUser || !currentUser.email) {
           console.log('Profile - Current user data not available');
           setError('User data not available. Please log in again.');
           navigate('/login', { replace: true, state: { from: `/profile/${username}` } });
           return;
         }

         console.log('Profile - Current user:', currentUser);
         console.log('Profile - Attempting to fetch profile for username:', username);

         try {
           const response = await axios.get(`http://localhost:3000/api/auth/profile/${username}`);
           const fetchedProfile = response.data;
           console.log('Profile - Profile fetched successfully:', fetchedProfile);
           setProfile(fetchedProfile);
           setFirstName(fetchedProfile.firstName || '');
           setLastName(fetchedProfile.lastName || '');
           setAge(fetchedProfile.age || '');
           setProfilePicture(fetchedProfile.profilePicture || 'https://via.placeholder.com/150');
         } catch (err) {
           console.error('Profile - Failed to fetch profile:', err.message, err.response?.data);
           if (err.response && err.response.status === 404) {
             setError('Profile not found. Please check the username or try again later.');
           } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
             setError('Authentication failed. Please log in again.');
             navigate('/login', { replace: true, state: { from: `/profile/${username}` } });
           } else {
             setError('Failed to load profile: ' + (err.message || 'An unexpected error occurred.'));
           }
         }
       };

       fetchProfile();
     }, [isAuthenticated, currentUser, isLoading, username, navigate]);

     const handleEdit = () => {
       setIsEditing(true);
     };

     const handleSave = async () => {
       try {
         const updates = {
           firstName,
           lastName,
           age: parseInt(age),
           profilePicture,
         };
         console.log('Profile - Saving profile updates:', updates);
         await updateUserProfile(updates);
         setProfile({ ...profile, ...updates });
         setIsEditing(false);
         alert('Profile updated successfully!');
       } catch (err) {
         console.error('Profile - Failed to update profile:', err.message);
         setError('Failed to update profile: ' + (err.message || 'Please try again.'));
       }
     };

     const handleFileChange = (e) => {
       const file = e.target.files[0];
       if (file) {
         const reader = new FileReader();
         reader.onloadend = () => {
           setProfilePicture(reader.result);
         };
         reader.readAsDataURL(file);
       }
     };

     if (isLoading) {
       console.log('Profile - Rendering loading state');
       return (
         <div className="profile-container">
           <div className="text-holo-gray text-center py-16">Loading profile...</div>
         </div>
       );
     }

     if (authError || error) {
       console.log('Profile - Rendering error state:', authError || error);
       return (
         <div className="profile-container">
           <div className="text-red-500 text-center py-16">{authError || error}</div>
           <div className="text-center">
             <Link to="/" className="text-holo-blue hover:underline">Return to Home</Link>
           </div>
         </div>
       );
     }

     if (!profile) {
       console.log('Profile - No profile data available');
       return (
         <div className="profile-container">
           <div className="text-red-500 text-center py-16">Profile not found.</div>
           <div className="text-center">
             <Link to="/" className="text-holo-blue hover:underline">Return to Home</Link>
           </div>
         </div>
       );
     }

     const isOwnProfile = currentUser && currentUser.username === username;

     return (
       <div className="profile-container">
         <div className="profile-header py-8 px-6 rounded-b-3xl text-center">
           <h1 className="text-4xl font-inter text-holo-blue mb-4 animate-text-glow">
             {isOwnProfile ? 'Your Profile' : `${profile.username || 'User'}'s Profile`}
           </h1>
           <p className="text-holo-gray mb-4">
             {isOwnProfile ? 'Manage your personal information.' : 'View user information.'}
           </p>
         </div>

         <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
           <div className="profile-card card p-6 glassmorphic">
             <div className="flex items-center justify-center mb-6">
               <div className="relative">
                 <img
                   src={profilePicture}
                   alt="Profile"
                   className="w-24 h-24 rounded-full object-cover animate-glow"
                 />
                 {isOwnProfile && isEditing && (
                   <label className="absolute bottom-0 right-0 bg-holo-bg-light rounded-full p-2 cursor-pointer">
                     <Camera className="w-5 h-5 text-holo-pink" />
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handleFileChange}
                       className="hidden"
                     />
                   </label>
                 )}
               </div>
             </div>

             {isOwnProfile && !isEditing && (
               <p className="text-holo-gray text-center mb-4">
                 Click "Edit Profile" to update your information.
               </p>
             )}

             <div className="space-y-4">
               <div className="flex items-center gap-2">
                 <User className="w-5 h-5 text-holo-pink" />
                 <div className="flex-1">
                   <label className="text-holo-gray text-sm">Username</label>
                   <input
                     type="text"
                     value={profile.username || ''}
                     disabled
                     className="input-field w-full rounded-full bg-holo-bg-light"
                   />
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <User className="w-5 h-5 text-holo-pink" />
                 <div className="flex-1">
                   <label className="text-holo-gray text-sm">First Name</label>
                   <input
                     type="text"
                     value={firstName}
                     onChange={(e) => setFirstName(e.target.value)}
                     disabled={!isOwnProfile || !isEditing}
                     className={`input-field w-full rounded-full ${!isOwnProfile || !isEditing ? 'bg-holo-bg-light' : ''}`}
                   />
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <User className="w-5 h-5 text-holo-pink" />
                 <div className="flex-1">
                   <label className="text-holo-gray text-sm">Last Name</label>
                   <input
                     type="text"
                     value={lastName}
                     onChange={(e) => setLastName(e.target.value)}
                     disabled={!isOwnProfile || !isEditing}
                     className={`input-field w-full rounded-full ${!isOwnProfile || !isEditing ? 'bg-holo-bg-light' : ''}`}
                   />
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <Mail className="w-5 h-5 text-holo-pink" />
                 <div className="flex-1">
                   <label className="text-holo-gray text-sm">Email</label>
                   <input
                     type="email"
                     value={profile.email || ''}
                     disabled
                     className="input-field w-full rounded-full bg-holo-bg-light"
                   />
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <Calendar className="w-5 h-5 text-holo-pink" />
                 <div className="flex-1">
                   <label className="text-holo-gray text-sm">Age</label>
                   <input
                     type="number"
                     value={age}
                     onChange={(e) => setAge(e.target.value)}
                     disabled={!isOwnProfile || !isEditing}
                     className={`input-field w-full rounded-full ${!isOwnProfile || !isEditing ? 'bg-holo-bg-light' : ''}`}
                     min="13"
                   />
                 </div>
               </div>

               {isOwnProfile && (
                 <div className="flex justify-center gap-4 mt-6">
                   {isEditing ? (
                     <>
                       <button
                         onClick={handleSave}
                         className="btn-primary rounded-full animate-glow"
                       >
                         Save
                       </button>
                       <button
                         onClick={() => setIsEditing(false)}
                         className="btn-primary rounded-full bg-holo-bg-light"
                       >
                         Cancel
                       </button>
                     </>
                   ) : (
                     <button
                       onClick={handleEdit}
                       className="btn-primary rounded-full animate-glow flex items-center"
                     >
                       <Edit2 className="w-5 h-5 mr-2" /> Edit Profile
                     </button>
                   )}
                 </div>
               )}
             </div>
           </div>

           <div className="projects-section card p-6 glassmorphic mt-6">
             <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
               <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> {isOwnProfile ? 'Your Projects' : `${profile.username || 'User'}'s Projects`}
             </h2>
             {profile.projects?.length === 0 ? (
               <p className="text-holo-gray flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-holo-pink animate-pulse" /> No projects yet.
               </p>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {profile.projects?.map((project) => (
                   <Link
                     key={project.id}
                     to={`/projects/${project.id}`}
                     className="project-item card p-4 glassmorphic"
                   >
                     <h3 className="text-lg font-inter text-holo-blue">{project.title || 'Untitled Project'}</h3>
                     <p className="text-holo-gray text-sm">{project.description || 'No description'}</p>
                   </Link>
                 ))}
               </div>
             )}
           </div>
         </div>
       </div>
     );
   };

   export default Profile;