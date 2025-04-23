import { LeftOutlined } from "@ant-design/icons";
import { Button, Card, Table, Tabs } from "antd";
import { React, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

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
import { exportExcel, getExamResults, getSubjectNameById } from "../../services/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#DC143C"];
const columns = [
  { title: "STT", dataIndex: "order", key: "order", width: 60, render: (_, __, index) => index + 1 },
  { title: "SBD", dataIndex: "studentId", key: "studentId" },
  { title: "Họ và tên", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
  { title: "Lớp học", dataIndex: "class", key: "class" },
  { title: "Mã đề thi", dataIndex: "examCode", key: "examCode" },
  { title: "Thời gian vào điểm", dataIndex: "time", key: "time" },
  { title: "Điểm số", dataIndex: "score", key: "score" },
  { title: "Xếp hạng", dataIndex: "rank", key: "rank", sorter: (a, b) => a.rank - b.rank },
];
const top5Columns = [
  { title: "Họ và tên", dataIndex: "name", key: "name" },
  { title: "Mã đề", dataIndex: "examCode", key: "examCode" },
  { title: "Điểm", dataIndex: "score", key: "score" },
  { title: "Xếp hạng", dataIndex: "rank", key: "rank" },
];

const Analysis = () => {

    const [loading, setLoading] = useState(true);
    const [scoreData, setScoreData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [lineChartData, setLineChartData] = useState([]);
    const [pieChartData, setPieChartData] = useState([]);
    const [examName, setExamName] = useState("");
    const [subjectName, setSubjectName] = useState("");
    const [createdate, setCreatedate] = useState("");
    const [basicStats, setBasicStats] = useState({});
    const { examId } = useParams();

    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await getExamResults(examId);
          const data = response.data || [];
          console.log(data[0]);
          const rsubject = await getSubjectNameById(data[0].subject);

          setScoreData(data);
          setLoading(false);
          setExamName(data[0].examName);
          setSubjectName(rsubject.data.subjectName);
          setCreatedate(data[0].examCreatedDate);

          // ==== Tính biểu đồ cột (chartData) ====
          const ranges = ["<3", ">=3 & <6", ">=6 & <7", ">=7 & <8", "8 - 10"];
          const chartCount = [0, 0, 0, 0, 0];
          data.forEach(s => {
            const score = s.score;
            if (score < 3) chartCount[0]++;
            else if (score < 6) chartCount[1]++;
            else if (score < 7) chartCount[2]++;
            else if (score < 8) chartCount[3]++;
            else if (score <= 10) chartCount[4]++;
          });
          const newChartData = ranges.map((r, i) => ({ range: r, count: chartCount[i] }));
          setChartData(newChartData);
    
          // Tính biểu đồ đường (lineChartData)
          const scoreMap = {};
          data.forEach(s => {
            const score = s.score;
            scoreMap[score] = (scoreMap[score] || 0) + 1;
          });
          const lineData = Object.entries(scoreMap)
            .map(([score, count]) => ({ score: parseFloat(score), students: count }))
            .sort((a, b) => a.score - b.score);
          setLineChartData(lineData);
          // ==== Tính biểu đồ tròn (pieChartData) ====
          const pieStat = {
            "Xuất sắc (>=9)": 0,
            "Giỏi (>=8 & <9)": 0,
            "Khá (>=6.5 &  <8)": 0,
            "Trung bình (>=5 & <6.5)": 0,
            "Dưới trung bình (<5)": 0,
          };
          data.forEach(s => {
            const score = s.score;
            if (score >= 9) pieStat["Xuất sắc (>=9)"]++;
            else if (score >= 8) pieStat["Giỏi (>=8 & <9)"]++;
            else if (score >= 6.5) pieStat["Khá (>=6.5 &  <8)"]++;
            else if (score >= 5) pieStat["Trung bình (>=5 & <6.5)"]++;
            else pieStat["Dưới trung bình (<5)"]++;
          });
          const pieData = Object.entries(pieStat).map(([name, value]) => ({ name, value }));
          setPieChartData(pieData);

          // ==== Tính thông tin cơ bản ====
          const scores = data.map((s) => s.score);
          const total = scores.length;
          const avg = total > 0 ? (scores.reduce((a, b) => a + b, 0) / total).toFixed(2) : 0;
          const max = total > 0 ? Math.max(...scores) : 0;
          const min = total > 0 ? Math.min(...scores) : 0;
          const over5 = total > 0 ? ((scores.filter(s => s > 5).length / total) * 100).toFixed(2) : 0;
          const over8 = total > 0 ? ((scores.filter(s => s > 8).length / total) * 100).toFixed(2) : 0;
          setBasicStats({
            total,
            avg,
            max,
            min,
            over5,
            over8
          });
        } catch (error) {
          toast.error("Lỗi khi lấy danh sách đề thi!");
          console.error("Error fetching exams:", error);
        }
      };
    
      fetchData();
    }, []);    
  
    const handleExportExcel = async () => {
      try {
        const response = await exportExcel(examId);
        if (response.status === 200) {
          const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "BangDiem.xlsx";
          link.click();
        } else {
          toast.error("Không thể tải file Excel");
        }
      } catch (error) {
        console.error("Error exporting Excel:", error);
        toast.error("Lỗi khi xuất file Excel");
      }
    };

    const rankedData = [...scoreData]
    .sort((a, b) => b.score - a.score)
    .map((student, index, arr) => {
      let rank = index + 1;
      if (index > 0 && arr[index - 1].score === student.score) {
        rank = index;
      }
      return { ...student, rank };
    });

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
          <p><strong>Tên bài thi:</strong> {examName}</p>
          <p><strong>Điểm trung bình:</strong> {basicStats.avg}</p>
          <p><strong>Môn:</strong> {subjectName}</p>
          <p><strong>Cao nhất:</strong> {basicStats.max}</p>
          <p><strong>Ngày tạo:</strong> {createdate}</p>
          <p><strong>Thấp nhất:</strong> {basicStats.min}</p>
          <p><strong>Số bài làm:</strong> {basicStats.total}</p>
          <p><strong>Tỉ lệ trên 5:</strong> {basicStats.over5}%</p>
          <p></p>
          <p><strong>Tỉ lệ trên 8:</strong> {basicStats.over8}%</p>
        </div>
      </Card>

        {/* Xuất dữ liệu */}
        <Card>
          <h3 className="font-semibold mb-2">Xuất dữ liệu</h3>
          <div className="flex flex-col gap-2">
            <div>- Phân tích cơ bản</div>
            <div>- Bảng điểm</div>
            {/* <Checkbox checked>Tỉ lệ đúng/sai theo câu hỏi</Checkbox> */}
          </div>
          <Button type="primary" className="mt-4 w-full" onClick={() => handleExportExcel(examId)}>
            Xuất ra excel
          </Button>
        </Card>
      </div>

      {/* Tabs Biểu đồ & Bảng điểm */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <Tabs defaultActiveKey="1">
          {/* Tab Bảng điểm */}
          <Tabs.TabPane tab="Bảng điểm" key="2">
            <div className="p-4">
                <Table 
                  columns={columns} 
                  dataSource={rankedData} 
                  pagination={false} 
                  rowKey="studentId" 
                />
              </div>
            </Tabs.TabPane>

            {/* Tab Biểu đồ */}
          <Tabs.TabPane tab="Thống kê" key="1">
            {/*biểu đồ cột*/}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>1. BIỂU ĐỒ CỘT THỂ HIỆN SỐ HỌC SINH THEO CÁC KHUNG ĐIỂM</strong></p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(value) => Number.isInteger(value) ? value : null}
                    label={{ value: "Số học sinh", angle: -90, position: "insideLeft" }} 
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/*biểu đồ đường*/}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>2. BIỂU ĐỒ ĐƯỜNG THỐNG KÊ SỐ HỌC SINH THEO ĐIỂM SỐ CỤ THỂ</strong></p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="score" label={{ value: "Điểm", position: "insideBottom", dy: 10 }} />
                  <YAxis 
                    allowDecimals={false}
                    tickFormatter={(value) => Number.isInteger(value) ? value : null}
                    label={{ value: "Số học sinh", angle: -90, position: "insideLeft" }} 
                  />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#1890ff" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/*biểu đồ tròn*/}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>3. BIỂU ĐỒ TRÒN ĐÁNH GIÁ TỈ LỆ HỌC SINH THEO HỌC LỰC QUA BÀI KIỂM TRA</strong></p>
            </div>
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

            {/* Top 5 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>4. TOP 5 HỌC SINH CAO ĐIỂM NHẤT</strong></p>
            </div>
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
