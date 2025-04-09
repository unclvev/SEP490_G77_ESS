import React from "react";
import { Provider } from 'react-redux';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import store from "./redux-setup/store";

import MainLayout from "./Layout/MainLayout";
import CreateQuestionBank from "./page/Bank/QuestionBank/CreateQuestionBank";
import Decentralization from "./page/Bank/QuestionBank/Decentralization";
import QuestionBank from "./page/Bank/QuestionBank/Questionbank";
import QuestionBankDetail from "./page/Bank/QuestionBank/QuestionBankDetail";
import QuestionList from "./page/Bank/QuestionBank/QuestionList";
import ForgotPassword from "./page/Common/ForgotPasswordPage";
import LoginPage from "./page/Common/LoginPage";
import Profile from "./page/Common/ProfilePage";
import RegistrationPage from "./page/Common/RegisterPage";
import ResetPassword from "./page/Common/ResetPasswordPage";
import Analysis from "./page/Exam/Analysis";
import ExamDetail from "./page/Exam/ExamContent";
import ExamManagement from "./page/Exam/ExamManager";
import ExamCreation from "./page/Exam/ExamMatrix";
import ExamPreview from "./page/Exam/ExamPreview";
import MainLayout2 from "./newLayout/MainLayout";
import GenQRCode from "./page/Essay/CreateQRCode.js";
import PreviewGenQR from "./page/Essay/PreviewGenQr";
import CreateEssayExam from "./page/Essay/CreateEssayExam";
import ImportEssayPage from "./page/Essay/ImportEssayPage";
import Home from "./page/Home/Home";
import EssQuestionBankDetail from "./page/Bank/QuestionBank/EssQuestionBankDetail.js";
import EssQuestionList from "./page/Bank/QuestionBank/EssQuestionList.js";
import TempComponent from "./page/TempComponent/temp.js";
import ExamSelect from "./page/Exam/ExamSelect.js";
import ExamCreation3T from "./page/Exam/ExamMCQ3tMatrix.js";

function App() {
  return (
    <Provider store={store}> {/* Thêm Provider */}
      <Router>
        <Routes>
          
          
          {/* Home dùng Sidebar riêng */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/profile" element={<Profile /> } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/MainLayout2" element={<MainLayout2 />} />
          {/* Các trang khác bọc trong MainLayout */}
          <Route path="/question-bank" element={<MainLayout><QuestionBank /></MainLayout>} />
          <Route path="/question-bank-detail/:bankId" element={<MainLayout><QuestionBankDetail /></MainLayout>} />
          <Route path="/create-question-bank" element={<MainLayout><CreateQuestionBank /></MainLayout>} />
          <Route path="/decentralization" element={<MainLayout><Decentralization /></MainLayout>} />
          <Route path="/question-list/:sectionId" element={<MainLayout><QuestionList /></MainLayout>} />
          <Route path="/default-bank-detail/:bankId" element={<MainLayout><EssQuestionBankDetail /></MainLayout>} />
          <Route path="/default-bank/:sectionId/questions" element={<EssQuestionList />} />

          <Route path="/exam" element={<MainLayout><ExamManagement /></MainLayout>} />
          <Route path="/exam/content" element={<MainLayout><ExamDetail /></MainLayout>} />
          <Route path="/exam/matrix" element={<MainLayout><ExamCreation /></MainLayout>} />
          <Route path="/exam/preview/:examid" element={<MainLayout><ExamPreview /></MainLayout>} />
          <Route path="/exam/analysis/:examId" element={<MainLayout><Analysis /></MainLayout>} />
          <Route path="/essay/genqr" element={<MainLayout><GenQRCode></GenQRCode></MainLayout>}/>
          <Route path="/essay/preview-gen-qr" element={<MainLayout><PreviewGenQR></PreviewGenQR></MainLayout>}/>
          <Route path="/essay/import" element={<MainLayout><ImportEssayPage></ImportEssayPage></MainLayout>}/>
          <Route path="/essay" element={<MainLayout><CreateEssayExam></CreateEssayExam></MainLayout>}/>
          <Route path="/exam/matrix3t" element={<MainLayout><ExamCreation3T/></MainLayout>}></Route>
          <Route path="/exam/select" element={<MainLayout><ExamSelect/></MainLayout>}></Route>

          <Route path="/temp" element={<TempComponent/>}></Route>
          
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
