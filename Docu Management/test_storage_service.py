
from app.services.storage_service import storage_service


def test_storage_service():

    object_key = "testing/s3-integration-test.txt"

    # 1. Generate upload URL
    upload_url = storage_service.generate_upload_url(
        object_key=object_key,
        content_type="text/plain",
    )

    print("\nUPLOAD URL GENERATED:")
    print(upload_url[:100], "...")

    # 2. Generate download URL
    download_url = storage_service.generate_download_url(
        object_key=object_key,
    )

    print("\nDOWNLOAD URL GENERATED:")
    print(download_url[:100], "...")

    print("\nSTORAGE SERVICE TEST SUCCESSFUL!")


if __name__ == "__main__":
    test_storage_service()
