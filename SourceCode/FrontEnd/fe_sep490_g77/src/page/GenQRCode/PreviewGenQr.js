import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const PreviewGenQR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  const imageRef = useRef(); // ✅ Tham chiếu đến ảnh để tính toán vị trí QR

  // ✅ Nhận dữ liệu từ `state`
  const { qrList, paperImage } = location.state || {};

  const [qrPositions, setQrPositions] = useState({ leftQR: {}, rightQR: {} });

  if (!qrList || qrList.length === 0) {
    return <p className="text-center text-red-500">Không có dữ liệu để hiển thị!</p>;
  }

  // ✅ Khi ảnh tải xong, tính toán vị trí QR Code theo tỉ lệ %
  const handleImageLoad = () => {
    const img = imageRef.current;
    if (img) {
      const imgWidth = img.clientWidth;
      const imgHeight = img.clientHeight;

      setQrPositions({
        leftQR: { top: `${imgHeight * 0.12}px`, left: `${imgWidth * 0.05}px` },
        rightQR: { top: `${imgHeight * 0.08}px`, right: `${imgWidth * 0.05}px` },
      });
    }
  };

  // ✅ Hàm thực hiện in trang
  const handlePrint = () => {
    window.print();
  };

  return (
    <div ref={printRef} className="flex flex-col items-center min-h-screen bg-gray-200 p-6">
      <h1 className="text-2xl font-bold text-blue-600 print:hidden">Xem trước các bản in</h1>

      <div className="flex flex-col gap-6">
        {/* ✅ Hiển thị từng ảnh giấy thi với QR Code tương ứng */}
        {qrList.map((qr, index) => (
          <div key={qr.id} className="relative w-full max-w-3xl break-before-page">
            <img
              ref={imageRef}
              src={paperImage}
              alt={`Bản in ${index + 1}`}
              className="w-full border rounded-md shadow"
              onLoad={handleImageLoad} // ✅ Gọi khi ảnh tải xong
            />

            {/* ✅ QR Code 1 - Gốc trên bên trái (tự điều chỉnh vị trí) */}
            <div className="absolute" style={qrPositions.leftQR}>
              <QRCodeCanvas value={qr.qrContent} size={50} />
            </div>

            {/* ✅ QR Code 2 - Gốc trên bên phải (tự điều chỉnh vị trí) */}
            <div className="absolute" style={qrPositions.rightQR}>
              <QRCodeCanvas value={qr.qrContent} size={50} />
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Nút điều khiển (Ẩn khi in) */}
      <div className="flex gap-4 mt-6 print:hidden">
        <button onClick={handlePrint} className="px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">
          In
        </button>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
          Quay lại
        </button>
      </div>
    </div>
  );
};

export default PreviewGenQR;
