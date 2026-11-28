from pathlib import Path

import fitz
from docx import Document
from docx.oxml.text.paragraph import CT_P
from docx.oxml.table import CT_Tbl
from docx.table import Table
from docx.text.paragraph import Paragraph

from .schemas import (
    DocumentExtraction,
    ExtractionBlock,
    PageExtraction,
)

# ============================================================
# Configuration
# ============================================================

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}

MIN_TEXT_CHARS = 40
MIN_IMAGE_COVERAGE = 0.20

# ============================================================
# File Validation
# ============================================================

def validate_file(file_path: str | Path) -> Path:
    """
    Validate file existence and supported extension.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Document not found: {path}"
        )

    if not path.is_file():
        raise ValueError(
            "The provided path is not a file."
        )

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {path.suffix}. "
            "Only PDF and DOCX are supported."
        )

    return path

# ============================================================
# Text Utilities
# ============================================================

def get_meaningful_char_count(text: str) -> int:
    """
    Count alphanumeric characters rather than whitespace
    or punctuation.
    """

    return sum(
        character.isalnum()
        for character in text
    )

# ============================================================
# PDF Image Coverage
# ============================================================

def calculate_image_coverage(page: fitz.Page) -> float:
    """
    Estimate how much of a PDF page is covered by images.

    This is an approximate indicator. It does not determine
    whether the page is scanned by itself.
    """

    page_area = page.rect.width * page.rect.height

    if page_area <= 0:
        return 0.0

    image_area = 0.0

    for image_info in page.get_image_info():
        bbox = fitz.Rect(image_info["bbox"])

        # Restrict image rectangle to the page boundaries.
        bbox = bbox & page.rect

        if not bbox.is_empty:
            image_area += bbox.width * bbox.height

    # Image rectangles may overlap.
    coverage = image_area / page_area

    return min(coverage, 1.0)

# ============================================================
# PDF Page Classification
# ============================================================

def classify_pdf_page(
    text: str,
    image_coverage: float,
) -> dict:
    """
    Classify a PDF page using extracted text and image coverage.

    Image coverage alone does not determine whether OCR
    is required.
    """

    meaningful_chars = get_meaningful_char_count(text)
    word_count = len(text.split())

    # Sufficient text was extracted.
    if (
        meaningful_chars >= MIN_TEXT_CHARS
        and word_count >= 5
    ):
        if image_coverage >= MIN_IMAGE_COVERAGE:
            extraction_type = "TEXT_WITH_IMAGES"
        else:
            extraction_type = "TEXT"

        needs_ocr = False

    # No meaningful text, but substantial image content.
    elif (
        meaningful_chars == 0
        and image_coverage >= MIN_IMAGE_COVERAGE
    ):
        extraction_type = "SCANNED"
        needs_ocr = True

    # Some text exists, but extraction may be incomplete.
    elif meaningful_chars > 0:
        extraction_type = "LOW_TEXT"
        needs_ocr = (
            image_coverage >= MIN_IMAGE_COVERAGE
        )

    # No meaningful text or substantial image.
    else:
        extraction_type = "EMPTY"
        needs_ocr = False

    return {
        "extraction_type": extraction_type,
        "needs_ocr": needs_ocr,
        "text_char_count": meaningful_chars,
        "word_count": word_count,
        "image_coverage": round(
            image_coverage,
            4,
        ),
    }

# ============================================================
# PDF Extraction
# ============================================================

def extract_pdf(
    file_path: str | Path,
) -> DocumentExtraction:
    """
    Extract text from a PDF page by page.

    Also inspects each page for possible OCR requirements.
    """

    path = validate_file(file_path)

    if path.suffix.lower() != ".pdf":
        raise ValueError(
            "extract_pdf() requires a PDF file."
        )

    document = DocumentExtraction(
        document_name=path.name,
        document_type="PDF",
    )

    with fitz.open(path) as pdf:
        document.total_pages = len(pdf)

        for page_index, page in enumerate(pdf):
            page_number = page_index + 1

            # Extract text from the current page.
            text = page.get_text(
                "text",
                sort=True,
            ).strip()

            # Estimate image coverage.
            image_coverage = calculate_image_coverage(
                page
            )

            # Classify the page.
            classification = classify_pdf_page(
                text=text,
                image_coverage=image_coverage,
            )

            # Store page-level extraction information.
            page_result = PageExtraction(
                page_number=page_number,
                text=text,
                extraction_type=classification[
                    "extraction_type"
                ],
                needs_ocr=classification[
                    "needs_ocr"
                ],
                text_char_count=classification[
                    "text_char_count"
                ],
                image_coverage=classification[
                    "image_coverage"
                ],
            )

            document.pages.append(page_result)

            # Store extracted text as a block.
            if text:
                document.blocks.append(
                    ExtractionBlock(
                        block_type="paragraph",
                        text=text,
                        block_index=len(
                            document.blocks
                        ),
                        page_number=page_number,
                    )
                )

    # Generate extraction quality report.
    quality_report = (
        generate_extraction_quality_report(
            document.pages
        )
    )

    document.metadata[
        "quality_report"
    ] = quality_report

    return document

# ============================================================
# DOCX Block Iterator
# ============================================================

def iter_docx_blocks(docx_document):
    """
    Iterate through DOCX paragraphs and tables
    in their original document order.
    """

    parent = docx_document.element.body

    for child in parent.iterchildren():

        if isinstance(child, CT_P):
            yield Paragraph(
                child,
                docx_document,
            )

        elif isinstance(child, CT_Tbl):
            yield Table(
                child,
                docx_document,
            )

# ============================================================
# DOCX Extraction
# ============================================================

def extract_docx(
    file_path: str | Path,
) -> DocumentExtraction:
    """
    Extract DOCX paragraphs, headings, and tables
    while preserving their original order.
    """

    path = validate_file(file_path)

    if path.suffix.lower() != ".docx":
        raise ValueError(
            "extract_docx() requires a DOCX file."
        )

    docx_document = Document(path)

    result = DocumentExtraction(
        document_name=path.name,
        document_type="DOCX",
    )

    block_index = 0
    table_index = 0

    for block in iter_docx_blocks(
        docx_document
    ):

        # ----------------------------------------------------
        # Paragraphs and Headings
        # ----------------------------------------------------

        if isinstance(block, Paragraph):
            text = block.text.strip()

            if not text:
                continue

            style_name = (
                block.style.name
                if block.style
                else ""
            )

            heading_level = None

            if style_name.startswith("Heading"):
                try:
                    heading_level = int(
                        style_name.split()[-1]
                    )
                except ValueError:
                    heading_level = None

            block_type = (
                "heading"
                if heading_level is not None
                else "paragraph"
            )

            result.blocks.append(
                ExtractionBlock(
                    block_type=block_type,
                    text=text,
                    block_index=block_index,
                    heading_level=heading_level,
                )
            )

            block_index += 1

        # ----------------------------------------------------
        # Tables
        # ----------------------------------------------------

        elif isinstance(block, Table):
            rows = []

            for row in block.rows:
                cells = [
                    cell.text.strip()
                    for cell in row.cells
                ]

                rows.append(
                    " | ".join(cells)
                )

            table_text = "\n".join(
                rows
            ).strip()

            if not table_text:
                continue

            result.blocks.append(
                ExtractionBlock(
                    block_type="table",
                    text=table_text,
                    block_index=block_index,
                    table_index=table_index,
                )
            )

            block_index += 1
            table_index += 1

    # Store basic DOCX extraction metadata.
    result.metadata["paragraph_count"] = sum(
        block.block_type in {
            "paragraph",
            "heading",
        }
        for block in result.blocks
    )

    result.metadata["table_count"] = (
        table_index
    )

    result.metadata["total_blocks"] = (
        len(result.blocks)
    )

    return result


# ============================================================
# Extraction Quality Report
# ============================================================

def generate_extraction_quality_report(
    pages: list[PageExtraction],
) -> dict:
    """
    Generate a basic report about extracted PDF text.
    """

    total_pages = len(pages)

    pages_needing_ocr = [
        page.page_number
        for page in pages
        if page.needs_ocr
    ]

    low_text_pages = [
        page.page_number
        for page in pages
        if page.extraction_type == "LOW_TEXT"
    ]

    empty_pages = [
        page.page_number
        for page in pages
        if page.extraction_type == "EMPTY"
    ]

    total_chars = sum(
        page.text_char_count
        for page in pages
    )

    pages_with_text = sum(
        1
        for page in pages
        if page.text_char_count > 0
    )

    text_extraction_coverage = (
        round(
            pages_with_text / total_pages,
            4,
        )
        if total_pages > 0
        else 0.0
    )

    return {
        "total_pages": total_pages,
        "pages_with_text": pages_with_text,
        "pages_needing_ocr": pages_needing_ocr,
        "low_text_pages": low_text_pages,
        "empty_pages": empty_pages,
        "total_extracted_chars": total_chars,
        "text_extraction_coverage": (
            text_extraction_coverage
        ),
    }


# ============================================================
# Main Extraction Entry Point
# ============================================================

def extract_document(
    file_path: str | Path,
) -> DocumentExtraction:
    """
    Main extraction entry point.

    Automatically selects the extraction method
    based on the file extension.
    """

    path = validate_file(file_path)

    extension = path.suffix.lower()

    if extension == ".pdf":
        return extract_pdf(path)

    if extension == ".docx":
        return extract_docx(path)

    raise ValueError(
        "Unsupported document type."
    )
