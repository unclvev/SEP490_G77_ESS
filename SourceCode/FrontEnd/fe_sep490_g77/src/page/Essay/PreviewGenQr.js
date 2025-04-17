import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

const PreviewGenQR = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef();
  const frontImageRef = useRef();
  const backImageRef = useRef();
  const { qrList, frontImage, backImage, layout, qrPosition } = location.state || {};
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [qrImages, setQrImages] = useState({});
  const [qrPositions, setQrPositions] = useState([]);

  useEffect(() => {
    // Calculate QR positions once frontImageRef is available
    if (frontImageRef.current) {
      handleImageLoad();
    }
  }, [frontImageRef.current]);

  useEffect(() => {
    // Auto-print when all QR images are ready
    if (Object.keys(qrImages).length === qrList?.length && qrList.length > 0 && isPrintReady) {
      console.log("✅ Tất cả ảnh QR đã sẵn sàng, tiến hành in...");
      printNow();
      setIsPrintReady(false); // Reset after printing
    }
  }, [qrImages, isPrintReady]);
  
  if (!qrList || qrList.length === 0) {
    return <p className="text-center text-red-500">Không có dữ liệu để hiển thị!</p>;
  }

  const handleImageLoad = () => {
    const frontImg = frontImageRef.current;
    if (frontImg) {
      const imgWidth = frontImg.clientWidth;
      const imgHeight = frontImg.clientHeight;

      const newPositions = qrList.map(() => ({
        leftQR: {
          top: `${imgHeight * 0.16}px`,
          left: `${imgWidth * 0.83}px`,
          position: "absolute",
        },
        rightQR: {
          top: `${imgHeight * 0.07}px`,
          left: `${imgWidth * 0.83}px`,
          position: "absolute",
        },
      }));

      setQrPositions(newPositions);
    }
  };

  const convertCanvasToImage = async () => {
    // Reset qrImages before starting a new conversion
    setQrImages({});
    
    const qrElements = document.querySelectorAll(".qr-code canvas");
    let newImages = {};
  
    console.log(`📸 Đang chuyển ${qrElements.length} QR code thành ảnh...`);
  
    // Map all canvases to promises
    const promises = Array.from(qrElements).map((canvas) => {
      return new Promise((resolve) => {
        // Get the QR ID from the data attribute
        const qrId = canvas.getAttribute('data-qr-id');
        if (!qrId) {
          console.error("❌ Không tìm thấy data-qr-id cho canvas:", canvas);
          resolve(null);
          return;
        }
        
        // Convert canvas to image
        const dataUrl = canvas.toDataURL("image/png");
        newImages[qrId] = dataUrl;
        console.log(`✅ Đã chuyển QR #${qrId} thành ảnh`);
        resolve(dataUrl);
      });
    });
  
    // Wait for all conversions to complete
    await Promise.all(promises);
    
    // Update state with all new images at once
    setQrImages(newImages);
    console.log("🎉 Đã chuyển đổi tất cả QR thành ảnh:", Object.keys(newImages).length);
    
    return newImages;
  };
  
  const handlePrint = async () => {
    if (!printRef.current) return;
  
    console.log("🔄 Bắt đầu chuyển đổi QR code thành ảnh...");
    await convertCanvasToImage(); // Chuyển QR code thành ảnh trước khi in
    setIsPrintReady(true); // Signal that we're ready to print
  };
  
  const printNow = () => {
    const { leftQR, rightQR, style } = qrPosition || {};
    const allQrReady = qrList.every(qr => qrImages[qr.id]);
    if (!allQrReady) {
      console.error("❌ Một số QR chưa được tạo thành ảnh, thử lại...");
      return alert("Một số mã QR chưa được tải xong, vui lòng thử lại!");
    }
  
    console.log("✅ Tất cả ảnh QR đã sẵn sàng, tiến hành in...");
    console.log("📊 QR Images:", qrImages);
    console.log("📋 QR List:", qrList.map(qr => qr.id));
  
    const printWindow = window.open("", "_blank");
    printWindow.document.open();
  
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            .page { position: relative; page-break-after: always; margin-bottom: 20px; }
            .page:last-child { page-break-after: avoid; }
            img.base-image { width: 100%; display: block; }
            img.qr-img {
              position: absolute;
              width: ${style?.width || "50px"};
              ${style?.height ? `height: ${style.height};` : ""}
              ${style?.maxWidth ? `max-width: ${style.maxWidth};` : ""}
            }
          </style>
        </head>
        <body>
    `);
    
    qrList.forEach((qr, index) => {
      const qrImageUrl = qrImages[qr.id];
      
      printWindow.document.write(`
        <div class="page">
          <!-- Front page with QR codes -->
          <div style="position: relative; margin-bottom: 20px;">
            <img src="${frontImage}" class="base-image" alt="Front page" />
            <img src="${qrImageUrl}" class="qr-img" style="
                top: ${leftQR.top};
                ${leftQR.left ? `left: ${leftQR.left};` : ""}
                ${leftQR.right ? `right: ${leftQR.right};` : ""}
              " alt="QR Code Left ${qr.id}" />

              <img src="${qrImageUrl}" class="qr-img" style="
                top: ${rightQR.top};
                ${rightQR.left ? `left: ${rightQR.left};` : ""}
                ${rightQR.right ? `right: ${rightQR.right};` : ""}
              " alt="QR Code Right ${qr.id}" />
          </div>
          
          <!-- Back page -->
          <div style="position: relative;">
            <img src="${backImage}" class="base-image" alt="Back page" />
          </div>
        </div>
      `);
    });
  
    printWindow.document.write(`
        </body>
      </html>
    `);
  
    printWindow.document.close();
    printWindow.focus();
  
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  };
  
  return (
    <div className="flex flex-col items-center min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold text-blue-600 print:hidden border px-4 py-2 rounded-lg bg-white mb-6">
        XEM TRƯỚC CÁC BẢN IN
      </h1>
      <div ref={printRef} className="w-full bg-white border p-4 shadow-md rounded-lg">
        {qrList.map((qr, index) => (
          <div key={qr.id} className="mb-8 page-break">
            <div className="relative mb-8">
              {frontImage ? (
                <img
                  ref={index === 0 ? frontImageRef : null}
                  src={frontImage}
                  className="w-full border rounded-md shadow"
                  onLoad={index === 0 ? handleImageLoad : null}
                  alt="Front Side"
                />
              ) : (
                <p className="text-red-500">Ảnh mặt trước không tìm thấy!</p>
              )}

              {/* Left QR Position */}
              <div 
                className="absolute qr-code"
                style={{
                  top: qrPosition.leftQR.top,
                  left: qrPosition.leftQR.left,
                  right: qrPosition.leftQR.right,
                  position: qrPosition.leftQR.position,
                  width: qrPosition.style.width,
                  height: qrPosition.style.height,
                  maxWidth: qrPosition.style.maxWidth
                }}
              >
                <QRCodeCanvas 
                  value={qr.qrContent || 'default'} 
                  data-qr-id={qr.id} 
                  style={{
                    width: "100%",
                    height: "100%"
                  }}
                />
              </div>

              {/* Right QR Position */}
              <div 
                className="absolute qr-code"
                style={{
                  top: qrPosition.rightQR.top,
                  left: qrPosition.rightQR.left,
                  right: qrPosition.rightQR.right,
                  position: qrPosition.rightQR.position,
                  width: qrPosition.style.width,
                  height: qrPosition.style.height,
                  maxWidth: qrPosition.style.maxWidth
                }}
              >
                <QRCodeCanvas 
                  value={qr.qrContent || 'default'} 
                  data-qr-id={qr.id} 
                  style={{
                    width: "100%",
                    height: "100%"
                  }}
                />
              </div>

            </div>

            <div className="relative">
              {backImage ? (
                <img
                  ref={index === 0 ? backImageRef : null}
                  src={backImage}
                  className="w-full border rounded-md shadow"
                  alt="Back Side"
                />
              ) : (
                <p className="text-red-500">Ảnh mặt sau không tìm thấy!</p>
              )}
            </div>
          </div>
        ))}
      </div>

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