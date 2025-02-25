import React from "react";
import { Select, Button, Collapse } from "antd";
import { useNavigate } from "react-router-dom";
import "tailwindcss/tailwind.css";

const { Panel } = Collapse;
const { Option } = Select;

const CreateQuestionBank = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/question-bank");
  };

  const detail = {
    title: "TẠO CẤU TRÚC NGÂN HÀNG CÂU HỎI",
    structure: [
      {
        title: "Số và phép tính",
        children: [
          {
            title: "Số tự nhiên",
            children: ["Các phép tính với số tự nhiên"],
          },
        ],
      },
      {
        title: "Hình học và đo lường",
        children: [
          {
            title: "Hình học trực quan",
            children: ["Hình phẳng và hình không gian", "Hình học tọa độ"],
          },
        ],
      },
      {
        title: "Một số yếu tố thống kê và xác suất",
        children: [
          {
            title: "Một số yếu tố xác suất",
            children: [],
          },
        ],
      },
    ],
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">{detail.title}</h1>

      {/* Combo Box Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <Select placeholder="Khối học" className="w-48">
          <Option value="1">Khối 1</Option>
          <Option value="2">Khối 2</Option>
          <Option value="3">Khối 3</Option>
        </Select>

        <Select placeholder="Môn học" className="w-48">
          <Option value="toan">Toán</Option>
          <Option value="ly">Lý</Option>
          <Option value="hoa">Hóa</Option>
        </Select>

        <Select placeholder="Giáo trình" className="w-48">
          <Option value="chuong-trinh-bo">Chương trình của bộ</Option>
          <Option value="chuong-trinh-dia-phuong">Chương trình địa phương</Option>
        </Select>
      </div>

      {/* Cấu trúc câu hỏi dạng mở rộng */}
      <div className="bg-white p-4 shadow-md rounded">
        <h2 className="text-xl font-semibold mb-4">Cấu trúc ngân hàng câu hỏi</h2>
        <Collapse accordion>
          {detail.structure.map((item, index) => (
            <Panel header={item.title} key={index}>
              <Collapse accordion>
                {item.children.map((subItem, subIndex) => (
                  <Panel header={subItem.title} key={`${index}-${subIndex}`}>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                      {subItem.children.length > 0 ? (
                        subItem.children.map((content, contentIndex) => (
                          <li key={`${index}-${subIndex}-${contentIndex}`}>{content}</li>
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

      {/* Button tạo ngân hàng */}
      <div className="flex justify-center mt-6">
        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white">
          Tạo cấu trúc ngân hàng
        </Button>
      </div>

      {/* Button quay lại */}
      <div className="flex justify-center mt-4">
        <Button className="bg-gray-300 hover:bg-gray-400 text-black" onClick={handleBack}>
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default CreateQuestionBank;
