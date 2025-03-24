import React, { useState } from "react";
import { Input, Select, Button, Card, Pagination, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
const { Search } = Input;
const { Option } = Select;

const mockData = Array.from({ length: 20 }, (_, i) => {
  const day = (i % 28) + 1;
  const month = ((i % 12) + 1).toString().padStart(2, '0');
  const date = `2025-${month}-${day.toString().padStart(2, '0')}`;

  const grade = `Khối ${10 + (i % 3)}`; 

  return {
    id: i + 1,
    title: `Đề tự luận số ${i + 1}`,
    grade: grade,
    subject: ["Toán", "Lý", "Hóa", "Văn"][i % 4],
    nameClass: `${grade}A${i}`, 
    createdDate: date,
  };
});

const CreateEssayExam = () => {
  const [searchText, setSearchText] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 8;

  const filteredData = mockData.filter((item) => {
    const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase());
    const matchGrade = selectedGrade ? item.grade === selectedGrade : true;
    const matchSubject = selectedSubject ? item.subject === selectedSubject : true;
    return matchSearch && matchGrade && matchSubject;
  });
  const navigate = useNavigate();
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <Search
          placeholder="Tìm đề theo tên..."
          onSearch={(value) => setSearchText(value)}
          allowClear
          className="w-64"
        />
        <Select
          placeholder="Chọn khối"
          className="w-40"
          allowClear
          onChange={setSelectedGrade}
        >
          <Option value="Khối 10">Khối 10</Option>
          <Option value="Khối 11">Khối 11</Option>
          <Option value="Khối 12">Khối 12</Option>
        </Select>
        <Select
          placeholder="Chọn môn"
          className="w-40"
          allowClear
          onChange={setSelectedSubject}
        >
          <Option value="Toán">Toán</Option>
          <Option value="Lý">Lý</Option>
          <Option value="Hóa">Hóa</Option>
          <Option value="Văn">Văn</Option>
        </Select>

        <Button type="primary" className="mt-2 sm:mt-0">
            Tạo đề
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {paginatedData.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={6}>
            <Card title={item.title} className="rounded-xl shadow-md">
              <p>{item.grade} - {item.subject}</p>
              <p className="text-sm text-gray-500">Ngày tạo {item.createdDate}</p>
              <p className="text-sm text-gray-500">Lớp {item.nameClass}</p>
              <div className="mt-4 flex justify-between">
                <Button
                  type="primary"
                  onClick={() => navigate("/essay/import")}
                >
                  Import
                </Button>
                <Button
                  onClick={() =>
                    navigate(`/essay/genqr`, {
                      state: {
                        title: item.title,
                        createdDate: item.createdDate,
                        grade: item.grade,
                        subject: item.subject,
                        nameClass: item.nameClass
                      },
                    })
                  }
                >
                  Gen QR Code
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mt-6 text-center">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredData.length}
          onChange={(page) => setCurrentPage(page)}
        />
      </div>
    </div>
  );
};

export default CreateEssayExam;
