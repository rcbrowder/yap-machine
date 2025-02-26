import apiClient from './client';

// Mock data to use when API fails
const DEFAULT_MOCK_ENTRIES = [
  {
    id: '1',
    title: 'Getting Started with AI Journal',
    content: 'This is a sample journal entry to help you get started. Click the edit button to modify it or create a new entry.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'My Goals for This Week',
    content: 'This is another sample entry. In a real app, these would come from the database. You can create your own entries using the "New Entry" button.',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updated_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// Get mock entries from localStorage or use defaults
const getMockEntries = () => {
  try {
    const savedEntries = localStorage.getItem('mockJournalEntries');
    if (savedEntries) {
      return JSON.parse(savedEntries);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return [...DEFAULT_MOCK_ENTRIES];
};

// Save mock entries to localStorage
const saveMockEntries = (entries) => {
  try {
    localStorage.setItem('mockJournalEntries', JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Initialize MOCK_ENTRIES from localStorage
let MOCK_ENTRIES = getMockEntries();

// Flag to enable/disable mock data
const USE_MOCK_DATA = false;

const journalService = {
  // Get all journal entries
  getAllEntries: async () => {
    // If mock data is enabled, return mock entries
    if (USE_MOCK_DATA) {
      console.log('Using mock data for journal entries');
      // Refresh from localStorage in case it was updated elsewhere
      MOCK_ENTRIES = getMockEntries();
      return MOCK_ENTRIES;
    }
    
    try {
      const response = await apiClient.get('/journal');
      // Ensure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      // Return mock data on error if enabled
      return USE_MOCK_DATA ? MOCK_ENTRIES : [];
    }
  },

  // Get a single journal entry by ID
  getEntry: async (id) => {
    // If mock data is enabled, find the entry in mock data
    if (USE_MOCK_DATA) {
      console.log(`Using mock data for journal entry ${id}`);
      // Refresh from localStorage
      MOCK_ENTRIES = getMockEntries();
      const entry = MOCK_ENTRIES.find(entry => entry.id === id);
      if (entry) return entry;
      // If not found and id is 'new', return empty entry
      if (id === 'new') {
        return {
          id: 'new',
          title: '',
          content: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }
      throw new Error('Entry not found');
    }
    
    try {
      const response = await apiClient.get(`/journal/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching journal entry ${id}:`, error);
      throw error;
    }
  },

  // Create a new journal entry
  createEntry: async (entryData) => {
    if (USE_MOCK_DATA) {
      console.log('Creating mock entry:', entryData);
      // Refresh from localStorage
      MOCK_ENTRIES = getMockEntries();
      const newEntry = {
        ...entryData,
        id: String(MOCK_ENTRIES.length + 1),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      MOCK_ENTRIES.push(newEntry);
      // Save to localStorage
      saveMockEntries(MOCK_ENTRIES);
      return newEntry;
    }
    
    try {
      const response = await apiClient.post('/journal', entryData);
      return response.data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Update an existing journal entry
  updateEntry: async (id, entryData) => {
    if (USE_MOCK_DATA) {
      console.log(`Updating mock entry ${id}:`, entryData);
      // Refresh from localStorage
      MOCK_ENTRIES = getMockEntries();
      const index = MOCK_ENTRIES.findIndex(entry => entry.id === id);
      if (index !== -1) {
        const updatedEntry = {
          ...MOCK_ENTRIES[index],
          ...entryData,
          updated_at: new Date().toISOString()
        };
        MOCK_ENTRIES[index] = updatedEntry;
        // Save to localStorage
        saveMockEntries(MOCK_ENTRIES);
        return updatedEntry;
      }
      throw new Error('Entry not found');
    }
    
    try {
      const response = await apiClient.patch(`/journal/${id}`, entryData);
      return response.data;
    } catch (error) {
      console.error(`Error updating journal entry ${id}:`, error);
      throw error;
    }
  },

  // Delete a journal entry
  deleteEntry: async (id) => {
    if (USE_MOCK_DATA) {
      console.log(`Deleting mock entry ${id}`);
      // Refresh from localStorage
      MOCK_ENTRIES = getMockEntries();
      const index = MOCK_ENTRIES.findIndex(entry => entry.id === id);
      if (index !== -1) {
        const deleted = MOCK_ENTRIES.splice(index, 1)[0];
        // Save to localStorage
        saveMockEntries(MOCK_ENTRIES);
        return { success: true, deleted };
      }
      throw new Error('Entry not found');
    }
    
    try {
      const response = await apiClient.delete(`/journal/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting journal entry ${id}:`, error);
      throw error;
    }
  },

  // Search journal entries using vector search
  searchEntries: async (queryText, maxResults = 5) => {
    if (USE_MOCK_DATA) {
      console.log(`Searching mock entries for: ${queryText}`);
      // Refresh from localStorage
      MOCK_ENTRIES = getMockEntries();
      // Simple search implementation - just checks if query is in title or content
      const results = MOCK_ENTRIES
        .filter(entry => 
          entry.title.toLowerCase().includes(queryText.toLowerCase()) || 
          entry.content.toLowerCase().includes(queryText.toLowerCase())
        )
        .slice(0, maxResults);
      return results;
    }
    
    try {
      const response = await apiClient.post('/vector/search', {
        query_text: queryText,
        max_results: maxResults
      });
      return response.data;
    } catch (error) {
      console.error('Error searching journal entries:', error);
      throw error;
    }
  }
};

export default journalService; 