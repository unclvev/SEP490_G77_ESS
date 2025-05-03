import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getQuestions, deleteQuestion } from '../../services/api';
import parse from 'html-react-parser';
import { InlineMath } from 'react-katex';
import { toast } from 'react-toastify';

const AddQuestionModal = ({ sectionId }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [expanded, setExpanded] = useState({});
  const isMounted = useRef(true);

  useEffect(() => {
    fetchQuestions();
    return () => {
      isMounted.current = false;
    };
  }, [sectionId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await getQuestions(sectionId);
      if (isMounted.current) setQuestions(res.data);
    } catch (error) {
      toast.error('Lỗi khi tải câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (question = null) => {
    setEditingQuestion(question);
    setModalVisible(true);
  };

  const handleDelete = async (quesid) => {
    try {
      await deleteQuestion(quesid);
      toast.success('Xóa thành công');
      fetchQuestions();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const toggleSolution = (quesid) => {
    setExpanded(prev => ({ ...prev, [quesid]: !prev[quesid] }));
  };

  const renderMath = (text) => {
    if (typeof text === 'string' && text.includes('[MATH:')) {
      const html = text.replace(/\[MATH:(.+?)\]/g, '<span class="katex-math" data-formula="$1">$$$1$$</span>');
      return parse(html, {
        replace: domNode => {
          if (domNode.attribs?.class === 'katex-math') {
            return <InlineMath math={domNode.attribs['data-formula']} />;
          }
        }
      });
    }
    return text;
  };

  return (
    <div>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => openModal(null)}
        style={{ marginBottom: 16 }}
      >
        Thêm Câu Hỏi
      </Button>

      {loading ? (
        <Spin />
      ) : (
        questions.map(q => (
          <Card
            key={q.quesid}
            hoverable
            style={{ marginBottom: 16 }}
            actions={[
              <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => openModal(q)}>
                Sửa
              </Button>,
              <Button key="delete" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(q.quesid)}>
                Xóa
              </Button>
            ]}
          >
            {/* 1. Nội dung câu hỏi */}
            <div style={{ marginBottom: 12 }}>
              {renderMath(q.quescontent)}
            </div>
            {/* 2. Ảnh (nếu có) */}
            {q.imageUrl && (
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <img src={q.imageUrl} alt="Question" style={{ maxWidth: '100%' }} />
              </div>
            )}
            {/* 3. Đáp án */}
            <div style={{ marginBottom: 12 }}>
              <strong>Đáp án:</strong>
              <ul>
                {Array.isArray(q.answers) && q.answers.map((a, i) => (
                  <li
                    key={i}
                    style={{ color: Array.isArray(q.correctAnswers) && q.correctAnswers.includes(a) ? '#52c41a' : undefined }}
                  >
                    {renderMath(a)} {Array.isArray(q.correctAnswers) && q.correctAnswers.includes(a) && '(Đúng)'}
                  </li>
                ))}
              </ul>
            </div>
            {/* 4. Giải thích có thể mở rộng */}
            <div>
              <Button type="link" onClick={() => toggleSolution(q.quesid)}>
                {expanded[q.quesid] ? 'Ẩn giải thích' : 'Xem giải thích'}
              </Button>
              {expanded[q.quesid] && q.solution && (
                <div style={{ marginTop: 8 }}>
                  <strong>Giải thích:</strong>
                  <p>{q.solution}</p>
                </div>
              )}
            </div>
          </Card>
        ))
      )}

      
    </div>
  );
};

export default AddQuestionModal;