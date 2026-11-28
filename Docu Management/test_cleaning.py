from app.services.documents.cleaning import clean_text

dirty_text = (
    "Hello   World  \r\n"
    "\r\n\r\n"
    "Salary\u00a0Details\t\tAvailable"
)

cleaned_text = clean_text(dirty_text)

print("BEFORE:")
print(repr(dirty_text))

print("\nAFTER:")
print(repr(cleaned_text))