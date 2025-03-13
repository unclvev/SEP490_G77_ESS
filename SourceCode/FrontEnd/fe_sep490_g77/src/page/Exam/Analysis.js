import { LeftOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Table } from "antd";
import React from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
  

const Analysis = () => {
  // Dữ liệu bảng điểm
  const scoreData = [
    {
      key: "1",
      studentId: "021",
      name: "Phạm Hoàng Long",
      qrCode: "Ẩn để mở",
      time: "10:56 19-2-2025",
      score: 10,
    },
    {
      key: "2",
      studentId: "021",
      name: "Phạm Hoàng Long",
      qrCode: "Ẩn để mở",
      time: "10:56 19-2-2025",
      score: 10,
    },
  ];

  // Dữ liệu biểu đồ
  const chartData = [
    { range: "<3", count: 0 },
    { range: "<6", count: 2 },
    { range: "<7", count: 0 },
    { range: "<8", count: 0 },
    { range: "<10", count: 1 },
  ];

  // Cột bảng điểm
  const columns = [
    {
      title: "Thông tin thí sinh",
      dataIndex: "name",
      key: "name",
      render: (text, record) => `SBD: ${record.studentId} Tên: ${text}`,
    },
    {
      title: "Mã QR bài làm",
      dataIndex: "qrCode",
      key: "qrCode",
    },
    {
      title: "Thời gian vào điểm",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "Điểm số",
      dataIndex: "score",
      key: "score",
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-4">
        <LeftOutlined className="text-xl cursor-pointer" />
        <h2 className="text-lg font-semibold ml-3">THỐNG KÊ</h2>
      </div>

      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <h3 className="font-semibold mb-2">CƠ BẢN</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>TÊN BÀI THI:</strong></p>
            <p><strong>ĐIỂM TRUNG BÌNH:</strong> 6</p>
            <p><strong>MÔN:</strong></p>
            <p><strong>CAO NHẤT:</strong> 8</p>
            <p><strong>NGÀY TẠO:</strong></p>
            <p><strong>THẤP NHẤT:</strong> 4</p>
            <p><strong>SỐ BÀI LÀM:</strong> 4</p>
            <p><strong>TỈ LỆ TRÊN 5:</strong> 66.66%</p>
            <p></p>
            <p><strong>TỈ LỆ TRÊN 8:</strong> 33.33%</p>
          </div>
        </Card>

        {/* Xuất dữ liệu */}
        <Card>
          <h3 className="font-semibold mb-2">XUẤT DỮ LIỆU</h3>
          <div className="flex flex-col gap-2">
            <Checkbox checked>Bảng điểm</Checkbox>
            <Checkbox checked>Phổ điểm</Checkbox>
            <Checkbox checked>Tỉ lệ đúng/sai theo câu hỏi</Checkbox>
          </div>
          <Button type="primary" className="mt-4 w-full">
            Xuất thành excel
          </Button>
        </Card>
      </div>

      {/* Biểu đồ */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">BIỂU ĐỒ</h3>
        <div className="bg-white p-4 rounded-lg shadow">
        <div className="bg-white p-4 rounded-lg shadow">
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="range" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="count" fill="#1890ff" />
    </BarChart>
  </ResponsiveContainer>
</div>

        </div>
      </div>

      {/* Bảng điểm */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">BẢNG ĐIỂM</h3>
        <Table
          columns={columns}
          dataSource={scoreData}
          pagination={false}
          className="bg-white rounded-lg shadow"
        />
      </div>
    </div>
  );
};

export default Analysis;
