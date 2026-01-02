// src/components/assignments/SubmitAssignment.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logUserActivity } from '../../utils/activityLogger';

// Placeholder submitAssignment function (replace with real logic)
const submitAssignment = async ({ file, projectId }) => {
  return {
    assignmentId: Math.random().toString(36).substring(2),
    title: file.name,
    projectId,
  };
};

const SubmitAssignment = ({ projectId }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    try {
      const submission = await submitAssignment({ file, projectId });

      await logUserActivity(user._id, 'assignment', 'submitted assignment', projectId, {
        assignmentId: submission.assignmentId,
        title: submission.title,
      });

      setFile(null);
      toast.success('Assignment submitted!', { description: 'Activity has been logged', duration: 3000 });
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error('Submission failed', { description: 'Please try again', duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAssignmentSubmit} className="assignment-form">
      <h3>Submit Assignment</h3>
      <input type="file" onChange={handleFileChange} />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Assignment'}
      </button>
    </form>
  );
};

export default SubmitAssignment;