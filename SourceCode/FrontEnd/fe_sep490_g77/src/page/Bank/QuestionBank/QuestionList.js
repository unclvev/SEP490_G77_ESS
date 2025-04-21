import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button, List, Card, Select, Input, Radio, message, Popconfirm, Upload } from "antd";
import { DeleteOutlined, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { EditorState, ContentState, convertToRaw, Modifier, SelectionState } from 'draft-js';
import parse from 'html-react-parser';
import axios from "axios";
import { toast } from "react-toastify";
import { Editor } from 'react-draft-wysiwyg';
import { stateToHTML } from 'draft-js-export-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { stateFromHTML } from 'draft-js-import-html';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { Modal } from 'antd'; 
import { useRef } from "react";
const { TextArea } = Input;
const { Option } = Select;
const QuestionList = () => {
  const { sectionId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  const [newQuestion, setNewQuestion] = useState({
    quescontent: "",
    typeId: null,
    modeid: null,
    secid: sectionId,
    solution: "",
    answers: [],
    correctAnswers: [""],
    imageUrl: "",
  });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
// Thêm vào các state hiện có
const [showMathInput, setShowMathInput] = useState(false);
const [mathExpression, setMathExpression] = useState('');
const [formulaListModalVisible, setFormulaListModalVisible] = useState(false);
const [formulaList, setFormulaList] = useState([]); // Danh sách công thức [MATH:...]
const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(null);
const [editingFormula, setEditingFormula] = useState('');
const [editingAnswerIndex, setEditingAnswerIndex] = useState(null);
const isMountedRef = useRef(true);
  useEffect(() => {
    fetchQuestions();
    fetchQuestionTypes();
    fetchLevels();
  }, [sectionId]);

  useEffect(() => {
    // Khi typeId thay đổi, cập nhật form theo loại câu hỏi
    if (newQuestion.typeId === 1) {
      // Trắc nghiệm: 4 đáp án
      setNewQuestion(prev => ({
        ...prev,
        answers: [...(prev.answers.length ? prev.answers : []), "", "", "", ""].slice(0, 4),
        correctAnswers: prev.correctAnswers.length ? [prev.correctAnswers[0]] : [""]
      }));
    } else if (newQuestion.typeId === 2) {
      // True/False: mặc định là True,False
      setNewQuestion(prev => ({
        ...prev,
        answers: ["True", "False"],
        correctAnswers: prev.correctAnswers.length === 4 ? prev.correctAnswers : ["True", "True", "True", "True"]
      }));
    } else if (newQuestion.typeId === 3) {
      // Điền kết quả: không cần answers, chỉ cần correctAnswers
      setNewQuestion(prev => ({
        ...prev,
        answers: [],
        correctAnswers: prev.correctAnswers.length ? [prev.correctAnswers[0]] : [""]
      }));
    }
  }, [newQuestion.typeId]);
  
  useEffect(() => {
    if (currentQuestion && currentQuestion.quescontent) {
      const rawHTML = currentQuestion.quescontent;
  
      const cleanHTML = rawHTML
        .replace(/<span[^>]*class="katex-math"[^>]*data-formula="(.*?)"[^>]*>.*?<\/span>/g, (_, formula) => `[MATH:${formula}]`)
        .replace(/style="[^"]*"/g, '')
        .replace(/class="[^"]*"/g, '')
        .replace(/&nbsp;/g, ' ');
  
      let contentState = stateFromHTML(cleanHTML);
      let newContent = contentState;
  
      const blocks = contentState.getBlockMap();
      blocks.forEach(block => {
        const text = block.getText();
        const blockKey = block.getKey();
        const regex = /\[MATH:(.+?)\]/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const formula = match[1];
          const start = match.index;
          const end = start + match[0].length;
  
          newContent = newContent.createEntity('KATEX', 'IMMUTABLE', { formula });
          const entityKey = newContent.getLastCreatedEntityKey();
  
          const selection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: start,
            focusOffset: end
          });
  
          newContent = Modifier.replaceText(newContent, selection, `[MATH:${formula}]`, null, entityKey);
        }
      });
  
      setEditorState(EditorState.createWithContent(newContent));
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [currentQuestion]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  
  

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`http://localhost:7052/api/Question/questions?sectionId=${sectionId}`);
      setQuestions(response.data);
    } catch (error) {
      if (!isMountedRef.current) return;
      toast.error("Lỗi khi tải danh sách câu hỏi!");
    }
  };

  const fetchQuestionTypes = async () => {
    try {
      const response = await axios.get(`http://localhost:7052/api/Question/types`);
      setQuestionTypes(response.data);
    } catch (error) {
      if (!isMountedRef.current) return;
      toast.error("Lỗi khi tải danh sách loại câu hỏi!");
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get(`http://localhost:7052/api/Question/levels`);
      setLevels(response.data);
    } catch (error) {
      if (!isMountedRef.current) return;
      toast.error("Lỗi khi tải danh sách độ khó!");
    }
  };

  const handleEdit = (question = null) => {
    setIsEditing(true);
  
    if (question) {
      setCurrentQuestion(question);
  
      // 🔁 Làm sạch công thức LaTeX
      const rawHTML = question.quescontent || "";
  
      const cleanHTML = rawHTML
        .replace(/<span[^>]*class="katex-math"[^>]*data-formula="(.*?)"[^>]*>.*?<\/span>/g, (_, formula) => `[MATH:${formula}]`)
        .replace(/style="[^"]*"/g, '')
        .replace(/class="[^"]*"/g, '')
        .replace(/&nbsp;/g, ' ');
  
      let contentState = stateFromHTML(cleanHTML);
      let newContent = contentState;
  
      const blocks = contentState.getBlockMap();
      blocks.forEach(block => {
        const text = block.getText();
        const blockKey = block.getKey();
        const regex = /\[MATH:(.+?)\]/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          const formula = match[1];
          const start = match.index;
          const end = start + match[0].length;
  
          newContent = newContent.createEntity('KATEX', 'IMMUTABLE', { formula });
          const entityKey = newContent.getLastCreatedEntityKey();
  
          const selection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: start,
            focusOffset: end
          });
  
          newContent = Modifier.replaceText(newContent, selection, `[MATH:${formula}]`, null, entityKey);
        }
      });
  
      setEditorState(EditorState.createWithContent(newContent));
  
      // ✅ Tùy loại câu hỏi
      if (question.typeId === 1) {
        setNewQuestion({
          quescontent: question.quescontent || "",
          typeId: question.typeId || null,
          modeid: question.modeid || null,
          secid: sectionId,
          solution: question.solution || "",
          answers: [...(question.answers || []), "", "", "", ""].slice(0, 4),
          correctAnswers: [question.correctAnswers[0] || ""],
          imageUrl: question.imageUrl || "",
        });
      } else if (question.typeId === 2) {
        setNewQuestion({
          quescontent: question.quescontent || "",
          typeId: question.typeId || null,
          modeid: question.modeid || null,
          secid: sectionId,
          solution: question.solution || "",
          answers: ["True", "False"],
          correctAnswers: [...question.correctAnswers], // ✅ fix ở đây
          imageUrl: question.imageUrl || "",
        });
      } else if (question.typeId === 3) {
        setNewQuestion({
          quescontent: question.quescontent || "",
          typeId: question.typeId || null,
          modeid: question.modeid || null,
          secid: sectionId,
          solution: question.solution || "",
          answers: [],
          correctAnswers: [question.correctAnswers[0] || ""],
          imageUrl: question.imageUrl || "",
        });
      }
    } else {
      // reset
      setCurrentQuestion(null);
      setEditorState(EditorState.createEmpty());
      setNewQuestion({
        quescontent: "",
        typeId: null,
        modeid: null,
        secid: sectionId,
        solution: "",
        answers: [],
        correctAnswers: [""],
        imageUrl: "", 
      });
    }
  };
  
  
  
  
  const insertMathFormula = () => {
    if (!mathExpression.trim()) return;
  
    if (editingAnswerIndex !== null) {
      // We're editing an answer
      const updatedAnswers = [...newQuestion.answers];
      const formula = `[MATH:${mathExpression}]`;
      updatedAnswers[editingAnswerIndex] = formula;
      
      // If this is the selected correct answer, update correctAnswers too
      if (newQuestion.correctAnswers[0] === newQuestion.answers[editingAnswerIndex]) {
        setNewQuestion({
          ...newQuestion,
          answers: updatedAnswers,
          correctAnswers: [formula]
        });
      } else {
        setNewQuestion({
          ...newQuestion,
          answers: updatedAnswers
        });
      }
      
      setEditingAnswerIndex(null);
    } else {
      // Tạo HTML chứa công thức toán học
      const mathHTML = `<span class="katex-math" data-formula="${mathExpression}">$$${mathExpression}$$</span>`;
      
      // Chuyển HTML sang ContentState
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      
      // Chèn một đối tượng KATEX entity
      const contentWithEntity = contentState.createEntity(
        'KATEX',
        'IMMUTABLE',
        { formula: mathExpression }
      );
      
      const entityKey = contentWithEntity.getLastCreatedEntityKey();
      
      // Chèn text và liên kết nó với entity
      const contentWithFormula = Modifier.insertText(
        contentWithEntity,
        selection,
        `[MATH:${mathExpression}]`, // Placeholder để dễ nhận biết
        null,
        entityKey
      );
      
      // Cập nhật EditorState
      const newEditorState = EditorState.push(
        editorState,
        contentWithFormula,
        'insert-characters'
      );
      
      setEditorState(newEditorState);
      
      // Cập nhật quescontent
      setNewQuestion({
        ...newQuestion,
        quescontent: stateToHTML(contentWithFormula, {
          entityStyleFn: (entity) => {
            if (entity.getType() === 'KATEX') {
              const formula = entity.getData().formula;
              return {
                element: 'span',
                attributes: {
                  class: 'katex-math',
                  'data-formula': formula
                },
                style: {}
              };
            }
          }
        })
      });
    }
  
    setMathExpression('');
    setShowMathInput(false);
  };
  
 
