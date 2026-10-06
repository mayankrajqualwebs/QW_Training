from fastapi import FastAPI

from routes.student_routes import router as student_router


app = FastAPI(
    title="Student API",
    description="Mock Student API",
    version="1.0.0"
)


app.include_router(student_router)


@app.get("/")
def root():
    return {
        "message": "Student API is running"
    }