import cv2
import numpy as np

img = cv2.imread('StudentInfo/scanbanchuan.jpg')

pts_src = np.array([
    [193, 140],    # góc trái trên
    [1720, 103],   # góc phải trên
    [1773, 2383],  # góc phải dưới
    [233, 2406]    # góc trái dưới
], dtype='float32')

pts_dst = np.array([
    [0, 0],
    [800, 0],
    [800, 1120],
    [0, 1120]
], dtype='float32')

M = cv2.getPerspectiveTransform(pts_src, pts_dst)
warped = cv2.warpPerspective(img, M, (800, 1120))

# Lưu lại ảnh đã căn chỉnh
cv2.imwrite("StudentInfo/warped_scanbanchuan.jpg", warped)

# Hiển thị ảnh kiểm tra
cv2.imshow("Warped OMR", warped)
cv2.waitKey(0)
cv2.destroyAllWindows()
