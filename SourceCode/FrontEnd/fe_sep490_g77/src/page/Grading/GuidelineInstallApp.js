import "tailwindcss/tailwind.css";

import loginImg from './Images/login.png';
import viewExamImg from './Images/ViewExam.png';
import viewExamListImg from './Images/ViewExamPart2.png';
import viewExamOptionImg from './Images/ViewExamOption.png';
import gradingCameraImg from './Images/GradingCamera.png';
import gradingImg from './Images/Grading.png';

const Guideline = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">Hướng Dẫn Tải và Sử Dụng Ứng Dụng</h1>
        <p className="mt-2 text-lg text-gray-700">Làm theo các bước dưới đây để tải và sử dụng ứng dụng chấm bài kiểm tra.</p>
      </header>

      {/* Bước 1: Tải ứng dụng */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 1: Tải Ứng Dụng</h2>
        <p className="mt-4 text-lg text-gray-800">Để tải ứng dụng, hãy quét mã QR bên dưới:</p>
        <div className="mt-4 text-center">
          <img src="qr-code.png" alt="QR Code" className="w-40 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Quét mã QR để tải ứng dụng về điện thoại của bạn.</p>
        </div>
      </section>

      {/* Bước 2: Sử dụng ứng dụng */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 2: Hướng Dẫn Sử Dụng</h2>

        {/* 2.1 Đăng nhập */}
        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-gray-700">1. Đăng nhập</h3>
          <p className="mt-2 text-lg text-gray-800">Nhập email và mật khẩu, sau đó nhấn "Đăng nhập".</p>
          <img src={loginImg} alt="Đăng nhập" className="mt-4 mx-auto w-64 rounded-lg shadow" />
        </div>

        {/* 2.2 Mở trang bài kiểm tra */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">2. Mở trang bài kiểm tra</h3>
          <p className="mt-2 text-lg text-gray-800">Sau khi đăng nhập, chọn mục "Bài kiểm tra".</p>
          <img src={viewExamImg} alt="Trang bài kiểm tra" className="mt-4 mx-auto w-64 rounded-lg shadow" />
        </div>

        {/* 2.3 Xem danh sách bài kiểm tra */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">3. Danh sách bài kiểm tra</h3>
          <p className="mt-2 text-lg text-gray-800">Danh sách các bài kiểm tra hiện ra, bạn có thể chọn bài để chấm.</p>
          <img src={viewExamListImg} alt="Danh sách bài kiểm tra" className="mt-4 mx-auto w-64 rounded-lg shadow" />
        </div>

        {/* 2.4 Tuỳ chọn bài kiểm tra */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">4. Tuỳ chọn bài kiểm tra</h3>
          <p className="mt-2 text-lg text-gray-800">Tại đây bạn có thể chọn xem đáp án, chấm điểm hoặc xem báo cáo điểm.</p>
          <img src={viewExamOptionImg} alt="Tuỳ chọn bài kiểm tra" className="mt-4 mx-auto w-64 rounded-lg shadow" />
        </div>

        {/* 2.5 Xem đáp án đúng */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">5. Xem đáp án đúng</h3>
          <p className="mt-2 text-lg text-gray-800">Sau khi nhấn vào nút “Chọn mã đề để xem đáp án”, bạn chọn mã đề thi sau đó sẽ thấy trang đáp án</p>
          <img src={gradingImg} alt="Chấm điểm" className="mt-4 mx-auto w-64 rounded-lg shadow" />
        </div>

        {/* 2.6 Màn hình chấm điểm */}
        <div className="mt-8">
          <h3 className="text-2xl font-semibold text-gray-700">6. Màn hình chấm điểm</h3>
          <p className="mt-2 text-lg text-gray-800">Sau khi chọn chấm bài, bạn sẽ chuyển sang giao diện camera để quét bài và nhận kết quả.</p>
          <img src={gradingCameraImg} alt="Chấm điểm" className="mt-4 mx-auto w-64 rounded-lg shadow" />
        </div>
      </section>

      {/* Bước 3: Video hướng dẫn */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 3: Video Hướng Dẫn</h2>
        <p className="mt-4 text-lg text-gray-800">Xem video dưới đây để hiểu rõ cách sử dụng ứng dụng:</p>
        <div className="mt-4">
          <video
            className="w-full rounded-lg shadow-md"
            width="560"
            height="400"
            controls
          >
            <source src="/videos/huongdan.mp4" type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </div>
      </section>

      {/* Bước 4: Liên hệ hỗ trợ */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 4: Liên Hệ Hỗ Trợ</h2>
        <p className="mt-4 text-lg text-gray-800">Nếu gặp khó khăn khi sử dụng, hãy liên hệ với chúng tôi:</p>
        <p className="mt-2 text-lg text-gray-800">Email: essnotifycation@gmail.com</p>
        <p className="mt-2 text-lg text-gray-800">Hotline: 0818165923</p>
      </section>

      <footer className="text-center mt-8">
        <p className="text-sm text-gray-600">© 2025 Ứng dụng Chấm Bài. Mọi quyền được bảo lưu.</p>
      </footer>
    </div>
  );
};

export default Guideline;
