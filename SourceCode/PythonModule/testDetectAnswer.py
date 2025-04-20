import cv2
import numpy as np
import os
import matplotlib.pyplot as plt

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

if __name__ == "__main__":
    # Run the detection
    image_path = r'output/subregions_left/left_subregion_2.jpg' # Change to your image path
    results = detect_answers(image_path)
    
    # Print the results
    print("Detected answers:")
    for question, answer in results:
        print(f"Question {question}: {answer}")