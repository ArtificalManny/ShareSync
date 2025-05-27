import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { Edit, Camera, PlusCircle, Folder, Mail as MailIcon, User as UserIcon } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUserProfile, isLoading, setIntendedRoute } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [bannerImage, setBannerImage] = useState('https://via.placeholder.com/1200x300');
  const [profileImage, setProfileImage] = useState('https://via.placeholder.com/150');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Wait for AuthContext to finish loading
        if (isLoading) {
          console.log('Profile - Waiting for AuthContext to finish loading');
          return;
        }

        if (!isAuthenticated) {
          console.log('Profile - User not authenticated, redirecting to login');
          setIntendedRoute(`/profile/${username}`); // Store intended route
          navigate('/login', { replace: true });
          return;
        }

        if (!user || !user.username) {
          console.log('Profile - User data not available');
          setError('User data not available. Please log in again.');
          setIntendedRoute(`/profile/${username}`);
          navigate('/login', { replace: true });
          return;
        }

        if (!username) {
          throw new Error('Username is missing in URL');
        }

        console.log('Profile - Fetching profile for:', username, 'Authenticated user:', user.username);
        const cleanUsername = username.trim();
        const userUsername = user.username?.trim();
        if (userUsername !== cleanUsername) {
          throw new Error('You can only view your own profile');
        }

        const userProfile = {
          username: userUsername || 'johndoe',
          firstName: user.firstName || 'John',
          lastName: user.lastName || 'Doe',
          email: user.email || 'johndoe@example.com',
          projects: Array.isArray(user.projects) ? user.projects : [],
        };
        setProfile(userProfile);
        setProfileImage(user.profilePicture || 'https://via.placeholder.com/150');
        setBannerImage(user.bannerImage || 'https://via.placeholder.com/1200x300');
      } catch (err) {
        console.error('Profile - Error fetching profile:', err.message, err.stack);
        setError('Failed to load profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, isAuthenticated, user, navigate, isLoading, setIntendedRoute]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
    });
  };

  const handleSave = () => {
    updateUserProfile(editedProfile);
    setProfile((prev) => ({
      ...prev,
      ...editedProfile,
    }));
    setIsEditing(false);
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerImage(reader.result);
        updateUserProfile({ bannerImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        updateUserProfile({ profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading || isLoading) return <div className="profile-container"><p className="text-holo-gray">Loading profile...</p></div>;

  if (error || !profile) {
    return (
      <div className="profile-container">
        <p className="text-red-500">{error || 'Profile not found'}</p>
        {(error.includes('token') || error.includes('User data not available')) && (
          <p className="text-holo-gray">
            Please <Link to="/login" className="text-holo-blue hover:underline">log in</Link> to view this profile.
          </p>
        )}
      </div>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <div className="profile-container">
      <div className="banner-section relative">
        <img
          src={bannerImage}
          alt="Banner"
          className="w-full h-48 object-cover animate-glow"
        />
        {isOwnProfile && (
          <label className="absolute top-4 right-4 flex items-center text-holo-blue hover:text-holo-pink cursor-pointer transition-all">
            <Camera className="w-5 h-5 mr-2 animate-pulse" /> Change Banner
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      <div className="profile-header text-center mt-[-80px] mb-6">
        <div className="relative inline-block">
          <img
            src={profileImage}
            alt="Profile"
            className="w-40 h-40 rounded-full object-cover border-4 border-holo-blue mx-auto animate-glow"
          />
          {isOwnProfile && (
            <label className="absolute bottom-2 right-2 bg-holo-blue p-2 rounded-full cursor-pointer animate-pulse">
              <Camera className="w-5 h-5 text-primary" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        <h1 className="text-3xl font-inter text-holo-blue mt-4 animate-text-glow">
          {profile.firstName} {profile.lastName}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {isOwnProfile && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleEdit}
              className="btn-primary rounded-full flex items-center animate-glow"
            >
              <Edit className="w-5 h-5 mr-2" /> Edit Profile
            </button>
          </div>
        )}

        {isEditing ? (
          <div className="card p-6 mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <Edit className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Edit Profile
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-holo-pink" />
                <input
                  type="text"
                  value={editedProfile.firstName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                  placeholder="First Name"
                  className="input-field w-full rounded-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-holo-pink" />
                <input
                  type="text"
                  value={editedProfile.lastName}
                  onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                  placeholder="Last Name"
                  className="input-field w-full rounded-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <MailIcon className="w-5 h-5 text-holo-pink" />
                <input
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  placeholder="Email"
                  className="input-field w-full rounded-full"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={handleSave} className="btn-primary rounded-full flex-1 animate-glow">Save</button>
                <button onClick={() => setIsEditing(false)} className="btn-primary bg-holo-bg-light rounded-full flex-1">Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 mb-6">
            <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> About
            </h2>
            <p className="text-primary flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-holo-pink" /> Username: <span className="text-holo-blue">{profile.username}</span>
            </p>
            <p className="text-primary flex items-center gap-2 mt-2">
              <MailIcon className="w-4 h-4 text-holo-pink" /> Email: <span className="text-holo-blue">{profile.email}</span>
            </p>
          </div>
        )}

        <div className="projects-section card p-6">
          <h2 className="text-2xl font-inter text-holo-blue mb-4 flex items-center">
            <Folder className="w-5 h-5 mr-2 text-holo-pink animate-pulse" /> Projects
          </h2>
          {profile.projects?.length === 0 ? (
            <p className="text-holo-gray">No projects yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.projects.map((project) => (
                <Link
                  to={`/projects/${project.id}`}
                  key={project.id}
                  className="project-card card p-4 hover:bg-holo-bg-dark transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-6 h-6 text-holo-pink" />
                    <div>
                      <h3 className="text-lg font-inter text-holo-blue animate-text-glow">{project.title}</h3>
                      <p className="text-holo-gray text-sm">{project.description || 'No description'}</p>
                    </div>
                  </div>
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