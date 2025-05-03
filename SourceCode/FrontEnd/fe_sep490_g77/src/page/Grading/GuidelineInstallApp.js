import "tailwindcss/tailwind.css";

// Import ảnh QR và video hướng dẫn
import qrImage from "./Images/ce71f89f-2ad2-4916-8f5e-953fb76d310b.jpg";
import guideVideo from "./Images/01c19636-411f-4c79-8cab-e08634ec3034.mp4";

const Guideline = () => {
  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
      {/* Header với mục lục */}
            {/* Header với mục lục */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-blue-600 mb-2">
          Hướng Dẫn Cài Đặt App ESS
        </h1>
        <p className="text-lg text-gray-700 mb-4">
          Chọn một mục bên dưới để đến phần tương ứng:
        </p>
        <nav>
          <ul className="flex justify-center space-x-4">
            <li className="px-3 py-1 bg-blue-50 rounded-full">
              <a href="#scan" className="text-blue-600 hover:underline">
                1. Quét QR tải App
              </a>
            </li>
            <li className="px-3 py-1 bg-blue-50 rounded-full">
              <a href="#video" className="text-blue-600 hover:underline">
                2. Video Hướng Dẫn
              </a>
            </li>
            <li className="px-3 py-1 bg-blue-50 rounded-full">
              <a href="#support" className="text-blue-600 hover:underline">
                3. Hỗ Trợ
              </a>
            </li>
          </ul>
        </nav>
      </header>

      {/* 1. Quét QR */}
      <section id="scan" className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          1. Quét QR để tải App
        </h2>
        <div className="flex justify-center">
          <img
            src={qrImage}
            alt="Mã QR tải App"
            className="w-full max-w-xl h-auto rounded-lg"
          />
        </div>
      </section>

      {/* 2. Video Hướng Dẫn */}
      <section id="video" className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          2. Video Hướng Dẫn
        </h2>
        <div className="flex justify-center">
          <video
            src={guideVideo}
            className="w-full max-w-full max-h-[70vh] rounded-lg object-contain"
            controls
          >
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>
      </section>

      {/* 3. Hỗ trợ */}
      <section id="support" className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          3. Hướng dẫn tải App
        </h2>
        <p className="text-base text-gray-700">
          Nếu gặp khó khăn trong quá trình cài đặt hoặc sử dụng, vui lòng liên hệ:
        </p>
        <ul className="mt-2 text-base text-gray-700 space-y-1">
          <li>Email: <a href="mailto:essnotifycation@gmail.com" className="text-blue-600 hover:underline">essnotifycation@gmail.com</a></li>
          <li>Hotline: <a href="tel:0818165923" className="text-blue-600 hover:underline">0818 165 923</a></li>
        </ul>
      </section>
    </div>
  );
};

export default Guideline;
