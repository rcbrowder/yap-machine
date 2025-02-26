import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import journalService from '../api/journalService';
import './JournalEntry.css';

export default function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewEntry = !id || id === 'new';
  
  const [entry, setEntry] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(!isNewEntry);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isNewEntry);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isNewEntry) {
      const fetchEntry = async () => {
        try {
          const data = await journalService.getEntry(id);
          setEntry(data);
          setError(null);
        } catch (err) {
          setError('Failed to load journal entry. Please try again later.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };

      fetchEntry();
    }
  }, [id, isNewEntry]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEntry((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!entry.title || !entry.content) {
      setError('Title and content are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      if (isNewEntry) {
        const createdEntry = await journalService.createEntry(entry);
        navigate(`/entry/${createdEntry.id}`);
      } else {
        await journalService.updateEntry(id, entry);
        setIsEditing(false);
        setShowPreview(false);
        setSaveSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setError('Failed to save journal entry. Please try again later.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this journal entry? This action cannot be undone.')) {
      try {
        await journalService.deleteEntry(id);
        navigate('/');
      } catch (err) {
        setError('Failed to delete journal entry. Please try again later.');
        console.error(err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading entry...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="back-link-container">
        <Link to="/" className="back-link">
          <svg className="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Journal
        </Link>
      </div>

      {error && (
        <div className="error-alert">
          <div className="alert-content">
            <div className="alert-icon-container">
              <svg className="icon-small error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="alert-message">
              <p className="error-text">{error}</p>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="success-alert">
          <div className="alert-content">
            <div className="alert-icon-container">
              <svg className="icon-small success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="alert-message">
              <p className="success-text">Journal entry saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      <div className="entry-container">
        {entry && (
          <>
            <div className="entry-header">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    className="title-input"
                    value={entry.title}
                    onChange={handleInputChange}
                    name="title"
                    placeholder="Enter title"
                  />
                ) : (
                  <>
                    <h1 className="entry-title">{entry.title}</h1>
                    <p className="entry-date">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </>
                )}
              </div>

              <div className="entry-actions">
                {isSaving ? (
                  <button className="save-button" disabled>
                    <svg className="spinner-icon" viewBox="0 0 24 24">
                      <circle className="spinner-track" cx="12" cy="12" r="10" fill="none" strokeWidth="4"></circle>
                      <circle className="spinner-path" cx="12" cy="12" r="10" fill="none" strokeWidth="4" strokeDasharray="31.4 31.4"></circle>
                    </svg>
                    Saving...
                  </button>
                ) : (
                  isEditing && (
                    <>
                      <button 
                        className="preview-button"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <svg className="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {showPreview ? 'Edit' : 'Preview'}
                      </button>
                      <button 
                        className="save-button"
                        onClick={handleSave}
                      >
                        Save
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={() => {
                          setIsEditing(false);
                          setShowPreview(false);
                          handleInputChange({ target: { name: 'title', value: entry.title } });
                          handleInputChange({ target: { name: 'content', value: entry.content } });
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )
                )}

                {!isEditing && (
                  <>
                    <button 
                      className="edit-button"
                      onClick={() => setIsEditing(true)}
                    >
                      <svg className="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      className="delete-button"
                      onClick={handleDelete}
                    >
                      <svg className="icon-small" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="content-edit-container">
                {showPreview ? (
                  <div className="markdown-preview">
                    <div className="preview-header">
                      <h3>Preview</h3>
                    </div>
                    <div className="preview-content">
                      <ReactMarkdown>{entry.content}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="content-label">
                      Content
                      <span className="markdown-hint"> (Markdown supported)</span>
                    </label>
                    <textarea
                      className="content-textarea"
                      value={entry.content}
                      onChange={handleInputChange}
                      name="content"
                      placeholder="Write your journal entry here..."
                    ></textarea>
                  </>
                )}
              </div>
            ) : (
              <div className="entry-content">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
} 