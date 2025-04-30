from flask import Flask, request, jsonify,Blueprint
from flasgger import Swagger
import os
import cv2
from pyzbar.pyzbar import decode
from PIL import Image
from azure.cognitiveservices.vision.computervision import ComputerVisionClient
from azure.cognitiveservices.vision.computervision.models import OperationStatusCodes
from msrest.authentication import CognitiveServicesCredentials
from unidecode import unidecode
import re
import time
from dotenv import load_dotenv
from database import get_db_connection
import requests
import json
import glob

conn = get_db_connection()
cursor = conn.cursor()

essay = Blueprint('essay', __name__)

load_dotenv() 
subscription_key = os.getenv("AZURE_SUBSCRIPTION_KEY")
endpoint = os.getenv("AZURE_ENDPOINT")

client = ComputerVisionClient(endpoint, CognitiveServicesCredentials(subscription_key))

app = Flask(__name__)
swagger = Swagger(app)
@app.route('/')
def home():
    return 'Welcome to the Flask App!'

def row_to_dict(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

def parse_score(raw_score):
    try:
        return float(raw_score.replace(",", "."))
    except:
        return None


def center(polygon):
    xs = polygon[::2]
    ys = polygon[1::2]
    return sum(xs) / 4, sum(ys) / 4

def is_below_and_near(label_poly, value_poly, tol=40):
    x1, y1 = center(label_poly)
    x2, y2 = center(value_poly)
    return y2 > y1 and abs(x2 - x1) < tol

def scan_score_a3(image_path):
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    headers = {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Content-Type": "application/octet-stream"
    }
    post_url = f"{endpoint.rstrip('/')}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31"
    res = requests.post(post_url, headers=headers, data=image_bytes)
    op_url = res.headers["Operation-Location"]
    
    # chờ kết quả
    while True:
        result = requests.get(op_url, headers={"Ocp-Apim-Subscription-Key": subscription_key}).json()
        if result.get("status") in ["succeeded", "failed"]:
            break
        time.sleep(1)

    if result["status"] != "succeeded":
        return {"error": "OCR failed"}

    lines = result["analyzeResult"]["pages"][0]["lines"]
    score = extract_score_a3_from_lines(lines)
    return {"score": score}

def extract_score_a3_from_lines(lines):
    label_polygon = None
    for line in lines:
        if "Bằng số" in line["content"]:
            label_polygon = line["polygon"]
            break

    if label_polygon:
        for line in lines:
            if re.match(r"^\d{1,2}[,.]\d{1,2}$", line["content"]):
                if is_below_and_near(label_polygon, line["polygon"]):
                    return line["content"]
    return None 

def extract_info_a3_from_lines(lines):
    print(f"{lines}")
    sbd_polygon = None
    for line in lines:  
        text = line["content"].lower()
        if "báo" in text and "danh" in text:
            sbd_polygon = line["polygon"]
            break

    if sbd_polygon:
        for line in lines:
            if re.match(r"^[A-Z0-9]{3,10}$", line["content"]):
                if is_below_and_near(sbd_polygon, line["polygon"]):
                    return line["content"]
    return None

def scan_info_a3(image_path):
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    headers = {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Content-Type": "application/octet-stream"
    }
    post_url = f"{endpoint.rstrip('/')}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31"
    res = requests.post(post_url, headers=headers, data=image_bytes)
    op_url = res.headers["Operation-Location"]
    
    # chờ kết quả
    while True:
        result = requests.get(op_url, headers={"Ocp-Apim-Subscription-Key": subscription_key}).json()
        if result.get("status") in ["succeeded", "failed"]:
            break
        time.sleep(1)

    if result["status"] != "succeeded":
        return {"error": "OCR failed"}

    lines = result["analyzeResult"]["pages"][0]["lines"]
    sbd = extract_info_a3_from_lines(lines)
    return {"student_code": sbd}

def extract_score_a4_from_lines(lines):
    for line in lines:
        if re.match(r"^\d{1,2}[,.]\d{1,2}$", line["content"]):
            return line["content"]

def extract_info_a4_from_lines(lines):
    for line in lines:
        text = line["content"]
        match = re.search(r"SBD[:\s\-]*([A-Z0-9]{2,10})", text.upper())
        if match:
            return match.group(1)
    return None

def scan_info_a4(image_path):
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    headers = {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Content-Type": "application/octet-stream"
    }
    post_url = f"{endpoint.rstrip('/')}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31"
    res = requests.post(post_url, headers=headers, data=image_bytes)
    op_url = res.headers["Operation-Location"]

    while True:
        result = requests.get(op_url, headers={"Ocp-Apim-Subscription-Key": subscription_key}).json()
        if result.get("status") in ["succeeded", "failed"]:
            break
        time.sleep(1)

    if result["status"] != "succeeded":
        return {"error": "OCR failed"}

    lines = result["analyzeResult"]["pages"][0]["lines"]
    sbd = extract_info_a4_from_lines(lines)
    return {"student_code": sbd}

def scan_score_a4(image_path):
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    headers = {
        "Ocp-Apim-Subscription-Key": subscription_key,
        "Content-Type": "application/octet-stream"
    }
    post_url = f"{endpoint.rstrip('/')}/formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31"
    res = requests.post(post_url, headers=headers, data=image_bytes)
    op_url = res.headers["Operation-Location"]

    while True:
        result = requests.get(op_url, headers={"Ocp-Apim-Subscription-Key": subscription_key}).json()
        if result.get("status") in ["succeeded", "failed"]:
            break
        time.sleep(1)

    if result["status"] != "succeeded":
        return {"error": "OCR failed"}

    lines = result["analyzeResult"]["pages"][0]["lines"]
    score = extract_score_a4_from_lines(lines)
    return {"score": score}

def safe_decode_qr(data_bytes):
    try:
        return data_bytes.decode('utf-8')
    except UnicodeDecodeError:
        try:
            return data_bytes.decode('latin1').encode('utf-8').decode('utf-8')
        except:
            return data_bytes.decode('utf-8', errors='replace')

def extract_qr_codes(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return ["Error: Could not read image file"]
    
    results = []

    resized = cv2.resize(image, (image.shape[1]*2, image.shape[0]*2))
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    decoded = decode(gray)
    if decoded:
        for obj in decoded:
            results.append(obj.data.decode('utf-8', errors='ignore'))
    
    if not results:
        right_half = image[:, image.shape[1]//2:]
        right_resized = cv2.resize(right_half, (right_half.shape[1]*3, right_half.shape[0]*3))
        right_gray = cv2.cvtColor(right_resized, cv2.COLOR_BGR2GRAY)
        decoded = decode(right_gray)
        if decoded:
            for obj in decoded:
                results.append(obj.data.decode('utf-8', errors='replace'))
    
    if not results:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        decoded = decode(enhanced)
        if decoded:
            for obj in decoded:
                results.append(obj.data.decode('utf-8', errors='replace'))
    
    if not results:
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                      cv2.THRESH_BINARY, 21, 10)
        decoded = decode(thresh)
        if decoded:
            for obj in decoded:
                results.append(obj.data.decode('utf-8', errors='replace'))
    
    if not results:
        for threshold in range(50, 200, 25):
            _, binary = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
            decoded = decode(binary)
            if decoded:
                for obj in decoded:
                    results.append(obj.data.decode('utf-8', errors='replace'))
                break
    
    if not results:
        if image.shape[1] > 200 and image.shape[0] > 200:
            top_right = image[0:image.shape[0]//2, image.shape[1]//2:]
            top_right_resized = cv2.resize(top_right, (top_right.shape[1]*3, top_right.shape[0]*3))
            top_right_gray = cv2.cvtColor(top_right_resized, cv2.COLOR_BGR2GRAY)
            decoded = decode(top_right_gray)
            if decoded:
                for obj in decoded:
                    results.append(obj.data.decode('utf-8', errors='replace'))
        
            bottom_right = image[image.shape[0]//2:, image.shape[1]//2:]
            bottom_right_resized = cv2.resize(bottom_right, (bottom_right.shape[1]*3, bottom_right.shape[0]*3))
            bottom_right_gray = cv2.cvtColor(bottom_right_resized, cv2.COLOR_BGR2GRAY)
            decoded = decode(bottom_right_gray)
            if decoded:
                for obj in decoded:
                    results.append(obj.data.decode('utf-8', errors='replace'))
    
    if not results:
        return ["No QR codes detected in the image"]
    
    return results

@essay.route('/essay/scan', methods=["POST"])
def scan_essay():
    """
    Phân tích ảnh info/score A3 hoặc A4 để trích xuất thông tin và mã QR, đồng thời lưu kết quả vào bảng student_result.
    ---
    consumes:
      - multipart/form-data
    parameters:
      - name: image
        in: formData
        type: file
        required: true
        description: Ảnh cần phân tích
      - name: type
        in: formData
        type: string
        enum: ['info-a3', 'score-a3', 'info-a4', 'score-a4']
        required: true
        description: Loại phân tích ảnh
      - name: exam_id
        in: query
        type: string
        required: true
        description: ID của đề thi tương ứng
    responses:
      200:
        description: Kết quả trả về
    """
    if 'image' not in request.files or 'type' not in request.form:
        return jsonify({"error": "Missing image or type"}), 400

    scan_type = request.form['type']
    exam_id = request.args.get("exam_id")
    if not exam_id:
        return jsonify({"error": "Missing exam_id"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filepath = "temp.jpg"
    file.save(filepath)

    qr_results = extract_qr_codes(filepath)
    qr_list = qr_results if isinstance(qr_results, list) else [qr_results]

    if scan_type == "info-a3":
        result_data = scan_info_a3(filepath)
    elif scan_type == "info-a4":
        result_data = scan_info_a4(filepath)
    elif scan_type == "score-a3":
        result_data = scan_score_a3(filepath)
    elif scan_type == "score-a4":
        result_data = scan_score_a4(filepath)
    else:
        return jsonify({"error": f"Invalid scan type: {scan_type}"}), 400

    result_data["qr_content"] = qr_list

    if scan_type.startswith("info"):
        student_code = result_data.get("student_code")
        if not student_code:
            return jsonify({"error": "Không trích xuất được SBD"}), 400

        cursor.execute("SELECT * FROM student_result WHERE student_code = ? AND exam_id = ?", (student_code, exam_id))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": f"Học sinh '{student_code}' không thuộc đề thi {exam_id}"}), 404

        student = row_to_dict(cursor, row)

        try:
            existing_qrs = json.loads(student["student_qr_codes"] or "[]")
        except:
            existing_qrs = []

        updated_qrs = list(set(existing_qrs + qr_list))

        cursor.execute(
            "UPDATE student_result SET student_qr_codes = ? WHERE student_result_id = ?",
            (json.dumps(updated_qrs), student["student_result_id"])
        )
        conn.commit()

    elif scan_type.startswith("score"):
        score = parse_score(result_data.get("score"))
        if not score:
            return jsonify({"error": "Không trích xuất được điểm"}), 400

        found = False
        for qr in qr_list:
            cursor.execute("SELECT * FROM student_result WHERE exam_id = ? AND student_qr_codes LIKE ?", (exam_id, f'%{qr}%'))
            row = cursor.fetchone()
            if row:
                student = row_to_dict(cursor, row)
                found = True

                if not student["score"]:  # chỉ update nếu chưa có điểm
                    cursor.execute(
                        "UPDATE student_result SET score = ? WHERE student_result_id = ?",
                        (score, student["student_result_id"])
                    )
                    conn.commit()
                break

        if not found:
            return jsonify({"error": "Không tìm thấy học sinh tương ứng với mã QR"}), 404

    return jsonify(result_data)
