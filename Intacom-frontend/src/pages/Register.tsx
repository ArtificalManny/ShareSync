import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { theme } from '../styles/theme';
import { motion } from 'framer-motion';
import axios from 'axios';

const Container = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
`;

const Form = styled.form`
  background: ${theme.colors.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h2`
  font-size: ${theme.typography.h2.fontSize};
  font-weight: ${theme.typography.h2.fontWeight};
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.primary};
`;

const Input = styled.input`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
`;

const Select = styled.select`
  width: 100%;
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.textLight};
  border-radius: ${theme.borderRadius.small};
`;

const Button = styled.button`
  width: 100%;
  margin-top: ${theme.spacing.sm};
`;

const Link = styled.a`
  display: block;
  margin-top: ${theme.spacing.sm};
  color: ${theme.colors.textLight};
  font-size: ${theme.typography.caption.fontSize};
`;

const Error = styled.p`
  color: ${theme.colors.error};
  font-size: ${theme.typography.caption.fontSize};
  margin-top: ${theme.spacing.sm};
`;

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState({ month: '', day: '', year: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
        firstName,
        lastName,
        username,
        email,
        password,
        gender,
        birthday,
      });
      navigate('/login');
    } catch (err) {
      setError('Unable to register. Please try again.');
    }
  };

  return (
    <Container
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Form onSubmit={handleSubmit}>
        <Title>Register</Title>
        <Input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          required
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </Select>
        <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <Select
            value={birthday.month}
            onChange={(e) => setBirthday({ ...birthday, month: e.target.value })}
            required
          >
            <option value="">Month</option>
            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </Select>
          <Select
            value={birthday.day}
            onChange={(e) => setBirthday({ ...birthday, day: e.target.value })}
            required
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')).map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </Select>
          <Select
            value={birthday.year}
            onChange={(e) => setBirthday({ ...birthday, year: e.target.value })}
            required
          >
            <option value="">Year</option>
            {Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i)).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </div>
        <Button type="submit">Register</Button>
        <Link href="/login">Already have an account? Login</Link>
        {error && <Error>{error}</Error>}
      </Form>
    </Container>
  );
};

export default Register;