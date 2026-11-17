
import asyncio
import uuid

from dotenv import dotenv_values
from prisma import Prisma


async def cleanup_test_user(email: str):
    test_database_url = dotenv_values(".env").get("TEST_DATABASE_URL")
    verifier = Prisma(datasource={"url": test_database_url})
    await verifier.connect()

    try:
        # Related refresh tokens are deleted through the User cascade.
        await verifier.user.delete_many(where={"email": email})
    finally:
        await verifier.disconnect()


def test_registration_login_and_protected_me_endpoint(client):
    email = f"auth_{uuid.uuid4().hex[:12]}@example.com"
    password = "IntegrationTest!123"

    try:
        # 1. Register a new user.
        register_response = client.post(
            "/auth/register",
            json={"email": email, "password": password},
        )
        assert register_response.status_code == 201, register_response.text

        # 2. Login with correct credentials.
        # OAuth2PasswordRequestForm expects form data, not JSON.
        login_response = client.post(
            "/auth/login",
            data={"username": email, "password": password},
        )
        assert login_response.status_code == 200, login_response.text

        tokens = login_response.json()
        assert tokens["access_token"]
        assert tokens["refresh_token"]
        assert tokens["token_type"] == "bearer"

        # 3. Use the access token to call the protected endpoint.
        me_response = client.get(
            "/auth/me",
            headers={
                "Authorization": f"Bearer {tokens['access_token']}"
            },
        )
        assert me_response.status_code == 200, me_response.text
        assert me_response.json()["email"] == email

        # 4. Incorrect password must be rejected.
        wrong_login_response = client.post(
            "/auth/login",
            data={"username": email, "password": "WrongPassword!123"},
        )
        assert wrong_login_response.status_code == 401

        # 5. Missing access token must be rejected.
        unauthenticated_response = client.get("/auth/me")
        assert unauthenticated_response.status_code == 401

    finally:
        # Cleanup runs even if an assertion fails.
        asyncio.run(cleanup_test_user(email))
