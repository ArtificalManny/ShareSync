import React from 'react';

interface TaskProps {
  task: {
    id: number;
    title: string;
    assignee: string;
    dueDate: Date;
    status: string;
    comments: { user: string; text: string }[];
    user: string;
  };
  onComment?: (text: string) => void;
  onUpdateStatus?: (status: string) => void;
}

const Task: React.FC<TaskProps> = ({ task, onComment, onUpdateStatus }) => {
  const [comment, setComment] = React.useState('');
  const [status, setStatus] = React.useState(task.status);

  return (
    <div className="p-4 bg-gray-100 rounded mb-4">
      <h4 className="text-md font-bold">{task.title}</h4>
      <p className="text-gray-700">Assignee: {task.assignee}</p>
      <p className="text-gray-700">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
      <p className="text-gray-700">Status: {task.status}</p>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 p-2 border rounded">
        <option value="Pending">Pending</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
      <button onClick={() => onUpdateStatus && onUpdateStatus(status)} className="mt-2 py-1 px-3 bg-purple-500 text-white rounded hover:bg-purple-600">Update Status</button>
      <div className="mt-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded"
        />
        <button onClick={() => onComment && onComment(comment)} className="mt-2 py-1 px-3 bg-green-500 text-white rounded hover:bg-green-600">Comment</button>
      </div>
      <div className="mt-2">
        {task.comments.map((c, index) => (
          <p key={index} className="text-gray-700">-{c.user}: {c.text}</p>
        ))}
      </div>
    </div>
  );
};

export default Task;