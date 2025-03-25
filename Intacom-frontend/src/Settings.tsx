import React from 'react';

const Settings: React.FC = () => {
  console.log('Rendering Settings page');
  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>Settings</h2>
      <p style={{ fontSize: '1rem', opacity: 0.8 }}>
        Manage your account settings here.
      </p>
    </div>
  );
};

export default Settings;