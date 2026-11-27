from app.services.documents import extract_document

file_path = "sampleTS.pdf"

result = extract_document(file_path)

print("\nDOCUMENT:")
print(result.document_name)
print(result.document_type)

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