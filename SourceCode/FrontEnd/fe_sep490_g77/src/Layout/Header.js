import React from "react";

const Header = () => {
  return (
    <div className="w-full bg-white shadow-md p-4 flex justify-between items-center px-10">
      {/* Logo và tên hệ thống bên trái */}
      <div className="flex items-center">
        <img 
          src="/logo.png" 
          alt="ESS Logo" 
          className="w-10 h-10 rounded-full mr-2"
        />
        <span className="font-semibold text-lg text-gray-700">
          ESS - Hệ thống hỗ trợ thi cử
        </span>
      </div>

      {/* Avatar người dùng bên phải */}
      <div className="flex items-center">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCI2T98OlomWWZac0cEFYkTJ9iPoECWFph3Q&s" 
          alt="User" 
          className="w-10 h-10 rounded-full mr-2"
        />
        <span>Hoàng Thu Phương K17HL</span>
      </div>
    </div>
  );
};

export default Header;
