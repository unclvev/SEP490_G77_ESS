import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { setToken } from "../redux-setup/action";


const Header = ({ collapsed }) => {
  const [avatar, setAvatar] = useState("");
  const [email, setEmail] = useState("");
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token.token);
        const emailClaim = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
        setEmail(emailClaim || "No Email");
        // Thiết lập avatar dựa trên email
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
    // Xóa token khỏi redux store
    dispatch(setToken(null));
    // Nếu bạn dùng redux-persist, bạn có thể purge data đã persist (cách này phụ thuộc vào cấu hình và phiên bản thư viện):
    // import { persistStore } from "redux-persist";
    // persistStore(store).purge();  // store phải được import hoặc truy cập ở đâu đó
    // Chuyển hướng về trang đăng nhập
    window.location.href = "/login";
  };

  return (
    <div className="w-full bg-white shadow-md p-4 flex justify-end items-center pr-10">
      <div className="flex items-center">
        <img src="https://via.placeholder.com/40" alt="User" className="rounded-full mr-2" />
        <span>Hoàng Thu Phương K17HL</span>
      </div>
    </div>
  );
};

export default Header;
