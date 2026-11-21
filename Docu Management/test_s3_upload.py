import requests

upload_url = "https://documanage01.s3.amazonaws.com/organizations/cmwnm86ys00061216i3hdjf5e/projects/cmwnm8n0f000a12166lzaykdt/files/707616a323bf4ba8ac938518506d5871/sample.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAXDGZCQ4WPRUMG2VA%2F20261119%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20261119T141409Z&X-Amz-Expires=300&X-Amz-SignedHeaders=content-type%3Bhost&X-Amz-Signature=353702f3d81ac6eceac2e5e7cce23ebe3b10c28289d028226cd99dea49e256f4"
file_path = "sample.pdf"

with open(file_path, "rb") as file:
    response = requests.put(
        upload_url,
        data=file,
        headers={
            "Content-Type": "application/pdf"
        }
    )

print("Status:", response.status_code)
print("Upload successful:", response.status_code == 200)
print("Response:", response.text)