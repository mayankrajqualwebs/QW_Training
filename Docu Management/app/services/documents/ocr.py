
from pathlib import Path
from io import BytesIO

import fitz
import pytesseract
from PIL import Image

from app.services.documents.schemas import (
    DocumentExtraction,
    ExtractionBlock,
)

from app.services.documents.extraction import (
    generate_extraction_quality_report,
)


def run_ocr_on_pdf(
    file_path: str | Path,
    document: DocumentExtraction,
    dpi: int = 200,
) -> DocumentExtraction:
    """
    Run OCR only on PDF pages marked as needing OCR.

    Updates the existing DocumentExtraction object
    and returns it.
    """

    path = Path(file_path)

    if path.suffix.lower() != ".pdf":
        return document

    ocr_pages = []
    ocr_errors = []

    with fitz.open(path) as pdf:

        for page_result in document.pages:

            if not page_result.needs_ocr:
                continue

            page_index = page_result.page_number - 1

            if page_index < 0 or page_index >= len(pdf):
                ocr_errors.append(
                    f"Invalid page number: {page_result.page_number}"
                )
                continue

            try:
                pdf_page = pdf[page_index]

                zoom = dpi / 72
                matrix = fitz.Matrix(zoom, zoom)

                pixmap = pdf_page.get_pixmap(
                    matrix=matrix,
                    alpha=False,
                )

                image_bytes = pixmap.tobytes("png")

                image = Image.open(
                    BytesIO(image_bytes)
                )

                ocr_text = pytesseract.image_to_string(
                    image,
                    config="--psm 3",
                ).strip()

                if not ocr_text:
                    ocr_errors.append(
                        f"No text recognized on page "
                        f"{page_result.page_number}"
                    )
                    continue

                # Replace the low-quality extracted text
                # with the OCR result for this page.
                page_result.text = ocr_text

                page_result.text_char_count = len(
                    ocr_text
                )

                page_result.extraction_type = "OCR"

                # OCR has been attempted successfully.
                page_result.needs_ocr = False

                ocr_pages.append(
                    page_result.page_number
                )

                # Find the existing block for this page.
                existing_block = next(
                    (
                        block
                        for block in document.blocks
                        if block.page_number
                        == page_result.page_number
                    ),
                    None,
                )

                if existing_block:
                    existing_block.text = ocr_text
                    existing_block.block_type = "paragraph"

                else:
                    document.blocks.append(
                        ExtractionBlock(
                            block_type="paragraph",
                            text=ocr_text,
                            block_index=len(document.blocks),
                            page_number=page_result.page_number,
                        )
                    )

            except Exception as exc:
                ocr_errors.append(
                    f"Page {page_result.page_number}: "
                    f"{str(exc)}"
                )

    
    document.metadata["ocr_report"] = {
        "ocr_pages": ocr_pages,
        "ocr_pages_count": len(ocr_pages),
        "ocr_errors": ocr_errors,
        "dpi": dpi,
    }

    # Refresh quality report after OCR
    document.metadata["quality_report"] = (
        generate_extraction_quality_report(
            document.pages
        )
    )

    return document

