import asyncio

async def fetch_student():
    print("Fetching student...")
    await asyncio.sleep(2)
    print("Student received!")

async def fetch_courses():
    print("Fetching courses...")
    await asyncio.sleep(1)
    print("Courses received!")

async def main():
    await asyncio.gather(
        fetch_student(),
        fetch_courses()
    )

print("-"*20, "\n")

async def fetch_user():
    print("Fetching user...")
    await asyncio.sleep(3)
    print("User received!")

async def fetch_orders():
    print("Fetching orders...")
    await asyncio.sleep(2)
    print("Orders received!")

async def main2():
    await asyncio.gather(
        fetch_user(),
        fetch_orders()
    )

#asyncio.run(main2())

#approch 2 using create task method

async def main3():
    task = asyncio.create_task(fetch_user())

    print("Main continues")

    await task
    print("Main finished")

asyncio.run(main3())