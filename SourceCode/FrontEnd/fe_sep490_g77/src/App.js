import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './page/Home';
// Import QuestionBank từ folder QuestionBank
import QuestionBank from './page/QuestionBank/Questionbank';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Trang chủ (Home) */}
        <Route path="/" element={<Home />} />
        
        {/* Trang Ngân hàng câu hỏi */}
        <Route path="/question-bank" element={<QuestionBank />} />
      </Routes>
    </Router>
  );
}

export default App;