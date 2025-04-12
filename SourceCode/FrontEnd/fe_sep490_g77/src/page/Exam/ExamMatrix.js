import React, { useState } from "react";
import { Tree, Table, InputNumber, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { TreeNode } = Tree;

const questionBank = [
  {
    title: "Chương I",
    key: "chuong-1",
    children: [],
  },
  {
    title: "Chương II",
    key: "chuong-2",
    children: [
      {
        title: "Bài 1: Phương trình bậc 4",
        key: "bai-1",
      },
      {
        title: "Bài 2: Hệ phương trình 2 ẩn",
        key: "bai-2",
      },
    ],
  },
];

const ExamCreation = () => {
  const navigate = useNavigate();
  const [selectedTopics, setSelectedTopics] = useState([]);

  const onSelect = (keys, info) => {
    if (!info.node.children) {
      const topicExists = selectedTopics.some((item) => item.key === info.node.key);
      if (!topicExists) {
        setSelectedTopics([...selectedTopics, { key: info.node.key, title: info.node.title, levels: {} }]);
      }
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

  return (
    <div style={{ display: "flex", height: "100vh", padding: 20, background: "#f5f5f5" }}>
      <div style={{ width: "25%", background: "#fff", padding: 10, borderRight: "1px solid #ddd" }}>
        <h3>Ngân hàng câu hỏi</h3>
        <Tree onSelect={onSelect} defaultExpandAll>
          {questionBank.map((chapter) => (
            <TreeNode title={chapter.title} key={chapter.key}>
              {chapter.children?.map((lesson) => (
                <TreeNode title={lesson.title} key={lesson.key} />
              ))}
            </TreeNode>
          ))}
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
        <Button danger style={{ marginRight: 10 }} onClick={() => navigate("/")}>Hủy</Button>
        <Button type="primary" onClick={() => navigate("/exam/preview")}>Tiếp tục</Button>
      </div>
    </div>
  );
};

export default ExamCreation;