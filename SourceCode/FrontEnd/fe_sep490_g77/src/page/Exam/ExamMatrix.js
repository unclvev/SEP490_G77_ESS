import React, { useState, useEffect } from "react";
import {
  Tree,
  Table,
  InputNumber,
  Button,
  Modal,
  Select,
  Input,
  message,
  Radio,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  countQExam,
  createExam,
  loadbExam,
  loadbExams,
} from "../../services/api";

const { TreeNode } = Tree;
const { Option } = Select;

const ExamCreation = () => {
  const navigate = useNavigate();

  const [selectedTopics, setSelectedTopics] = useState([]);
  const [isBankModalVisible, setBankModalVisible] = useState(false);
  const [banksData, setBanksData] = useState({
    ownBanks: [],
    sharedBanks: [],
    systemBanks: [],
  });
  const [sections, setSections] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankSearch, setBankSearch] = useState("");
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankCategory, setBankCategory] = useState("ownBanks");

  // Fetch banks on mount
  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await loadbExams();
      // API trả về { ownBanks, sharedBanks, systemBanks }
      setBanksData(response.data);
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

      // Build map of sections
      const map = {};
      data.sections.forEach(sec => {
        map[sec.secId] = {
          key: `section-${sec.secId}`,
          title: sec.secName,
          children: [],
          raw: sec,
        };
      });
      // Assign children by ancestor relations
      data.sections.forEach(sec => {
        sec.descendants.forEach(rel => {
          if (rel.depth > 0) {
            const parent = map[rel.ancestorId];
            const child = map[sec.secId];
            if (parent && child) {
              parent.children.push(child);
            }
          }
        });
      });
      // Take roots (nodes with no parent relation)
      const roots = Object.values(map)
        .filter(n => !n.raw.descendants.some(rel => rel.depth > 0))
        .map(({ raw, ...node }) => node);

      setSections([
        {
          key: `bank-${data.bankId}`,
          title: data.bankName,
          children: roots,
        },
      ]);
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
        const levelMapping = {
          "Thông hiểu": "easy",
          "Vận dụng": "medium",
          "Nâng cao": "hard",
        };

        const questionCounts = response.data.reduce(
          (acc, item) => {
            acc[levelMapping[item.level] || item.level] = item.count || 0;
            return acc;
          },
          { easy: 0, medium: 0, hard: 0 }
        );
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
      const examStructure = selectedTopics.map((topic) => ({
        sectionId: topic.key.replace("section-", ""),
        easy: topic.levels.easy,
        medium: topic.levels.medium,
        hard: topic.levels.hard,
      }));
      console.log(examStructure);
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

  const filteredBanks = (banksData[bankCategory] || []).filter((b) =>
    b.bankName.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: 20,
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div>
          <Button
            type="primary"
            onClick={handleCreateExam}
            disabled={totalSelected > 50}
          >
            Khởi tạo
          </Button>
          <span style={{ marginLeft: 16 }}>
            Đã chọn <strong>{totalSelected}</strong>/50 câu
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left panel: Bank + Tree */}
        <div
          style={{
            width: "25%",
            background: "#fff",
            padding: 10,
            borderRight: "1px solid #ddd",
            overflowY: "auto",
          }}
        >
          <Button
            icon={<PlusOutlined />}
            onClick={() => setBankModalVisible(true)}
          >
            Chọn ngân hàng
          </Button>
          <Modal
            title="Chọn Ngân Hàng Câu Hỏi"
            open={isBankModalVisible}
            destroyOnClose // đảm bảo unmount select khi modal đóng
            onOk={() => setBankModalVisible(false)}
            onCancel={() => setBankModalVisible(false)}
          >
            <Radio.Group
              value={bankCategory}
              onChange={(e) => {
                setBankCategory(e.target.value);
                setBankSearch("");
              }}
              style={{ marginBottom: 12 }}
            >
              <Radio.Button value="ownBanks">Của tôi</Radio.Button>
              <Radio.Button value="sharedBanks">Được chia sẻ</Radio.Button>
              <Radio.Button value="systemBanks">Hệ thống</Radio.Button>
            </Radio.Group>

            {/* tìm kiếm */}
            <Input.Search
              placeholder="Tìm ngân hàng..."
              allowClear
              value={bankSearch}
              onChange={(e) => setBankSearch(e.target.value)}
              style={{ marginBottom: 12, width: "100%" }}
            />

            <Select
              style={{ width: "100%" }}
              showSearch
              placeholder="Chọn ngân hàng"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              value={selectedBank}
              onSelect={(val) => {
                setSelectedBank(val);
                fetchBankDetails(val);
                setBankModalVisible(false);
              }}
            >
              {banksData[bankCategory]
                .filter((b) =>
                  b.bankName.toLowerCase().includes(bankSearch.toLowerCase())
                )
                .map((b) => (
                  <Option key={b.bankId} value={b.bankId}>
                    {b.bankName}
                  </Option>
                ))}
            </Select>
          </Modal>

          <Tree
            onSelect={onSelect}
            defaultExpandAll
            treeData={sections}
          />
        </div>

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
                    max={Math.min(
                      record.maxLevels.easy,
                      50 - (totalSelected - record.levels.easy)
                    )}
                    value={record.levels.easy}
                    onChange={(val) =>
                      handleQuestionCountChange(record.key, "easy", val)
                    }
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
                    max={Math.min(
                      record.maxLevels.medium,
                      50 - (totalSelected - record.levels.medium)
                    )}
                    value={record.levels.medium}
                    onChange={(val) =>
                      handleQuestionCountChange(record.key, "medium", val)
                    }
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
                    max={Math.min(
                      record.maxLevels.hard,
                      50 - (totalSelected - record.levels.hard)
                    )}
                    value={record.levels.hard}
                    onChange={(val) =>
                      handleQuestionCountChange(record.key, "hard", val)
                    }
                  />
                ),
              },
              {
                title: "Xóa",
                key: "delete",
                render: (_, record) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(record.key)}
                  />
                ),
              },
            ]}
            dataSource={selectedTopics.map((item, idx) => ({
              ...item,
              index: idx + 1,
            }))}
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
