import cv2
import numpy as np
import os
import matplotlib.pyplot as plt
import uuid
from flask import Flask, request, jsonify, Blueprint
from flasgger import Swagger, swag_from
from database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

mcq = Blueprint('mcq', __name__)

def detect_any_square(image_path, output_path="detected_squares_any.jpg"):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not read image file at {image_path}")
        return None
    img_result = img.copy()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    detected_squares = []
    min_area = 200
    max_area = 2000
    aspect_ratio_tolerance = 0.5
    approx_poly_epsilon_factor = 0.04

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
        perimeter = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, approx_poly_epsilon_factor * perimeter, True)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h if h != 0 else 0
            if area > max_area or abs(aspect_ratio - 1.0) > aspect_ratio_tolerance:
                continue
            detected_squares.append((x, y, w, h))
            cv2.rectangle(img_result, (x, y), (x + w, y + h), (0, 255, 0), 2)

    if detected_squares:
        cv2.imwrite(output_path, img_result)

    return detected_squares

def filter_filled_squares(gray_image, candidate_boxes, fill_check_threshold_value=120, min_fill_percentage=50.0):
    filled_square_boxes = []
    for box in candidate_boxes:
        x, y, w, h = box
        if w > 0 and h > 0:
            roi = gray_image[y:y+h, x:x+w]
            _, roi_thresh = cv2.threshold(roi, fill_check_threshold_value, 255, cv2.THRESH_BINARY_INV)
            black_pixels = cv2.countNonZero(roi_thresh)
            total_pixels = w * h
            fill_percentage = (black_pixels / total_pixels) * 100 if total_pixels > 0 else 0
            if fill_percentage >= min_fill_percentage:
                filled_square_boxes.append(box)
    return filled_square_boxes

def find_4_corner_boxes_strict(boxes, image_shape, max_distance=200):
    h, w = image_shape[:2]
    corners_target = {
        'C1': (0, 0),
        'C2': (w, 0),
        'C3': (0, h),
        'C4': (w, h),
    }
    found = {}
    for key, (tx, ty) in corners_target.items():
        candidates = []
        for box in boxes:
            x, y, bw, bh = box
            cx = x + bw // 2
            cy = y + bh // 2
            dist = np.hypot(cx - tx, cy - ty)
            if dist <= max_distance:
                candidates.append((dist, box))
        if candidates:
            best_box = min(candidates, key=lambda t: t[0])[1]
            found[key] = best_box
        else:
            print(f"[WARN] Không tìm được góc {key}")
            found[key] = None

    if any(v is None for v in found.values()):
        return None
    return found

def crop_regions_from_warped(warped_img):
    regions = {}
    regions["sbd"] = warped_img[90:400, 750:890]
    regions["ma_de"] = warped_img[90:400, 910:990]
    regions["answers_left"] = warped_img[520:1370, 175:440]
    regions["answers_right"] = warped_img[520:1370, 625:900]
    return regions

def extract_digits_from_columns(region_img, num_digits, label='sbd'):
    h, w = region_img.shape[:2]
    cell_h = h // 10
    cell_w = w // num_digits
    result = ""
    for col in range(num_digits):
        col_x1 = col * cell_w
        col_x2 = (col + 1) * cell_w
        max_fill = 0
        selected_digit = ""
        for row in range(10):
            row_y1 = row * cell_h
            row_y2 = (row + 1) * cell_h
            roi = region_img[row_y1:row_y2, col_x1:col_x2]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(roi_gray, 120, 255, cv2.THRESH_BINARY_INV)
            fill = cv2.countNonZero(thresh)
            if fill > max_fill and fill > 100:
                max_fill = fill
                selected_digit = str(row)
        result += selected_digit
    return result

