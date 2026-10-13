from typing import List, Optional
from database import db
from schemas.student import StudentCreate, StudentUpdate


class StudentService:
    @staticmethod
    async def create_student(data: StudentCreate):
        return await db.student.create(
            data={
                "name": data.name,
                "email": data.email,
                "age": data.age,
            }
        )

    @staticmethod
    async def get_all_students():
        return await db.student.find_many()

    @staticmethod
    async def get_student_by_id(student_id: int):
        return await db.student.find_unique(
            where={"id": student_id}
        )

    @staticmethod
    async def update_student(student_id: int, data: StudentUpdate):
        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return None
        return await db.student.update(
            where={"id": student_id},
            data=update_data,
        )

    @staticmethod
    async def delete_student(student_id: int):
        return await db.student.delete(
            where={"id": student_id}
        )
