import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

const MainLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen ml-64">
        <Header />
        <main className="p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
