from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_mongo, disconnect_mongo, connect_postgres, disconnect_postgres
from app.routes import field_data, geocoding, weather, soil, predict, risk, rotation, advisor


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_mongo()
    await connect_postgres()
    yield
    # Shutdown
    await disconnect_mongo()
    await disconnect_postgres()


app = FastAPI(
    title="Agriva Backend API",
    description="Unified Python FastAPI backend for Agriva field analysis and ML predictions",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(field_data.router, prefix="/api/field-data", tags=["Field Data"])
app.include_router(geocoding.router, prefix="/api/geocoding", tags=["Geocoding"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(soil.router, prefix="/api/soil", tags=["Soil"])
app.include_router(predict.router, prefix="/api/predict", tags=["ML Predictions"])
app.include_router(risk.router, prefix="/api/risk", tags=["Climate Risk"])
app.include_router(rotation.router, prefix="/api/rotation", tags=["Crop Rotation"])
app.include_router(advisor.router, prefix="/api/advisor", tags=["Gemini Advisor"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Agriva backend is running smoothly"}