def detect_bubbles(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    _, thresh = cv2.threshold(blur, 150, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    bubble_boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = w / float(h)
        if 8 < w < 60 and 8 < h < 60 and 0.6 < aspect_ratio < 1.4:
            bubble_boxes.append((x, y, w, h))
    return bubble_boxes

def split_into_question_regions(region_img, questions_per_region=5):
    h, w = region_img.shape[:2]
    total_questions = 25
    total_regions = total_questions // questions_per_region
    step = h // total_regions
    regions = []
    for i in range(total_regions):
        y1 = i * step
        y2 = (i+1) * step if i < total_regions - 1 else h
        roi = region_img[y1:y2, :]
        regions.append((roi, i*questions_per_region + 1))  # (ảnh cắt nhỏ, câu bắt đầu)
    return regions

def extract_answers_from_region(region_img, start_q):
    bubble_boxes = detect_bubbles(region_img)
    bubble_boxes = sorted(bubble_boxes, key=lambda b: (b[1], b[0]))
    gray = cv2.cvtColor(region_img, cv2.COLOR_BGR2GRAY)
    rows = []
    current_row = []
    last_y = -100
    for box in bubble_boxes:
        x, y, w, h = box
        if abs(y - last_y) > 15 and current_row:
            rows.append(sorted(current_row, key=lambda b: b[0]))
            current_row = []
        current_row.append(box)
        last_y = y
    if current_row:
        rows.append(sorted(current_row, key=lambda b: b[0]))

    answers = {}
    for i, row in enumerate(rows):
        if len(row) != 4:
            continue
        max_fill = 0
        best_choice = ""
        for j, box in enumerate(row):
            x, y, w, h = box
            roi = gray[y:y+h, x:x+w]
            _, thresh = cv2.threshold(roi, 120, 255, cv2.THRESH_BINARY_INV)
            fill = cv2.countNonZero(thresh)
            if fill > max_fill:
                max_fill = fill
                best_choice = "ABCD"[j]
        answers[str(start_q+i)] = best_choice
    return answers

def extract_all_information(regions):
    result = {}
    result["sbd"] = extract_digits_from_columns(regions["sbd"], num_digits=6)
    result["ma_de"] = extract_digits_from_columns(regions["ma_de"], num_digits=4)
    
    answers = {}

    for side in ["answers_left", "answers_right"]:
        region_img = regions[side]
        regions_split = split_into_question_regions(region_img)
        for small_region, start_q in regions_split:
            ans = extract_answers_from_region(small_region, start_q)
            answers.update(ans)

    result["answers"] = answers
    return result

def detect_horizontal_lines(region_img, debug_save_path="output/debug_lines.jpg", min_line_length=100, line_gap=10, threshold=100):
    """
    Dùng Hough Transform để detect các đường ngang trong vùng answers.
    Lưu file debug kẻ line để dễ kiểm tra.
    """
    gray = cv2.cvtColor(region_img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    edges = cv2.Canny(blur, 50, 150, apertureSize=3)

    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi/180,
        threshold=threshold,
        minLineLength=min_line_length,
        maxLineGap=line_gap
    )

    y_positions = []

    debug_img = region_img.copy()

    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if abs(y1 - y2) < 10:  # Gần như đường ngang
                y_avg = (y1 + y2) // 2
                y_positions.append(y_avg)
                # Vẽ line debug
                cv2.line(debug_img, (x1, y_avg), (x2, y_avg), (0, 255, 0), 2)

    # Gộp các line gần nhau thành 1 line (giảm nhiễu)
    y_positions = sorted(y_positions)
    filtered_positions = []

    for y in y_positions:
        if not filtered_positions or abs(y - filtered_positions[-1]) > 20:  # cách nhau tối thiểu 20px
            filtered_positions.append(y)

    # Save ảnh debug
    if not os.path.exists(os.path.dirname(debug_save_path)):
        os.makedirs(os.path.dirname(debug_save_path))
    cv2.imwrite(debug_save_path, debug_img)
    print(f"✅ Saved debug horizontal lines to {debug_save_path}")

    return filtered_positions

def enhance_contrast_clahe(image):
    """
    Tăng contrast bằng CLAHE (Histogram Equalization).
    """
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    final = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return final

def split_by_detected_lines(region_img, lines_y, prefix="left", output_dir="output/subregions_detected"):
    """
    Chia ảnh theo các đường y đã detect, đồng thời tăng contrast vùng nhỏ trước khi lưu.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    subregions = []
    for i in range(len(lines_y) - 1):
        y1 = lines_y[i]
        y2 = lines_y[i+1]
        sub_img = region_img[y1:y2, :]

        # ✨ Tăng độ tương phản trước
        sub_img = enhance_contrast_clahe(sub_img)

        subregions.append((sub_img, y1, y2))

        save_path = os.path.join(output_dir, f"{prefix}_subregion_{i+1}.jpg")
        cv2.imwrite(save_path, sub_img)
        print(f"✅ Saved subregion {i+1}: y = {y1} to {y2} -> {save_path}")

    return subregions

def detect_answers(image_path, output_folder='recog'):
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        raise Exception(f"Could not read image at {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Save original grayscale for visualization
    cv2.imwrite(os.path.join(output_folder, "grayscale.jpg"), gray)
    
    # Apply preprocessing to enhance the contrast
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Use adaptive thresholding instead of global
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                   cv2.THRESH_BINARY_INV, 11, 2)
    
    # Save binary image for debugging
    cv2.imwrite(os.path.join(output_folder, "binary.jpg"), binary)
    
    # Detect circles using Hough Circle Transform
    circles = cv2.HoughCircles(
        gray,
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=20,
        param1=50,
        param2=30,
        minRadius=8,
        maxRadius=20
    )
    
    # Create a visualization image
    vis_image = image.copy()
    
    # Initialize grid for answers
    # We know there are 5 rows (questions) and 4 columns (A, B, C, D)
    num_rows = 5
    num_cols = 4
    
    # Calculate approximate grid positions
    height, width = gray.shape
    row_height = height / num_rows
    col_width = width / num_cols
    
    # Create grid cells
    grid = []
    for r in range(num_rows):
        row = []
        for c in range(num_cols):
            # Calculate cell center
            center_x = int(col_width * (c + 0.5))
            center_y = int(row_height * (r + 0.5))
            row.append((center_x, center_y))
        grid.append(row)
    
    # Draw grid for visualization
    grid_image = image.copy()
    for r in range(num_rows):
        for c in range(num_cols):
            x, y = grid[r][c]
            cv2.circle(grid_image, (x, y), 14, (0, 255, 0), 1)
    
    # Save grid visualization
    cv2.imwrite(os.path.join(output_folder, "grid.jpg"), grid_image)
    
    # Initialize results
    results = []
    
    # For each row (question), find the darkest circle
    for r in range(num_rows):
        darkest_val = 255
        darkest_idx = -1
        
        for c in range(num_cols):
            center_x, center_y = grid[r][c]
            
            # Create a mask for sampling the area around this grid point
            mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.circle(mask, (center_x, center_y), 10, 255, -1)
            
            # Get mean pixel value in this circle area
            mean_val = np.mean(gray[mask > 0])
            
            # Debug: Draw the sampling area and add text with mean value
            cv2.circle(vis_image, (center_x, center_y), 10, (0, 0, 255), 2)
            cv2.putText(vis_image, f"{mean_val:.1f}", (center_x-15, center_y+25), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
            
            # Check if this is the darkest so far for this row
            if mean_val < darkest_val:
                darkest_val = mean_val
                darkest_idx = c
        
        # Mark the darkest (selected) answer
        if darkest_idx != -1:
            answer_x, answer_y = grid[r][darkest_idx]
            cv2.circle(vis_image, (answer_x, answer_y), 12, (0, 255, 0), 3)
            answer = chr(65 + darkest_idx)  # 'A', 'B', 'C', or 'D'
            results.append((r+1, answer))
    
    # Save visualization
    cv2.imwrite(os.path.join(output_folder, "detected_answers.jpg"), vis_image)
    
    # Save results to file
    with open(os.path.join(output_folder, "results.txt"), "w") as f:
        for question, answer in results:
            f.write(f"Question {question}: {answer}\n")
    
    return results

def detect_code(image_path, output_folder='recog', is_student_id=True):
    """Detect student ID (6 digits) or exam code (3 digits) from bubble sheets"""
    
    # Create output folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    print(f"Processing image: {image_path}")
    
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        raise Exception(f"Could not read image at {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply preprocessing to enhance the contrast
    gray = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Determine dimensions
    height, width = gray.shape
    
    # Set parameters based on sheet type
    if is_student_id:
        num_cols = 6  # Student ID: 6 digits
        label = "Student ID"
    else:
        num_cols = 3  # Exam code: 3 digits
        label = "Exam Code"
    
    num_rows = 10  # Always 10 options (0-9)
    
    # Calculate grid dimensions - this is critical for accurate detection
    # Find the first and last row/column of cells by looking for grid lines
    
    # For these specific images, we know the grid structure
    # Let's calculate row_height and col_width more precisely
    
    # The grid looks quite regular in the images
    offset_x = int(width * 0.03)   # 3% width
    offset_y = int(height * 0.03)  # 3% height

    # Tính lại kích thước vùng thực sự chứa các ô tròn
    effective_width = width - 2 * offset_x
    effective_height = height - 2 * offset_y

    # Thực tế ô lưới chia đều theo số cột/số hàng
    col_width = effective_width / num_cols
    row_height = effective_height / num_rows

    # Tạo các điểm center cho từng ô
    grid = []
    for r in range(num_rows):
        row = []
        for c in range(num_cols):
            center_x = int(offset_x + col_width * (c + 0.5))
            center_y = int(offset_y + row_height * (r + 0.5))
            row.append((center_x, center_y))
        grid.append(row)
        
    # Draw grid for visualization
    grid_image = image.copy()
    for r in range(num_rows):
        for c in range(num_cols):
            x, y = grid[r][c]
            cv2.circle(grid_image, (x, y), 5, (0, 255, 0), 1)
            # Add labels to the grid for better debugging
            cv2.putText(grid_image, f"{r}", (x-15, y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    
    # Save grid visualization
    cv2.imwrite(os.path.join(output_folder, f"{label.lower().replace(' ', '_')}_grid.jpg"), grid_image)
    
    # Initialize result
    code_digits = []
    
    # Create visualization image
    vis_image = image.copy()
    
    # For each column (digit position), find the darkest bubble
    for c in range(num_cols):
        darkest_val = 255
        darkest_idx = -1
        
        # Also track the second darkest for verification
        second_darkest_val = 255
        second_darkest_idx = -1
        
        for r in range(num_rows):
            center_x, center_y = grid[r][c]
            
            # Create a mask for sampling the area around this grid point
            mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.circle(mask, (center_x, center_y), 12, 255, -1)
            
            # Get mean pixel value in this circle area
            mean_val = np.mean(gray[mask > 0])
            
            # Debug: Draw the sampling area and show the average value
            cv2.circle(vis_image, (center_x, center_y), 12, (0, 0, 255), 1)
            cv2.putText(vis_image, f"{mean_val:.1f}", (center_x-15, center_y+15), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
            
            # Check if this is the darkest so far for this column
            if mean_val < darkest_val:
                second_darkest_val = darkest_val
                second_darkest_idx = darkest_idx
                darkest_val = mean_val
                darkest_idx = r
            elif mean_val < second_darkest_val:
                second_darkest_val = mean_val
                second_darkest_idx = r
        
        # Mark the darkest (selected) bubble
        if darkest_idx != -1:
            # The row index corresponds to the digit (0-9)
            digit = darkest_idx
            code_digits.append(digit)
            
            # Draw the selected bubble
            answer_x, answer_y = grid[darkest_idx][c]
            cv2.circle(vis_image, (answer_x, answer_y), 8, (0, 255, 0), 2)
            
            # Also mark the second darkest for comparison
            if second_darkest_idx != -1:
                second_x, second_y = grid[second_darkest_idx][c]
                cv2.circle(vis_image, (second_x, second_y), 8, (255, 255, 0), 1)
    
    # Format the detected code
    code = ''.join(map(str, code_digits))
    
    # Save visualization
    cv2.imwrite(os.path.join(output_folder, f"detected_{label.lower().replace(' ', '_')}.jpg"), vis_image)
    
    # Save result to file
    with open(os.path.join(output_folder, f"{label.lower().replace(' ', '_')}.txt"), "w") as f:
        f.write(f"{label}: {code}\n")
    
    print(f"Detected {label}: {code}")
    return code

app = Flask(__name__)
swagger = Swagger(app)

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
TEMP_FOLDER = 'temp_subimages'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

@mcq.route('/mcq/detect', methods=['POST'])
@swag_from({
    'parameters': [
        {
            'name': 'file',
            'in': 'formData',
            'type': 'file',
            'required': True,
            'description': 'Upload image file (Student answer sheet)'
        }
    ],
    'responses': {
        200: {
            'description': 'Detection result',
            'examples': {
                'application/json': {
                    "student_id": "000000",
                    "exam_code": "000",
                    "answers": {
                        "1": "B",
                        "2": "C"
                    }
                }
            }
        }
    }
})
def detect():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    # Save the uploaded file
    input_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}.jpg")
    file.save(input_path)

    # Step 1: Detect squares and warp the paper
    all_square_boxes = detect_any_square(input_path)
    if not all_square_boxes:
        return jsonify({"error": "No squares detected"}), 400

    img_original = cv2.imread(input_path)
    gray_original = cv2.cvtColor(img_original, cv2.COLOR_BGR2GRAY)
    final_filled_boxes = filter_filled_squares(gray_original, all_square_boxes)
    corner_map = find_4_corner_boxes_strict(final_filled_boxes, img_original.shape, max_distance=220)

    if corner_map is None:
        return jsonify({"error": "Not enough corners detected"}), 400

    src_pts = np.float32([
        (corner_map['C1'][0] + corner_map['C1'][2]//2, corner_map['C1'][1] + corner_map['C1'][3]//2),
        (corner_map['C2'][0] + corner_map['C2'][2]//2, corner_map['C2'][1] + corner_map['C2'][3]//2),
        (corner_map['C4'][0] + corner_map['C4'][2]//2, corner_map['C4'][1] + corner_map['C4'][3]//2),
        (corner_map['C3'][0] + corner_map['C3'][2]//2, corner_map['C3'][1] + corner_map['C3'][3]//2),
    ])
    dst_pts = np.float32([
        [0, 0], [1000, 0], [1000, 1400], [0, 1400]
    ])
    matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
    warped = cv2.warpPerspective(img_original, matrix, (1000, 1400))

    # Step 2: Crop regions
    regions = crop_regions_from_warped(warped)

    # Step 3: Detect answers
    lines_left = detect_horizontal_lines(regions["answers_left"], debug_save_path="output/debug_lines_left.jpg")
    lines_right = detect_horizontal_lines(regions["answers_right"], debug_save_path="output/debug_lines_right.jpg")

    subregions_left = split_by_detected_lines(regions["answers_left"], lines_left, prefix="left", output_dir="output/subregions_left")
    subregions_right = split_by_detected_lines(regions["answers_right"], lines_right, prefix="right", output_dir="output/subregions_right")

    answers_left = {}
    for idx, (sub_img, y1, y2) in enumerate(subregions_left):
        start_q = idx * 5 + 1
        temp_filename = os.path.join(TEMP_FOLDER, f"left_{idx}_{uuid.uuid4().hex}.jpg")
        cv2.imwrite(temp_filename, sub_img)
        detected = detect_answers(temp_filename)
        for relative_q, answer in detected:
            absolute_q = start_q + (relative_q - 1)
            answers_left[absolute_q] = answer

    answers_right = {}
    for idx, (sub_img, y1, y2) in enumerate(subregions_right):
        start_q = idx * 5 + 26
        temp_filename = os.path.join(TEMP_FOLDER, f"right_{idx}_{uuid.uuid4().hex}.jpg")
        cv2.imwrite(temp_filename, sub_img)
        detected = detect_answers(temp_filename)
        for relative_q, answer in detected:
            absolute_q = start_q + (relative_q - 1)
            answers_right[absolute_q] = answer

    final_answers = {**answers_left, **answers_right}

    # Step 4: Detect exam code and student ID
    exam_code_path = "output/region_ma_de.jpg"
    student_id_path = "output/region_sbd.jpg"
    cv2.imwrite(exam_code_path, regions["ma_de"])
    cv2.imwrite(student_id_path, regions["sbd"])

    exam_code = detect_code(exam_code_path, output_folder=OUTPUT_FOLDER, is_student_id=False)
    student_id = detect_code(student_id_path, output_folder=OUTPUT_FOLDER, is_student_id=True)

    # Final return
    info_dict = {
        "student_id": student_id,
        "exam_code": exam_code,
        "answers": final_answers
    }

    return jsonify(info_dict)

if __name__ == "__main__":
    app.run(debug=True)





