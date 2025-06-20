import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    // Check backend connection
    fetch('http://localhost:5000/health')
      .then(res => res.json())
      .then(data => setBackendStatus('Connected ✓'))
      .catch(err => setBackendStatus('Not connected ✗'));

    // Fetch materials
    fetch('http://localhost:5000/api/materials')
      .then(res => res.json())
      .then(data => setMaterials(data.data || []))
      .catch(err => console.error('Error fetching materials:', err));
  }, []);

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 className="stat-title">Total Quotes</h3>
          <p className="stat-value">24</p>
        </div>
        <div className="card">
          <h3 className="stat-title">This Month</h3>
          <p className="stat-value" style={{ color: '#ff9800' }}>5</p>
        </div>
        <div className="card">
          <h3 className="stat-title">Revenue</h3>
          <p className="stat-value" style={{ color: '#4caf50' }}>,678</p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Quick Actions</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/new-quote" className="btn btn-primary">
            Create New Quote
          </Link>
          <button className="btn btn-secondary">
            View Reports
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">System Status</h2>
        <p>Backend API: <strong>{backendStatus}</strong></p>
        <p>Materials in database: <strong>{materials.length}</strong></p>
      </div>

      {materials.length > 0 && (
        <div className="card">
          <h2 className="card-title">Available Materials</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Price/lb</th>
                  <th>Density</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(material => (
                  <tr key={material.id}>
                    <td>{material.name}</td>
                    <td></td>
                    <td>{material.density} lb/in³</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
