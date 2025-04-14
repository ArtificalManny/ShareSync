import React, { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  gender: string;
  birthday: {
    month: string;
    day: string;
    year: string;
  };
}

const ProfileEdit: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/projects/by-id/${username}`);
      const userData: User = response.data.data;
      setProfile(userData);
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
      setEmail(userData.email);
      setGender(userData.gender);
      setBirthday(userData.birthday);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) throw new Error('User not logged in');
      const userData = JSON.parse(storedUser) as User;
      await axios.put(`${import.meta.env.VITE_API_URL}/users/${userData._id}`, {
        firstName,
        lastName,
        email,
        gender,
        birthday,
      });
      navigate(`/profile/${userData.username}`);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div>
      <h1>Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <div>
          <input
            type="text"
            placeholder="MM"
            value={birthday.month}
            onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
            required
            maxLength={2}
            pattern="\d*"
          />
          <input
            type="text"
            placeholder="DD"
            value={birthday.day}
            onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
            required
            maxLength={2}
            pattern="\d*"
          />
          <input
            type="text"
            placeholder="YYYY"
            value={birthday.year}
            onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
            required
            maxLength={4}
            pattern="\d*"
          />
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default ProfileEdit;