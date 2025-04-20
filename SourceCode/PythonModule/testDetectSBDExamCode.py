import cv2
import numpy as np
import os

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

def main():
    # Create output folder
    output_folder = 'recog'
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    # Process exam code (Image 1 - Ma de thi)
    exam_code_path = "output/region_ma_de.jpg"
    if os.path.exists(exam_code_path):
        try:
            exam_code = detect_code(exam_code_path, output_folder, is_student_id=False)
            print(f"Detected Exam Code: {exam_code}")
        except Exception as e:
            print(f"Error processing exam code sheet: {str(e)}")
    else:
        print(f"Exam code image not found at {exam_code_path}")
    
    # Process student ID (Image 2 - So bao danh)
    student_id_path = "output/region_sbd.jpg"
    if os.path.exists(student_id_path):
        try:
            student_id = detect_code(student_id_path, output_folder, is_student_id=True)
            print(f"Detected Student ID: {student_id}")
        except Exception as e:
            print(f"Error processing student ID sheet: {str(e)}")
    else:
        print(f"Student ID image not found at {student_id_path}")

if __name__ == "__main__":
    main()