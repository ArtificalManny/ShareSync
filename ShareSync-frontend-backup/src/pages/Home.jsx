import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { ThumbsUp, MessageSquare, Share2 } from 'lucide-react';
import './Home.css';

const Home = () => {
  const { user, isAuthenticated } = useContext(AuthContext);

  const projectFeed = [
    { id: '1', project: 'Project Alpha', type: 'post', user: 'Alice', content: 'Just posted an update on our UI design!', timestamp: '2 hours ago', likes: 5, projectId: '1' },
    { id: '2', project: 'Project Beta', type: 'task', user: 'Bob', content: 'Completed task: Backend API Integration', timestamp: '5 hours ago', projectId: '2' },
    { id: '3', project: 'Project Gamma', type: 'announcement', user: 'Charlie', content: 'Team meeting scheduled for tomorrow at 10 AM', timestamp: '1 day ago', projectId: '3' },
  ];

  return (
    <div className="home-container">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-inter text-primary mb-6">Welcome, {isAuthenticated ? user.firstName : 'Guest'}!</h1>
        <div className="feed bg-glass p-6 rounded-lg shadow-soft">
          <h2 className="text-xl font-inter text-accent-teal mb-4">Project Feed</h2>
          {projectFeed.length === 0 ? (
            <p className="text-gray-400">No updates yet. Join a project to see what’s happening!</p>
          ) : (
            <div className="space-y-4">
              {projectFeed.map((item) => (
                <div
                  key={item.id}
                  className="feed-item bg-glass p-4 rounded-lg shadow-soft transition-all hover:shadow-lg"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-primary font-semibold">{item.user}</span>
                    <span className="text-gray-400 mx-2">in</span>
                    <Link to={`/projects/${item.projectId}`} className="text-accent-teal hover:underline">
                      {item.project}
                    </Link>
                  </div>
                  <p className="text-primary">{item.content}</p>
                  <p className="text-gray-400 text-sm mt-1">{item.timestamp}</p>
                  <div className="flex items-center mt-3 gap-4">
                    <button className="flex items-center text-accent-teal hover:text-accent-gold transition-all">
                      <ThumbsUp className="w-5 h-5 mr-1" /> {item.likes || 0} Likes
                    </button>
                    <button className="flex items-center text-accent-teal hover:text-accent-gold transition-all">
                      <MessageSquare className="w-5 h-5 mr-1" /> Comment
                    </button>
                    <button className="flex items-center text-accent-teal hover:text-accent-gold transition-all">
                      <Share2 className="w-5 h-5 mr-1" /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;