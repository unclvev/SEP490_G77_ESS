import React, { useState } from "react";
import { Card, Button, Space, Typography, Modal, Input, Radio, Select } from "antd";
import { DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckOutlined } from "@ant-design/icons";
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { EditorState, ContentState, Modifier } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

const { Text } = Typography;
const { Option } = Select;

const latexPresets = [
  { label: 'Phân số: a/b', value: '\\frac{a}{b}' },
  { label: 'Đạo hàm: d/dx', value: '\\frac{d}{dx}' },
  { label: 'Tích phân: ∫', value: '\\int_a^b f(x) \\mathrm{d}x' },
  { label: 'Mũ: xⁿ', value: 'x^n' },
  { label: 'Căn: √x', value: '\\sqrt{x}' },
];

const normalizeText = (text = '') => text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const createEditorState = (text) => {
  const clean = normalizeText(text);
  const contentState = ContentState.createFromText(clean);
  return EditorState.createWithContent(contentState);
};

const QuestionCardV2 = ({ question, index, onQuestionChange, onAnswerChange, onCorrectChange, onAnswerDelete, onDelete, onMoveUp, onMoveDown, totalQuestions }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editorState, setEditorState] = useState(createEditorState(question.Content));
  const [modalAnswers, setModalAnswers] = useState([]);
  const [modalCorrectId, setModalCorrectId] = useState(null);

  const correctAnswerId = question.CorrectAnswerId || (question.Answers.find(ans => ans.IsCorrect)?.AnswerId) || null;

  const openModal = () => {
    setEditorState(createEditorState(question.Content));
    setModalAnswers(question.Answers.map(a => ({ ...a })));
    setModalCorrectId(correctAnswerId);
    setModalVisible(true);
  };

  const handleSaveModal = () => {
    const rawText = normalizeText(editorState.getCurrentContent().getPlainText());
    onQuestionChange(index, rawText);
    modalAnswers.forEach(ans => onAnswerChange(index, ans.AnswerId, ans.Content));
    onCorrectChange(index, modalCorrectId);
    setModalVisible(false);
  };

  const insertKatexToQuestion = latex => {
    setEditorState(prev => {
      const content = prev.getCurrentContent();
      const selection = prev.getSelection();
      const newContent = Modifier.replaceText(content, selection, `[MATH:${latex}]`);
      const newState = EditorState.push(prev, newContent, 'insert-characters');
      return EditorState.forceSelection(newState, newContent.getSelectionAfter());
    });
  };

  const insertKatexToAnswer = (ansIdx, latex) => {
    setModalAnswers(prev => {
      const arr = [...prev];
      arr[ansIdx].Content = (arr[ansIdx].Content || '') + ` [MATH:${latex}]`;
      return arr;
    });
  };

  const renderContent = text => {
    const clean = normalizeText(text);
    return clean.split("\n").map((line, idx) => (
      <p key={idx} style={{ margin: '4px 0' }}>
        {line.split(/(\[MATH:[^\]]+\])/g).map((seg, i) => {
          const match = seg.match(/\[MATH:([^\]]+)\]/);
          return match ? <InlineMath key={i}>{match[1]}</InlineMath> : <span key={i}>{seg}</span>;
        })}
      </p>
    ));
  };

  return (
    <>
      <Card style={{ marginBottom: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
          <Space>
            <Text strong>{`Câu ${index + 1}`}</Text>
            <Button size='small' icon={<ArrowUpOutlined />} onClick={() => onMoveUp(index)} disabled={index === 0} />
            <Button size='small' icon={<ArrowDownOutlined />} onClick={() => onMoveDown(index)} disabled={index === totalQuestions - 1} />
          </Space>
          <Space>
            <Button type='text' icon={<EditOutlined />} onClick={openModal}>Chỉnh sửa</Button>
            <Button type='text' icon={<DeleteOutlined />} onClick={() => onDelete(index)}>Xóa câu hỏi</Button>
          </Space>
        </Space>

        <div style={{ marginBottom: 12 }}>{renderContent(question.Content)}</div>

        <div style={{ marginTop: 8 }}>
          <Space direction='vertical' style={{ width: '100%' }}>
            {question.Answers.map((ans, i) => {
              const isCorrect = ans.AnswerId === correctAnswerId;
              return (
                <Space key={ans.AnswerId} align='start'>
                  <Text strong style={isCorrect ? { color: 'green' } : {}}>{`${String.fromCharCode(65 + i)}.`}</Text>
                  {isCorrect && <CheckOutlined style={{ color: 'green', marginLeft: 4 }} />}
                  <div>{renderContent(ans.Content)}</div>
                  {/* <Button type='text' icon={<DeleteOutlined />} onClick={() => onAnswerDelete(index, ans.AnswerId)} /> */}
                </Space>
              );
            })}
          </Space>
        </div>
      </Card>

      <Modal title={`Chỉnh sửa Câu ${index + 1}`} open={modalVisible} onOk={handleSaveModal} onCancel={() => setModalVisible(false)} width={800}>
        <Select placeholder='Chèn công thức vào câu hỏi' onChange={insertKatexToQuestion} style={{ marginBottom: 12, width: 240 }}>
          {latexPresets.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
        </Select>
        <Editor
          editorState={editorState}
          onEditorStateChange={setEditorState}
          toolbar={{ options: ['inline','blockType','fontSize','list','textAlign','link','embedded','emoji','history','image'] }}
          wrapperClassName='demo-wrapper'
          editorClassName='demo-editor'
        />

        <div style={{ marginTop: 16 }}>
          <Text strong>Đáp án:</Text>
          <Space direction='vertical' style={{ width: '100%' }}>
            {modalAnswers.map((ans, i) => (
              <Space key={ans.AnswerId} align='center'>
                <Radio
                  value={ans.AnswerId}
                  checked={modalCorrectId===ans.AnswerId}
                  onChange={() => setModalCorrectId(ans.AnswerId)}
                />
                <Select placeholder='Chèn công thức vào đáp án' onChange={val => insertKatexToAnswer(i, val)} style={{ width: 200 }}>
                  {latexPresets.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                </Select>
                <Input
                  style={{ width: '100%' }}
                  value={ans.Content}
                  onChange={e => setModalAnswers(prev => prev.map((item, idx) => idx===i ? { ...item, Content: e.target.value } : item))}
                />
              </Space>
            ))}
          </Space>
        </div>
      </Modal>
    </>
  );
};

export default QuestionCardV2;