import React from "react";
import { Button, Select, Input, List, Card } from "antd";
import "tailwindcss/tailwind.css";

const { Option } = Select;
const { TextArea } = Input;

const QuestionList = () => {
  // Kiểm tra nếu dữ liệu không có, trang sẽ hiển thị "Không có dữ liệu"
  const questions = [
    {
      id: 1,
      content: "Có 10 tấm thẻ được đánh số từ 1 đến 10. Chọn ngẫu nhiên 2 tấm thẻ. Xác suất để chọn được 2 tấm thẻ đều ghi số chẵn là",
      answers: ["1/4", "2/9", "1/2", "2"],
      correct: "2/9",
    },
    {
      id: 2,
      content: "Một nhóm 9 học sinh gồm 5 học sinh nam và 4 học sinh nữ, chọn ngẫu nhiên 5 học sinh. Xác suất để có học sinh nam nhiều hơn học sinh nữ là",
      answers: ["1/4", "2/9", "1/2", "2"],
      correct: "1/2",
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-center mb-6">TẠO CÂU HỎI</h1>

      <div className="grid grid-cols-2 gap-4">
        {/* Bên trái - Danh sách câu hỏi */}
        <div className="bg-white p-4 shadow-md rounded">
          <h2 className="text-lg font-semibold mb-4">Danh sách câu hỏi</h2>
          {questions.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={questions}
              renderItem={(question, index) => (
                <List.Item key={question.id}>
                  <Card title={`Câu ${index + 1}`} className="mb-2">
                    <p>{question.content}</p>
                    <ul className="list-disc ml-4">
                      {question.answers.map((ans, i) => (
                        <li key={i} className={ans === question.correct ? "text-green-600 font-bold" : ""}>
                          {ans}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <p className="text-gray-500 text-center">Không có câu hỏi nào</p>
          )}
        </div>

        {/* Bên phải - Khu vực nhập câu hỏi */}
        <div className="bg-gray-50 p-4 shadow-md rounded">
          <h2 className="text-lg font-semibold mb-4">Thêm câu hỏi</h2>
          <div className="mb-4">
            <Select defaultValue="Nhận biết" className="w-32 mr-2">
              <Option value="nhan-biet">Nhận biết</Option>
              <Option value="thong-hieu">Thông hiểu</Option>
              <Option value="van-dung">Vận dụng</Option>
            </Select>
            <Select defaultValue="Trắc nghiệm" className="w-32">
              <Option value="trac-nghiem">Trắc nghiệm</Option>
              <Option value="tu-luan">Tự luận</Option>
            </Select>
          </div>

          <TextArea rows={4} placeholder="Nhập nội dung câu hỏi" className="mb-4" />

          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Đáp án A" />
            <Input placeholder="Đáp án B" />
            <Input placeholder="Đáp án C" />
            <Input placeholder="Đáp án D" />
          </div>

          <Button type="primary" className="mt-4 bg-blue-500 hover:bg-blue-600 w-full">
            Thêm câu hỏi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionList;
