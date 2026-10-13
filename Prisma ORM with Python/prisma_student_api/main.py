from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import db
from routes.student_routes import router as student_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    try:
        yield
    finally:
        await db.disconnect()


app = FastAPI(
    title="Student API",
    description="FastAPI with Prisma and PostgreSQL",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/", tags=["Health"])
async def root():
    return {"message": "Student API is running"}


# Include application routers
app.include_router(student_router)