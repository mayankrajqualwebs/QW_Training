
import asyncio
import uuid

from dotenv import dotenv_values
from prisma import Prisma


async def verify_user_and_cleanup(email: str, password: str):
    """Verify persistence using a separate Prisma client."""
    test_database_url = dotenv_values(".env").get("TEST_DATABASE_URL")

    verifier = Prisma(datasource={"url": test_database_url})
    await verifier.connect()

    try:
        user = await verifier.user.find_unique(
            where={"email": email}
        )

        assert user is not None, "User was not persisted"
        assert user.email == email
        assert user.passwordHash != password

    finally:
        try:
            await verifier.user.delete_many(
                where={"email": email}
            )
        finally:
            await verifier.disconnect()


def test_registration_persists_user_in_database(client):
    email = f"pytest_{uuid.uuid4().hex[:12]}@example.com"
    password = "IntegrationTest!123"

    response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 201, response.text

    body = response.json()
    assert body["email"] == email
    assert "id" in body

    # Use a separate Prisma client and event loop for DB verification.
    asyncio.run(verify_user_and_cleanup(email, password))
