import React from "react";

const Footer = ({ collapsed }) => {
  return (
    <footer
      className={`bg-gray-200 text-center p-3 fixed bottom-0 left-0 transition-all duration-300 ${
        collapsed ? "w-[calc(100%-4rem)] ml-16" : "w-[calc(100%-16rem)] ml-64"
      }`}
    >
      <p>© 2025 ESS - Hệ thống hỗ trợ thi cử</p>
    </footer>
  );
};

export default Footer;
