# AI Journal

AI Journal is a private, local-first journaling application that combines traditional markdown journaling with AI-powered conversation capabilities. It allows you to write your thoughts in a simple interface and then interact with your journal through natural language to gain insights, retrieve specific memories, or analyze patterns in your writing.

The application runs completely on your local machine using Docker containers, with no data ever leaving your device.

## Features

- Markdown-based journaling for simple and flexible writing
- Encrypted storage for complete privacy
- Vector-based semantic search for intelligent retrieval
- AI conversation powered by a locally-run Ollama model
- Containerized architecture ensuring all your personal reflections remain private and secure

## Tech Stack

- Frontend: React + Tailwind CSS
- Backend: FastAPI (Python)
- Database: SQLite (journal entries) + ChromaDB (vector embeddings)
- AI: Ollama (Mistral-7B)

## Prerequisites

- Docker
- Ollama (with Mistral-7B model installed)

## Quick Start

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull the Mistral-7B model:
   ```
   ollama pull mistral
   ```
3. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-journal.git
   cd ai-journal
   ```
4. Start the application with Docker Compose:
   ```
   docker compose up --build
   ```
5. Access the application:
   - Journal Interface: http://localhost:3000
   - API Documentation: http://localhost:8000/docs

## Development Setup

1. Clone the repository
2. Run `docker compose up --build`
3. Access the application at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/        # API routes and endpoints
│   │   ├── core/       # Core application logic
│   │   ├── db/         # Database modules
│   │   ├── models/     # Data models
│   │   └── main.py     # Application entry point
│   ├── data/           # Data storage directory
│   ├── Dockerfile      # Backend container configuration
│   ├── requirements.txt# Python dependencies
│   └── test_chroma.py  # Vector database testing
├── frontend/
│   ├── public/         # Static public assets
│   ├── src/
│   │   ├── api/        # API service integrations
│   │   ├── assets/     # Frontend assets
│   │   ├── components/ # Reusable UI components
│   │   ├── contexts/   # React context providers
│   │   ├── pages/      # Application pages
│   │   ├── utils/      # Utility functions
│   │   ├── App.jsx     # Main application component
│   │   └── main.jsx    # Entry point
│   ├── Dockerfile      # Frontend container configuration
│   ├── index.html      # HTML entry point
│   ├── package.json    # JS dependencies
│   └── vite.config.js  # Vite configuration
├── docker-compose.yml  # Multi-container orchestration
└── Dockerfile          # Main application container
```