import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Layout chính */}
      <div
        className={`flex flex-col transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        } flex-1`}
      >
        <Header collapsed={collapsed} />
        <main className="p-6 pt-3 flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
