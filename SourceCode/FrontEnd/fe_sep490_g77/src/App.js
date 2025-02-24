import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './page/Home/Home';
import QuestionBank from './page/Bank/QuestionBank/Questionbank';
import QuestionBankDetail from './page/Bank/QuestionBank/QuestionBankDetail';
import LoginPage from './page/Common/LoginPage';
import RegisterPage from './page/Common/RegisterPage';
import ProfilePage from './page/Common/ProfilePage';
import ForgotPasswordPage from './page/Common/ForgotPasswordPage';
import ResetPasswordPage from './page/Common/ResetPasswordPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Common */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* Home */}
        <Route path="/" element={<Home />} />
        <Route path="/question-bank" element={<QuestionBank />} />
       
        {/* Định nghĩa route cho chi tiết ngân hàng: /question-bank-detail/:id */}
        <Route path="/question-bank-detail/:id" element={<QuestionBankDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
