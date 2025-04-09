import cv2
import numpy as np
from sklearn.cluster import KMeans

# Load ảnh
image = cv2.imread('StudentInfo/scansbd.jpg')
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Làm mờ và nhị phân
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
                               cv2.THRESH_BINARY_INV, 11, 2)

# Tìm contour
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

bubbles = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    area = cv2.contourArea(c)
    ar = w / float(h)
    if 15 < w < 40 and 15 < h < 40 and 0.8 < ar < 1.2 and area > 120:
        bubbles.append((x, y, w, h, c))

# Lấy tâm mỗi bubble
centers = np.array([[b[0] + b[2] // 2, b[1] + b[3] // 2] for b in bubbles])

# Gom cột (6 cột) bằng KMeans
kmeans = KMeans(n_clusters=6, random_state=42).fit(centers[:, 0].reshape(-1, 1))
columns = [[] for _ in range(6)]

for idx, label in enumerate(kmeans.labels_):
    columns[label].append(bubbles[idx])

# Sắp xếp cột trái → phải
columns = sorted(columns, key=lambda col: np.mean([b[0] for b in col]))

# Tìm số được tô đậm nhất trong mỗi cột
sbd_digits = []
for col in columns:
    col_sorted = sorted(col, key=lambda b: b[1])  # top → bottom (0–9)
    min_mean = 255
    selected = None
    for i, b in enumerate(col_sorted):
        mask = np.zeros(gray.shape, dtype=np.uint8)
        cv2.drawContours(mask, [b[4]], -1, 255, -1)
        mean_val = cv2.mean(gray, mask=mask)[0]
        if mean_val < min_mean:
            min_mean = mean_val
            selected = i
    sbd_digits.append(selected)

print("Detected SBD:", ''.join(map(str, sbd_digits)))
