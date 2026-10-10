from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from database import db
from schemas import StudentCreate
from schemas import StudentUpdate

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
    lifespan=lifespan
)


@app.get("/")
async def root():
    return {"message": "Student API is running"}


@app.post("/students")
async def create_student(student: StudentCreate):
    try:
        new_student = await db.student.create(
            data={
                "name": student.name,
                "email": student.email,
                "age": student.age
            }
        )
        return new_student.model_dump()

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail="Could not create student. Check whether the email already exists."
        )


@app.get("/students")
async def get_students():
    students = await db.student.find_many()
    return [student.model_dump() for student in students]

# UPDATE STUDENT
@app.put("/students/{student_id}")
async def update_student(student_id: int, student: StudentUpdate):
    existing_student = await db.student.find_unique(
        where={"id": student_id}
    )

    if existing_student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    update_data = student.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update"
        )

    try:
        updated_student = await db.student.update(
            where={"id": student_id},
            data=update_data
        )
        return updated_student.model_dump()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Update failed. Check the supplied values."
        )


# DELETE STUDENT
@app.delete("/students/{student_id}")
async def delete_student(student_id: int):
    existing_student = await db.student.find_unique(
        where={"id": student_id}
    )

    if existing_student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    await db.student.delete(
        where={"id": student_id}
    )

    return {
        "message": "Student deleted successfully",
        "student_id": student_id
    }