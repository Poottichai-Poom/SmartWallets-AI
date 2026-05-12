import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Home: React.FC = () => {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    api.get('/health')
      .then(res => setStatus(res.data.message))
      .catch(() => setStatus('Backend Unreachable'));
  }, []);

  return (
    <div className="home-page">
      <h1>SmartWallets-AI Dashboard</h1>
      <p>System Status: <strong>{status}</strong></p>
    </div>
  );
};

export default Home;
