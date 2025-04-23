import React, { useState } from "react";
import { Modal, Input, Radio, Row, Col, Typography, Upload, Button, Space } from "antd";
import { EditorState, Modifier } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import { stateToHTML } from "draft-js-export-html";
import { PlusOutlined, UploadOutlined, SigmaOutlined } from "@ant-design/icons";
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

  const mathTemplates = [
    { label: "Phân số", latex: "\\frac{a}{b}" },
    { label: "Căn bậc hai", latex: "\\sqrt{x}" },
    { label: "Tích phân", latex: "\\int_{a}^{b} f(x) dx" },
    { label: "Lũy thừa", latex: "x^2" },
  ];

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
      const contentWithEntity = contentState.createEntity("KATEX", "IMMUTABLE", { formula: mathExpression });
      const entityKey = contentWithEntity.getLastCreatedEntityKey();

      const contentWithFormula = Modifier.insertText(
        contentWithEntity,
        selection,
        `[MATH:${mathExpression}]`,
        null,
        entityKey
      );

      const newEditorState = EditorState.push(
        editorState,
        contentWithFormula,
        "insert-characters"
      );

      setEditorState(newEditorState);
    } else if (editingAnswerIndex !== null) {
      const updated = [...answers];
      updated[editingAnswerIndex].Content += `[MATH:${mathExpression}]`;
      setAnswers(updated);
    }
    setMathExpression("");
    setShowMathInput(false);
    setEditingAnswerIndex(null);
  };

  const handleOk = () => {
    console.log("121");
    if (onAdd) {
      const content = stateToHTML(editorState.getCurrentContent(), {
        entityStyleFn: (entity) => {
          if (entity.getType() === "KATEX") {
            const formula = entity.getData().formula;
            return {
              element: "span",
              attributes: {
                class: "katex-math",
                "data-formula": formula,
              },
            };
          }
        },
      });
      console.log(content);
      onAdd({
        Content: content,
        Type: "Multiple Choice",
        Answers: answers.filter((a) => a.Content.trim() !== ""),
        ImageUrl: imageUrl,
      });
    }
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
      <div>
        {/* Công thức Toán cho Câu hỏi */}
        <Space style={{ marginBottom: 12 }}>
          <Button onClick={() => setShowMathInput(!showMathInput)}>
            {showMathInput ? "Ẩn nhập công thức" : "Thêm công thức toán học"}
          </Button>
        </Space>
        {showMathInput && (
          <div style={{ marginBottom: 16 }}>
            <Space wrap>
              {mathTemplates.map((tpl) => (
                <Button size="small" key={tpl.label} onClick={() => setMathExpression(tpl.latex)}>
                  {tpl.label}
                </Button>
              ))}
            </Space>
            <Input
              style={{ marginTop: 8 }}
              value={mathExpression}
              onChange={(e) => setMathExpression(e.target.value)}
              placeholder="Nhập hoặc chọn công thức LaTeX"
            />
            <Button type="primary" onClick={() => insertMathFormula(editingAnswerIndex !== null ? "answer" : "question")} style={{ marginTop: 8 }}>Chèn công thức</Button>
            {mathExpression && (
              <div style={{ marginTop: 8 }}><BlockMath>{mathExpression}</BlockMath></div>
            )}
          </div>
        )}

        <Editor
          editorState={editorState}
          onEditorStateChange={setEditorState}
          wrapperClassName="demo-wrapper"
          editorClassName="demo-editor"
          editorStyle={{ minHeight: "200px", border: "1px solid #ddd", padding: "4px" }}
        />

        {/* Upload ảnh */}
        <div style={{ marginTop: 12 }}>Ảnh minh họa (tối đa 800x800px, dưới 2MB):</div>
        <Upload
          showUploadList={false}
          customRequest={handleImageUpload}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />} style={{ marginBottom: 8 }}>Tải ảnh lên</Button>
        </Upload>
        {imageUrl && (
          <img src={imageUrl} alt="preview" style={{ maxWidth: "100%", marginBottom: 12 }} />
        )}

        {/* Đáp án */}
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
              <Col span={20}>
                <Input
                  placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                  value={ans.Content}
                  onChange={(e) => handleAnswerChange(e.target.value, idx)}
                />
              </Col>
              <Col span={2}>
                <Button size="small" icon={<PlusOutlined />} onClick={() => {
                  setEditingAnswerIndex(idx);
                  setShowMathInput(true);
                }} />
              </Col>
            </Row>
          ))}
        </Radio.Group>
      </div>
    </Modal>
  );
};

export default AddQuestionModal;
