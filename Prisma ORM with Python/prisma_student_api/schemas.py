from pydantic import BaseModel, EmailStr


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    age: int

class StudentUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    age: int | None = None