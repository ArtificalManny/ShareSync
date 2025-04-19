import { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { lightTheme, darkTheme } from './styles/theme';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  margin: 0 auto;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  background: linear-gradient(45deg, #818cf8, #f9a8d4);
  color: #fff;
  padding: 10px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  &:hover {
    transform: scale(1.05);
  }
`;

const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

const FeedbackForm = () => {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/feedback`,
        { content, rating },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } },
      );
      setContent('');
      setRating(0);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Your feedback"
        rows={5}
        required
      />
      <input
        type="number"
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        placeholder="Rating (1-5)"
        min="1"
        max="5"
        required
      />
      <Button type="submit">Submit Feedback</Button>
    </Form>
  );
};

export default FeedbackForm;