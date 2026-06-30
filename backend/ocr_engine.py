import easyocr
import io
import numpy as np
from PIL import Image

# Initialize EasyOCR Reader in CPU mode
# This downloads the models on the first run, but is offline afterwards.
reader = easyocr.Reader(['en'], gpu=False)

def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        # Convert bytes to PIL Image, then to numpy array for EasyOCR
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image_np = np.array(image)
        
        # Read text
        result = reader.readtext(image_np)
        
        # Result is a list of tuples: (bbox, text, confidence)
        # We join all extracted text lines
        extracted_text = "\n".join([item[1] for item in result])
        return extracted_text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""
