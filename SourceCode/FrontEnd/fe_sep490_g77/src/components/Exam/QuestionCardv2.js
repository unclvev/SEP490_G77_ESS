import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Modal,
  Input,
  Radio,
  Row,
  Col,
  Upload,
  Select,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { InlineMath } from "react-katex";
import "katex/dist/katex.min.css";
import { EditorState, ContentState, Modifier } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { isDeleteExam, isModifyExam } from "../../services/api";

const { Text } = Typography;
const { Option } = Select;

const latexPresets = [
  { label: "Phân số: a/b", value: "\\frac{a}{b}" },
  { label: "Đạo hàm: d/dx", value: "\\frac{d}{dx}" },
  { label: "Tích phân: ∫", value: "\\int_a^b f(x) \\mathrm{d}x" },
  { label: "Mũ: xⁿ", value: "x^n" },
  { label: "Căn: √x", value: "\\sqrt{x}" },
  { label: "Tổ hợp: C(n, k)", value: "\\binom{n}{k}" },
  { label: "Logarit", value: "\\log_b{x}" },
  { label: "Pi", value: "\\pi" },
  { label: "Vô cực", value: "\\infty" },
];

const normalizeText = (text = "") =>
  text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

const createEditorState = (text) => {
  const clean = normalizeText(text);
  const contentState = ContentState.createFromText(clean);
  return EditorState.createWithContent(contentState);
};

