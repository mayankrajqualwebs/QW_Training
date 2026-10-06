from fastapi import APIRouter, HTTPException

from services import student_service


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


@router.get("/")
def get_students():
    return student_service.get_all_students()


@router.get("/{student_id}")
def get_student(student_id: int):

    student = student_service.get_student_by_id(student_id)

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student