from data.mock_students import students


def get_all_students():
    return students


def get_student_by_id(student_id):
    for student in students:
        if student["id"] == student_id:
            return student

    return None