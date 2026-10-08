from pydantic import BaseModel


class StudentCreate(BaseModel):
    name: str
    course: str
    year: int


class StudentResponse(BaseModel):
    id: int
    name: str
    course: str
    year: int