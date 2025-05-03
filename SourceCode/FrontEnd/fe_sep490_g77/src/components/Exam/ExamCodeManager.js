// hooks/useExamCodeManager.js
import { useState } from "react";

export default function useExamCodeManager(initialCodes = []) {
  const [examCodes, setExamCodes] = useState(initialCodes);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleChangeTab = (key) => {
    setActiveIndex(Number(key));
  };

  const handleAddExamCode = () => {
    const newCode = {
      ExamCode: `Mã đề ${examCodes.length + 1}`,
      Questions: []
    };
    setExamCodes((prev) => [...prev, newCode]);
    setActiveIndex(examCodes.length);
  };

  const handleDeleteExamCode = (index) => {
    if (examCodes.length <= 1) return false;
    const updated = [...examCodes];
    updated.splice(index, 1);
    setExamCodes(updated);
    setActiveIndex(0);
    return true;
  };

  const updateCurrentQuestions = (newQuestions) => {
    const updated = [...examCodes];
    updated[activeIndex] = {
      ...updated[activeIndex],
      Questions: newQuestions
    };
    setExamCodes(updated);
  };

  const getCurrentQuestions = () =>
    examCodes[activeIndex]?.Questions || [];

  return {
    examCodes,
    activeIndex,
    currentExamCode: examCodes[activeIndex] || {},
    handleChangeTab,
    handleAddExamCode,
    handleDeleteExamCode,
    updateCurrentQuestions,
    getCurrentQuestions,
    setExamCodes,
    setActiveIndex,
  };
}
