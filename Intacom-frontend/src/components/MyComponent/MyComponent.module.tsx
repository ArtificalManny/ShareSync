import React from 'react';
import styles from './MyComponent.module.css';

const MyComponent: React.FC = () => (
  <div className={styles.myClass}>
    {/* Your component content goes here */}
    <h2>Welcome to MyComponent</h2>
    <p>This is styled by MyComponent.module.css</p>
  </div>
);

export default MyComponent;
