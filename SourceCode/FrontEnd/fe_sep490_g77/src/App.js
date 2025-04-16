import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import store from "./redux-setup/store";
import { Provider } from 'react-redux';
import { ToastContainer } from "react-toastify";

import Home from "./page/Home/Home";
import MainLayout from "./Layout/MainLayout";
import QuestionBank from "./page/Bank/QuestionBank/QuestionBank";
import Profile from "./page/Common/ProfilePage";
import QuestionBankDetail from "./page/Bank/QuestionBank/QuestionBankDetail";
import CreateQuestionBank from "./page/Bank/QuestionBank/CreateQuestionBank";
import ForgotPassword from "./page/Common/ForgotPasswordPage";
import ResetPassword from "./page/Common/ResetPasswordPage";
import Decentralization from "./page/Bank/QuestionBank/Decentralization";
import QuestionList from "./page/Bank/QuestionBank/QuestionList";
import ExamManagement from "./page/Exam/ExamManager";
import ExamDetail from "./page/Exam/ExamContent";
import ExamCreation from "./page/Exam/ExamMatrix";
import ExamPreview from "./page/Exam/ExamPreview";
import LoginPage from "./page/Common/LoginPage";
import RegistrationPage from "./page/Common/RegisterPage";
import MainLayout2 from "./newLayout/MainLayout";
import ManagerPage from "./page/Manager/ManagerPage";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Public routes - no auth required */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Auth routes - only accessible when NOT logged in */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />

          {/* Routes không sử dụng PrivateRoute */}
          <Route path="/" element={<Home />} />
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/MainLayout2" element={<MainLayout2 />} />

          {/* Routes có MainLayout */}
          <Route path="/question-bank" element={<MainLayout><QuestionBank /></MainLayout>} />
          <Route path="/question-bank-detail/:bankId" element={<MainLayout><QuestionBankDetail /></MainLayout>} />
          <Route path="/create-question-bank" element={<MainLayout><CreateQuestionBank /></MainLayout>} />
          <Route path="/decentralization" element={<MainLayout><Decentralization /></MainLayout>} />
          <Route path="/question-list/:sectionId" element={<MainLayout><QuestionList /></MainLayout>} />
          <Route path="/exam" element={<MainLayout><ExamManagement /></MainLayout>} />
          <Route path="/exam/content" element={<MainLayout><ExamDetail /></MainLayout>} />
          <Route path="/exam/matrix" element={<MainLayout><ExamCreation /></MainLayout>} />
          <Route path="/exam/preview" element={<MainLayout><ExamPreview /></MainLayout>} />
        </Routes>
      </Router>
      
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
      />
    </Provider>
  );
}

export default App;
