import React, { useState } from "react";
import { Modal, Input, Radio, Row, Col, Typography, Upload, Button, Space, Select } from "antd";
import { EditorState, Modifier } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { UploadOutlined } from "@ant-design/icons";
import { BlockMath } from "react-katex";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import "katex/dist/katex.min.css";

const { Text } = Typography;

const AddQuestionModal = ({ visible, onClose, onAdd }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [answers, setAnswers] = useState([
    { Content: "", IsCorrect: false },
    { Content: "", IsCorrect: false },
    { Content: "", IsCorrect: false },
    { Content: "", IsCorrect: false },
  ]);
  const [showMathInput, setShowMathInput] = useState(false);
  const [mathExpression, setMathExpression] = useState("");
  const [editingAnswerIndex, setEditingAnswerIndex] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  const handleAnswerChange = (value, index) => {
    const updated = answers.map((ans, i) =>
      i === index ? { ...ans, Content: value } : ans
    );
    setAnswers(updated);
  };

  const handleCorrectChange = (index) => {
    const updated = answers.map((ans, i) => ({
      ...ans,
      IsCorrect: i === index,
    }));
    setAnswers(updated);
  };

  const insertMathFormula = (target = "question") => {
    if (!mathExpression.trim()) return;
    if (target === "question") {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const newContent = Modifier.insertText(
        contentState,
        selection,
        `[MATH:${mathExpression}]`
      );
      const newState = EditorState.push(editorState, newContent, "insert-characters");
      setEditorState(EditorState.forceSelection(newState, newContent.getSelectionAfter()));
    } else if (editingAnswerIndex !== null) {
      const updated = [...answers];
      updated[editingAnswerIndex].Content += ` [MATH:${mathExpression}]`;
      setAnswers(updated);
    }
    setMathExpression("");
    setShowMathInput(false);
    setEditingAnswerIndex(null);
  };

  const handleOk = () => {
    const rawText = editorState.getCurrentContent().getPlainText();
    if (!rawText.trim()) return;

    const content = rawText;
    const validAnswers = answers.filter((a) => a.Content.trim() !== "");
    const correct = validAnswers.find((a) => a.IsCorrect);

    const newQuestion = {
      QuestionId: Date.now(),
      Content: content,
      Type: "Trắc nghiệm",
      Answers: validAnswers.map((a, i) => ({
        AnswerId: Date.now() + i + 1,
        Content: a.Content,
        IsCorrect: a.IsCorrect,
      })),
      ImageUrl: imageUrl,
      CorrectAnswerId: correct ? Date.now() + validAnswers.findIndex((a) => a.IsCorrect) + 1 : null,
    };

    onAdd(newQuestion);
    onClose();

    setEditorState(EditorState.createEmpty());
    setAnswers([
      { Content: "", IsCorrect: false },
      { Content: "", IsCorrect: false },
      { Content: "", IsCorrect: false },
      { Content: "", IsCorrect: false },
    ]);
    setImageUrl("");
  };

  const handleImageUpload = async ({ file }) => {
    const isImage = file.type.startsWith("image/");
    const isLt2M = file.size / 1024 / 1024 < 2;
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = async () => {
      if (img.width > 800 || img.height > 800) {
        return alert("Ảnh phải nhỏ hơn 800x800 pixels");
      }
      if (!isImage || !isLt2M) {
        alert("Ảnh phải nhỏ hơn 2MB và đúng định dạng ảnh!");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImageUrl(reader.result);
      };
    };
  };

  return (
    <Modal
      title="Thêm câu hỏi mới"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      width="90vw"
      okText="Thêm"
      cancelText="Hủy"
    >
      <Button onClick={() => setShowMathInput(!showMathInput)} style={{ marginBottom: 12 }}>
        {showMathInput ? "Ẩn khung thêm công thức" : "Thêm công thức toán học"}
      </Button>

      {showMathInput && (
        <div style={{ marginBottom: 16, border: '1px solid #ccc', padding: 12, borderRadius: 6 }}>
          <Text strong>Chọn công thức mẫu:</Text>
          <Space wrap style={{ marginTop: 8, marginBottom: 8 }}>
            {["\\frac{a}{b}", "\\sqrt{x}", "\\int_{a}^{b} f(x) dx", "\\frac{d}{dx}", "x^n", "\\lim_{x \\to 0}", "\\sum_{i=1}^n i", "\\begin{bmatrix} a & b \\ c & d \\end{bmatrix}", "\\pi", "\\angle ABC"].map((latex, idx) => (
              <Button key={idx} size="small" onClick={() => setMathExpression(latex)}>
                {latex}
              </Button>
            ))}
          </Space>

          <Input
            value={mathExpression}
            onChange={(e) => setMathExpression(e.target.value)}
            placeholder="Hoặc nhập công thức LaTeX tùy chỉnh"
            style={{ marginBottom: 8 }}
          />

          <Select
            style={{ width: 200, marginBottom: 8 }}
            placeholder="Chọn vị trí chèn"
            value={editingAnswerIndex === null ? "question" : `answer-${editingAnswerIndex}`}
            onChange={(val) => {
              if (val === "question") setEditingAnswerIndex(null);
              else setEditingAnswerIndex(parseInt(val.replace("answer-", ""), 10));
            }}
          >
            <Select.Option value="question">Chèn vào câu hỏi</Select.Option>
            {answers.map((_, idx) => (
              <Select.Option key={idx} value={`answer-${idx}`}>
                Đáp án {String.fromCharCode(65 + idx)}
              </Select.Option>
            ))}
          </Select>

          {mathExpression && (
            <div style={{ marginBottom: 8 }}>
              <BlockMath>{mathExpression}</BlockMath>
            </div>
          )}

          <Button type="primary" onClick={() => insertMathFormula(editingAnswerIndex !== null ? "answer" : "question")}>
            Chèn công thức
          </Button>
        </div>
      )}

      <Editor
        editorState={editorState}
        onEditorStateChange={setEditorState}
        wrapperClassName="demo-wrapper"
        editorClassName="demo-editor"
        editorStyle={{ minHeight: "200px", border: "1px solid #ddd", padding: "4px" }}
      />

      <div style={{ marginTop: 12 }}>Ảnh minh họa:</div>
      <Upload
        showUploadList={false}
        customRequest={handleImageUpload}
        accept="image/*"
      >
        <Button icon={<UploadOutlined />} style={{ marginBottom: 8 }}>
          Tải ảnh lên
        </Button>
      </Upload>
      {imageUrl && (
        <img src={imageUrl} alt="preview" style={{ maxWidth: "100%", marginBottom: 12 }} />
      )}

      <div style={{ marginTop: 12 }}>Đáp án:</div>
      <Radio.Group style={{ width: "100%" }}>
        {answers.map((ans, idx) => (
          <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={2}>
              <Radio
                checked={ans.IsCorrect}
                onChange={() => handleCorrectChange(idx)}
              />
            </Col>
            <Col span={22}>
              <Input
                placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                value={ans.Content}
                onChange={(e) => handleAnswerChange(e.target.value, idx)}
              />
            </Col>
          </Row>
        ))}
      </Radio.Group>
    </Modal>
  );
};

export default AddQuestionModal;