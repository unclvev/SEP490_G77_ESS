import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./page/Home/Home";
import MainLayout from "./Layout/MainLayout";
import QuestionBank from "./page/Bank/QuestionBank/QuestionBank";
import QuestionBankDetail from "./page/Bank/QuestionBank/QuestionBankDetail";
import CreateQuestionBank from "./page/Bank/QuestionBank/CreateQuestionBank";
import Decentralization from "./page/Bank/QuestionBank/Decentralization";
import QuestionList from "./page/Bank/QuestionBank/QuestionList";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home dùng Sidebar riêng */}
        <Route path="/" element={<Home />} />

        {/* Các trang khác bọc trong MainLayout */}
        <Route path="/question-bank" element={<MainLayout><QuestionBank /></MainLayout>} />
        <Route path="/question-bank-detail/:id" element={<MainLayout><QuestionBankDetail /></MainLayout>} />
        <Route path="/create-question-bank" element={<MainLayout><CreateQuestionBank /></MainLayout>} />
        <Route path="/decentralization" element={<MainLayout><Decentralization /></MainLayout>} />
        <Route path="/question-list" element={<MainLayout><QuestionList /></MainLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
