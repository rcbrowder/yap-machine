import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import journalService from '../api/journalService';

function JournalEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewEntry = id === 'new';
  
  const [entry, setEntry] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(!isNewEntry);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isNewEntry);
  const [isSaving, setIsSaving] = useState(false);

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

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Loading journal entry...</p>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        {isEditing ? (
          <input
            type="text"
            name="title"
            value={entry.title}
            onChange={handleInputChange}
            placeholder="Entry title"
            className="text-2xl font-bold w-full border-b-2 border-gray-300 focus:border-indigo-500 outline-none pb-2"
          />
        ) : (
          <h2 className="text-2xl font-bold text-gray-900">{entry.title}</h2>
        )}

        <div className="flex space-x-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Edit
            </button>
          )}

          {!isNewEntry && !isEditing && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          name="content"
          value={entry.content}
          onChange={handleInputChange}
          placeholder="Write your journal entry here (Markdown supported)"
          className="w-full min-h-[400px] p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      ) : (
        <div className="bg-white p-6 rounded-lg shadow prose max-w-none">
          <ReactMarkdown>{entry.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default JournalEntry; 