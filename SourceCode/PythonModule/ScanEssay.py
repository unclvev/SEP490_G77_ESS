import cv2
import pytesseract
import sqlite3
import numpy as np
from pyzbar.pyzbar import decode

# Load the uploaded image
image_path = "D:/Capstone/Code/SEP490_G77_ESS/SourceCode/PythonModule/FolderExam/answer1.jpg"
image = cv2.imread(image_path)

# Function to extract text from image using OCR
def extract_text(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_string(gray, lang='eng')
    return text

# Function to scan QR codes from image
def scan_qr(image):
    qr_codes = decode(image)
    qr_data_list = [qr.data.decode('utf-8') for qr in qr_codes]
    return qr_data_list

# Extract information
extracted_text = extract_text(image)
qr_data_list = scan_qr(image)
qr_data = ', '.join(qr_data_list)

# Simple parsing (improve based on format)
lines = extracted_text.split('\n')
name = next((line.split(':')[1].strip() for line in lines if "Họ và tên" in line), "Unknown")
student_id = next((line.split(':')[1].strip() for line in lines if "SBD" in line), "Unknown")
class_name = next((line.split(':')[1].strip() for line in lines if "Lớp" in line), "Unknown")
subject = next((line.split(':')[1].strip() for line in lines if "Môn" in line), "Unknown")
exam_date = next((line.split(':')[1].strip() for line in lines if "Ngày kiểm tra" in line), "Unknown")
score = next((line for line in lines if any(ch.isdigit() for ch in line)), "Not Found")

# Return extracted data as JSON
extracted_data = {
    "name": name,
    "student_id": student_id,
    "class": class_name,
    "subject": subject,
    "exam_date": exam_date,
    "score": score,
    "qr_data": qr_data
}

extracted_data