const extractMathFormulas = () => {
  const regex = /\[MATH:(.+?)\]/g;
  const matches = [];
  const raw = newQuestion.quescontent;

  let match;
  while ((match = regex.exec(raw)) !== null) {
    matches.push(match[1]);
  }

  setFormulaList(matches);
  setFormulaListModalVisible(true);
};
const saveEditedFormula = () => {
  const updatedList = [...formulaList];
  updatedList[selectedFormulaIndex] = editingFormula;

  const raw = newQuestion.quescontent;
  const regex = /\[MATH:(.+?)\]/g;

  let currentIndex = -1;
  const updatedContent = raw.replace(regex, (_, formula) => {
    currentIndex++;
    return `[MATH:${updatedList[currentIndex]}]`;
  });

  // Tạo lại ContentState
  const newContentState = stateFromHTML(updatedContent);

  let finalContent = newContentState;
  const blocks = newContentState.getBlockMap();

  blocks.forEach(block => {
    const text = block.getText();
    const blockKey = block.getKey();
    const mathRegex = /\[MATH:(.+?)\]/g;
    let match;

    while ((match = mathRegex.exec(text)) !== null) {
      const formula = match[1];
      const start = match.index;
      const end = start + match[0].length;

      finalContent = finalContent.createEntity('KATEX', 'IMMUTABLE', { formula });
      const entityKey = finalContent.getLastCreatedEntityKey();

      const selection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: start,
        focusOffset: end
      });

      finalContent = Modifier.replaceText(finalContent, selection, `[MATH:${formula}]`, null, entityKey);
    }
  });

  setEditorState(EditorState.createWithContent(finalContent));

  // ✅ Thêm đoạn này để cập nhật lại quescontent
  const html = stateToHTML(finalContent, {
    entityStyleFn: (entity) => {
      if (entity.getType() === 'KATEX') {
        const formula = entity.getData().formula;
        return {
          element: 'span',
          attributes: {
            class: 'katex-math',
            'data-formula': formula
          },
          style: {}
        };
      }
    }
  });

  setNewQuestion((prev) => ({
    ...prev,
    quescontent: html
  }));

  setFormulaList(updatedList);
  setFormulaListModalVisible(false);
  setSelectedFormulaIndex(null);
  setEditingFormula('');
};



  const handleSave = async () => {
    if (!newQuestion.quescontent.trim() || !newQuestion.typeId || !newQuestion.modeid) {
      toast.warning("⚠️ Vui lòng nhập đầy đủ thông tin câu hỏi!");
      return;
    }

    // Kiểm tra thêm cho từng loại câu hỏi
    if (newQuestion.typeId === 1) {
      // Trắc nghiệm
      if (!newQuestion.correctAnswers[0]) {
        toast.warning("⚠️ Vui lòng chọn đáp án đúng!");
        return;
      }
      const nonEmptyAnswers = newQuestion.answers.filter(a => a.trim() !== "");
      if (nonEmptyAnswers.length < 2) {
        toast.warning("⚠️ Câu hỏi trắc nghiệm cần ít nhất 2 đáp án!");
        return;
      }
    } 
    else if (newQuestion.typeId === 2) {
      // ✅ True/False với 4 ý
      if (newQuestion.correctAnswers.length !== 4) {
        toast.warning("⚠️ Câu hỏi True/False phải có đủ 4 ý!");
        return;
      }
    } 
    else if (newQuestion.typeId === 3) {
      // Điền kết quả
      const answer = newQuestion.correctAnswers[0];
      if (!newQuestion.correctAnswers[0] || newQuestion.correctAnswers[0].length !== 4) {
        toast.warning("⚠️ Đáp án điền kết quả phải có đúng 4 ký tự!");
        return;
      }
      if (!/^[\d\-,]{4}$/.test(answer)) {
        toast.warning("⚠️ Chỉ cho phép nhập số, dấu - và dấu , trong 4 ký tự!");
        return;
      }
    }

    try {
      const requestData = {
        quescontent: newQuestion.quescontent,
        typeId: newQuestion.typeId,
        modeid: newQuestion.modeid,
        secid: parseInt(sectionId),
        solution: newQuestion.solution,
        answers: newQuestion.typeId === 1 ? newQuestion.answers : [],
        correctAnswers: newQuestion.typeId === 2
    ? newQuestion.correctAnswers
    : [newQuestion.correctAnswers[0]],
        imageUrl: newQuestion.imageUrl,
      };

      let response;
      if (currentQuestion) {
        response = await axios.put(`http://localhost:7052/api/Question/questions/${currentQuestion.quesid}`, requestData);
      } else {
        response = await axios.post(`http://localhost:7052/api/Question/questions`, requestData);
      }

      toast.success("✅ Lưu câu hỏi thành công!");
      setIsEditing(false);
      setNewQuestion({
        quescontent: "",
        typeId: null,
        modeid: null,
        secid: sectionId,
        solution: "",
        answers: [],
        correctAnswers: [""],
      });

      fetchQuestions();
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi lưu câu hỏi!");
    }
  };

  const handleDelete = async (quesid) => {
    try {
      await axios.delete(`http://localhost:7052/api/Question/questions/${quesid}`);
      toast.success("Xóa câu hỏi thành công!");
      fetchQuestions();
    } catch (error) {
      toast.error("Lỗi khi xóa câu hỏi!");
    }
  };

  const handleExportExcel = () => {
    window.location.href = `http://localhost:7052/api/Question/${sectionId}/export-excel`;
  };

  const handleImportExcel = async ({ file }) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`http://localhost:7052/api/Question/${sectionId}/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        toast.success("✅ Import Excel thành công!");
        await fetchQuestions();
      } else {
        toast.error("❌ Import không thành công, vui lòng thử lại!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "❌ Lỗi khi import Excel!");
    }
  };

  // Render các trường dữ liệu tùy theo loại câu hỏi
  
const renderQuestionFields = () => {
  switch (newQuestion.typeId) {
    case 1: // Trắc nghiệm
      return (
        <div className="mb-4">
         <label className="font-semibold block mb-2">
  Đáp án <span className="text-red-500">*</span>
</label>

          <Radio.Group 
            value={newQuestion.correctAnswers[0]}
            onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswers: [e.target.value] })}
            className="w-full"
          >
            {newQuestion.answers.map((answer, index) => (
              <div key={index} className="flex items-center mb-2">
                <div className="flex-grow mr-2 border rounded relative">
                  <Input
                    className="w-full pr-8"
                    placeholder={`Đáp án ${index + 1}`}
                    value={answer}
                    onChange={(e) => {
                      const updatedAnswers = [...newQuestion.answers];
                      updatedAnswers[index] = e.target.value;
                      
                      // Nếu đáp án đang được chọn bị thay đổi, cập nhật giá trị trong correctAnswers
                      if (newQuestion.correctAnswers[0] === newQuestion.answers[index]) {
                        setNewQuestion({ 
                          ...newQuestion, 
                          answers: updatedAnswers, 
                          correctAnswers: [e.target.value] 
                        });
                      } else {
                        setNewQuestion({ ...newQuestion, answers: updatedAnswers });
                      }
                    }}
                  />
                  <Button 
                    size="small" 
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={() => {
                      // Lưu đáp án hiện tại và hiển thị modal nhập công thức cho đáp án
                      setMathExpression("");
                      setShowMathInput(true);
                      // Thêm biến state để biết đang sửa đáp án nào
                      setEditingAnswerIndex(index);
                    }}
                  >
                    Σ
                  </Button>
                </div>
                <Radio value={answer}>
                  {/* Hiển thị preview LaTeX cho đáp án */}
                  {answer.includes("[MATH:") ? (
                    renderQuestionWithMath(
                      answer.replace(/\[MATH:(.*?)\]/g, 
                        '<span class="katex-math" data-formula="$1">$$1</span>')
                    )
                  ) : (
                    "Đúng"
                  )}
                </Radio>
              </div>
            ))}
          </Radio.Group>
        </div>
      );
      
      case 2: // True/False
  return (
    <div className="mb-4">
     <label className="font-semibold block mb-2">
  Chọn True/False cho từng ý (a–d) <span className="text-red-500">*</span>
</label>

      {["a", "b", "c", "d"].map((label, index) => (
        <div key={index} className="mb-2">
         <span className="mr-2">ý {label}:</span>
          <Radio.Group
            value={newQuestion.correctAnswers[index]}
            onChange={(e) => {
              const updated = [...newQuestion.correctAnswers];
              updated[index] = e.target.value;
              setNewQuestion({ ...newQuestion, correctAnswers: updated });
            }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="True">True</Radio.Button>
            <Radio.Button value="False">False</Radio.Button>
          </Radio.Group>
        </div>
      ))}
    </div>
  );

      
      case 3: // Điền kết quả
        return (
          <div className="mb-4">
           <label className="font-semibold block mb-2">
  Đáp án đúng (4 ký tự) <span className="text-red-500">*</span>
</label>

            <Input
              placeholder="Nhập đáp án (ví dụ: 1234, -123, 0.12, ...)"
              value={newQuestion.correctAnswers[0]}
              onChange={(e) => {
                // Giới hạn độ dài là 4 ký tự
                const value = e.target.value.slice(0, 4);
                setNewQuestion({ ...newQuestion, correctAnswers: [value] });
              }}
              maxLength={4}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Đáp án phải có đúng 4 ký tự (bao gồm cả dấu, số).
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  // Thêm vào phần render câu hỏi hiện có
  const renderQuestionWithMath = (htmlContent) => {
    const reactElement = parse(htmlContent, {
      replace: domNode => {
        if (domNode.attribs && domNode.attribs.class === 'katex-math') {
          const formula = domNode.attribs['data-formula'];
          return <InlineMath math={formula} />;
        }
      }
    });
    
    return <div>{reactElement}</div>;
  };

  // 🟢 Hiển thị thông tin câu hỏi trong danh sách
  const renderQuestionContent = (question) => {
    switch (question.typeId) {
      case 1: // Trắc nghiệm
        return (
          <>
           
            <p><strong>Loại câu hỏi:</strong> Trắc nghiệm</p>
            <p><strong>Đáp án:</strong></p>
            {question.answers && question.answers.length > 0 ? (
              question.answers.map((answer, index) => (
                <p key={index}>
                  {answer.includes("[MATH:") ? (
                    <>
                      {renderQuestionWithMath(
                        answer.replace(/\[MATH:(.*?)\]/g, 
                          '<span class="katex-math" data-formula="$1">$$1</span>')
                      )}
                      {question.correctAnswers.includes(answer) && " ✅"}
                    </>
                  ) : (
                    <>
                      {answer} {question.correctAnswers.includes(answer) && " ✅"}
                    </>
                  )}
                </p>
              ))
            ) : (
              <p className="text-red-500">⚠️ Lỗi: Câu hỏi trắc nghiệm phải có ít nhất một đáp án!</p>
            )}
            {question.solution && (
              <p><strong>Giải thích:</strong> {question.solution}</p>
            )}
          </>
        );

        case 2: // True/False
        return (
          <>
            <p><strong>Loại câu hỏi:</strong> True/False</p>
            {question.correctAnswers && question.correctAnswers.length === 4 ? (
              <div>
                {["A", "B", "C", "D"].map((label, index) => (
                  <p key={index}><strong>Ý {label}:</strong> {question.correctAnswers[index]}</p>
                ))}
              </div>
            ) : (
              <p className="text-red-500">⚠️ Lỗi: Phải có đủ 4 đáp án True/False tương ứng với các ý!</p>
            )}
            {question.solution && (
              <p><strong>Giải thích:</strong> {question.solution}</p>
            )}
          </>
        );
      

    case 3: // Điền kết quả
      return (
        <>
         
          <p><strong>Loại câu hỏi:</strong> Điền kết quả</p>
          {question.correctAnswers && question.correctAnswers[0] && question.correctAnswers[0].length === 4 ? (
            <p><strong>Đáp án đúng:</strong> {question.correctAnswers[0]}</p>
          ) : (
            <p className="text-red-500">⚠️ Lỗi: Đáp án đúng phải có đúng 4 ký tự!</p>
          )}
          {question.solution && (
            <p><strong>Giải thích:</strong> {question.solution}</p>
          )}
        </>
      );

    default:
      return <p className="text-red-500">⚠️ Lỗi: Loại câu hỏi không xác định!</p>;
  }
};
// Image upload component


// Thêm hàm renderMathInput
const renderMathInput = () => {
  if (!showMathInput) return null;

  return (
    <div className="math-input-container border p-4 mb-4 bg-gray-50 rounded">
      <h4 className="font-semibold mb-2">
        {editingAnswerIndex !== null 
          ? `Nhập công thức toán học cho đáp án ${editingAnswerIndex + 1}` 
          : "Nhập công thức toán học"}
      </h4>
      <p className="text-sm text-gray-600 mb-2">
        Sử dụng cú pháp LaTeX. Ví dụ: <code>{"\\frac{a}{b}"}</code>, <code>{"\\sqrt{x}"}</code>, <code>{"x^2"}</code>
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <Button size="small" onClick={() => setMathExpression("\\frac{a}{b}")}>
          Phân số (a/b)
        </Button>
        <Button size="small" onClick={() => setMathExpression("\\sqrt{x}")}>
          Căn bậc 2
        </Button>
        <Button size="small" onClick={() => setMathExpression("x^2")}>
          Lũy thừa (x²)
        </Button>
        <Button size="small" onClick={() => setMathExpression("\\int_{a}^{b} f(x) dx")}>
          Tích phân
        </Button>
      </div>

      <div className="flex">
        <Input
          value={mathExpression}
          onChange={(e) => setMathExpression(e.target.value)}
          placeholder="Nhập công thức LaTeX"
          className="flex-grow mr-2"
        />
        <Button type="primary" onClick={insertMathFormula}>Chèn</Button>
        <Button className="ml-2" onClick={() => {
          setShowMathInput(false);
          setEditingAnswerIndex(null);
        }}>Hủy</Button>
      </div>

      {mathExpression && (
        <div className="mt-3 p-2 border rounded bg-white">
          <p className="text-sm mb-1">Xem trước:</p>
          <BlockMath math={mathExpression} />
        </div>
      )}
    </div>
  );
};


  return (
    <div className="p-6 bg-gray-100 min-h-screen grid grid-cols-2 gap-6">
      {/* DANH SÁCH CÂU HỎI */}
      <div className="bg-white p-6 shadow-md rounded">
        <h1 className="text-2xl font-bold mb-4">Danh Sách Câu Hỏi</h1>
        <Button type="primary" className="mb-4" onClick={() => handleEdit()}>
          Thêm Câu Hỏi
        </Button>

        {/* Nút Export và Import */}
        <div className="flex justify-between mb-4">
          <Button type="default" icon={<DownloadOutlined />} onClick={handleExportExcel}>
          📥 Tải File Mẫu (Import/Export)
          </Button>
          <Upload customRequest={handleImportExcel} showUploadList={false}>
            <Button type="primary" icon={<UploadOutlined />}>Import Excel</Button>
          </Upload>
        </div>
        <List
          itemLayout="vertical"
          dataSource={questions}
          renderItem={(question, index) => (
            <List.Item key={question.quesid}>
              <Card
                title={ <div>
                  {renderQuestionWithMath(question.quescontent)}
                  {question.imageUrl && (
                    <div className="mt-3 border rounded p-2 bg-gray-50">
                      <img 
                       src={question.imageUrl.startsWith("http") 
                        ? question.imageUrl 
                        : `http://localhost:7052${question.imageUrl}`}
                        alt="Question image" 
                        className="max-w-full max-h-64 object-contain" 
                      />
                    </div>
                  )}
                </div>
              }
                
  className="mb-2"
                extra={
                  <>
                    <Button onClick={() => handleEdit(question)}>Sửa</Button>
                    <Popconfirm 
                      title="Bạn có chắc muốn xóa?" 
                      onConfirm={() => handleDelete(question.quesid)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button danger className="ml-2"><DeleteOutlined /></Button>
                    </Popconfirm>
                  </>
                }
              >
                <p><strong>Độ khó:</strong> {levels.find(l => l.levelId === question.modeid)?.levelName || question.modeid}</p>
                {renderQuestionContent(question)}
              </Card>
            </List.Item>
          )}
        />
      </div>

      {/* FORM THÊM/SỬA CÂU HỎI */}
      {isEditing && (
        <div className="bg-white p-6 shadow-md rounded">
          <h2 className="text-2xl font-bold mb-4">{currentQuestion ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi"}</h2>

          <label className="font-semibold">
  Loại câu hỏi <span className="text-red-500">*</span>
</label>

          <Select
            className="w-full mb-4"
            placeholder="Chọn loại câu hỏi"
            value={newQuestion.typeId ?? undefined}
            onChange={(value) => setNewQuestion({ 
              ...newQuestion, 
              typeId: value,
              // Reset other fields when changing question type
              answers: [],
              correctAnswers: [""]
            })}
          >
            {questionTypes.map((type) => (
              <Option key={type.typeId} value={type.typeId}>
                {type.typeName}
              </Option>
            ))}
          </Select>

          <label className="font-semibold">
  Độ khó <span className="text-red-500">*</span>
</label>

          <Select
            className="w-full mb-4"
            placeholder="Chọn độ khó"
            value={newQuestion.modeid || undefined}
            onChange={(value) => setNewQuestion({ ...newQuestion, modeid: value })}
          >
            {levels.map((level) => (
              <Option key={level.levelId} value={level.levelId}>
                {level.levelName}
              </Option>
            ))}
          </Select>

          
          <label className="font-semibold">
  Nội dung câu hỏi <span className="text-red-500">*</span>
</label>

<div className="mb-2">
  <Button 
    type="primary" 
    size="small" 
    onClick={() => setShowMathInput(!showMathInput)}
    className="mr-2"
  >
    {showMathInput ? "Ẩn công thức" : "Thêm công thức toán học"}
  </Button>
  <Button 
  size="small"
  type="dashed"
  onClick={extractMathFormulas}
>
  Chỉnh sửa công thức toán học
</Button>

</div>

{renderMathInput()}

<Editor
  editorState={editorState}
  onEditorStateChange={(state) => {
    setEditorState(state);
    const content = state.getCurrentContent();
    setNewQuestion({
      ...newQuestion,
      quescontent: stateToHTML(content, {
        entityStyleFn: (entity) => {
          if (entity.get('type') === 'KATEX') {
            return {
              element: 'span',
              attributes: {
                class: 'katex-math',
                'data-formula': entity.getData().formula
              }
            };
          }
        }
      })
    });
  }}
  wrapperClassName="mb-4 border border-gray-200"
  editorClassName="p-2 bg-white min-h-[200px]"
  toolbar={{
    options: ['inline', 'list', 'link', 'history'],
    inline: { inDropdown: false },
    list: { inDropdown: true },
    link: { inDropdown: false },
    history: { inDropdown: false },
  }}
/>
<Modal
  title="Chỉnh sửa công thức toán học"
  open={formulaListModalVisible}
  onCancel={() => setFormulaListModalVisible(false)}
  footer={null}
>
  {formulaList.length === 0 ? (
    <p>Không tìm thấy công thức nào.</p>
  ) : selectedFormulaIndex === null ? (
    <>
      <p>Chọn công thức để chỉnh sửa:</p>
      <ul className="list-disc pl-4">
        {formulaList.map((formula, idx) => (
          <li key={idx} className="mb-2">
            <code className="bg-gray-100 p-1 rounded">{formula}</code>
            <Button
              size="small"
              className="ml-2"
              onClick={() => {
                setSelectedFormulaIndex(idx);
                setEditingFormula(formula);
              }}
            >
              Chỉnh sửa
            </Button>
          </li>
        ))}
      </ul>
    </>
  ) : (
    <>
      <p className="mb-2">Cập nhật công thức LaTeX:</p>
      <Input.TextArea
        rows={2}
        value={editingFormula}
        onChange={(e) => setEditingFormula(e.target.value)}
      />
      <div className="flex justify-end mt-3 gap-2">
        <Button onClick={() => {
          setSelectedFormulaIndex(null);
          setEditingFormula('');
        }}>
          Quay lại
        </Button>
        <Button type="primary" onClick={saveEditedFormula}>
          Lưu
        </Button>
      </div>
    </>
  )}
</Modal>


          {/* Fields specific to question type */}
          {renderQuestionFields()}
          <div className="mb-4">
  <label className="font-semibold block mb-2">Hình ảnh (không bắt buộc)</label>
  <Upload
  name="image"
  listType="picture-card"
  showUploadList={false}
  beforeUpload={file => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isImage) {
      message.error('Chỉ chấp nhận file hình ảnh!');
      return Upload.LIST_IGNORE;
    }

    if (!isLt5M) {
      message.error('Ảnh phải nhỏ hơn 5MB!');
      return Upload.LIST_IGNORE;
    }

    return true;
  }}
  customRequest={async ({ file }) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      try {
        const base64Image = reader.result;

        const response = await axios.post('http://localhost:7052/api/Question/upload-image-base64', {
          base64Image
        });

        let imageUrl = response.data.imageUrl;

        if (imageUrl && imageUrl.startsWith("/")) {
          imageUrl = `http://localhost:7052${imageUrl}`;
        }
        setNewQuestion(prev => ({
          ...prev,
          imageUrl
        }));

        toast.success("Tải ảnh lên thành công!");
      } catch (error) {
        toast.error("Lỗi khi tải ảnh base64 lên!");
        console.error(error);
      }
    };
  }}
