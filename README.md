# Yap Machine

Yap Machine is a private, local-first journaling application that combines traditional markdown journaling with AI-powered conversation capabilities. It allows you to write and organize your thoughts in a clean, modern interface while providing powerful AI features for retrieving memories, gaining insights, and analyzing patterns in your writing.

![Journal Entry View](media/journal-entry.png)
![Chat Interface](media/chat-interface.png)

## Features

- **Markdown Journaling**: Write and edit journal entries with full markdown support
- **Semantic Search**: Find related journal entries using natural language queries
- **AI Conversation**: Interact with your journal through a chat interface powered by advanced language models
- **Privacy-Focused**: All data stays on your device with local database storage
- **Modern UI**: Clean, responsive interface for a distraction-free writing experience
- **Retrieval-Augmented Generation (RAG)**: The AI assistant uses your journal entries as context to provide personalized responses

## Technology Stack

### Frontend
- React 19 with React Router for navigation
- Modern JavaScript (ES6+)
- Responsive UI with custom CSS styling
- Markdown rendering for journal entries

### Backend
- FastAPI (Python) RESTful API
- SQLAlchemy with SQLite for relational data storage
- ChromaDB for vector embeddings and semantic search
- Langchain for Retrieval-Augmented Generation (RAG)
- Support for OpenAI and local language models

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) for containerized deployment
- For local LLM support (optional): [Ollama](https://ollama.ai) with Mistral model

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-journal.git
   cd ai-journal
   ```

2. (Optional) For local language model support:
   - Install Ollama from [ollama.ai](https://ollama.ai)
   - Pull the Mistral model:
     ```
     ollama pull mistral
     ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Configure your preferred language model settings (OpenAI API key or Ollama endpoint)

4. Start the application with Docker Compose:
   ```
   docker compose up --build
   ```

5. Access the application:
   - Journal Interface: http://localhost:5173
   - API Documentation: http://localhost:8000/docs

## Usage

### Writing Journal Entries
- Create new entries from the main journal list page
- Edit existing entries by clicking on them in the list
- Use markdown for formatting your entries

### Searching Your Journal
- Use the search box on the journal list page for keyword search
- The search utilizes semantic similarity, not just exact text matching

### Chatting with Your Journal
- Navigate to the Chat tab to have AI-powered conversations about your journal
- Ask questions about patterns, request summaries, or explore connections
- The AI assistant uses RAG to provide context-aware responses based on your entries

## Project Structure

```
.
├── backend/                 # Python FastAPI backend
│   ├── app/                 # Application code
│   │   ├── api/             # API endpoints
│   │   ├── db/              # Database models and connections
│   │   ├── models/          # Pydantic data models
│   │   └── services/        # Business logic and AI services
│   ├── data/                # Data storage
│   ├── Dockerfile           # Backend container config
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend
│   ├── src/
│   │   ├── api/             # API client services
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React context providers
│   │   ├── pages/           # Application views
│   │   └── utils/           # Helper functions
│   ├── Dockerfile           # Frontend container config
│   └── package.json         # JS dependencies
└── docker-compose.yml       # Container orchestration
```

## Development

### Backend Development
- API documentation available at http://localhost:8000/docs
- Changes to Python files are automatically reloaded in development

### Frontend Development
- React development server has hot-reloading enabled
- CSS changes are immediately visible

## License

This project is licensed under the MIT License - see the LICENSE file for details.