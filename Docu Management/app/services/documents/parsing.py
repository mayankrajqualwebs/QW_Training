
from app.services.documents.schemas import (
    DocumentExtraction,
    ExtractionBlock,
    ParsedContentItem,
    ParsedDocument,
    ParsedSection,
)


def create_section(
    section_id: int,
    title: str | None = None,
    heading_level: int = 0,
    source_block_index: int | None = None,
    page_number: int | None = None,
) -> ParsedSection:
    return ParsedSection(
        section_id=section_id,
        title=title,
        heading_level=heading_level,
        source_block_index=source_block_index,
        page_number=page_number,
    )


def parse_document_structure(
    document: DocumentExtraction,
) -> ParsedDocument:
    parsed_document = ParsedDocument(
        document_name=document.document_name,
        document_type=document.document_type,
        metadata={
            "source_block_count": len(document.blocks),
        },
    )

    # Temporary root preserves the order of top-level content.
    root = create_section(
        section_id=0,
        title=None,
        heading_level=0,
    )

    # Stack contains the current heading hierarchy.
    section_stack: list[ParsedSection] = [root]

    next_section_id = 1
    unsectioned_section: ParsedSection | None = None
    heading_seen = False

    for block in document.blocks:
        text = block.text.strip()

        if not text:
            continue

        # -------------------------
        # Heading
        # -------------------------
        if block.block_type == "heading":
            heading_seen = True
            unsectioned_section = None

            heading_level = block.heading_level or 1

            # Move up until the parent heading is found.
            while (
                len(section_stack) > 1
                and section_stack[-1].heading_level >= heading_level
            ):
                section_stack.pop()

            section = create_section(
                section_id=next_section_id,
                title=text,
                heading_level=heading_level,
                source_block_index=block.block_index,
                page_number=block.page_number,
            )
            next_section_id += 1

            parent = section_stack[-1]

            parent.content.append(
                ParsedContentItem(
                    content_type="section",
                    section=section,
                    source_block_index=block.block_index,
                    page_number=block.page_number,
                )
            )

            section_stack.append(section)
            continue

        # Current section is the most recent heading.
        current_section = section_stack[-1]

        # Content outside any heading is preserved inside
        # a synthetic section instead of being discarded.
        if current_section is root:
            if unsectioned_section is None:
                title = (
                    "Unsectioned content"
                    if heading_seen
                    else "Preamble"
                )

                unsectioned_section = create_section(
                    section_id=next_section_id,
                    title=title,
                    heading_level=0,
                )
                next_section_id += 1

                root.content.append(
                    ParsedContentItem(
                        content_type="section",
                        section=unsectioned_section,
                    )
                )

            current_section = unsectioned_section

        # -------------------------
        # Table
        # -------------------------
        if block.block_type == "table":
            current_section.content.append(
                ParsedContentItem(
                    content_type="table",
                    text=text,
                    source_block_index=block.block_index,
                    page_number=block.page_number,
                    table_index=block.table_index,
                )
            )

        # -------------------------
        # Paragraph / other text
        # -------------------------
        else:
            current_section.content.append(
                ParsedContentItem(
                    content_type="paragraph",
                    text=text,
                    source_block_index=block.block_index,
                    page_number=block.page_number,
                )
            )

    # Convert the temporary root's ordered items into
    # the document's top-level sections.
    parsed_document.sections = [
        item.section
        for item in root.content
        if item.content_type == "section"
        and item.section is not None
    ]

    parsed_document.metadata.update(
        {
            "section_count": next_section_id - 1,
            "top_level_section_count": len(
                parsed_document.sections
            ),
        }
    )

    return parsed_document
