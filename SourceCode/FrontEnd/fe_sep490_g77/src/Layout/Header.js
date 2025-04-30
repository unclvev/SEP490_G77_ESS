import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {jwtDecode} from "jwt-decode";

import { setToken } from "../redux-setup/action";




const Header = ({ collapsed }) => {
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarRef = useRef(null);


  useEffect(() => {
    if (token) {
      try {
        const raw = typeof token === "string" ? token : token.token;
        const decoded = jwtDecode(raw);            // ← dùng named fn
        const emailClaim =
          decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"]
          || decoded.email;
        setEmail(emailClaim || "No Email");
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

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (avatarRef.current && !avatarRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);


  const handleLogout = () => {
    // Xóa token khỏi redux store
    dispatch(setToken(null));
    // Nếu bạn dùng redux-persist, bạn có thể purge data đã persist (cách này phụ thuộc vào cấu hình và phiên bản thư viện):
    // import { persistStore } from "redux-persist";
    // persistStore(store).purge();  // store phải được import hoặc truy cập ở đâu đó
    // Chuyển hướng về trang đăng nhập
    window.location.href = "/login";
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
          <div className="relative flex items-center gap-2" ref={avatarRef}>
          <span className="text-sm text-gray-700">{email}</span>
          <img
            src={avatar}
            alt="User"
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => setDropdownOpen((open) => !open)}
          />
          {dropdownOpen && (
            <div className="absolute right-0 mt-12 w-40 bg-white border rounded shadow-lg z-20">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setDropdownOpen(false);
                  window.location.href = "/profile";
                }}
              >
                Profile
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
        
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
