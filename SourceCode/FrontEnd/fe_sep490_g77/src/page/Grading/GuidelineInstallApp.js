import "tailwindcss/tailwind.css";

const Guideline = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">Hướng Dẫn Tải và Sử Dụng App</h1>
        <p className="mt-2 text-lg text-gray-700">Tải và khám phá các tính năng hữu ích của ứng dụng ngay hôm nay!</p>
      </header>

      {/* Phần 1: Tải Ứng Dụng */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 1: Tải Ứng Dụng</h2>
        <div className="mt-4">
          <p className="text-lg text-gray-800">Ứng dụng của chúng tôi có sẵn trên cả App Store và Google Play:</p>
          <div className="mt-4 flex justify-center space-x-6">
            <div className="text-center">
              <img src="google-play.png" alt="Google Play" className="w-32 mb-4" />
              <p>Tải từ Google Play</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <img src="qr-code.png" alt="QR Code" className="w-40 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Quét mã QR để tải ứng dụng ngay lập tức!</p>
          </div>
        </div>
      </section>

      {/* Phần 2: Hướng Dẫn Sử Dụng App */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 2: Cách Sử Dụng App</h2>
        <div className="mt-4">
          <h3 className="text-2xl font-semibold text-gray-700">1. Tạo tài khoản</h3>
          <p className="mt-2 text-lg text-gray-800">Mở app và chọn "Đăng ký", điền thông tin cá nhân để tạo tài khoản.</p>

          <h3 className="text-2xl font-semibold text-gray-700 mt-6">2. Đăng nhập</h3>
          <p className="mt-2 text-lg text-gray-800">Sau khi đăng ký, sử dụng tên đăng nhập và mật khẩu để đăng nhập vào ứng dụng.</p>

          <h3 className="text-2xl font-semibold text-gray-700 mt-6">3. Chức năng chính</h3>
          <p className="mt-2 text-lg text-gray-800">Các chức năng chính của app bao gồm:</p>
          <ul className="list-disc pl-6 mt-2 text-gray-800">
            <li>Quản lý đơn hàng</li>
            <li>Thanh toán dễ dàng</li>
            <li>Chia sẻ thông tin với bạn bè</li>
          </ul>

          <h3 className="text-2xl font-semibold text-gray-700 mt-6">Ảnh minh họa</h3>
          <div className="mt-4">
            <img src="app-screenshot.png" alt="App Screenshot" className="w-full rounded-lg shadow-md" />
          </div>
        </div>
      </section>

      {/* Phần 3: Video hướng dẫn sử dụng app */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 3: Hướng Dẫn Video</h2>
        <div className="mt-4">
          <h3 className="text-2xl font-semibold text-gray-700">Hướng dẫn sử dụng app</h3>
          <p className="mt-2 text-lg text-gray-800">Dưới đây là video hướng dẫn sử dụng ứng dụng:</p>
          <div className="mt-4">
            <iframe
              className="w-full rounded-lg shadow-md"
              width="560"
              height="415"
              src="https://www.youtube.com/watch?v=S_BzQf0gVsg"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Phần 4: Liên hệ hỗ trợ */}
      <section className="bg-white p-6 shadow-md rounded-lg mb-8">
        <h2 className="text-3xl font-semibold text-blue-600">Bước 4: Liên Hệ Hỗ Trợ</h2>
        <p className="mt-4 text-lg text-gray-800">Nếu bạn gặp bất kỳ vấn đề nào, vui lòng liên hệ với chúng tôi qua:</p>
        <p className="mt-2 text-lg text-gray-800">Email: support@yourapp.com</p>
        <p className="mt-2 text-lg text-gray-800">Hotline: 0818165923</p>
      </section>

      {/* Footer */}
      <footer className="text-center mt-8">
        <p className="text-sm text-gray-600">© 2025 Ứng dụng của chúng tôi. Tất cả quyền lợi được bảo vệ.</p>
      </footer>
    </div>
  );
};

export default Guideline;
