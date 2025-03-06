import {React, useState} from "react";
import { Card, Button, List } from "antd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUser, faChartBar, faPlus, faGear } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserSearchModal from "../../components/Exam/usersearch";
import Swal from "sweetalert2";

const examInfo = {
  title: "TÊN BÀI THI",
  createdAt: "12/02/2025 14:15",
  creator: "Hoàng Long Phạm",
  attempts: 0,
};

const questions = [
  {
    id: 1,
    question: "Hàm số y = f(x) liên tục trên R và có bảng biến thiên như hình vẽ. Mệnh đề nào sau đây là đúng?",
    image: "https://via.placeholder.com/400x150",
    answers: ["Hàm số có hai điểm cực trị.", "Hàm số có một điểm cực trị.", "Hàm số không có giá trị cực tiểu.", "Hàm số không có giá trị cực đại."],
  },
  {
    id: 2,
    question: "Cho hàm số có bảng xét dấu đạo hàm như sau. Hàm số đã cho nghịch biến trên khoảng nào dưới đây?",
    image: "https://via.placeholder.com/400x150",
    answers: ["(2; +∞).", "(0; +∞).", "(-2;0).", "(0;2)."],
  },
  {
    id: 3,
    question: "Trong các hàm số sau, hàm số đồng biến trên R là:",
    image: null,
    answers: ["f(x) = -3x².", "f(x) = -3 - x².", "f(x) = (1 / √3)x³.", "f(x) = x³ - x."],
  },
];

const members = ["longph", "VietNguyen", "DuyAnh"];

const ExamDetail = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

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
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire("Đã xóa!", "Bài thi đã bị xóa.", "success");
        // Thêm logic xóa bài thi ở đây
      }
    });
  };

  const confirmDelete = () => {
    toast.dismiss();
    toast.success("Bài thi đã bị xóa!", { position: "top-center" });
    // TODO: Thực hiện hành động xóa ở đây
  };

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

        <h4 style={{ marginTop: 20 }}>Thành viên</h4>
        <List
          dataSource={members}
          bordered
          renderItem={(item) => (
            <List.Item>
              <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
              {item}
            </List.Item>
          )}
        />
      </div>

      {/* Question List */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        {questions.map((q, index) => (
          <Card key={q.id} title={`Câu ${index + 1}`} style={{ marginBottom: 20, border: "2px solid #007bff", borderRadius: "8px" }}>
            <p>{q.question}</p>
            {q.image && <img src={q.image} alt="Hình minh họa" style={{ width: "100%", marginBottom: 10, borderRadius: "6px" }} />}
            <List
              bordered
              dataSource={q.answers}
              renderItem={(answer) => <List.Item>{answer}</List.Item>}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExamDetail;
