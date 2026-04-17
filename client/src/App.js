import React from 'react';
import Dashboard from './pages/Dashboard';

export default function App(){
  const token = 'demo-token'; // Use demo token
  return <Dashboard token={token} />;
}
