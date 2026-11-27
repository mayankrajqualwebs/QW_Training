from pathlib import Path
import fitz
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

SUPPORTED_EXTENSIONS = {".pdf", ".docx"}

MIN_TEXT_CHARS = 40
MIN_IMAGE_COVERAGE = 0.20

def validate_file(file_path: str | Path) -> Path:
    """
    Validate file existence and supported extension.
    """

    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"Document not found: {path}")

    if not path.is_file():
        raise ValueError("The provided path is not a file.")

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {path.suffix}. "
            "Only PDF and DOCX are supported."
        )

    return path


def get_meaningful_char_count(text: str) -> int:
    """
    Count alphanumeric characters rather than whitespace,
    punctuation, or extraction noise.
    """

    return sum(character.isalnum() for character in text)


def calculate_image_coverage(page: fitz.Page) -> float:
    """
    Estimate how much of a PDF page is covered by images.

    This is an approximate indicator, not a perfect
    determination of whether a page is scanned.
    """

    page_area = page.rect.width * page.rect.height

    if page_area <= 0:
        return 0.0

    image_area = 0.0

    for image_info in page.get_image_info():
        bbox = fitz.Rect(image_info["bbox"])

        # Restrict the image rectangle to the page.
        bbox = bbox & page.rect

        if not bbox.is_empty:
            image_area += bbox.width * bbox.height

    # Multiple images may overlap, so cap the estimate.
    return min(image_area / page_area, 1.0)


def classify_pdf_page(
    text: str,
    image_coverage: float,
) -> tuple[str, bool]:
    """
    Return:
        extraction_type, needs_ocr
    """

    meaningful_chars = get_meaningful_char_count(text)

    has_usable_text = meaningful_chars >= MIN_TEXT_CHARS
    has_significant_image = image_coverage >= MIN_IMAGE_COVERAGE

    if has_usable_text:
        if image_coverage >= 0.50:
            return "MIXED", False

        return "TEXT", False

    if has_significant_image:
        return "SCANNED", True

    if meaningful_chars == 0:
        return "EMPTY", False

    return "LOW_TEXT", False


def extract_pdf(file_path: str | Path):
    """
    Extract text from a PDF and inspect every page
    for possible OCR requirements.
    """

    from .schemas import DocumentExtraction, PageExtraction, ExtractionBlock

    path = validate_file(file_path)

    if path.suffix.lower() != ".pdf":
        raise ValueError("extract_pdf() requires a PDF file.")

    document = DocumentExtraction(
        document_name=path.name,
        document_type="PDF",
    )

    with fitz.open(path) as pdf:
        document.total_pages = len(pdf)

        for page_index, page in enumerate(pdf):
            page_number = page_index + 1

            text = page.get_text("text", sort=True).strip()

            image_coverage = calculate_image_coverage(page)

            extraction_type, needs_ocr = classify_pdf_page(
                text=text,
                image_coverage=image_coverage,
            )

            page_result = PageExtraction(
                page_number=page_number,
                text=text,
                extraction_type=extraction_type,
                needs_ocr=needs_ocr,
                text_char_count=get_meaningful_char_count(text),
                image_coverage=round(image_coverage, 4),
            )

            document.pages.append(page_result)

            if text:
                document.blocks.append(
                    ExtractionBlock(
                        block_type="paragraph",
                        text=text,
                        block_index=page_index,
                        page_number=page_number,
                    )
                )

    return document


def iter_docx_blocks(docx_document):
    """
    Iterate through DOCX paragraphs and tables
    in their original document order.
    """

    from docx.oxml.text.paragraph import CT_P
    from docx.oxml.table import CT_Tbl

    from docx.document import Document as DocumentObject
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    parent = docx_document.element.body

    for child in parent.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, docx_document)

        elif isinstance(child, CT_Tbl):
            yield Table(child, docx_document)


def extract_docx(file_path: str | Path):
    """
    Extract DOCX paragraphs and tables while preserving
    their original order.
    """

    from .schemas import DocumentExtraction, ExtractionBlock

    path = validate_file(file_path)

    if path.suffix.lower() != ".docx":
        raise ValueError("extract_docx() requires a DOCX file.")

    docx_document = Document(path)

    result = DocumentExtraction(
        document_name=path.name,
        document_type="DOCX",
    )

    block_index = 0
    table_index = 0

    for block in iter_docx_blocks(docx_document):

        if isinstance(block, Paragraph):
            text = block.text.strip()

            if not text:
                continue

            style_name = block.style.name if block.style else ""

            heading_level = None

            if style_name.startswith("Heading"):
                try:
                    heading_level = int(style_name.split()[-1])
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

        elif isinstance(block, Table):
            rows = []

            for row in block.rows:
                cells = [
                    cell.text.strip()
                    for cell in row.cells
                ]

                rows.append(" | ".join(cells))

            table_text = "\n".join(rows).strip()

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

    result.metadata["paragraph_count"] = sum(
        block.block_type in {"paragraph", "heading"}
        for block in result.blocks
    )

    result.metadata["table_count"] = table_index

    return result


def extract_document(file_path: str | Path):
    """
    Main entry point.

    Automatically selects the correct extraction method
    based on the file extension.
    """

    path = validate_file(file_path)

    extension = path.suffix.lower()

    if extension == ".pdf":
        return extract_pdf(path)

    if extension == ".docx":
        return extract_docx(path)

    raise ValueError("Unsupported document type.")
