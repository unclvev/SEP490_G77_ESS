import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './page/Home';
import QuestionBank from './page/QuestionBank/Questionbank';
import QuestionBankDetail from './page/QuestionBank/QuestionBankDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/question-bank" element={<QuestionBank />} />
        {/* Định nghĩa route cho chi tiết ngân hàng: /question-bank-detail/:id */}
        <Route path="/question-bank-detail/:id" element={<QuestionBankDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