const QuestionCardV2 = ({
  question,
  index,
  onDelete,
  onMoveUp,
  onMoveDown,
  totalQuestions,
  onFullUpdate,
  examId,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editorState, setEditorState] = useState(
    createEditorState(question.Content)
  );
  const [modalAnswers, setModalAnswers] = useState([]);
  const [modalCorrectId, setModalCorrectId] = useState(null);
  const [imageUrl, setImageUrl] = useState(question.ImageUrl || "");

  const correctAnswerId =
    question.CorrectAnswerId ||
    question.Answers.find((ans) => ans.IsCorrect)?.AnswerId ||
    null;

  const openModal = () => {
    setEditorState(createEditorState(question.Content));
    setModalAnswers(question.Answers.map((a) => ({ ...a })));
    setModalCorrectId(correctAnswerId);
    setImageUrl(question.ImageUrl || "");
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    const content = editorState.getCurrentContent();
    const blocks = content.getBlocksAsArray();
    const fullText = blocks.map((b) => b.getText()).join("\n");

    const updatedAnswers = modalAnswers.map((ans) => ({
      ...ans,
      IsCorrect: ans.AnswerId === modalCorrectId,
    }));

    onFullUpdate(index, {
      ...question,
      Content: fullText,
      Answers: updatedAnswers,
      CorrectAnswerId: modalCorrectId,
      ImageUrl: imageUrl,
    });

    setModalVisible(false);
  };

  const insertKatexToQuestion = (latex) => {
    setEditorState((prev) => {
      const content = prev.getCurrentContent();
      const selection = prev.getSelection();
      const newContent = Modifier.replaceText(
        content,
        selection,
        `[MATH:${latex}]`
      );
      const newState = EditorState.push(prev, newContent, "insert-characters");
      return EditorState.forceSelection(
        newState,
        newContent.getSelectionAfter()
      );
    });
  };

  const insertKatexToAnswer = (ansIdx, latex) => {
    setModalAnswers((prev) => {
      const arr = [...prev];
      arr[ansIdx].Content = (arr[ansIdx].Content || "") + ` [MATH:${latex}]`;
      return arr;
    });
  };

  const handleImageUpload = async ({ file }) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImageUrl(reader.result);
  };

  const renderContent = (text) => {
    const clean = normalizeText(text);
    return clean.split("\n").map((line, idx) => (
      <p key={idx} style={{ margin: "4px 0" }}>
        {line.split(/(\[MATH:[^\]]+\])/g).map((seg, i) => {
          const match = seg.match(/\[MATH:([^\]]+)\]/);
          return match ? (
            <InlineMath key={i}>{match[1]}</InlineMath>
          ) : (
            <span key={i}>{seg}</span>
          );
        })}
      </p>
    ));
  };

  const handleEditClick = async () => {
    try {
      await isModifyExam(examId);
      openModal();
    } catch (err) {
      message.error("Bạn không có quyền chỉnh sửa câu hỏi");
    }
  };

  // Hàm thay thế onDelete
  const handleDeleteClick = async () => {
    try {
      await isDeleteExam(examId);
      onDelete(index);
    } catch (err) {
      message.error("Bạn không có quyền xóa câu hỏi");
    }
  };

  const handleMoveUpClick = async (index) => {
    try {
      await isModifyExam(examId);
      onMoveUp(index);
    } catch (err) {
      message.error("Bạn không có quyền sửa câu hỏi");
    }
  };

  const handleMoveDownClick = async (index) => {
    try {
      await isModifyExam(examId);
      onMoveDown(index);
    } catch (err) {
      message.error("Bạn không có quyền sửa câu hỏi");
    }
  };

  return (
    <>
      <Card
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: 16,
        }}
      >
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Space>
            <Text strong>{`Câu ${index + 1}`}</Text>
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              onClick={() => handleMoveUpClick(index)}
              disabled={index === 0}
            />
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              onClick={() => handleMoveDownClick(index)}
              disabled={index === totalQuestions - 1}
            />
          </Space>
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={handleEditClick}
            >
              Chỉnh sửa
            </Button>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={handleDeleteClick}
            >
              Xóa câu hỏi
            </Button>
          </Space>
        </Space>

        <div style={{ marginBottom: 12 }}>
          {renderContent(question.Content)}
        </div>

        {question.ImageUrl && (
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <img
              src={question.ImageUrl}
              alt="Hình minh họa"
              style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
            />
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {question.Answers.map((ans, i) => {
              const isCorrect = ans.AnswerId === correctAnswerId;
              return (
                <Space key={ans.AnswerId} align="start">
                  <Text
                    strong
                    style={isCorrect ? { color: "green" } : {}}
                  >{`${String.fromCharCode(65 + i)}.`}</Text>
                  {isCorrect && (
                    <CheckOutlined style={{ color: "green", marginLeft: 4 }} />
                  )}
                  <div>{renderContent(ans.Content)}</div>
                </Space>
              );
            })}
          </Space>
        </div>
      </Card>

      <Modal
        title={`Chỉnh sửa Câu ${index + 1}`}
        open={modalVisible}
        onOk={handleSaveModal}
        onCancel={() => setModalVisible(false)}
        width={"140vh"}
      >
        <div style={{ marginBottom: 12 }}>
          <Select
            placeholder="Chèn công thức vào câu hỏi"
            onChange={insertKatexToQuestion}
            style={{ width: 240 }}
          >
            {latexPresets.map((p) => (
              <Option key={p.value} value={p.value}>
                {p.label}
              </Option>
            ))}
          </Select>
        </div>

        <Editor
          editorState={editorState}
          onEditorStateChange={setEditorState}
          wrapperClassName="demo-wrapper"
          editorClassName="demo-editor"
          editorStyle={{
            minHeight: "150px",
            border: "1px solid #ddd",
            padding: "4px",
          }}
        />

        <div style={{ marginTop: 16 }}>
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
            <Space align="center" style={{ marginBottom: 16 }}>
              <img
                src={imageUrl}
                alt="Hình minh họa"
                style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
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
        </div>

        <div style={{ marginTop: 12 }}>
          <Text strong>Đáp án:</Text>
          <Radio.Group
            value={modalCorrectId}
            onChange={(e) => setModalCorrectId(e.target.value)}
            style={{ width: "100%" }}
          >
            {modalAnswers.map((ans, i) => (
              <Row key={i} gutter={8} style={{ marginBottom: 8 }}>
                <Col span={2}>
                  <Radio value={ans.AnswerId} />
                </Col>
                <Col span={20}>
                  <Input
                    placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                    value={ans.Content}
                    onChange={(e) =>
                      setModalAnswers((prev) =>
                        prev.map((item, idx) =>
                          idx === i
                            ? { ...item, Content: e.target.value }
                            : item
                        )
                      )
                    }
                  />
                </Col>
                <Col span={2}>
                  <Select
                    onChange={(val) => insertKatexToAnswer(i, val)}
                    placeholder="KaTeX"
                    size="small"
                    style={{ width: "100%" }}
                  >
                    {latexPresets.map((p) => (
                      <Option key={p.value} value={p.value}>
                        {p.label}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            ))}
          </Radio.Group>
        </div>
      </Modal>
    </>
  );
};

export default QuestionCardV2;
