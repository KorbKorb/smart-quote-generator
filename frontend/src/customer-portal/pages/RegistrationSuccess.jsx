import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { customerAPI } from '../utils/api';
import './RegistrationSuccess.css';

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    // Redirect to login if accessed directly without email
    if (!email) {
      navigate('/portal/login');
    }
  }, [email, navigate]);

  const handleResendEmail = async () => {
    setResending(true);
    setResendMessage('');
    
    try {
      const response = await customerAPI.resendVerificationEmail(email);
      if (response.success) {
        setResendMessage('Verification email sent successfully!');
      } else {
        setResendMessage(response.message || 'Failed to send email');
      }
    } catch (error) {
      setResendMessage('Failed to send email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon-wrapper">
          <svg className="success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="success-title">Registration Successful!</h1>
        
        <div className="success-content">
          <p className="success-message">
            Welcome to Smart Quote Generator! Your account has been created successfully.
          </p>

          <div className="email-notification">
            <svg className="email-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="email-text">
                We've sent a verification email to:
              </p>
              <p className="email-address">{email}</p>
            </div>
          </div>

          <div className="next-steps">
            <h2>What's Next?</h2>
            <ol className="steps-list">
              <li>
                <span className="step-number">1</span>
                <div className="step-content">
                  <strong>Verify your email</strong>
                  <p>Click the link in the email we sent you to verify your account</p>
                </div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div className="step-content">
                  <strong>Sign in to your account</strong>
                  <p>Use your email and password to access the customer portal</p>
                </div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div className="step-content">
                  <strong>Start requesting quotes</strong>
                  <p>Upload your DXF files and get instant quotes</p>
                </div>
              </li>
            </ol>
          </div>

          <div className="action-buttons">
            <Link to="/portal/login" className="btn btn-primary">
              Go to Login
            </Link>
            <button className="btn btn-secondary" onClick={() => window.location.href = 'mailto:'}>
              Open Email App
            </button>
          </div>

          <div className="help-section">
            <p>Didn't receive the email?</p>
            <button 
              className="resend-link"
              onClick={handleResendEmail}
              disabled={resending}
            >
              {resending ? 'Sending...' : 'Resend verification email'}
            </button>
            {resendMessage && (
              <p className={`resend-message ${resendMessage.includes('successfully') ? 'success' : 'error'}`}>
                {resendMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="success-illustration">
        <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Simple illustration of email being sent */}
          <path d="M80 150 L320 150 L320 230 L80 230 Z" fill="#EBF8FF" stroke="#4299E1" strokeWidth="2"/>
          <path d="M80 150 L200 210 L320 150" stroke="#4299E1" strokeWidth="2" fill="none"/>
          <circle cx="350" cy="120" r="30" fill="#48BB78" fillOpacity="0.2"/>
          <path d="M335 120 L345 130 L365 110" stroke="#48BB78" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

export default RegistrationSuccess;