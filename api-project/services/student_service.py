from data.mock_students import students


def get_all_students():
    return students


def get_student_by_id(student_id):
    for student in students:
        if student["id"] == student_id:
            return student

    return None


def create_student(student_data):
    new_id = max(student["id"] for student in students) + 1

    new_student = {
        "id": new_id,
        **student_data
    }

    students.append(new_student)

    return new_student


def update_student(student_id, student_data):
    for index, student in enumerate(students):

        if student["id"] == student_id:

            updated_student = {
                "id": student_id,
                **student_data
            }

            students[index] = updated_student

            return updated_student

    return None


def patch_student(student_id, student_data):
    for student in students:

        if student["id"] == student_id:

            student.update(student_data)

            return student

    return None


def delete_student(student_id):
    for index, student in enumerate(students):

        if student["id"] == student_id:

            deleted_student = students.pop(index)

            return deleted_student

    return None