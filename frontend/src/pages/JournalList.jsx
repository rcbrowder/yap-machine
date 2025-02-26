import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import journalService from '../api/journalService';
import './JournalList.css';

function JournalList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const data = await journalService.getAllEntries();
        setEntries(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching entries:', err);
        
        // If we have fewer than 3 retries, try again after a delay
        if (retryCount < 3) {
          console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000); // 1 second delay between retries
        } else {
          setError('Failed to load journal entries. Please try again later.');
          setEntries([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [retryCount]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
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
          <p className="loading-text">Loading journal entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <svg xmlns="http://www.w3.org/2000/svg" className="error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="error-message">{error}</p>
          <button 
            onClick={() => setRetryCount(retryCount + 1)} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div>
      <div className="journal-header">
        <h2 className="journal-title-main">Your Journal</h2>
        <Link
          to="/new"
          className="new-entry-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="icon-small" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          New Entry
        </Link>
      </div>

      {safeEntries.length === 0 ? (
        <div className="no-entries-container">
          <div className="no-entries-content">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-large" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="no-entries-message">You don't have any journal entries yet.</p>
            <Link to="/new" className="start-writing-button">
              Start Writing
            </Link>
          </div>
        </div>
      ) : (
        <div className="journal-grid">
          {safeEntries.map((entry) => (
            <Link
              key={entry?.id || Math.random()}
              to={`/entry/${entry?.id}`}
              className="journal-card"
            >
              <div className="journal-card-content">
                <h3 className="journal-card-title">{entry?.title || 'Untitled'}</h3>
                <p className="journal-date">
                  {formatDate(entry?.created_at)}
                </p>
                <p className="journal-preview">
                  {entry?.content?.length > 150
                    ? `${entry.content.substring(0, 150)}...`
                    : entry?.content || 'No content'}
                </p>
              </div>
              <div className="journal-card-footer">
                <span className="read-more-link">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-tiny" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default JournalList; 