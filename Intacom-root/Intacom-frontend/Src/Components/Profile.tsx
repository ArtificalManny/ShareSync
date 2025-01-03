// src/components/Profile.tsx
import React, { useState } from 'react';
import { Box, Typography, Avatar, Button, TextField, IconButton, Grid, Paper } from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon } from '@mui/icons-material';
import { styled } from '@mui/system';
import api from '../api/api'; // Axios instance

// Styled Components
const CoverImage = styled('div')({
  width: '100%',
  height: '200px',
  backgroundImage: 'url(/default-cover.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  position: 'relative',
});

const ProfileContainer = styled(Paper)(({ theme }) => ({
  marginTop: '-50px',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
}));

const Profile: React.FC = () => {
  // State Management
  const [editing, setEditing] = useState<boolean>(false);
  const [user, setUser] = useState<any>({
    name: 'John Doe',
    headline: 'Software Engineer at XYZ',
    bio: 'Passionate developer with experience in React and Node.js.',
    contact: 'john.doe@example.com',
    coverImage: '/default-cover.jpg',
    profilePicture: '/default-profile.jpg',
    experiences: [
      {
        id: 1,
        title: 'Software Engineer',
        company: 'XYZ Corp',
        duration: 'Jan 2020 - Present',
        description: 'Developing scalable web applications using React and Node.js.',
      },
    ],
    education: [
      {
        id: 1,
        school: 'ABC University',
        degree: 'B.S. in Computer Science',
        duration: '2016 - 2020',
      },
    ],
    projects: [
      {
        id: 1,
        name: 'IntelliConnect',
        description: 'A comprehensive project management tool.',
        images: ['/project1.jpg'],
        links: ['https://github.com/ArtificalManny/Intacom'],
      },
    ],
  });

  // Handlers
  const handleEditToggle = () => {
    setEditing(!editing);
  };

  const handleSave = () => {
    // Implement API call to save user data
    api.put('/users/profile', user)
      .then(response => {
        setUser(response.data);
        setEditing(false);
      })
      .catch(error => {
        console.error('Error updating profile:', error);
      });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('image', e.target.files[0]);

      api.post(`/users/upload-${type}-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then(response => {
          setUser({
            ...user,
            [type === 'cover' ? 'coverImage' : 'profilePicture']: response.data.imageUrl,
          });
        })
        .catch(error => {
          console.error(`Error uploading ${type} image:`, error);
        });
    }
  };

  return (
    <Box>
      {/* Cover Image */}
      <CoverImage style={{ backgroundImage: `url(${user.coverImage})` }}>
        {editing && (
          <Button
            variant="contained"
            component="label"
            style={{ position: 'absolute', bottom: '10px', right: '10px' }}
          >
            Change Cover
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'cover')}
            />
          </Button>
        )}
      </CoverImage>

      {/* Profile Section */}
      <ProfileContainer>
        <Avatar
          src={user.profilePicture}
          alt="Profile Picture"
          sx={{ width: 100, height: 100, border: '4px solid white' }}
        />
        {editing && (
          <Button
            variant="contained"
            component="label"
            style={{ marginLeft: '20px' }}
          >
            Change Profile Picture
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'profile')}
            />
          </Button>
        )}
        <Box sx={{ marginLeft: '20px', flexGrow: 1 }}>
          {editing ? (
            <>
              <TextField
                label="Name"
                name="name"
                value={user.name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Headline"
                name="headline"
                value={user.headline}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </>
          ) : (
            <>
              <Typography variant="h4">{user.name}</Typography>
              <Typography variant="subtitle1">{user.headline}</Typography>
            </>
          )}
        </Box>
        <IconButton onClick={editing ? handleSave : handleEditToggle}>
          {editing ? <SaveIcon /> : <EditIcon />}
        </IconButton>
      </ProfileContainer>

      {/* About Section */}
      <Box sx={{ padding: '20px' }}>
        <Typography variant="h5">About</Typography>
        {editing ? (
          <>
            <TextField
              label="Bio"
              name="bio"
              value={user.bio}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              margin="normal"
            />
            <TextField
              label="Contact Information"
              name="contact"
              value={user.contact}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
          </>
        ) : (
          <>
            <Typography>{user.bio}</Typography>
            <Typography>Email: {user.contact}</Typography>
          </>
        )}
      </Box>

      {/* Experience Section */}
      <Box sx={{ padding: '20px' }}>
        <Typography variant="h5">Experience</Typography>
        {user.experiences.map((exp: any) => (
          <Box key={exp.id} sx={{ marginBottom: '10px' }}>
            <Typography variant="h6">{exp.title} at {exp.company}</Typography>
            <Typography variant="subtitle2">{exp.duration}</Typography>
            <Typography>{exp.description}</Typography>
          </Box>
        ))}
      </Box>

      {/* Education Section */}
      <Box sx={{ padding: '20px' }}>
        <Typography variant="h5">Education</Typography>
        {user.education.map((edu: any) => (
          <Box key={edu.id} sx={{ marginBottom: '10px' }}>
            <Typography variant="h6">{edu.degree} at {edu.school}</Typography>
            <Typography variant="subtitle2">{edu.duration}</Typography>
          </Box>
        ))}
      </Box>

      {/* Projects Section */}
      <Box sx={{ padding: '20px' }}>
        <Typography variant="h5">Projects</Typography>
        <Grid container spacing={2}>
          {user.projects.map((project: any) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Paper sx={{ padding: '10px' }}>
                <Typography variant="h6">{project.name}</Typography>
                <Typography variant="body2">{project.description}</Typography>
                {project.images.map((img: string, index: number) => (
                  <img key={index} src={img} alt={project.name} style={{ width: '100%', marginTop: '10px' }} />
                ))}
                <Button
                  href={project.links[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  sx={{ marginTop: '10px' }}
                >
                  View Project
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default Profile;
