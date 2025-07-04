import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewQuote from './pages/NewQuote';
import QuoteHistory from './pages/QuoteHistory';
import QuoteDetail from './pages/QuoteDetail';

// Customer Portal imports
import { CustomerAuthProvider } from './customer-portal/contexts/CustomerAuthContext';
import PortalLayout from './customer-portal/components/PortalLayout';
import ProtectedRoute from './customer-portal/components/ProtectedRoute';
import CustomerLogin from './customer-portal/pages/Login';
import CustomerRegister from './customer-portal/pages/Register';
import RegistrationSuccess from './customer-portal/pages/RegistrationSuccess';
import CustomerDashboard from './customer-portal/pages/Dashboard';

import './App.css';
import './customer-portal/styles/typography.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/*" element={<AdminApp />} />
        
        {/* Customer Portal Routes */}
        <Route path="/portal/*" element={
          <CustomerAuthProvider>
            <CustomerPortal />
          </CustomerAuthProvider>
        } />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Router>
  );
}

// Admin App Component
function AdminApp() {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">Smart Quote Generator - Admin</h1>
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/admin" className="nav-link">Dashboard</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/new-quote" className="nav-link">New Quote</Link>
            </li>
            <li className="nav-item">
              <Link to="/admin/quotes" className="nav-link">Quote History</Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new-quote" element={<NewQuote />} />
          <Route path="/quotes" element={<QuoteHistory />} />
          <Route path="/quotes/:id" element={<QuoteDetail />} />
        </Routes>
      </main>
    </div>
  );
}

// Customer Portal Component
function CustomerPortal() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/register" element={<CustomerRegister />} />
      <Route path="/registration-success" element={<RegistrationSuccess />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <PortalLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        {/* Add more customer portal routes here as we build them */}
      </Route>
    </Routes>
  );
}

export default App;