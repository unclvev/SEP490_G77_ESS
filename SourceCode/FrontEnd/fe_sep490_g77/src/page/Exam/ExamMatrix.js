import React, { useState } from "react";
import { Tree, Table, InputNumber, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { TreeNode } = Tree;

const questionBank = [
  {
    title: "Chương I: Đại số",
    key: "1",
    children: [
      {
        title: "Bài 1: Phương trình bậc 2",
        key: "2",
        children: [
          {
            title: "Phần 1: Dạng cơ bản",
            key: "3",
            children: [
              { title: "Ví dụ 1", key: "4" },
              { title: "Ví dụ 2", key: "5" }
            ]
          },
          {
            title: "Phần 2: Dạng nâng cao",
            key: "6",
            children: [{ title: "Bài tập 1", key: "7" }]
          }
        ]
      },
      {
        title: "Bài 2: Hệ phương trình",
        key: "8",
        children: [
          { title: "Phần 1: Lý thuyết", key: "9" },
          { title: "Phần 2: Bài tập", key: "10" }
        ]
      }
    ]
  },
  {
    title: "Chương II: Hình học",
    key: "11",
    children: [
      {
        title: "Bài 1: Hình tam giác",
        key: "12",
        children: [
          {
            title: "Phần 1: Lý thuyết",
            key: "13",
            children: [
              { title: "Định nghĩa", key: "14" },
              {
                title: "Định lý",
                key: "15",
                children: [
                  { title: "Định lý 1", key: "16" },
                  {
                    title: "Định lý 2",
                    key: "17",
                    children: [
                      {
                        title: "Hệ quả 1",
                        key: "18",
                        children: [{ title: "Ví dụ 1", key: "19" }]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          { title: "Phần 2: Bài tập", key: "20" }
        ]
      }
    ]
  },
  {
    title: "Chương III: Xác suất - Thống kê",
    key: "21",
    children: [
      { title: "Bài 1: Tổ hợp", key: "22" },
      { title: "Bài 2: Xác suất", key: "23" }
    ]
  }
];

const ExamCreation = () => {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);

  const onSelect = (keys, info) => {
    const topicExists = selectedTopics.some((item) => item.key === info.node.key);
    if (!topicExists) {
      setSelectedTopics([...selectedTopics, { key: info.node.key, title: info.node.title, levels: {} }]);
    }
  };

  const handleInputChange = (key, level, type, value) => {
    setSelectedTopics((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, levels: { ...item.levels, [level]: { ...item.levels[level], [type]: value } } }
          : item
      )
    );
  };

  const handleDelete = (key) => {
    setSelectedTopics((prev) => prev.filter((item) => item.key !== key));
  };

  const levels = ["Nhận biết", "Thông hiểu", "Vận dụng"];
  const columns = [
    { title: "STT", dataIndex: "index", key: "index", width: 50 },
    { title: "Nội dung kiến thức", dataIndex: "title", key: "title" },
    ...levels.flatMap((level) => [
      {
        title: level,
        children: [
          {
            title: "Số TN",
            dataIndex: ["levels", level, "mcq"],
            key: `${level}-mcq`,
            render: (text, record) => (
              <InputNumber
                min={0}
                value={text || 0}
                onChange={(value) => handleInputChange(record.key, level, "mcq", value)}
              />
            ),
          },
          {
            title: "Số TL",
            dataIndex: ["levels", level, "essay"],
            key: `${level}-essay`,
            render: (text, record) => (
              <InputNumber
                min={0}
                value={text || 0}
                onChange={(value) => handleInputChange(record.key, level, "essay", value)}
              />
            ),
          },
        ],
      },
    ]),
    {
      title: "Xóa",
      dataIndex: "delete",
      key: "delete",
      render: (_, record) => (
        <Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.key)} />
      ),
    },
  ];

  // Hàm đệ quy render TreeNode
  const renderTreeNodes = (data) =>
    data.map((item) => {
      if (item.children) {
        return (
          <TreeNode title={item.title} key={item.key}>
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={item.title} key={item.key} />;
    });

  return (
    <div style={{ display: "flex", height: "100vh", padding: 20, background: "#f5f5f5" }}>
      <div style={{ width: "25%", background: "#fff", padding: 10, borderRight: "1px solid #ddd", overflowY: "auto" }}>
        <h3>Ngân hàng câu hỏi</h3>
        <Tree onSelect={onSelect} defaultExpandAll>
          {renderTreeNodes(questionBank)}
        </Tree>
      </div>
      <div style={{ flex: 1, padding: 20, background: "#fff" }}>
        <h3>Ma trận đề thi</h3>
        <Table
          columns={columns}
          dataSource={selectedTopics.map((item, index) => ({ ...item, index: index + 1 }))}
          rowKey="key"
          pagination={false}
          bordered
        />
      </div>
      <div style={{ position: "absolute", bottom: 20, right: 20 }}>
        <Button danger style={{ marginRight: 10 }} onClick={() => navigate("/")}>
          Hủy
        </Button>
        <Button type="primary" onClick={() => navigate("/exam/preview")}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
};

export default ExamCreation;
