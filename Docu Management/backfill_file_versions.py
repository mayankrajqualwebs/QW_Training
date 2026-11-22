
import asyncio

from app.db.client import prisma
from app.repositories.file_repository import file_repository


async def main():
    await prisma.connect()

    try:
        count = await file_repository.backfill_file_versions()

        print(f"Successfully created version 1 records for {count} files.")

    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
