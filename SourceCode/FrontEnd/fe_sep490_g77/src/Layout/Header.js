import React from "react";

const Header = ({ collapsed }) => {
  return (
    <div
      className={`bg-white shadow-md p-4 flex justify-between items-center left-0 right-0 z-10 transition-all duration-300 ${
        collapsed ? "ml-16 w-[calc(100%-4rem)]" : "ml-64 w-[calc(100%-16rem)]"
      }`}
    >
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
