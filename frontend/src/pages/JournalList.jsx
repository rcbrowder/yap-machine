import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import journalService from '../api/journalService';
import './JournalList.css';

function JournalList() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const data = await journalService.getAllEntries();
        setEntries(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching entries:', err);
        setError('Failed to load journal entries. Please try again later.');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

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
      <div className="rounded-lg bg-white shadow p-6 text-center">
        <div className="flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-secondary-800 font-medium mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-2xl font-bold text-secondary-900">Your Journal</h2>
        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          New Entry
        </Link>
      </div>

      {safeEntries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="flex flex-col items-center max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-secondary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5M3 14h9m-9-3h6m3 0h6" />
            </svg>
            <h3 className="text-lg font-medium text-secondary-800 mb-2">No entries yet</h3>
            <p className="text-secondary-500 mb-6">Start documenting your thoughts, ideas, and experiences by creating your first journal entry.</p>
            <Link
              to="/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Create your first entry
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {safeEntries.map((entry) => (
            <Link
              key={entry?.id || Math.random()}
              to={`/entry/${entry?.id}`}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-secondary-900 mb-1 line-clamp-1">{entry?.title || 'Untitled'}</h3>
                <p className="text-sm text-secondary-500 mb-3">
                  {formatDate(entry?.created_at)}
                </p>
                <p className="text-secondary-700 line-clamp-3">
                  {entry?.content?.length > 150
                    ? `${entry.content.substring(0, 150)}...`
                    : entry?.content || 'No content'}
                </p>
              </div>
              <div className="pt-4 mt-auto">
                <span className="text-sm text-primary-600 font-medium inline-flex items-center">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
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