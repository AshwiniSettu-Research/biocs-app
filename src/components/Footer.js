import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  const handleInputChange = (e) => {
    setContactForm({ ...contactForm, [e.target.name]: e.target.value });
  };

  const handleFeedbackChange = (e) => {
    setFeedbackForm({ ...feedbackForm, [e.target.name]: e.target.value });
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setFeedbackStatus('sending');

    try {
      const response = await fetch('https://formsubmit.co/ajax/ashwinisettu.as@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: feedbackForm.name,
          email: feedbackForm.email,
          message: feedbackForm.message,
          _subject: `BIOCS Feedback from ${feedbackForm.name}`,
        }),
      });

      if (response.ok) {
        setFeedbackStatus('success');
        setFeedbackForm({ name: '', email: '', message: '' });
        setTimeout(() => setFeedbackStatus(''), 3000);
      } else {
        setFeedbackStatus('error');
        setTimeout(() => setFeedbackStatus(''), 3000);
      }
    } catch (err) {
      setFeedbackStatus('error');
      setTimeout(() => setFeedbackStatus(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('sending');

    try {
      const response = await fetch('https://formsubmit.co/ajax/ashwinisettu.as@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          _subject: `BIOCS Contact: ${contactForm.subject}`,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitStatus(''), 3000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus(''), 3000);
      }
    } catch (err) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(''), 3000);
    }
  };

  const researcherInfo = (
    <div className="researcher-info">
      <h4>Principal Researcher</h4>
      <p><strong>Name:</strong> Ashwini Settu</p>
      <p><strong>Designation:</strong> Researcher</p>
      <p><strong>Department:</strong> School of Computing</p>
      <p><strong>Institution:</strong> SRM Institute of Science and Technology, Chennai</p>
      <p><strong>Email:</strong> ashwinisettu.as@gmail.com</p>
    </div>
  );

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <h2 className="footer-logo">BIOCS</h2>
          <p className="footer-tagline">Biosequence<br />Analyser</p>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">Research</h3>
          <ul>
            <li>
              <a href="https://scholar.google.com/citations?user=qVLxihUAAAAJ&hl=en&authuser=2" target="_blank" rel="noopener noreferrer">
                Publications
              </a>
            </li>
            <li>
              <a
                href="#research-groups"
                onClick={(e) => {
                  e.preventDefault();
                  setShowResearchModal(true);
                }}
              >
                Research Groups
              </a>
            </li>
            <li>
              <a href="https://scholar.google.com/citations?user=qVLxihUAAAAJ&hl=en&authuser=2" target="_blank" rel="noopener noreferrer">
                Ongoing Research
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">Training</h3>
          <ul>
            <li>
              <a href="https://www.ebi.ac.uk/training/" target="_blank" rel="noopener noreferrer">Online Courses</a>
            </li>
            <li>
              <a href="https://www.uniprot.org/help" target="_blank" rel="noopener noreferrer">Materials</a>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-heading">About BIOCS</h3>
          <ul>
            <li>
              <a
                href="#contact-us"
                onClick={(e) => {
                  e.preventDefault();
                  setShowContactModal(true);
                }}
              >
                Contact Us
              </a>
            </li>
            <li>
              <a
                href="#feedback"
                onClick={(e) => {
                  e.preventDefault();
                  setShowFeedbackModal(true);
                }}
              >
                Feedback
              </a>
            </li>
            <li>
              <a href="https://www.iscb.org/events" target="_blank" rel="noopener noreferrer">Events</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-address">
          BIOCS, SRM Institute of Science &amp; Technology, Chennai, Tamil Nadu, India.
        </p>
        <a
          href="#contact-details"
          className="footer-contact-link"
          onClick={(e) => {
            e.preventDefault();
            setShowContactModal(true);
          }}
        >
          Full Contact Details
        </a>
      </div>

      <div className="footer-copyright">
        <p>
          Copyright &copy; BIOCS 2024 |{' '}
          <Link to="/about">Privacy Notice</Link> |{' '}
          <Link to="/about">Terms of use</Link>
        </p>
      </div>

      {/* Contact Us Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowContactModal(false)}>
              &times;
            </button>
            <h2 className="modal-title">Contact Us</h2>

            {researcherInfo}

            <hr className="modal-divider" />

            <h3 className="modal-subtitle">Send us a Message</h3>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="contact-name">Your Name</label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={contactForm.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Your Email</label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  value={contactForm.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  type="text"
                  id="contact-subject"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter subject"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={contactForm.message}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your message"
                  rows="5"
                ></textarea>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitStatus === 'sending'}
              >
                {submitStatus === 'sending' ? 'Sending...' : 'Submit'}
              </button>
              {submitStatus === 'success' && (
                <p className="status-msg success">Message sent successfully!</p>
              )}
              {submitStatus === 'error' && (
                <p className="status-msg error">Failed to send. Please try again.</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Research Groups Modal */}
      {showResearchModal && (
        <div className="modal-overlay" onClick={() => setShowResearchModal(false)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowResearchModal(false)}>
              &times;
            </button>
            <h2 className="modal-title">Research Groups</h2>
            {researcherInfo}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowFeedbackModal(false)}>
              &times;
            </button>
            <h2 className="modal-title">Feedback</h2>
            <p className="feedback-intro">
              We value your feedback. Share your experience, suggestions, or report any issues with the BIOCS platform.
            </p>
            <form className="contact-form" onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label htmlFor="feedback-name">Your Name</label>
                <input
                  type="text"
                  id="feedback-name"
                  name="name"
                  value={feedbackForm.name}
                  onChange={handleFeedbackChange}
                  required
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="feedback-email">Your Email</label>
                <input
                  type="email"
                  id="feedback-email"
                  name="email"
                  value={feedbackForm.email}
                  onChange={handleFeedbackChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="feedback-message">Your Feedback</label>
                <textarea
                  id="feedback-message"
                  name="message"
                  value={feedbackForm.message}
                  onChange={handleFeedbackChange}
                  required
                  placeholder="Share your feedback, suggestions, or report issues"
                  rows="5"
                ></textarea>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={feedbackStatus === 'sending'}
              >
                {feedbackStatus === 'sending' ? 'Sending...' : 'Send Feedback'}
              </button>
              {feedbackStatus === 'success' && (
                <p className="status-msg success">Feedback sent successfully!</p>
              )}
              {feedbackStatus === 'error' && (
                <p className="status-msg error">Failed to send. Please try again.</p>
              )}
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}

export default Footer;
