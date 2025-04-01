import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {jwtDecode} from "jwt-decode";

const Header = ({ collapsed }) => {
  const [avatar, setAvatar] = useState(""); // Có thể set avatar động sau
  const [email, setEmail] = useState("");
  const token = useSelector((state) => state.token); // Giả sử token lưu trong auth
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token.token);
        const emailClaim = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        setEmail(emailClaim || "No Email");
        // Nếu muốn set avatar dựa theo email hoặc AccId có thể thêm logic tại đây
        setAvatar(`https://api.dicebear.com/6.x/initials/svg?seed=${emailClaim}`);
      } catch (error) {
        console.error("Invalid Token", error);
        setEmail("");
        setAvatar("");
      }
    } else {
      setEmail("");
      setAvatar("");
    }
  }, [token]);

  const handleLogout = () => {
    
  };

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

      {/* Khu vực User hoặc Login/Register */}
      <div className="flex items-center">
        {token ? (
          <>
            <img
              src={avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCI2T98OlomWWZac0cEFYkTJ9iPoECWFph3Q&s"}
              alt="User"
              className="w-10 h-10 rounded-full mr-2"
            />
            <span className="mr-4">{email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => window.location.href = "/login"}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Login
            </button>
            <button
              onClick={() => window.location.href = "/register"}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Register
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
