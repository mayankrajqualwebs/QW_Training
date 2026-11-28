from app.services.documents.extraction import extract_document
from app.services.documents.parsing import parse_document_structure

document = extract_document("sampleTS.docx")
parsed_document = parse_document_structure(document)

print("Sections:", parsed_document.metadata["section_count"])
print(
    "Top-level sections:",
    parsed_document.metadata["top_level_section_count"],
)

print(parsed_document.to_dict())


def print_section(section, indent=0):
    prefix = " " * indent

    print(
        f"{prefix}Section: {section.title}"
        f" (level={section.heading_level})"
    )

    for item in section.content:
        if item.content_type == "section":
            print_section(item.section, indent + 2)

        elif item.content_type == "table":
            print(
                f"{prefix}  TABLE "
                f"(block={item.source_block_index})"
            )

        else:
            print(
                f"{prefix}  PARAGRAPH "
                f"(block={item.source_block_index})"
            )

print("*"*35)
for section in parsed_document.sections:
    print_section(section)
