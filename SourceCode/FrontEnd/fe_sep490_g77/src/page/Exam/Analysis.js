import { LeftOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Table, Tabs } from "antd";
import { React, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#DC143C"];

// Cột bảng điểm đầy đủ
const columns = [
  { title: "STT", dataIndex: "order", key: "order", width: 60, render: (_, __, index) => index + 1 },
  { title: "SBD", dataIndex: "studentId", key: "studentId" },
  { title: "Họ và tên", dataIndex: "name", key: "name" },
  { title: "Lớp học", dataIndex: "class", key: "class" },
  { title: "Mã đề thi", dataIndex: "examCode", key: "examCode" },
  { title: "Thời gian vào điểm", dataIndex: "time", key: "time" },
  { title: "Điểm số", dataIndex: "score", key: "score" },
  { title: "Xếp hạng", dataIndex: "rank", key: "rank" },
];

// Cột bảng Top 5
const top5Columns = [
  { title: "Họ và tên", dataIndex: "name", key: "name" },
  { title: "Mã đề", dataIndex: "examCode", key: "examCode" },
  { title: "Điểm", dataIndex: "score", key: "score" },
  { title: "Xếp hạng", dataIndex: "rank", key: "rank" },
];

const Analysis = () => {

  const [scoreData, setScoreData] = useState([
    { key: "1", studentId: "021", name: "Phạm Hồng Long", class: "12A1", examCode: "M01", time: "10:56 19-2-2025", score: 10 },
    { key: "2", studentId: "015", name: "Phọng Hoàng Lam", class: "12A3", examCode: "M02", time: "10:58 19-2-2025", score: 9 },
    { key: "3", studentId: "032", name: "Nguyễn Ngọc Việt", class: "12A1", examCode: "M03", time: "10:50 19-2-2025", score: 8 },
    { key: "4", studentId: "007", name: "Lê Quang Trung", class: "12K", examCode: "M02", time: "10:45 19-2-2025", score: 7 },
  ]);

  // Sắp xếp theo điểm từ cao xuống thấp để xếp hạng
  const rankedData = [...scoreData].sort((a, b) => b.score - a.score).map((student, index) => ({
    ...student,
    rank: index + 1,
  }));

  const [chartData, setChartData] = useState([
    { range: "<3", count: 0 },
    { range: "<6", count: 2 },
    { range: "<7", count: 0 },
    { range: "<8", count: 0 },
    { range: "<10", count: 1 },
  ]);

  const [lineChartData, setLineChartData] = useState([
    { score: 6, students: 3 },
    { score: 7, students: 8 },
    { score: 8, students: 12 },
    { score: 9, students: 6 },
    { score: 10, students: 4 },
  ]);

  const [pieChartData, setPieChartData] = useState([
    { name: "Xuất sắc (>9)", value: 10 },
    { name: "Giỏi (8 - 9)", value: 20 },
    { name: "Khá (6.5 - 8)", value: 30 },
    { name: "Trung bình (5 - 6.5)", value: 25 },
    { name: "Dưới trung bình (<5)", value: 15 },
  ]);

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
          <h3 className="font-semibold mb-2">Cơ bản</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Tên bài thi:</strong></p>
            <p><strong>Điểm trung bình:</strong> 6</p>
            <p><strong>Môn:</strong></p>
            <p><strong>Cao nhất:</strong> 8</p>
            <p><strong>Ngày tạo:</strong></p>
            <p><strong>Thấp nhất:</strong> 4</p>
            <p><strong>Số bài làm:</strong> 4</p>
            <p><strong>Tỉ lệ trên 5:</strong> 66.66%</p>
            <p></p>
            <p><strong>Tỉ lệ trên 8:</strong> 33.33%</p>
          </div>
        </Card>

        {/* Xuất dữ liệu */}
        <Card>
          <h3 className="font-semibold mb-2">Xuất dữ liệu</h3>
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

      {/* Tabs Biểu đồ & Bảng điểm */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <Tabs defaultActiveKey="1">
          {/* Tab Biểu đồ */}
          <Tabs.TabPane tab="Biểu đồ" key="1">
            <div className="p-4">
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
          </Tabs.TabPane>

          {/* Tab Bảng điểm */}
          <Tabs.TabPane tab="Bảng điểm" key="2">
            <div className="p-4">
              <Table columns={columns} dataSource={rankedData} pagination={false} />
            </div>
          </Tabs.TabPane>

          {/* Tab Biểu đồ Đường */}
          <Tabs.TabPane tab="Biểu đồ Đường" key="3">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" label={{ value: "Điểm", position: "insideBottom", dy: 10 }} />
                  <YAxis label={{ value: "Số học sinh", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#1890ff" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Tabs.TabPane>

          {/* Tab Biểu đồ Tròn */}
          <Tabs.TabPane tab="Biểu đồ Tròn" key="4">
            <div className="p-4 flex justify-center">
              <ResponsiveContainer width={400} height={300}>
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" outerRadius={100} label>
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Tabs.TabPane>

          {/* Tab Bảng Top 5 */}
          <Tabs.TabPane tab="Bảng Top 5" key="5">
            <div className="p-4">
              <Table columns={top5Columns} dataSource={rankedData.slice(0, 5)} pagination={false} />
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default Analysis;
