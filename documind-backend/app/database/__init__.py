"""
Database connection and initialization
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import structlog

from app.core.config import settings
from app.database.models import (
    User,
    Organization,
    Project,
    Document,
    Tag,
    DocumentTag,
    SavedAnalysis,
    Activity,
    QueryHistory,
    CloudStorageConnection,
    DocumentShare,
    APIKey,
    AuditLog
)

logger = structlog.get_logger(__name__)

# Global database client
client: AsyncIOMotorClient | None = None


async def connect_to_mongo():
    """Create database connection"""
    global client
    
    try:
        client = AsyncIOMotorClient(settings.DATABASE_URL)
        
        # Initialize Beanie with models
        await init_beanie(
            database=client[settings.DATABASE_NAME],
            document_models=[
                User,
                Organization,
                Project,
                Document,
                Tag,
                DocumentTag,
                SavedAnalysis,
                Activity,
                QueryHistory,
                CloudStorageConnection,
                DocumentShare,
                APIKey,
                AuditLog
            ]
        )
        
        logger.info(
            "database_connected",
            database_name=settings.DATABASE_NAME,
            database_url=settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else "local"
        )
        
    except Exception as e:
        logger.error("database_connection_failed", error=str(e))
        raise


async def close_mongo_connection():
    """Close database connection"""
    global client
    
    if client:
        client.close()
        logger.info("database_connection_closed")


async def get_database():
    """Get database instance"""
    global client
    if client is None:
        await connect_to_mongo()
    return client[settings.DATABASE_NAME]


def get_client():
    """Get MongoDB client (for health checks)"""
    return client

