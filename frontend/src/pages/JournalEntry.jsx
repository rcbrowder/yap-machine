import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import journalService from '../api/journalService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert } from '../components/ui/alert';
import { Card } from '../components/ui/card';

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
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-main rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500">Loading entry...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-main hover:text-mainAccent transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Journal
        </Link>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {saveSuccess && (
        <Alert type="success" className="mb-4">
          Journal entry saved successfully!
        </Alert>
      )}

      <Card className="p-6 mb-6">
        {entry && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <div>
                {isEditing ? (
                  <Input
                    type="text"
                    value={entry.title}
                    onChange={handleInputChange}
                    name="title"
                    placeholder="Enter title"
                    className="text-xl font-bold w-full"
                  />
                ) : (
                  <>
                    <h1 className="text-2xl font-bold mb-2">{entry.title}</h1>
                    {entry.created_at && (
                      <p className="text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {isSaving ? (
                  <Button disabled className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </Button>
                ) : (
                  isEditing && (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => setShowPreview(!showPreview)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {showPreview ? 'Edit' : 'Preview'}
                      </Button>
                      <Button onClick={handleSave}>
                        Save
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setShowPreview(false);
                          handleInputChange({ target: { name: 'title', value: entry.title } });
                          handleInputChange({ target: { name: 'content', value: entry.content } });
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )
                )}

                {!isEditing && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </Button>
                    <Button 
                      variant="danger"
                      onClick={handleDelete}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Content
                  </label>
                  {!showPreview && (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        Supports Markdown formatting
                      </p>
                      <textarea
                        id="content"
                        name="content"
                        value={entry.content}
                        onChange={handleInputChange}
                        rows="16"
                        className="w-full px-4 py-3 border-2 border-black rounded font-mono text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:border-main"
                        placeholder="Write your journal entry here..."
                      ></textarea>
                    </>
                  )}
                </div>

                {showPreview && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">Preview</h3>
                    </div>
                    <div className="p-4 bg-white border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] prose max-w-none">
                      <ReactMarkdown>{entry.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown>{entry.content}</ReactMarkdown>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
} 