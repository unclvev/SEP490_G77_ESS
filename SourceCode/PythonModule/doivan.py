import cv2
import numpy as np
import os

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
            roi = gray_image[y:y + h, x:x + w]
            _, roi_thresh = cv2.threshold(roi, fill_check_threshold_value, 255, cv2.THRESH_BINARY_INV)
            black_pixels = cv2.countNonZero(roi_thresh)
            total_pixels = w * h
            fill_percentage = (black_pixels / total_pixels) * 100 if total_pixels > 0 else 0
            if fill_percentage >= min_fill_percentage:
                filled_square_boxes.append(box)
    return filled_square_boxes


def find_4_corner_boxes_strict(boxes, image_shape, max_distance=200):
    """
    Tìm 4 ô vuông gần các góc ảnh (trái trên, phải trên, trái dưới, phải dưới) với kiểm tra khoảng cách giới hạn.
    Nếu không đủ 4 góc hợp lệ, trả về None để cảnh báo không an toàn để warp.
    """
    h, w = image_shape[:2]
    corners_target = {
        'C1': (0, 0),       # Top-left
        'C2': (w, 0),       # Top-right
        'C3': (0, h),       # Bottom-left
        'C4': (w, h),       # Bottom-right
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
            print(f"[WARN] Không tìm được góc {key} trong khoảng {max_distance}px")
            found[key] = None

    if any(v is None for v in found.values()):
        return None

    return found

def crop_regions_from_warped(warped_img):
    """
    Chia vùng ảnh đã chuẩn hóa thành các vùng logic: SBD, mã đề, đáp án trái/phải.

    Returns:
        dict: {region_name: cropped_image}
    """
    regions = {}

    # Kích thước ảnh chuẩn hóa sau warp (theo bạn đã định là 1000 x 1400)
    # Điều chỉnh các tọa độ dưới nếu bạn thay đổi kích thước chuẩn

    # 📍 Vùng số báo danh
    regions["sbd"] = warped_img[28:400, 735:900]

    # 📍 Vùng mã đề
    regions["ma_de"] = warped_img[28:400, 910:1000]

    # 📍 Vùng đáp án 1–25 (bên trái)
    # regions["answers_left"] = warped_img[520:1370, 80:450]
    regions["answers_left"] = warped_img[520:1370, 170:450]


    # 📍 Vùng đáp án 26–50 (bên phải)
    # regions["answers_right"] = warped_img[520:1370, 540:920]
    regions["answers_right"] = warped_img[520:1370, 630:920]

    return regions

def extract_answers(region_img, start_q, num_questions=25, num_choices=4, fill_threshold=120, min_fill=90):
    """
    Phân tích đáp án tô từ ảnh, với kiểm soát ngưỡng rõ ràng.
    Nếu không có ô nào đủ tô đậm -> trả về "".
    Nếu có nhiều ô cùng vượt -> chọn ô có pixel đậm nhất.
    """
    h, w = region_img.shape[:2]
    cell_h = h // num_questions
    cell_w = w // num_choices

    answers = {}

    for q_idx in range(num_questions):
        row_y1 = q_idx * cell_h
        row_y2 = (q_idx + 1) * cell_h

        best_choice = ""
        max_fill = 0

        for c_idx, choice in enumerate(['A', 'B', 'C', 'D']):
            col_x1 = c_idx * cell_w
            col_x2 = (c_idx + 1) * cell_w

            roi = region_img[row_y1:row_y2, col_x1:col_x2]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(roi_gray, fill_threshold, 255, cv2.THRESH_BINARY_INV)
            fill = cv2.countNonZero(thresh)

            if fill > max_fill and fill >= min_fill:
                max_fill = fill
                best_choice = choice

        answers[str(start_q + q_idx)] = best_choice  # Nếu không tô -> best_choice == ""
    return answers

def extract_answers_with_visual(region_img, start_q, num_questions=25, num_choices=4, fill_threshold=120, min_fill=120):
    """
    Giống extract_answers, nhưng trả thêm ảnh có khoanh vùng các đáp án detect được.
    Chỉ khoanh nếu ô thực sự được tô đậm.
    """
    h, w = region_img.shape[:2]
    cell_h = h // num_questions
    cell_w = w // num_choices

    answers = {}
    visual_img = region_img.copy()

    for q_idx in range(num_questions):
        row_y1 = q_idx * cell_h
        row_y2 = (q_idx + 1) * cell_h

        best_choice = ""
        max_fill = 0
        best_box = None

        for c_idx, choice in enumerate(['A', 'B', 'C', 'D']):
            col_x1 = c_idx * cell_w
            col_x2 = (c_idx + 1) * cell_w

            roi = region_img[row_y1:row_y2, col_x1:col_x2]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(roi_gray, fill_threshold, 255, cv2.THRESH_BINARY_INV)
            fill = cv2.countNonZero(thresh)
            fill_ratio = (fill / (cell_w * cell_h)) * 100  # Tỷ lệ phần trăm ô được tô

            if fill > max_fill and fill_ratio >= 30:  # 👈 chỉ chọn nếu đủ đậm
                max_fill = fill
                best_choice = choice
                best_box = (col_x1, row_y1, col_x2, row_y2)

        q_num = str(start_q + q_idx)
        answers[q_num] = best_choice

        # Nếu có đáp án chọn, vẽ lên ảnh
        if best_choice and best_box:
            x1, y1, x2, y2 = best_box
            cv2.rectangle(visual_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(visual_img, f"{q_num}:{best_choice}", (x1 + 3, y1 + 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

    return answers, visual_img



def extract_digits_from_columns(region_img, num_digits, label='sbd'):
    """
    Phân tích vùng mã đề hoặc số báo danh. Dò từ trái sang phải, trên xuống dưới.
    """
    h, w = region_img.shape[:2]
    cell_h = h // 10  # 10 hàng từ 0–9
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

def extract_answers_by_circle_detection(image, start_q=1, num_questions=25):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 150, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    bubble_boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = w / float(h)
        if 8 < w < 60 and 8 < h < 60 and 0.6 < aspect_ratio < 1.4:
            bubble_boxes.append((x, y, w, h))

    # Debug: Vẽ toàn bộ ô đã phát hiện
    debug_img = image.copy()
    for x, y, w, h in bubble_boxes:
        cv2.rectangle(debug_img, (x, y), (x + w, y + h), (0, 0, 255), 1)

    debug_window_name = "🔍 Detected Bubbles (Debug)"
    cv2.imshow(debug_window_name, debug_img)
    cv2.waitKey(0)

    # ✅ Check nếu tồn tại rồi mới destroy để tránh lỗi
    if cv2.getWindowProperty(debug_window_name, cv2.WND_PROP_VISIBLE) >= 1:
        cv2.destroyWindow(debug_window_name)

    # Tiếp tục phân tích...
    bubble_boxes = sorted(bubble_boxes, key=lambda b: b[1])
    rows = []
    current_row = []
    threshold_y = 20
    last_y = -100

    for box in bubble_boxes:
        x, y, w, h = box
        if abs(y - last_y) > threshold_y and current_row:
            rows.append(sorted(current_row, key=lambda b: b[0]))
            current_row = []
        current_row.append(box)
        last_y = y
    if current_row:
        rows.append(sorted(current_row, key=lambda b: b[0]))

    answers = {}
    visual_img = image.copy()

    for i, row in enumerate(rows):
        if len(row) != 4:
            continue

        q_number = str(start_q + i)
        max_fill = 0
        best_choice = ""
        best_box = None

        for j, box in enumerate(row):
            x, y, w, h = box
            roi = gray[y:y + h, x:x + w]
            _, roi_thresh = cv2.threshold(roi, 120, 255, cv2.THRESH_BINARY_INV)
            fill = cv2.countNonZero(roi_thresh)

            if fill > max_fill and fill > 100:
                max_fill = fill
                best_choice = "ABCD"[j]
                best_box = box

        answers[q_number] = best_choice

        if best_choice and best_box:
            x, y, w, h = best_box
            cv2.rectangle(visual_img, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(visual_img, f"{q_number}:{best_choice}", (x, y - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)

    return answers, visual_img




def extract_all_information(regions):
    """
    Tổng hợp phân tích cả 4 vùng:
    - Vùng đáp án 1–25
    - Vùng đáp án 26–50
    - Vùng mã đề
    - Vùng số báo danh

    Returns:
        dict: kết quả phân tích, gồm sbd, ma_de, answers (1–50)
    """
    result = {}

    # 🎯 Đọc số báo danh và mã đề như cũ
    result["sbd"] = extract_digits_from_columns(regions["sbd"], num_digits=6, label="sbd")
    result["ma_de"] = extract_digits_from_columns(regions["ma_de"], num_digits=4, label="ma_de")

    # 🧠 Dùng thuật toán contour để dò đáp án
    answers_left, vis_left = extract_answers_by_circle_detection(regions["answers_left"], start_q=1)
    answers_right, vis_right = extract_answers_by_circle_detection(regions["answers_right"], start_q=26)

    result["answers"] = {**answers_left, **answers_right}

    # 💾 Hiển thị & lưu ảnh
    cv2.imshow("Answers Left", vis_left)
    cv2.imshow("Answers Right", vis_right)
    cv2.imwrite("output/answers_left_detected.jpg", vis_left)
    cv2.imwrite("output/answers_right_detected.jpg", vis_right)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    return result



def detect_bubbles_and_group(image, expected_rows=25, expected_cols=4):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 180, 255, cv2.THRESH_BINARY_INV)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Lọc theo kích thước vòng tròn
    bubble_boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        aspect_ratio = w / float(h)
        area = w * h
        if 10 < w < 50 and 10 < h < 50 and 0.8 < aspect_ratio < 1.2:
            bubble_boxes.append((x, y, w, h))

    print(f"Found {len(bubble_boxes)} bubbles")

    # Sắp xếp theo y để nhóm theo dòng
    bubble_boxes = sorted(bubble_boxes, key=lambda b: b[1])  # theo y

    # Nhóm 100 ô thành 25 dòng
    grouped_rows = []
    current_row = []
    last_y = -100

    for box in bubble_boxes:
        x, y, w, h = box
        if abs(y - last_y) > 15 and current_row:
            grouped_rows.append(sorted(current_row, key=lambda b: b[0]))  # theo x
            current_row = []
        current_row.append(box)
        last_y = y

    if current_row:
        grouped_rows.append(sorted(current_row, key=lambda b: b[0]))

    return grouped_rows
def analyze_rows(rows, image, start_q=1):
    answers = {}
    visual = image.copy()

    for i, row in enumerate(rows):
        max_fill = 0
        best_choice = ""
        best_box = None
        for j, box in enumerate(row):
            x, y, w, h = box
            roi = image[y:y+h, x:x+w]
            roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, thresh = cv2.threshold(roi_gray, 120, 255, cv2.THRESH_BINARY_INV)
            fill = cv2.countNonZero(thresh)
            if fill > max_fill and fill > 100:
                max_fill = fill
                best_choice = "ABCD"[j]
                best_box = box
        qid = str(start_q + i)
        answers[qid] = best_choice
        if best_box:
            x, y, w, h = best_box
            cv2.rectangle(visual, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(visual, f"{qid}:{best_choice}", (x, y - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0,255,0), 1)

    return answers, visual


if __name__ == "__main__":
    image_filename = "input/to2.jpg"
    output_filename = "output/to2_final.jpg"
    intermediate_output_filename = "output1/5_detected_squares.jpg"

    if not os.path.exists(image_filename):
        print(f"Error: Input image file not found at {image_filename}")
    else:
        all_square_boxes = detect_any_square(image_filename, intermediate_output_filename)

        if all_square_boxes:
            print(f"Detected {len(all_square_boxes)} candidate squares.")
            img_original = cv2.imread(image_filename)
            gray_original = cv2.cvtColor(img_original, cv2.COLOR_BGR2GRAY)

            final_filled_boxes = filter_filled_squares(
                gray_image=gray_original,
                candidate_boxes=all_square_boxes,
                fill_check_threshold_value=120,
                min_fill_percentage=50.0
            )

            print(f"Filtered {len(final_filled_boxes)} filled squares.")

            corner_map = find_4_corner_boxes_strict(final_filled_boxes, img_original.shape, max_distance=220)
            if corner_map is None:
                print("❌ Không xác định được đủ 4 góc — KHÔNG nên tiếp tục warp ảnh!")
                exit()
            # --- WARP ẢNH về khung chuẩn ---
            # 1. Lấy toạ độ center của 4 ô góc
            src_pts = np.float32([
                (corner_map['C1'][0] + corner_map['C1'][2] // 2, corner_map['C1'][1] + corner_map['C1'][3] // 2),
                (corner_map['C2'][0] + corner_map['C2'][2] // 2, corner_map['C2'][1] + corner_map['C2'][3] // 2),
                (corner_map['C4'][0] + corner_map['C4'][2] // 2, corner_map['C4'][1] + corner_map['C4'][3] // 2),
                (corner_map['C3'][0] + corner_map['C3'][2] // 2, corner_map['C3'][1] + corner_map['C3'][3] // 2),
            ])

            # 2. Toạ độ ảnh chuẩn hóa (ví dụ: 1000 x 1400)
            dst_pts = np.float32([
                [0, 0],
                [1000, 0],
                [1000, 1400],
                [0, 1400]
            ])

            # 3. Biến đổi phối cảnh
            matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
            warped = cv2.warpPerspective(img_original, matrix, (1000, 1400))
            regions = crop_regions_from_warped(warped)

            info = extract_all_information(regions)
            print("✅ KẾT QUẢ:")
            print("SBD:   ", info["sbd"])
            print("Mã đề: ", info["ma_de"])
            print("Đáp án:")
            for i in range(1, 51):
                print(f"  Câu {i:02}: {info['answers'].get(str(i), '')}")
            # Lưu thử để kiểm tra từng vùng
            for name, region in regions.items():
                filename = f"output/region_{name}.jpg"
                cv2.imwrite(filename, region)
                print(f"✅ Saved region '{name}' to {filename}")
            # 4. Hiển thị thử ảnh đã chuẩn hóa
            cv2.imshow("Warped Image (chuẩn hoá)", warped)
            cv2.imwrite("output/to2_warped.jpg", warped)
            cv2.waitKey(0)
            cv2.destroyAllWindows()
        else:
            print("No squares found.")
