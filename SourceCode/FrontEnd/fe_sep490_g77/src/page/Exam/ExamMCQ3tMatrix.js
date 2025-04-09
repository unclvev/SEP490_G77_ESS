import React, { useState, useEffect } from "react";
import { Tree, Table, InputNumber, Button, Modal, Select, message, Tabs } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { countQExam, createExam, createExam3T, loadbExam, loadbExams } from "../../services/api";

const { TreeNode } = Tree;
const { Option } = Select;

const partMapping = {
  mcq: { label: "Trắc nghiệm (40 câu)", typeId: 1, required: 40 },
  tf: { label: "Đúng/Sai (8 câu)", typeId: 2, required: 8 },
  fill: { label: "Điền số (6 câu)", typeId: 3, required: 6 },
};

const ExamCreation3T = () => {
  const navigate = useNavigate();

  // State cho ngân hàng câu hỏi và chi tiết phần bank
  const [banks, setBanks] = useState([]);
  const [selectedBankDetails, setSelectedBankDetails] = useState(null);
  const [sections, setSections] = useState([]); // Dữ liệu cây từ ngân hàng

  // Modal chọn ngân hàng
  const [isBankModalVisible, setBankModalVisible] = useState(false);

  // State chứa các mục được chọn theo từng phần: mcq, tf, fill
  const [selectedTopics, setSelectedTopics] = useState({
    mcq: [],
    tf: [],
    fill: [],
  });
  
  // Tab active, mặc định hiển thị phần trắc nghiệm (mcq)
  const [activePart, setActivePart] = useState("mcq");

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
      setSelectedBankDetails(response.data);
      const sectionsData = response.data.sections ?? [];

      // Tạo cấu trúc để hiển thị dạng cây
      const bankNode = {
        key: `bank-${response.data.bankId}`,
        title: response.data.bankName,
        children: sectionsData.map((section) => ({
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

  // Khi chọn một node của cây, chỉ cho phép chọn nếu đó là section (không phải ngân hàng)
  const onSelect = async (keys, info) => {
    if (info.node.key.startsWith("bank-")) {
      message.warning("Không thể chọn ngân hàng, chỉ chọn được section.");
      return;
    }
    
    // Nếu mục đã được chọn ở phần active rồi thì không thêm nữa
    if (selectedTopics[activePart].some((item) => item.key === info.node.key)) {
      return;
    }
    
    try {
      // Lấy id section (loại bỏ "section-")
      const sectionId = info.node.key.replace("section-", "");
      // Lấy typeId từ mapping của phần hiện tại (mcq, tf, fill)
      const { typeId } = partMapping[activePart];
      // Gọi API countQExam để lấy số câu khả dụng theo cấp độ (dễ, trung bình, khó)
      const response = await countQExam(sectionId, typeId);
      // Giả sử API trả về mảng đối tượng dạng: 
      // [{ level: "Basic", count: số }, { level: "Intermediate", count: số }, { level: "Advanced", count: số }]
      const levelMapping = { Basic: "easy", Intermediate: "medium", Advanced: "hard" };
      const questionCounts = response.data.reduce((acc, item) => {
        const levelKey = levelMapping[item.level] || item.level;
        acc[levelKey] = item.count || 0;
        return acc;
      }, { easy: 0, medium: 0, hard: 0 });
      
      // Thêm mục mới vào state của phần active với các giá trị mặc định cho levels và maxLevels
      setSelectedTopics((prev) => ({
        ...prev,
        [activePart]: [
          ...prev[activePart],
          {
            key: info.node.key,
            title: info.node.title,
            levels: { easy: 0, medium: 0, hard: 0 },
            maxLevels: questionCounts,
          },
        ],
      }));
    } catch (error) {
      console.error("Lỗi khi tải số lượng câu hỏi:", error);
      message.error("Không thể tải số lượng câu hỏi.");
    }
  };

  // Xóa mục được chọn theo phần và key
  const handleDelete = (part, key) => {
    setSelectedTopics((prev) => ({
      ...prev,
      [part]: prev[part].filter((item) => item.key !== key),
    }));
  };

  const handleBankSelect = (value) => {
    setBankModalVisible(false);
    fetchBankDetails(value);
  };

  // Xử lý thay đổi số lượng câu được chọn theo cấp độ
  const handleQuestionCountChange = (part, key, level, value) => {
    setSelectedTopics((prev) => ({
      ...prev,
      [part]: prev[part].map((item) =>
        item.key === key
          ? {
              ...item,
              levels: {
                ...item.levels,
                [level]: Math.min(value, item.maxLevels?.[level] ?? 0),
              },
            }
          : item
      ),
    }));
  };

  // Khi nhấn "Khởi tạo", gom dữ liệu của 3 phần lại rồi gọi API tạo đề thi
  const handleCreateExam = async () => {
    // Gom các mục từ 3 phần và thêm thông tin bắt buộc:
    // sectionId, số lượng câu theo cấp độ và typeId
    const examStructure = Object.entries(selectedTopics).flatMap(([part, items]) =>
      items.map((item) => ({
        sectionId: item.key.replace("section-", ""),
        typeId: partMapping[part].typeId,
        counts: { ...item.levels },
      }))
    );

    const examStructureJSON = JSON.stringify(examStructure);

    console.log(examStructureJSON);
    
    try {
      const response = await createExam3T(examStructure);
      if (response && response.data.examId) {
        navigate(`/exam/preview/${response.data.examId}`);
      } else {
        console.error("API không trả về examId hợp lệ:", response);
      }
    } catch (error) {
      console.error("Lỗi khi tạo đề thi:", error);
      message.error("Lỗi khi tạo đề thi.");
    }
  };

  // Hàm render bảng ma trận cho từng phần, với 3 cột cho cấp độ: Dễ, Trung bình, Khó
  const renderTable = (part) => {
    const required = partMapping[part].required;
    return (
      <div>
        <h3>
          {partMapping[part].label} (Yêu cầu: {required} câu)
        </h3>
        <Table
          columns={[
            { title: "STT", dataIndex: "index", key: "index", width: 50 },
            { title: "Nội dung kiến thức", dataIndex: "title", key: "title" },
            {
              title: "Dễ",
              dataIndex: "easy",
              key: "easy",
              render: (_, record) => (
                <InputNumber
                  min={0}
                  max={record.maxLevels?.easy ?? 0}
                  value={record.levels?.easy ?? 0}
                  onChange={(value) =>
                    handleQuestionCountChange(part, record.key, "easy", value)
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
                  max={record.maxLevels?.medium ?? 0}
                  value={record.levels?.medium ?? 0}
                  onChange={(value) =>
                    handleQuestionCountChange(part, record.key, "medium", value)
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
                  max={record.maxLevels?.hard ?? 0}
                  value={record.levels?.hard ?? 0}
                  onChange={(value) =>
                    handleQuestionCountChange(part, record.key, "hard", value)
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
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDelete(part, record.key)}
                />
              ),
            },
          ]}
          dataSource={selectedTopics[part].map((item, index) => ({
            ...item,
            index: index + 1,
          }))}
          rowKey="key"
          pagination={false}
          bordered
        />
      </div>
    );
  };

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
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 10,
        }}
      >
        <Button type="primary" onClick={handleCreateExam}>
          Khởi tạo
        </Button>
      </div>
      <div style={{ display: "flex", flex: 1 }}>
        {/* Panel trái: Ngân hàng câu hỏi */}
        <div
          style={{
            width: "25%",
            background: "#fff",
            padding: 10,
            borderRight: "1px solid #ddd",
            overflowY: "auto",
          }}
        >
          <Button icon={<PlusOutlined />} onClick={() => setBankModalVisible(true)}>
            Chọn ngân hàng câu hỏi
          </Button>
          <Modal
            title="Chọn Ngân Hàng Câu Hỏi"
            open={isBankModalVisible}
            onOk={() => {}}
            onCancel={() => setBankModalVisible(false)}
            footer={null}
          >
            <Select
              style={{ width: "100%" }}
              onChange={handleBankSelect}
              placeholder="Chọn ngân hàng"
            >
              {banks.map((bank) => (
                <Option key={bank.bankId} value={bank.bankId}>
                  {bank.bankName}
                </Option>
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
        {/* Panel phải: Các phần lựa chọn theo dạng Tab */}
        <div style={{ flex: 1, padding: 20, background: "#fff" }}>
          <Tabs activeKey={activePart} onChange={(key) => setActivePart(key)}>
            <Tabs.TabPane tab={partMapping["mcq"].label} key="mcq">
              {renderTable("mcq")}
            </Tabs.TabPane>
            <Tabs.TabPane tab={partMapping["tf"].label} key="tf">
              {renderTable("tf")}
            </Tabs.TabPane>
            <Tabs.TabPane tab={partMapping["fill"].label} key="fill">
              {renderTable("fill")}
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ExamCreation3T;
