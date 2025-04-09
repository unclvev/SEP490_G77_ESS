import cv2
import numpy as np
from skimage.morphology import skeletonize
from skimage import img_as_ubyte
import matplotlib.pyplot as plt
import os

class BubbleFormScanner:
    def __init__(self):
        self.debug_mode = True
        self.debug_images = {}
        
    def preprocess_image(self, image):
        """Preprocess image to enhance grid and bubbles"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        # Apply adaptive thresholding to handle different lighting conditions
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                      cv2.THRESH_BINARY_INV, 21, 5)
        
        # Save debug image
        if self.debug_mode:
            self.debug_images['thresh'] = thresh.copy()
            
        return thresh
    
    def detect_circles(self, preprocessed):
        """Detect all circles in the image using Hough Circle Transform"""
        # Create a copy to draw on
        circle_img = cv2.cvtColor(preprocessed, cv2.COLOR_GRAY2BGR)
        
        # Use Hough Circle Transform
        # Parameters may need adjustment based on image quality and size
        circles = cv2.HoughCircles(
            255 - preprocessed,  # We use inverted image for better detection
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=20,
            param1=50,
            param2=15,
            minRadius=10,
            maxRadius=30
        )
        
        detected_circles = []
        
        if circles is not None:
            circles = np.uint16(np.around(circles))
            for i in circles[0, :]:
                # Draw the outer circle
                cv2.circle(circle_img, (i[0], i[1]), i[2], (0, 255, 0), 2)
                # Draw the center of the circle
                cv2.circle(circle_img, (i[0], i[1]), 2, (0, 0, 255), 3)
                
                detected_circles.append((i[0], i[1], i[2]))
        
        # Save debug image
        if self.debug_mode:
            self.debug_images['detected_circles'] = circle_img
            
        return detected_circles
    
    def cluster_circles_into_grid(self, circles):
        """Group circles into a grid structure"""
        if not circles:
            return None, None
        
        # Extract x and y coordinates
        x_coords = [c[0] for c in circles]
        y_coords = [c[1] for c in circles]
        
        # Cluster x-coordinates (columns)
        x_clusters = self._cluster_coordinates(x_coords)
        
        # Cluster y-coordinates (rows)
        y_clusters = self._cluster_coordinates(y_coords)
        
        # Sort clusters
        x_clusters.sort(key=lambda cluster: np.mean(cluster))
        y_clusters.sort(key=lambda cluster: np.mean(cluster))
        
        return x_clusters, y_clusters
    
    def _cluster_coordinates(self, coords, threshold=20):
        """Cluster coordinates that are close to each other"""
        if not coords:
            return []
            
        # Sort coordinates
        sorted_coords = sorted(coords)
        
        # Initialize clusters
        clusters = [[sorted_coords[0]]]
        
        # Group coordinates
        for coord in sorted_coords[1:]:
            if coord - clusters[-1][-1] <= threshold:
                # Add to current cluster
                clusters[-1].append(coord)
            else:
                # Start a new cluster
                clusters.append([coord])
                
        return clusters
    
    def identify_grids(self, circles, x_clusters, y_clusters):
        """Identify separate grids in the image"""
        if not x_clusters or not y_clusters:
            return []
            
        # Find significant gaps in x-clusters to separate grids
        x_means = [np.mean(cluster) for cluster in x_clusters]
        x_gaps = [x_means[i+1] - x_means[i] for i in range(len(x_means)-1)]
        
        # Find threshold for significant gap
        avg_gap = np.mean(x_gaps)
        significant_gaps = [i for i, gap in enumerate(x_gaps) if gap > 1.5 * avg_gap]
        
        # Define grid boundaries
        grid_boundaries = []
        start_idx = 0
        
        for gap_idx in significant_gaps:
            grid_boundaries.append((start_idx, gap_idx + 1))
            start_idx = gap_idx + 1
            
        grid_boundaries.append((start_idx, len(x_clusters)))
        
        # Create grids
        grids = []
        for start, end in grid_boundaries:
            grid_x_clusters = x_clusters[start:end]
            if len(grid_x_clusters) >= 3:  # Minimum 3 columns to be considered a grid
                grids.append({
                    'x_clusters': grid_x_clusters,
                    'y_clusters': y_clusters,
                    'cols': len(grid_x_clusters),
                    'rows': len(y_clusters),
                    'x_min': min([min(cluster) for cluster in grid_x_clusters]),
                    'x_max': max([max(cluster) for cluster in grid_x_clusters]),
                    'y_min': min([min(cluster) for cluster in y_clusters]),
                    'y_max': max([max(cluster) for cluster in y_clusters])
                })
                
        return grids
    
    def detect_filled_bubbles(self, image, circles):
        """Detect which bubbles are filled"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
            
        # Apply threshold to highlight filled bubbles
        _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)
        
        filled_bubbles = []
        
        for x, y, r in circles:
            # Create a mask for this circle
            mask = np.zeros_like(thresh)
            cv2.circle(mask, (x, y), int(r * 0.7), 255, -1)  # Slightly smaller than the circle
            
            # Calculate the average pixel value inside the circle
            mean_value = cv2.mean(thresh, mask)[0]
            
            # If mean value is high enough, consider it filled
            if mean_value > 50:  # Threshold may need adjustment
                filled_bubbles.append((x, y, r))
                
        return filled_bubbles
    
    def classify_filled_bubbles(self, filled_bubbles, grids):
     """Classify which bubbles are filled in each grid position"""
    results = []

    for grid_idx, grid in enumerate(grids):
        x_clusters = grid['x_clusters']
        y_clusters = grid['y_clusters']

        # Create a matrix to represent filled positions (saves (x, y, r))
    grid_matrix = [[[] for col in range(len(x_clusters))] for row in range(len(y_clusters))]

        # Map filled bubbles to cells
    for x, y, r in filled_bubbles:
            if x < grid['x_min'] or x > grid['x_max'] or y < grid['y_min'] or y > grid['y_max']:
                continue

            col_idx = -1
            for i, cluster in enumerate(x_clusters):
                if min(cluster) <= x <= max(cluster):
                    col_idx = i
                    break

            row_idx = -1
            for i, cluster in enumerate(y_clusters):
                if min(cluster) <= y <= max(cluster):
                    row_idx = i
                    break

            if row_idx >= 0 and col_idx >= 0:
                grid_matrix[row_idx][col_idx].append((x, y, r))

        # Extract number from grid
    number = ""
    for col in range(len(x_clusters)):
            best_row = -1
            max_radius = -1  # Or count if you want majority
            for row in range(len(y_clusters)):
                bubbles = grid_matrix[row][col]
                if len(bubbles) > 0:
                    avg_r = np.mean([b[2] for b in bubbles])
                    if avg_r > max_radius:
                        max_radius = avg_r
                        best_row = row

            if best_row != -1:
                number += str(best_row)
            else:
                number += "X"

    results.append({
            'grid_index': grid_idx,
            'matrix': grid_matrix,
            'number': number,
            'cols': grid['cols'],
            'rows': grid['rows']
        })

    return results

    
    def visualize_results(self, image, grids, filled_bubbles, results):
        """Create a visualization of the detected grids and filled bubbles"""
        # Create a copy to draw on
        vis_img = image.copy()
        
        # Draw grid boundaries
        for i, grid in enumerate(grids):
            color = (255, 0, 0) if i == 0 else (0, 255, 0)
            cv2.rectangle(vis_img, 
                         (grid['x_min'], grid['y_min']), 
                         (grid['x_max'], grid['y_max']), 
                         color, 2)
            
            # Draw grid number
            cv2.putText(vis_img, f"Grid {i+1}: {results[i]['number']}", 
                       (grid['x_min'], grid['y_min'] - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                       
            # Draw row numbers
            for row_idx, y_cluster in enumerate(grid['y_clusters']):
                y_pos = int(np.mean(y_cluster))
                cv2.putText(vis_img, str(row_idx), 
                           (grid['x_min'] - 20, y_pos), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        # Draw filled bubbles
        for x, y, r in filled_bubbles:
            cv2.circle(vis_img, (x, y), r, (0, 0, 255), 2)
            
        return vis_img
    
    def scan_form(self, image_path):
        """Main function to scan the bubble form"""
        # Load image
        image = cv2.imread(image_path)
        if image is None:
            print(f"Error: Could not load image {image_path}")
            return None
            
        # Preprocess image
        preprocessed = self.preprocess_image(image)
        
        # Detect all circles
        circles = self.detect_circles(preprocessed)
        
        # Cluster circles into grid
        x_clusters, y_clusters = self.cluster_circles_into_grid(circles)
        
        # Identify separate grids
        grids = self.identify_grids(circles, x_clusters, y_clusters)
        
        # Detect filled bubbles
        filled_bubbles = self.detect_filled_bubbles(image, circles)
        
        # Classify filled bubbles
        results = self.classify_filled_bubbles(filled_bubbles, grids)
        
        # Create visualization
        vis_img = self.visualize_results(image, grids, filled_bubbles, results)
        
        # Save debug image
        if self.debug_mode:
            self.debug_images['result'] = vis_img
            
        return results, vis_img

# Test the scanner
if __name__ == "__main__":
    scanner = BubbleFormScanner()
    image_path = "StudentInfo/scanbdmade.jpg"  # Update with your image path
    
    results, vis_img = scanner.scan_form(image_path)
    
    if results:
        print("\nForm scanning results:")
        for i, result in enumerate(results):
            print(f"Grid {i+1}: {result['number']}")
            print(f"Matrix shape: {result['matrix'].shape}")
            print(result['matrix'])
        
        # Display results
        cv2.imshow("Original Image", cv2.imread(image_path))
        cv2.imshow("Preprocessed", scanner.debug_images.get('thresh', np.zeros((100, 100))))
        cv2.imshow("Circles Detected", scanner.debug_images.get('detected_circles', np.zeros((100, 100, 3))))
        cv2.imshow("Result", vis_img)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    else:
        print("No results found.")