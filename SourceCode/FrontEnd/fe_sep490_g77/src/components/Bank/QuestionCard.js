import React, { useState } from 'react';
import { Card, Tag, Space, Typography, Button, Popconfirm, Collapse } from 'antd';
import { EditOutlined, DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import parse from 'html-react-parser';
import { InlineMath } from 'react-katex';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const typeLabels = { 1: 'Trắc nghiệm', 2: 'True/False', 3: 'Điền kết quả' };
const levelColors = { 'Dễ': 'green', 'Trung bình': 'gold', 'Khó': 'red' };

// Mock dữ liệu
const mockQuestion = {
  quesid: 1,
  quescontent: 'Ví dụ: Tính tích phân <span class="katex-math" data-formula="\\int_{0}^{1} x^2 dx">$$\\int_{0}^{1} x^2 dx$$</span>',
  typeId: 1,
  answers: ['[MATH:\\int_{0}^{1} x^2 dx]', '2', '3', '4'],
  correctAnswers: ['[MATH:\\int_{0}^{1} x^2 dx]'],
  modeid: 2,
  solution: 'Kết quả là 1/3'
};
const mockLevels = [
  { levelId: 1, levelName: 'Dễ' },
  { levelId: 2, levelName: 'Trung bình' },
  { levelId: 3, levelName: 'Khó' }
];

const QuestionCard = ({ question = mockQuestion, levels = mockLevels, onEdit = () => {}, onDelete = () => {} }) => {
  const [showSolution, setShowSolution] = useState(false);
  const q = {
    quesid: question.quesid,
    quescontent: question.quescontent || '',
    typeId: question.typeId || 1,
    answers: question.answers || [],
    correctAnswers: question.correctAnswers || [],
    modeid: question.modeid,
    solution: question.solution || ''
  };
  const levelName = levels.find(l => l.levelId === q.modeid)?.levelName || 'N/A';

  // render math placeholder tags
  const renderMath = html => <span>{parse(html, {
    replace: node => node.attribs?.class === 'katex-math'
      ? <InlineMath math={node.attribs['data-formula']} />
      : undefined
  })}</span>;

  // Section 1: header info
  const header = (
    <Space align="center" justify="space-between" style={{ width: '100%' }}>
      <Title level={5} style={{ margin: 0 }}>Câu {q.quesid}</Title>
      <Space>
        <Tag color="blue">{typeLabels[q.typeId]}</Tag>
        <Tag color={levelColors[levelName] || 'default'}>{levelName}</Tag>
        <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(q)} />
        <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => onDelete(q.quesid)} okText="Xóa" cancelText="Hủy">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </Space>
  );

  // Section 2: content
  const content = (
    <Paragraph style={{ margin: '16px 0' }}>
      {q.quescontent.includes('<span') ? renderMath(q.quescontent) : q.quescontent}
    </Paragraph>
  );

  // Section 3: answers
  const answers = (
    <Space direction="vertical" style={{ width: '100%' }} size="small">
      {q.answers.map((ans, idx) => {
        const isCorrect = q.correctAnswers.includes(ans);
        return (
          <Paragraph
            key={idx}
            style={{
              background: isCorrect ? '#e6fffb' : 'transparent',
              fontWeight: isCorrect ? 'bold' : 'normal',
              padding: '8px',
              margin: 0,
              borderRadius: 4
            }}
          >
            <Text>{String.fromCharCode(65 + idx)}. </Text>
            {ans.includes('[MATH:')
              ? renderMath(ans.replace(/\[MATH:(.+?)\]/g, '<span class="katex-math" data-formula="$1">$$$1$$</span>'))
              : <Text>{ans}</Text>
            }
          </Paragraph>
        );
      })}
    </Space>
  );

  // Section 4: solution dropdown
  const solutionToggle = (
    <Button
      type="link"
      icon={showSolution ? <UpOutlined /> : <DownOutlined />}
      onClick={() => setShowSolution(prev => !prev)}
    >
      {showSolution ? 'Ẩn giải thích' : 'Xem giải thích'}
    </Button>
  );

  return (
    <Card style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: 16 }}>
      {header}
      {content}
      {answers}
      <div style={{ marginTop: 12 }}>
        {solutionToggle}
        {showSolution && (
          <Paragraph type="secondary" style={{ marginTop: 8, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
            {q.solution}
          </Paragraph>
        )}
      </div>
    </Card>
  );
};

export default QuestionCard;
