from app.services.documents.extraction import extract_document
from app.services.documents.ocr import run_ocr_on_pdf
from app.services.documents.preview import print_document_preview

file_path = "sampleEmpty.pdf"
# Stage 1: Extract text and detect scanned pages
result = extract_document(file_path)

print("Before OCR:")
for page in result.pages:
    print(
        f"Page {page.page_number} | "
        f"OCR required: {page.needs_ocr}"
    )

# Stage 2: Run OCR on required pages
result = run_ocr_on_pdf(
    file_path=file_path,
    document=result,
)

print("\nAfter OCR:")
for page in result.pages:
    print(
        f"Page {page.page_number} | "
        f"Type: {page.extraction_type} | "
        f"OCR required: {page.needs_ocr} | "
        f"Characters: {page.text_char_count}"
    )

# Visualize the extracted result
print_document_preview(
    result,
    max_blocks=30,
)

print("\nOCR Report:")
print(result.metadata.get("ocr_report"))