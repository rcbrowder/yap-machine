import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import journalService from '../api/journalService';

function JournalEntry() {
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

    try {
      setIsSaving(true);
      if (isNewEntry) {
        const newEntry = await journalService.createEntry(entry);
        navigate(`/entry/${newEntry.id}`);
      } else {
        await journalService.updateEntry(id, entry);
        setIsEditing(false);
        // Show success message briefly
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
      setError(null);
    } catch (err) {
      setError('Failed to save journal entry. Please try again later.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
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
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-secondary-500 text-sm font-medium">Loading journal entry...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Journal
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">Journal entry saved successfully!</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={entry.title}
              onChange={handleInputChange}
              placeholder="Entry title"
              className="text-2xl font-bold w-full bg-transparent border-b-2 border-secondary-200 focus:border-primary-500 focus:ring-0 outline-none pb-2"
              autoFocus
            />
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-secondary-900">{entry.title}</h2>
              {entry.created_at && (
                <p className="text-secondary-500 text-sm mt-1">{formatDate(entry.created_at)}</p>
              )}
            </div>
          )}

          <div className="flex space-x-2 self-end sm:self-auto">
            {isEditing ? (
              <>
                <button
                  onClick={() => isNewEntry ? navigate('/') : setIsEditing(false)}
                  className="px-4 py-2 border border-secondary-300 text-secondary-700 bg-white rounded-md hover:bg-secondary-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-secondary-300 text-secondary-700 bg-white rounded-md hover:bg-secondary-50 transition-colors duration-150 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50 transition-colors duration-150 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="mt-4">
            <label htmlFor="content" className="block text-sm font-medium text-secondary-700 mb-2">
              Entry Content <span className="text-xs text-secondary-500">(Markdown supported)</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={entry.content}
              onChange={handleInputChange}
              placeholder="Write your journal entry here..."
              className="w-full min-h-[400px] p-4 bg-secondary-50 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
              rows={12}
            />
          </div>
        ) : (
          <div className="prose prose-primary prose-p:text-secondary-700 prose-headings:text-secondary-900 max-w-none">
            <ReactMarkdown>{entry.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalEntry; 