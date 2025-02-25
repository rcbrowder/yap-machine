import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import journalService from '../api/journalService';

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
      <div className="text-center py-10">
        <p className="text-gray-500">Loading journal entries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Journal Entries</h2>
        <Link
          to="/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          New Entry
        </Link>
      </div>

      {safeEntries.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No journal entries yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {safeEntries.map((entry) => (
            <Link
              key={entry?.id || Math.random()}
              to={`/entry/${entry?.id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900">{entry?.title || 'Untitled'}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(entry?.created_at)}
              </p>
              <p className="text-gray-600 mt-2 line-clamp-2">
                {entry?.content?.length > 150
                  ? `${entry.content.substring(0, 150)}...`
                  : entry?.content || 'No content'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default JournalList; 