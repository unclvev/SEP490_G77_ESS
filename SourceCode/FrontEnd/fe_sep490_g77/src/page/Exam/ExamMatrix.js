import React, { useState, useEffect } from "react";
import { Tree, Table, InputNumber, Button, Modal, Select, message } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { countQExam, createExam, loadbExam, loadbExams } from "../../services/api";

const { TreeNode } = Tree;
const { Option } = Select;

const ExamCreation = () => {
  const navigate = useNavigate();

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isBankModalVisible, setBankModalVisible] = useState(false);
  const [banks, setBanks] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);

  // Fetch banks on mount
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await loadbExams();
      setBanks(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách ngân hàng:", error);
      message.error("Không thể tải danh sách ngân hàng.");
    }
  };

  const fetchBankDetails = async (bankId) => {
    try {
      const response = await loadbExam(bankId);
      const data = response.data;
      setSelectedBank(data);
      const nodes = (data.sections || []).map((section) => ({
        key: `section-${section.secId}`,
        title: section.secName,
      }));
      setSections([{
        key: `bank-${data.bankId}`,
        title: data.bankName,
        children: nodes,
      }]);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu ngân hàng:", error);
      message.error("Không thể tải dữ liệu ngân hàng.");
    }
  };

  const onSelect = async (keys, info) => {
    if (info.node.key.startsWith("bank-")) {
      message.warning("Chỉ được chọn section, không được chọn ngân hàng");
      return;
    }
    if (!selectedTopics.some((t) => t.key === info.node.key)) {
      try {
        const sectionId = info.node.key.replace("section-", "");
        const response = await countQExam(sectionId, 1);
        const levelMapping = { Basic: "easy", Intermediate: "medium", Advanced: "hard" };
        const questionCounts = response.data.reduce((acc, item) => {
          acc[levelMapping[item.level] || item.level] = item.count || 0;
          return acc;
        }, { easy: 0, medium: 0, hard: 0 });
        setSelectedTopics((prev) => [
          ...prev,
          {
            key: info.node.key,
            title: info.node.title,
            levels: { easy: 0, medium: 0, hard: 0 },
            maxLevels: questionCounts,
          },
        ]);
      } catch (error) {
        console.error("Lỗi khi tải số lượng câu hỏi:", error);
        message.error("Không thể tải số lượng câu hỏi.");
      }
    }
  };

  const handleDelete = (key) => {
    setSelectedTopics((prev) => prev.filter((t) => t.key !== key));
  };

  // total selected across all topics and levels
  const totalSelected = selectedTopics.reduce(
    (sum, t) => sum + t.levels.easy + t.levels.medium + t.levels.hard,
    0
  );

  const handleQuestionCountChange = (key, level, value) => {
    setSelectedTopics((prev) =>
      prev.map((topic) => {
        if (topic.key !== key) return topic;
        // cap individual level by both maxLevels[level] and remaining slots
        const current = topic.levels[level];
        const remaining = 50 - (totalSelected - current);
        const newValue = Math.min(value, topic.maxLevels[level], remaining);
        return {
          ...topic,
          levels: { ...topic.levels, [level]: newValue },
        };
      })
    );
  };

  const handleCreateExam = () => {
    if (totalSelected > 50) {
      message.error("Bạn đã chọn quá 50 câu");
      return;
    }
    const proceed = async () => {
      console.log("aaaa");
      const examStructure = selectedTopics.map((topic) => ({
        sectionId: topic.key.replace("section-", ""),
        easy: topic.levels.easy,
        medium: topic.levels.medium,
        hard: topic.levels.hard,
      }));
      try {
        const response = await createExam(examStructure);
        if (response.data?.examId) {
          navigate(`/exam/preview/${response.data.examId}`);
        }
      } catch (error) {
        console.error("Lỗi khi tạo đề thi:", error);
        message.error("Tạo đề thi thất bại");
      }
    };
    if (totalSelected < 50) {
      Modal.confirm({
        title: "Chưa đủ 50 câu",
        content: `Bạn chỉ chọn ${totalSelected} câu. Bạn có chắc muốn khởi tạo đề không?`,
        onOk: proceed,
      });
    } else {
      proceed();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: 20, background: "#f5f5f5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <Button type="primary" onClick={handleCreateExam} disabled={totalSelected > 50}>
            Khởi tạo
          </Button>
          <span style={{ marginLeft: 16 }}>
            Đã chọn <strong>{totalSelected}</strong>/50 câu
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left panel: Bank + Tree */}
        <div style={{ width: "25%", background: "#fff", padding: 10, borderRight: "1px solid #ddd", overflowY: "auto" }}>
          <Button icon={<PlusOutlined />} onClick={() => setBankModalVisible(true)}>
            Chọn ngân hàng
          </Button>
          <Modal
            title="Chọn Ngân Hàng Câu Hỏi"
            open={isBankModalVisible}
            onOk={() => setBankModalVisible(false)}
            onCancel={() => setBankModalVisible(false)}
          >
            <Select style={{ width: "100%" }} onChange={(val) => { setSelectedBank(val); fetchBankDetails(val); }}>
              {banks.map((b) => (
                <Option key={b.bankId} value={b.bankId}>
                  {b.bankName}
                </Option>
              ))}
            </Select>
          </Modal>
          <Tree onSelect={onSelect} defaultExpandAll>
            {sections.map((node) => (
              <TreeNode key={node.key} title={node.title}>
                {node.children.map((child) => (
                  <TreeNode key={child.key} title={child.title} />
                ))}
              </TreeNode>
            ))}
          </Tree>
        </div>
        {/* Right panel: Matrix */}
        <div style={{ flex: 1, padding: 20, background: "#fff" }}>
          <h3>Ma trận đề thi: Đề 50 câu multiple choice</h3>
          <Table
            columns={[
              { title: "STT", dataIndex: "index", key: "index", width: 50 },
              { title: "Kiến thức", dataIndex: "title", key: "title" },
              {
                title: "Dễ",
                dataIndex: "easy",
                key: "easy",
                render: (_, record) => (
                  <InputNumber
                    min={0}
                    max={Math.min(record.maxLevels.easy, 50 - (totalSelected - record.levels.easy))}
                    value={record.levels.easy}
                    onChange={(val) => handleQuestionCountChange(record.key, "easy", val)}
                  />
                ),
              },
              {
                title: "Trung bình",
                dataIndex: "medium",
                key: "medium",
                render: (_, record) => (
                  <InputNumber
                    min={0}
                    max={Math.min(record.maxLevels.medium, 50 - (totalSelected - record.levels.medium))}
                    value={record.levels.medium}
                    onChange={(val) => handleQuestionCountChange(record.key, "medium", val)}
                  />
                ),
              },
              {
                title: "Khó",
                dataIndex: "hard",
                key: "hard",
                render: (_, record) => (
                  <InputNumber
                    min={0}
                    max={Math.min(record.maxLevels.hard, 50 - (totalSelected - record.levels.hard))}
                    value={record.levels.hard}
                    onChange={(val) => handleQuestionCountChange(record.key, "hard", val)}
                  />
                ),
              },
              {
                title: "Xóa",
                key: "delete",
                render: (_, record) => (
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)} />
                ),
              },
            ]}
            dataSource={selectedTopics.map((item, idx) => ({ ...item, index: idx + 1 }))}
            rowKey="key"
            pagination={false}
            bordered
          />
        </div>
      </div>
    </div>
  );
};

export default ExamCreation;
