from motor.motor_asyncio import AsyncIOMotorClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# ===== MongoDB =====
mongo_client: AsyncIOMotorClient | None = None
mongo_db = None


async def connect_mongo():
    global mongo_client, mongo_db
    try:
        mongo_client = AsyncIOMotorClient(settings.mongo_url)
        mongo_db = mongo_client[settings.mongo_db_name]
        # Test connection
        await mongo_client.admin.command("ping")
        print(f"✅ MongoDB connected: {settings.mongo_db_name}")
    except Exception as e:
        print(f"⚠️ MongoDB connection failed: {e}")
        print("   Running without MongoDB — field data will not persist.")
        mongo_db = None


async def disconnect_mongo():
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("MongoDB disconnected.")


def get_mongo_db():
    return mongo_db


# ===== PostgreSQL =====
pg_engine = None
AsyncSessionLocal = None


class Base(DeclarativeBase):
    pass


async def connect_postgres():
    global pg_engine, AsyncSessionLocal
    try:
        pg_engine = create_async_engine(settings.postgres_url, echo=settings.debug)
        AsyncSessionLocal = sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)
        # Test connection
        async with pg_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ PostgreSQL connected")
    except Exception as e:
        print(f"⚠️ PostgreSQL connection failed: {e}")
        print("   Running without PostgreSQL — some features may be limited.")
        pg_engine = None
        AsyncSessionLocal = None


async def disconnect_postgres():
    global pg_engine
    if pg_engine:
        await pg_engine.dispose()
        print("PostgreSQL disconnected.")


async def get_pg_session():
    if AsyncSessionLocal is None:
        yield None
        return
    async with AsyncSessionLocal() as session:
        yield session
