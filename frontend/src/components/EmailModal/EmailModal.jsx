// frontend/src/components/EmailModal/EmailModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './EmailModal.css';

const EmailModal = ({ isOpen, onClose, quote }) => {
  const [formData, setFormData] = useState({
    recipientEmail: quote?.customer?.email || '',
    ccEmail: '',
    subject: `Quote #${quote?._id?.slice(-8).toUpperCase()} - ${quote?.customer?.company || quote?.customer?.name}`,
    message: '',
    includeTerms: true
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const response = await axios.post(
        `http://localhost:5000/api/quotes/${quote._id}/send-email`,
        {
          recipientEmail: formData.recipientEmail,
          ccEmail: formData.ccEmail,
          customMessage: formData.message
        }
      );

      if (response.data.success) {
        setSent(true);
        setTimeout(() => {
          onClose();
          setSent(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error.response?.data?.message || 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="email-modal-overlay" onClick={onClose}>
      <div className="email-modal" onClick={e => e.stopPropagation()}>
        <div className="email-modal-header">
          <h2>Send Quote Email</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" />
              <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="email-sent-success">
            <svg className="success-icon" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="25" fill="none" />
              <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
            <h3>Email Sent Successfully!</h3>
            <p>The quote has been sent to {formData.recipientEmail}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="email-form">
            <div className="form-group">
              <label htmlFor="recipientEmail">To *</label>
              <input
                type="email"
                id="recipientEmail"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleInputChange}
                required
                placeholder="customer@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ccEmail">CC (Optional)</label>
              <input
                type="email"
                id="ccEmail"
                name="ccEmail"
                value={formData.ccEmail}
                onChange={handleInputChange}
                placeholder="additional@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Additional Message (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="4"
                placeholder="Add a personal message to the email..."
              />
            </div>

            <div className="email-preview">
              <h4>Email Preview</h4>
              <div className="preview-content">
                <p><strong>Dear {quote?.customer?.name},</strong></p>
                <p>Thank you for your interest in our sheet metal fabrication services. We're pleased to provide you with a detailed quote for your project.</p>
                {formData.message && (
                  <p className="custom-message">{formData.message}</p>
                )}
                <p>The attached PDF includes complete pricing breakdown, part specifications, and terms.</p>
                <p><strong>Total Amount: ${quote?.totalPrice ? parseFloat(quote.totalPrice).toFixed(2) : '0.00'}</strong></p>
              </div>
            </div>

            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="includeTerms"
                  checked={formData.includeTerms}
                  onChange={handleInputChange}
                />
                Include terms and conditions
              </label>
            </div>

            {error && (
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                </svg>
                {error}
              </div>
            )}

            <div className="email-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? (
                  <>
                    <div className="loading-spinner small"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailModal;
