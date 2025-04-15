import React from 'react';

interface Post {
  _id: string;
  content: string;
  creator: { _id: string; username: string };
  project: { _id: string; name: string };
  createdAt: string;
}

interface PostsListProps {
  posts: Post[];
}

const PostsList: React.FC<PostsListProps> = ({ posts }) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Recent Posts</h2>
      {posts.length > 0 ? (
        <ul style={styles.list}>
          {posts.map((post) => (
            <li key={post._id} style={styles.listItem}>
              <span style={styles.postContent}>{post.content}</span>
              <span style={styles.postDetails}>
                By {post.creator.username} in {post.project.name} -{' '}
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.noContent}>No posts yet.</p>
      )}
    </div>
  );
};

// Futuristic styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  heading: {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '24px',
    textShadow: '0 0 10px #A2E4FF',
    marginBottom: '20px',
    textAlign: 'center',
    color: '#A2E4FF',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    background: 'rgba(162, 228, 255, 0.1)',
    padding: '15px 20px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid #A2E4FF',
    boxShadow: '0 0 10px rgba(162, 228, 255, 0.3)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postContent: {
    fontSize: '16px',
    flex: 1,
    color: '#A2E4FF',
    fontFamily: '"Orbitron", sans-serif',
  },
  postDetails: {
    fontSize: '14px',
    color: '#FF6F91',
    marginLeft: '20px',
    fontFamily: '"Orbitron", sans-serif',
  },
  noContent: {
    fontSize: '16px',
    color: '#FF6F91',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: '"Orbitron", sans-serif',
  },
};

// Add hover effect
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  li:hover {
    transform: scale(1.02);
    box-shadow: 0 0 15px rgba(162, 228, 255, 0.5);
  }
`, styleSheet.cssRules.length);

export default PostsList;