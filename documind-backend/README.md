# DocuMind AI Backend

FastAPI-based backend for the DocuMind AI Secure Enterprise Document Analysis Platform.

## Features

- ✅ FastAPI application with async support
- ✅ API versioning (`/api/v1`)
- ✅ CORS middleware configuration
- ✅ Security headers middleware
- ✅ Request logging middleware
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ Structured logging (JSON format)
- ✅ Health check endpoints
- ✅ Background task queue (FastAPI BackgroundTasks)
- ✅ OpenAPI/Swagger documentation
- ✅ JWT authentication utilities (ready for implementation)
- ✅ Pydantic schemas for request/response validation

## Project Structure

```
documind-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py       # Main v1 API router
│   │       ├── health/         # Health check endpoints
│   │       └── tasks/          # Background task endpoints
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Application configuration
│   │   ├── exceptions.py       # Custom exceptions
│   │   ├── middleware.py       # Custom middleware
│   │   ├── logging_config.py   # Logging configuration
│   │   ├── security.py         # Security utilities (JWT, password hashing)
│   │   ├── dependencies.py     # FastAPI dependencies
│   │   └── rate_limit.py       # Rate limiting
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── common.py           # Common Pydantic schemas
│   ├── services/               # Business logic services (to be implemented)
│   ├── workers/
│   │   ├── __init__.py
│   │   └── tasks.py            # Background task definitions
│   └── utils/                  # Utility functions
├── requirements.txt            # Python dependencies
├── requirements-dev.txt        # Development dependencies
├── .gitignore
└── README.md
```

## Setup

### Prerequisites

- Python 3.9 or higher
- pip or poetry

### Installation

1. **Create a virtual environment:**

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Create `.env` file:**

Copy the example environment file and configure it:

```bash
# Create .env file with your configuration
# See .env.example for available options
```

4. **Run the application:**

```bash
# Development mode with auto-reload
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Health Checks

- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/ready` - Readiness check
- `GET /api/v1/health/live` - Liveness check

### Background Tasks

- `GET /api/v1/tasks` - List all background tasks
- `GET /api/v1/tasks/{task_id}` - Get task status

### Root

- `GET /` - API information

## Configuration

Configuration is managed through environment variables. See `.env.example` for all available options.

Key settings:
- `DEBUG`: Enable/disable debug mode
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `RATE_LIMIT_ENABLED`: Enable/disable rate limiting
- `RATE_LIMIT_PER_MINUTE`: Requests per minute limit
- `LOG_LEVEL`: Logging level (INFO, DEBUG, WARNING, ERROR)
- `LOG_FORMAT`: Log format (json or text)

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black app/
isort app/
```

### Type Checking

```bash
mypy app/
```

## Production Deployment

For production deployment:

1. Set `DEBUG=False` in environment variables
2. Set a strong `SECRET_KEY` (use `openssl rand -hex 32`)
3. Configure proper CORS origins
4. Set up a production WSGI server (e.g., Gunicorn with Uvicorn workers)
5. Configure reverse proxy (nginx)
6. Set up proper logging and monitoring
7. Configure database and Redis connections

## Next Steps

- [ ] Implement authentication endpoints
- [ ] Implement document management endpoints
- [ ] Implement RAG pipeline services
- [ ] Set up database (PostgreSQL)
- [ ] Set up Redis for caching
- [ ] Implement Celery for advanced task queue
- [ ] Add comprehensive test coverage
- [ ] Set up CI/CD pipeline

## License

Proprietary - DocuMind AI

