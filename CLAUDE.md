# AI Journal Development Guidelines

## Build & Run Commands
- Start application: `docker compose up --build`
- Frontend only: `cd frontend && npm run dev` (http://localhost:5173)
- Backend only: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` (http://localhost:8000)
- Build frontend: `cd frontend && npm run build`
- Frontend linting: `cd frontend && npm run lint`
- Backend test: `cd backend && python test_chroma.py`

## Code Style Guidelines
- **Frontend**: React 19 with ESLint configuration
  - Follow JSX Runtime syntax (no React imports for JSX)
  - Use functional components with hooks
  - Prefer named exports
  - Files use .jsx extension for components
- **Backend**: Python 3 with FastAPI
  - Follow PEP 8 style guidelines
  - Use type hints for function parameters and returns
  - Organize imports: stdlib, third-party, local
  - Use async/await patterns where appropriate
  - Error handling via proper HTTP status codes

## Project Organization
- Maintain separation between frontend/backend
- Store persistent data in `/backend/data`
- Follow RESTful API design principles