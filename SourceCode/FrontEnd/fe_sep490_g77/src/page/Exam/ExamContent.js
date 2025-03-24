import { React, useEffect, useState } from "react";
import { Card, Button, List } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUser, faChartBar, faPlus, faGear } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserSearchModal from "../../components/Exam/usersearch";
import Swal from "sweetalert2";
import { useSearchParams } from "react-router-dom";
import { getExam } from "../../services/api";

const ExamDetail = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await getExam(id);
        //if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.data;
        const examData = JSON.parse(data.examdata); // Giải mã chuỗi JSON trong `Examdata`

        setExamInfo({
          title: data.examname,
          createdAt: new Date(data.createdate).toLocaleString(),
          creator: "Unknown", // Có thể cần API khác để lấy tên người tạo từ `AccId`
          attempts: 0, // Thêm nếu API có trả về số lượt làm
        });

        setQuestions(examData.Questions);
      } catch (error) {
        console.error("Error fetching exam:", error);
        toast.error("Lỗi khi tải dữ liệu bài thi");
      }
    };

    fetchExam();
  }, [id]);

  const handleDelete = () => {
    Swal.fire({
      title: "Bạn có chắc chắn muốn xóa?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`https://your-api-url.com/exams/${id}`, { method: "DELETE" });
          Swal.fire("Đã xóa!", "Bài thi đã bị xóa.", "success");
        } catch (error) {
          Swal.fire("Lỗi!", "Không thể xóa bài thi.", "error");
        }
      }
    });
  };

  if (!examInfo) {
    return <p style={{ textAlign: "center", marginTop: 50 }}>Đang tải...</p>;
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f9f9f9" }}>
      {/* Sidebar */}
      <div style={{ width: 280, background: "#fff", padding: 20, borderRight: "2px solid #ddd", borderRadius: "8px" }}>
        <h3>{examInfo.title}</h3>
        <p>📅 Ngày tạo: {examInfo.createdAt}</p>
        <p>👤 Người tạo: {examInfo.creator}</p>
        <p>📊 Số lượt làm: {examInfo.attempts}</p>
        <Button type="default" block style={{ marginTop: 10 }}>
          <FontAwesomeIcon icon={faGear} /> Cài đặt
        </Button>
        <Button type="default" block style={{ marginTop: 10 }}>
          <FontAwesomeIcon icon={faChartBar} /> Thống kê
        </Button>
        <Button type="primary" danger block style={{ marginTop: 10 }} onClick={handleDelete}>
          <FontAwesomeIcon icon={faTrash} /> Xóa
        </Button>

        <h4 style={{ marginTop: 20 }}>Phân quyền</h4>
        <Button type="dashed" block onClick={() => setIsModalVisible(true)}>
          <FontAwesomeIcon icon={faPlus} /> Thêm người dùng
        </Button>
        <UserSearchModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
      </div>

      {/* Question List */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {questions.map((q, index) => (
          <Card key={q.QuestionId} title={`Câu ${index + 1}`} style={{ marginBottom: 20, border: "2px solid #007bff", borderRadius: "8px" }}>
            <p>{q.Content}</p>
            {q.Answers && (
              <List bordered dataSource={q.Answers} renderItem={(answer) => <List.Item>{answer.Content}</List.Item>} />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExamDetail;
