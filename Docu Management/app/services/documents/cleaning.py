
import re
import unicodedata

from app.services.documents.schemas import DocumentExtraction


def clean_text(text: str) -> str:
    """
    Normalize extracted text while preserving
    meaningful content and line structure.
    """

    if not text:
        return ""

    # Normalize Unicode characters consistently.
    text = unicodedata.normalize("NFC", text)

    # Normalize line endings.
    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Replace non-breaking spaces with normal spaces.
    text = text.replace("\u00a0", " ")

    # Remove common invisible formatting characters.
    text = text.replace("\u200b", "")
    text = text.replace("\ufeff", "")

    # Remove control characters, but preserve
    # newline and tab characters.
    text = "".join(
        char
        for char in text
        if char in "\n\t"
        or not unicodedata.category(char).startswith("C")
    )

    # Remove trailing whitespace from each line.
    lines = [
        line.rstrip()
        for line in text.split("\n")
    ]

    text = "\n".join(lines)

    # Collapse repeated spaces and tabs.
    text = re.sub(r"[ \t]{2,}", " ", text)

    # Keep at most one blank line between sections.
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def clean_document(
    document: DocumentExtraction,
) -> DocumentExtraction:
    """
    Clean page text and extraction blocks.

    Updates the existing DocumentExtraction object.
    """

    original_char_count = 0
    cleaned_char_count = 0

    # Clean page-level text.
    for page in document.pages:
        original_char_count += len(page.text)

        page.text = clean_text(page.text)

        page.text_char_count = len(page.text)

        cleaned_char_count += len(page.text)

    # Clean block-level text.
    for block in document.blocks:
        block.text = clean_text(block.text)

    document.metadata["cleaning_report"] = {
        "original_char_count": original_char_count,
        "cleaned_char_count": cleaned_char_count,
        "characters_removed": (
            original_char_count - cleaned_char_count
        ),
        "pages_processed": len(document.pages),
        "blocks_processed": len(document.blocks),
    }

    return document
