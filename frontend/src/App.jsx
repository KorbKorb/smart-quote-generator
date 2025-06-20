import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewQuote from './pages/NewQuote';
import QuoteHistory from './pages/QuoteHistory';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">Smart Quote Generator</h1>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/new-quote" className="nav-link">New Quote</Link>
              </li>
              <li className="nav-item">
                <Link to="/quotes" className="nav-link">Quote History</Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-quote" element={<NewQuote />} />
            <Route path="/quotes" element={<QuoteHistory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;