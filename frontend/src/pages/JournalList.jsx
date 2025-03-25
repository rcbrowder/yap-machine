import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import journalService from '../api/journalService';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-main border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-bold">Loading journal entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Button 
                onClick={() => setRetryCount(retryCount + 1)} 
                variant="default"
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const safeEntries = Array.isArray(entries) ? entries : [];

  return (
    <div>
      <div className="flex justify-end mb-6">

        <Link to="/new">
          <Button variant="default">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            New Entry
          </Button>
        </Link>
      </div>

      {safeEntries.length === 0 ? (
        <div className="p-8 rounded-base border-2 border-border bg-main shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <h3 className="text-xl font-bold mb-2">No entries yet</h3>
          <p className="mb-4">Start documenting your thoughts, ideas, and experiences by creating your first journal entry.</p>
          <Link to="/new">
            <Button variant="default">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Create your first entry
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {safeEntries.map((entry) => (
            <Link
              key={entry?.id || Math.random()}
              to={`/entry/${entry?.id}`}
              className="block"
            >
              <Card className="h-full transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <CardHeader>
                  <CardTitle>{entry?.title || 'Untitled'}</CardTitle>
                  <p className="text-sm text-mtext">{formatDate(entry?.created_at)}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {entry?.content?.length > 150
                      ? `${entry.content.substring(0, 150)}...`
                      : entry?.content || 'No content'}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <span className="flex items-center text-sm font-bold">
                    Read more
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default JournalList; 