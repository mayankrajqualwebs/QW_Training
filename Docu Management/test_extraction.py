from app.services.documents import extract_document
from app.services.documents.extraction import extract_document
from app.services.documents.preview import print_document_preview

file_path = "samplelow.docx"

from app.services.documents.extraction import extract_document
from app.services.documents.preview import print_document_preview


result = extract_document(
    "samplelow.docx"
)

print_document_preview(
    result,
    max_blocks=30,
)

print("\nPAGES:")
for page in result.pages:
    print(
        f"Page {page.page_number} | "
        f"Type: {page.extraction_type} | "
        f"OCR: {page.needs_ocr} | "
        f"Characters: {page.text_char_count} | "
        f"Image coverage: {page.image_coverage}"
    )

print("\nBLOCKS:")
for block in result.blocks:
    print(block.block_type, block.text[:200])

print("\nJSON OUTPUT:")
print(result.to_dict())