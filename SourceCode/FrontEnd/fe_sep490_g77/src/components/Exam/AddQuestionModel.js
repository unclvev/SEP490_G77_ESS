import React, { useState } from "react";
import {
  Modal,
  Input,
  Radio,
  Row,
  Col,
  Typography,
  Upload,
  Button,
  Space,
  Select,
} from "antd";
import { EditorState, Modifier } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
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

  const latexPresets = [
    { label: "Phân số", value: "\\frac{a}{b}" },
    { label: "Căn bậc hai", value: "\\sqrt{x}" },
    { label: "Tích phân", value: "\\int_a^b f(x)\\,dx" },
    { label: "Đạo hàm", value: "\\frac{d}{dx}f(x)" },
    { label: "Giới hạn", value: "\\lim_{x\\to0}\\frac{\\sin x}{x}" },
    { label: "Tổng sigma", value: "\\sum_{i=1}^n i" },
    {
      label: "Ma trận 2×2",
      value: "\\begin{pmatrix}a & b\\\\ c & d\\end{pmatrix}",
    },
    { label: "Mũ", value: "x^n" },
    { label: "Góc", value: "\\angle ABC" },
    { label: "Hàm lượng giác", value: "\\sin\\theta + \\cos\\theta" },
  ];

  const handleCorrectChange = (value) => {
    const updated = answers.map((ans, i) => ({
      ...ans,
      IsCorrect: i === value,
    }));
    setAnswers(updated);
  };

  const insertMathFormula = (target) => {
    if (!mathExpression.trim()) return;
    if (target === "question") {
      const contentState = editorState.getCurrentContent();
      const selection = editorState.getSelection();
      const newContent = Modifier.insertText(
        contentState,
        selection,
        `[MATH:${mathExpression}]`
      );
      const newState = EditorState.push(
        editorState,
        newContent,
        "insert-characters"
      );
      setEditorState(
        EditorState.forceSelection(newState, newContent.getSelectionAfter())
      );
    } else {
      // chỗ này target = answer, editingAnswerIndex đã ghi nhận khi chọn
      setAnswers((prev) => {
        const arr = [...prev];
        arr[editingAnswerIndex].Content += ` [MATH:${mathExpression}]`;
        return arr;
      });
    }
    // reset
    setMathExpression("");
    setShowMathInput(false);
    setEditingAnswerIndex(null);
  };

  const handleOk = () => {
    const rawText = editorState.getCurrentContent().getPlainText();
    if (!rawText.trim()) return;

    const validAnswers = answers.filter((a) => a.Content.trim() !== "");
    const correctIndex = validAnswers.findIndex((a) => a.IsCorrect);

    const newQuestion = {
      QuestionId: Date.now(),
      Content: rawText,
      Type: "Trắc nghiệm",
      Answers: validAnswers.map((a, i) => ({
        AnswerId: Date.now() + i + 1,
        Content: a.Content,
        IsCorrect: a.IsCorrect,
      })),
      ImageUrl: imageUrl,
      CorrectAnswerId:
        correctIndex >= 0 ? validAnswers[correctIndex].AnswerId : null,
    };

    onAdd(newQuestion);
    onClose();

    // Reset modal
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

    img.onload = () => {
      if (img.width > 800 || img.height > 800) {
        return alert("Ảnh phải nhỏ hơn 800x800 pixels");
      }
      if (!isImage || !isLt2M) {
        return alert("Ảnh phải nhỏ hơn 2MB và đúng định dạng ảnh!");
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => setImageUrl(reader.result);
    };
  };

  // Derive selected value for Radio.Group
  const selectedCorrection = answers.findIndex((a) => a.IsCorrect);

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
      <>
        <Button
          type="dashed"
          onClick={() => setShowMathInput((v) => !v)}
          style={{ marginBottom: 12 }}
        >
          {showMathInput ? "Ẩn khung công thức" : "Thêm công thức toán"}
        </Button>

        {showMathInput && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: 16,
              borderRadius: 6,
              marginBottom: 16,
            }}
          >
            <Text strong>Chọn công thức mẫu:</Text>
            <Space wrap style={{ margin: "8px 0" }}>
              {latexPresets.map((p, i) => (
                <Button
                  key={i}
                  size="small"
                  onClick={() => setMathExpression(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </Space>

            <Input
              value={mathExpression}
              onChange={(e) => setMathExpression(e.target.value)}
              placeholder="Hoặc nhập LaTeX tự do"
              style={{ marginBottom: 12 }}
            />

            <Select
              style={{ width: 200, marginRight: 12 }}
              placeholder="Chèn vào"
              value={
                editingAnswerIndex == null
                  ? "question"
                  : `answer-${editingAnswerIndex}`
              }
              onChange={(val) => {
                if (val === "question") setEditingAnswerIndex(null);
                else setEditingAnswerIndex(+val.split("-")[1]);
              }}
            >
              <Select.Option value="question">Câu hỏi</Select.Option>
              {answers.map((_, idx) => (
                <Select.Option key={idx} value={`answer-${idx}`}>
                  Đáp án {String.fromCharCode(65 + idx)}
                </Select.Option>
              ))}
            </Select>

            {mathExpression && (
              <div style={{ marginBottom: 12 }}>
                <BlockMath>{mathExpression}</BlockMath>
              </div>
            )}

            <Button
              type="primary"
              onClick={() =>
                insertMathFormula(
                  editingAnswerIndex == null ? "question" : "answer"
                )
              }
            >
              Chèn công thức
            </Button>
          </div>
        )}
      </>

      <Editor
        editorState={editorState}
        onEditorStateChange={setEditorState}
        wrapperClassName="demo-wrapper"
        editorClassName="demo-editor"
        editorStyle={{
          minHeight: "200px",
          border: "1px solid #ddd",
          padding: "4px",
        }}
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
        <Space align="center" style={{ marginBottom: 12 }}>
          <img
            src={imageUrl}
            alt="preview"
            style={{ maxWidth: "100%", maxHeight: 200 }}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => setImageUrl("")}
            danger
          >
            Xóa ảnh
          </Button>
        </Space>
      )}

      <div style={{ marginTop: 12 }}>Đáp án:</div>
      <Radio.Group
        style={{ width: "100%" }}
        onChange={(e) => handleCorrectChange(e.target.value)}
        value={selectedCorrection}
      >
        {answers.map((ans, idx) => (
          <Row key={idx} gutter={8} style={{ marginBottom: 8 }}>
            <Col span={2}>
              <Radio value={idx} />
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
