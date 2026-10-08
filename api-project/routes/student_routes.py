from fastapi import APIRouter, HTTPException

from services import student_service
from schemas.student_schema import StudentCreate, StudentResponse


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


# ==========================================================
# GET ALL STUDENTS
# ==========================================================

@router.get("/", response_model=list[StudentResponse])
def get_students():

    return student_service.get_all_students()


# ==========================================================
# GET STUDENT BY ID
# ==========================================================

@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int):

    student = student_service.get_student_by_id(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


# ==========================================================
# CREATE STUDENT
# ==========================================================

@router.post("/", status_code=201)
def create_student(student_data: StudentCreate):

    return student_service.create_student(
        student_data.model_dump()
    )


# ==========================================================
# UPDATE STUDENT - PUT
# ==========================================================

@router.put("/{student_id}")
def update_student(
    student_id: int,
    student_data: dict
):

    student = student_service.update_student(
        student_id,
        student_data
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


# ==========================================================
# PARTIAL UPDATE - PATCH
# ==========================================================

@router.patch("/{student_id}")
def patch_student(
    student_id: int,
    student_data: dict
):

    student = student_service.patch_student(
        student_id,
        student_data
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


# ==========================================================
# DELETE STUDENT
# ==========================================================

@router.delete("/{student_id}")
def delete_student(student_id: int):

    student = student_service.delete_student(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return {
        "message": "Student deleted successfully",
        "student": student
    }