>
  {newQuestion.imageUrl ? (
    <div className="relative w-full h-full">
      <img src={newQuestion.imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <Button type="primary" icon={<UploadOutlined />} className="mr-2">Thay đổi</Button>
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            setNewQuestion(prev => ({ ...prev, imageUrl: "" }));
          }}
        />
      </div>
    </div>
  ) : (
    <div>
      <UploadOutlined />
      <div className="mt-2">Tải ảnh lên</div>
    </div>
  )}
</Upload>

  {/* Hiển thị ảnh sau khi upload */}
{newQuestion.imageUrl && (
  <div className="mt-2">
    <img
      src={newQuestion.imageUrl}
      alt="Preview"
      className="max-h-64 object-contain border rounded"
    />
    
  </div>
)}
  
  {newQuestion.imageUrl && (
    <div className="mt-2">
      <a href={newQuestion.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
        {newQuestion.imageUrl.split('/').pop()}
      </a>
    </div>
  )}
</div>
          {/* Solution field for all question types */}
          <label className="font-semibold">Giải thích (Solution)</label>
          <TextArea 
            rows={3} 
            className="mb-4" 
            placeholder="Nhập giải thích cho câu hỏi (không bắt buộc)"
            value={newQuestion.solution} 
            onChange={(e) => setNewQuestion({ ...newQuestion, solution: e.target.value })}
          />

          <div className="flex gap-2">
            <Button type="primary" className="flex-grow" onClick={handleSave}>Lưu Câu Hỏi</Button>
            <Button onClick={() => setIsEditing(false)}>Hủy</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionList;