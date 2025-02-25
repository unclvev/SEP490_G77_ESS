import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Collapse, Dropdown, Menu } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import "tailwindcss/tailwind.css";

const { Panel } = Collapse;

const QuestionBankDetail = () => {
  const navigate = useNavigate();

  // Điều hướng đến trang phân quyền
  const handleNavigateDecentralization = () => {
    navigate("/decentralization");
  };

  // Điều hướng đến trang danh sách câu hỏi
  const handleNavigateQuestionList = () => {
    navigate("/question-list");
  };

  // Cấu trúc câu hỏi
  const detail = {
    id: 2,
    title: "NGÂN HÀNG CÂU HỎI TOÁN 2",
    structure: [
      {
        title: "Số và phép tính",
        children: [{ title: "Số tự nhiên", children: ["Các phép tính với số tự nhiên"] }],
      },
      {
        title: "Hình học và đo lường",
        children: [{ title: "Hình học trực quan", children: ["Hình phẳng và hình không gian", "Hình học tọa độ"] }],
      },
      {
        title: "Một số yếu tố thống kê và xác suất",
        children: [{ title: "Một số yếu tố xác suất", children: [] }],
      },
    ],
  };

  // Menu cho dấu ba chấm
  const menu = (
    <Menu>
      <Menu.Item key="1" icon={<PlusOutlined />}>Thêm cấu trúc con</Menu.Item>
      <Menu.Item key="2" icon={<EditOutlined />}>Sửa</Menu.Item>
      <Menu.Item key="3" icon={<DeleteOutlined />} danger>Xóa</Menu.Item>
    </Menu>
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Tiêu đề */}
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">{detail.title}</h1>

      {/* Nhóm nút chức năng */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">Cấu trúc</Button>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white" onClick={handleNavigateDecentralization}>
            Phân quyền
          </Button>
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white" onClick={handleNavigateQuestionList}>
            Xem số lượng câu hỏi
          </Button>
        </div>

        <div className="flex gap-4">
          <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white">+ Tạo câu hỏi trong ngân hàng</Button>
          <Button className="bg-blue-100 hover:bg-blue-200">+ Nhập câu hỏi</Button>
        </div>
      </div>

      {/* Cấu trúc câu hỏi dưới dạng Collapse */}
      <div className="bg-white p-4 shadow-md rounded">
        <h2 className="text-xl font-semibold mb-4">Cấu trúc ngân hàng câu hỏi</h2>
        <Collapse accordion>
          {detail.structure.map((item, index) => (
            <Panel
              header={
                <div className="flex justify-between items-center">
                  <span>{item.title}</span>
                  <Dropdown overlay={menu} trigger={["click"]}>
                    <MoreOutlined className="text-xl cursor-pointer" />
                  </Dropdown>
                </div>
              }
              key={index}
            >
              <Collapse accordion>
                {item.children.map((subItem, subIndex) => (
                  <Panel
                    header={
                      <div className="flex justify-between items-center">
                        <span>{subItem.title}</span>
                        <Dropdown overlay={menu} trigger={["click"]}>
                          <MoreOutlined className="text-xl cursor-pointer" />
                        </Dropdown>
                      </div>
                    }
                    key={`${index}-${subIndex}`}
                  >
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {subItem.children.length > 0 ? (
                        subItem.children.map((content, contentIndex) => (
                          <li key={`${index}-${subIndex}-${contentIndex}`} className="flex justify-between">
                            {content}
                            <Dropdown overlay={menu} trigger={["click"]}>
                              <MoreOutlined className="text-xl cursor-pointer" />
                            </Dropdown>
                          </li>
                        ))
                      ) : (
                        <li className="italic text-gray-500">Không có nội dung</li>
                      )}
                    </ul>
                  </Panel>
                ))}
              </Collapse>
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default QuestionBankDetail;
