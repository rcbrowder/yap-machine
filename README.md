# AI Journal

A personal journaling application with AI-powered chat functionality. This application runs completely locally using Ollama for AI capabilities and ChromaDB for vector storage.

## Features

- Markdown-based journal entries
- AI-powered chat interface for interacting with your journal entries
- Local-first architecture for privacy
- Semantic search across journal entries

## Tech Stack

- Frontend: React + Tailwind CSS
- Backend: FastAPI (Python)
- Database: SQLite (journal entries) + ChromaDB (vector embeddings)
- AI: Ollama (Mistral-7B)

## Prerequisites

- Docker
- Ollama (with Mistral-7B model installed)

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
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   └── models/
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── docker-compose.yml
└── Dockerfile
```