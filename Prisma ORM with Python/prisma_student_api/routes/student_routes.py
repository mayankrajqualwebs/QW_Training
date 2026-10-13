from typing import List
from fastapi import APIRouter, HTTPException, status
from schemas.student import StudentCreate, StudentUpdate, StudentResponse
from services.student_service import StudentService

router = APIRouter(prefix="/students", tags=["Students"])


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student",
)
async def create_student(student: StudentCreate):
    try:
        new_student = await StudentService.create_student(student)
        return new_student
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not create student. Check whether the email already exists.",
        )


@router.get(
    "",
    response_model=List[StudentResponse],
    summary="Get all students",
)
async def get_students():
    students = await StudentService.get_all_students()
    return students


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Get student by ID",
)
async def get_student(student_id: int):
    student = await StudentService.get_student_by_id(student_id)
    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Update a student by ID",
)
async def update_student(student_id: int, student: StudentUpdate):
    existing_student = await StudentService.get_student_by_id(student_id)
    if existing_student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    update_data = student.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least one field to update",
        )

    try:
        updated_student = await StudentService.update_student(student_id, student)
        return updated_student
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed. Check the supplied values.",
        )


@router.delete(
    "/{student_id}",
    summary="Delete a student by ID",
)
async def delete_student(student_id: int):
    existing_student = await StudentService.get_student_by_id(student_id)
    if existing_student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    await StudentService.delete_student(student_id)
    return {
        "message": "Student deleted successfully",
        "student_id": student_id,
    }
