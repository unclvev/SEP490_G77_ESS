import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./page/Home/Home";
import MainLayout from "./Layout/MainLayout";
import QuestionBank from "./page/Bank/QuestionBank/Questionbank";
import QuestionBankDetail from "./page/Bank/QuestionBank/QuestionBankDetail";
import CreateQuestionBank from "./page/Bank/QuestionBank/CreateQuestionBank";
import Decentralization from "./page/Bank/QuestionBank/Decentralization";
import QuestionList from "./page/Bank/QuestionBank/QuestionList";
import ExamManagement from "./page/Exam/ExamManager";
import ExamDetail from "./page/Exam/ExamContent";
import ExamCreation from "./page/Exam/ExamMatrix";
import ExamPreview from "./page/Exam/ExamPreview";
import LoginPage from "./page/Common/LoginPage";
import RegistrationPage from "./page/Common/RegisterPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Home dùng Sidebar riêng */}
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<LoginPage></LoginPage>}/>
        <Route path="/signup" element={<RegistrationPage></RegistrationPage>}/>

        {/* Các trang khác bọc trong MainLayout */}
        <Route path="/question-bank" element={<MainLayout><QuestionBank /></MainLayout>} />
        <Route path="/question-bank-detail/:bankId" element={<MainLayout><QuestionBankDetail /></MainLayout>} />

        <Route path="/create-question-bank" element={<MainLayout><CreateQuestionBank /></MainLayout>} />
        <Route path="/decentralization" element={<MainLayout><Decentralization /></MainLayout>} />
        <Route path="/question-list/:sectionId" element={<MainLayout><QuestionList /></MainLayout>} />

        <Route path="/exam" element={<MainLayout><ExamManagement></ExamManagement></MainLayout>}/>
        <Route path="/exam/content" element={<MainLayout><ExamDetail></ExamDetail></MainLayout>}/>
        <Route path="/exam/matrix" element={<MainLayout><ExamCreation></ExamCreation></MainLayout>}/>
        <Route path="/exam/preview" element={<MainLayout><ExamPreview></ExamPreview></MainLayout>}/>

      </Routes>
    </Router>
  );
}

export default App;
