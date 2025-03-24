import React, { useState, useEffect } from "react";
import { Tree, Table, InputNumber, Button, Modal, Select, message } from "antd";
import { DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { countQExam, loadbExam, loadbExams } from "../../services/api";

const { TreeNode } = Tree;
const { Option } = Select;

const ExamCreation = () => {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isBankModalVisible, setBankModalVisible] = useState(false);
  const [banks, setBanks] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [examInfo, setExamInfo] = useState({ name: "", grade: "", subject: "" });

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
      setSelectedBank(response.data);
      const sections = response.data.sections ?? [];

      const bankNode = {
        key: `bank-${response.data.bankId}`,
        title: response.data.bankName,
        children: sections.map((section) => ({
          key: `section-${section.secId}`,
          title: section.secName,
        })),
      };
      setSections([bankNode]);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu ngân hàng:", error);
      message.error("Không thể tải dữ liệu ngân hàng.");
    }
  };

  const handleCreateExam = () => {
    const examStructure = selectedTopics.map(topic => ({
      sectionId: topic.key.replace("section-", ""), // Lấy ID section từ key
      easy: topic.levels.easy || 0,
      medium: topic.levels.medium || 0,
      hard: topic.levels.hard || 0
    }));
  
    console.log("Cấu trúc đề thi:", JSON.stringify(examStructure, null, 2));
  };
  

  const handleBankSelect = (value) => {
    setSelectedBank(value);
    fetchBankDetails(value);
  };

  const onSelect = async (keys, info) => {
    if (info.node.key.startsWith("bank-")) {
      message.warning("Không thể chọn ngân hàng, chỉ chọn được section.");
      return;
    }
    if (!selectedTopics.some((item) => item.key === info.node.key)) {
      try {
        const examId = info.node.key.replace("section-", "");
        const response = await countQExam(examId);
        const levelMapping = { Basic: "easy", Intermediate: "medium", Advanced: "hard" };
        const questionCounts = response.data.reduce((acc, item) => {
          acc[levelMapping[item.level] || item.level] = item.count || 0;
          return acc;
        }, { easy: 0, medium: 0, hard: 0 });

        setSelectedTopics([...selectedTopics, {
          key: info.node.key,
          title: info.node.title,
          levels: { easy: 0, medium: 0, hard: 0 },
          maxLevels: { ...questionCounts },
        }]);
      } catch (error) {
        console.error("Lỗi khi tải số lượng câu hỏi:", error);
        message.error("Không thể tải số lượng câu hỏi.");
      }
    }
  };

  const handleDelete = (key) => {
    setSelectedTopics(selectedTopics.filter((item) => item.key !== key));
  };

  const handleUseBank = () => {
    setBankModalVisible(false);
  };

  const handleQuestionCountChange = (key, level, value) => {
    setSelectedTopics((prevTopics) =>
      prevTopics.map((topic) =>
        topic.key === key
          ? { ...topic, levels: { ...topic.levels, [level]: Math.min(value, topic.maxLevels[level]) } }
          : topic
      )
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", padding: 20, background: "#f5f5f5" }}>
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
       <Button type="primary" onClick={handleCreateExam}>Khởi tạo</Button>

      </div>
      <div style={{ display: "flex", flex: 1 }}>
        <div style={{ width: "25%", background: "#fff", padding: 10, borderRight: "1px solid #ddd", overflowY: "auto" }}>
          <Button icon={<PlusOutlined />} onClick={() => setBankModalVisible(true)}>
            Chọn ngân hàng câu hỏi
          </Button>
          <Modal title="Chọn Ngân Hàng Câu Hỏi" open={isBankModalVisible} onOk={handleUseBank} onCancel={() => setBankModalVisible(false)}>
            <Select style={{ width: "100%" }} onChange={handleBankSelect}>
              {banks.map((bank) => (
                <Option key={bank.bankId} value={bank.bankId}>{bank.bankName}</Option>
              ))}
            </Select>
          </Modal>
          <h3>Ngân hàng câu hỏi</h3>
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
        <div style={{ flex: 1, padding: 20, background: "#fff" }}>
          <h3>Ma trận đề thi</h3>
          <Table
            columns={[
              { title: "STT", dataIndex: "index", key: "index", width: 50 },
              { title: "Nội dung kiến thức", dataIndex: "title", key: "title" },
              { title: "Dễ", dataIndex: "easy", key: "easy", render: (_, record) => (
                <InputNumber min={0} max={record.maxLevels.easy} value={record.levels.easy} onChange={(value) => handleQuestionCountChange(record.key, "easy", value)} />
              )},
              { title: "Trung bình", dataIndex: "medium", key: "medium", render: (_, record) => (
                <InputNumber min={0} max={record.maxLevels.medium} value={record.levels.medium} onChange={(value) => handleQuestionCountChange(record.key, "medium", value)} />
              )},
              { title: "Khó", dataIndex: "hard", key: "hard", render: (_, record) => (
                <InputNumber min={0} max={record.maxLevels.hard} value={record.levels.hard} onChange={(value) => handleQuestionCountChange(record.key, "hard", value)} />
              )},
              { title: "Xóa", key: "delete", render: (_, record) => (
                <Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.key)} />
              )},
            ]}
            dataSource={selectedTopics.map((item, index) => ({ ...item, index: index + 1 }))}
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
