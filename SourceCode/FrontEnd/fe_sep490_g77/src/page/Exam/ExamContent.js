import React, { useEffect, useState } from "react";
import { Card, Button, Space, Typography, Radio, Dropdown, Menu, Modal } from "antd";
import '@ant-design/v5-patch-for-react-19';
import {
  LeftOutlined,
  MoreOutlined,
  SettingOutlined,
  BarChartOutlined,
  EyeOutlined,
  HistoryOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import { delExam, getExam } from "../../services/api";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";

const { Text, Title } = Typography;

const ExamDetail = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("id");
  const navigate = useNavigate();

  const [examInfo, setExamInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await getExam(examId);
        const data = response.data;
        // Parse chuỗi JSON trong trường Examdata theo cấu trúc mới
        const parsedExamData = JSON.parse(data.examdata);

        setExamInfo({
          examName: parsedExamData.exam?.ExamName || "Đề thi chưa có tên",
          grade: parsedExamData.exam?.Grade || "N/A",
          subject: parsedExamData.exam?.Subject || "N/A",
          createdAt: new Date(data.createdate).toLocaleString(),
          creator: "Hoàng Long Phạm", // Bạn có thể lấy từ data.accId nếu API trả về
          attempts: 0, // Tùy vào dữ liệu trả về
        });
        setQuestions(parsedExamData.examdata?.Questions || []);
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };

    fetchExam();
  }, [examId]);

  // Các hàm xử lý cho từng câu hỏi
  const handleEditQuestion = (index) => {
    // Demo: Hiển thị modal chỉnh sửa (bạn có thể triển khai modal chi tiết)
    Modal.info({
      title: `Chỉnh sửa câu ${index + 1}`,
      content: `Chức năng chỉnh sửa câu hỏi sẽ được triển khai sau.`,
      onOk() {},
    });
  };

  const handleDeleteQuestion = (index) => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn xóa câu hỏi này?",
      onOk: () => {
        const updatedQuestions = questions.filter((_, i) => i !== index);
        setQuestions(updatedQuestions);
      },
    });
  };

const exportToWord = (questions) => {
  // Gọi hàm in (nếu cần)
  handlePrintQuestions();

  // Tạo mảng Paragraph chứa cả câu hỏi và đáp án
  const paragraphs = [];

  questions.forEach((q, index) => {
    // Thêm câu hỏi
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Câu ${index + 1}: `, bold: true }),
          new TextRun(q.Content),
        ],
        spacing: { after: 200 },
      })
    );

    // Nếu có đáp án, thêm từng đáp án vào sau câu hỏi
    if (q.Answers && q.Answers.length > 0) {
      q.Answers.forEach((answer, aIndex) => {
        // Tạo text cho đáp án
        const answerRuns = [
          new TextRun({ text: `   Đáp án ${aIndex + 1}: `, bold: true }),
          new TextRun(answer.Content),
        ];

        // Nếu đáp án là đáp án đúng, thêm ghi chú (ví dụ: "(Đúng)")
        if (answer.IsCorrect) {
          answerRuns.push(new TextRun({ text: " (Đúng)", italics: true }));
        }

        paragraphs.push(
          new Paragraph({
            children: answerRuns,
            spacing: { after: 100 },
          })
        );
      });
    }
  });

  // Tạo document với các paragraph đã tạo
  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  // Chuyển document thành blob và trigger download
  console.log("Innnn");
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "Exam.docx");
  });
};


  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updatedQuestions = [...questions];
    [updatedQuestions[index - 1], updatedQuestions[index]] = [updatedQuestions[index], updatedQuestions[index - 1]];
    setQuestions(updatedQuestions);
  };

  const handleMoveDown = (index) => {
    if (index === questions.length - 1) return;
    const updatedQuestions = [...questions];
    [updatedQuestions[index], updatedQuestions[index + 1]] = [updatedQuestions[index + 1], updatedQuestions[index]];
    setQuestions(updatedQuestions);
  };

  // Hàm in cấu trúc JSON của danh sách câu hỏi
  const handlePrintQuestions = () => {
    console.log("Cấu trúc JSON của questions:", JSON.stringify(questions, null, 2));
    Modal.info({
      title: "Cấu trúc JSON của các câu hỏi",
      width: "80%",
      content: (
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(questions, null, 2)}
        </pre>
      ),
      onOk() {},
    });
  };

  const handleCopyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      alert("Đã copy link!");
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleDeleteExam = () => {
    Modal.confirm({
      title: "Xác nhận",
      content: "Bạn có chắc chắn muốn xóa đề thi này?",
      async onOk() {
        try {
          await delExam(examId);
          toast.success("Đã xóa đề thi thành công!");
          navigate("/exam");
        } catch (error) {
          toast.error("Xóa đề thi thất bại!");
        }
      },
    });
  };

  const handleClick = () => {
    if (examId) {
      navigate(`/exam/analysis/${examId}`);
    } else {
      // Xử lý trường hợp không có examId (có thể thông báo lỗi, redirect về trang khác, v.v.)
      console.warn("Không tìm thấy examId trong searchParams");
    }
  };

  // Hàm tìm đáp án đúng dựa trên CorrectAnswerId
  const getCorrectAnswerLetter = (question) => {
    if (!question || !question.Answers || question.Answers.length === 0) return "Chưa chọn";
    const index = question.Answers.findIndex(
      (ans) => ans.AnswerId === question.CorrectAnswerId
    );
    return index !== -1 ? String.fromCharCode(65 + index) : "Chưa chọn";
  };

  // Menu dropdown cho từng câu hỏi
  const renderQuestionMenu = (index, question) => {
    return (
      <Menu>
        <Menu.Item key="edit" onClick={() => handleEditQuestion(index)}>
          Chỉnh sửa
        </Menu.Item>
        <Menu.Item key="delete" onClick={() => handleDeleteQuestion(index)} danger>
          Xóa
        </Menu.Item>
        <Menu.Item key="moveUp" onClick={() => handleMoveUp(index)}>
          Di chuyển lên
        </Menu.Item>
        <Menu.Item key="moveDown" onClick={() => handleMoveDown(index)}>
          Di chuyển xuống
        </Menu.Item>
      </Menu>
    );
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9f9f9", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #ddd", padding: "10px 20px", display: "flex", alignItems: "center" }}>
        <Button icon={<LeftOutlined />} onClick={handleBack} style={{ marginRight: 10 }} />
        <Title level={4} style={{ margin: 0 }}>{examInfo?.examName || "Đề thi"}</Title>
      </div>

      {/* Nội dung chính */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* Sidebar thông tin đề thi */}
        <div style={{ width: 300, background: "#fff", borderRight: "1px solid #ddd", padding: 20 }}>
          <Title level={5} style={{ marginBottom: 5 }}>
            {examInfo?.examName || "Đề thi"}
          </Title>
          <div style={{ marginBottom: 10, color: "#888" }}>
            Ngày tạo: {examInfo?.createdAt}
            <br />
            Người tạo: {examInfo?.creator}
            <br />
            Số lượt làm: {examInfo?.attempts}
          </div>

          <Space style={{ marginBottom: 10 }}>
            {/* <Button type="primary">Chia sẻ</Button>
            <Button onClick={handleCopyLink}>Copy link</Button> */}
            {/* <Button onClick={() => exportToWord(questions)}>In ra Word</Button> */}

          </Space>

          <Card bodyStyle={{ padding: 0 }} style={{ border: "none" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 8 }}>
                <Button icon={<SettingOutlined />} block>
                  Cài đặt
                </Button>
              </li>
              <li style={{ marginBottom: 8 }}>
              <Button onClick={() => exportToWord(questions)} block>In ra Word</Button>
              </li>

              <li style={{ marginBottom: 8 }}>
      <Button icon={<BarChartOutlined />} block onClick={handleClick}>
        Thống kê
      </Button>
    </li>
              {/* <li style={{ marginBottom: 8 }}>
                <Button icon={<EyeOutlined />} block>
                  Giám sát nâng cao
                </Button>
              </li> */}
              {/* <li style={{ marginBottom: 8 }}>
                <Button icon={<HistoryOutlined />} block>
                  Nhật ký hoạt động
                </Button>
              </li> */}
              <li>
                <Button icon={<DeleteOutlined />} danger block onClick={handleDeleteExam}>
                  Xóa
                </Button>
              </li>
            </ul>
          </Card>

          <div style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 600 }}>Phân quyền</Text>
            <div style={{ marginTop: 8 }}>
              <Button type="dashed" block>Tìm kiếm giáo viên</Button>
            </div>
          </div>

          {/* <div style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 600 }}>Nội dung</Text>
            <div style={{ marginTop: 8 }}>
              <Button type="dashed" block>Xem chi tiết</Button>
            </div>
          </div> */}
        </div>

        {/* Khu vực danh sách câu hỏi */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
          {questions.length === 0 ? (
            <div style={{ textAlign: "center", marginTop: 100 }}>
              <Title level={3}>Chưa có dữ liệu nội bài (câu hỏi)</Title>
              

            </div>
          ) : (
            questions.map((q, index) => (
              <Card
                key={q.QuestionId}
                style={{ marginBottom: 20, borderRadius: 8, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}
              >
                {/* Thanh tiêu đề câu hỏi với menu dropdown */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Space>
                    <Text strong>{`Câu ${index + 1}`}</Text>
                    <Button size="small">Trắc nghiệm</Button>
                    <Button size="small">NB</Button>
                  </Space>
                  <Dropdown overlay={renderQuestionMenu(index, q)} trigger={["click"]}>
                    <MoreOutlined style={{ fontSize: 18, cursor: "pointer" }} />
                  </Dropdown>
                </div>

                {/* Nội dung câu hỏi */}
                <Card style={{ border: "1px solid #ddd", marginTop: 10, marginBottom: 10 }}>
                  <Text>{q.Content}</Text>
                </Card>

                {/* Danh sách đáp án */}
                <Card style={{ border: "1px solid #ddd" }}>
                  <Radio.Group value={null}>
                    <Space direction="vertical">
                      {q.Answers.map((answer, i) => (
                        <Radio key={answer.AnswerId} value={answer.AnswerId} disabled>
                          <Text strong>{String.fromCharCode(65 + i)}.</Text>
                          <Text style={{ marginLeft: 8, fontWeight: answer.IsCorrect ? "bold" : "normal" }}>
                            {answer.Content}
                          </Text>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>

                {/* Hiển thị đáp án đúng */}
                <div style={{ marginTop: 8 }}>
                  <Text style={{ color: "green", fontWeight: "bold" }}>
                    Đáp án: {getCorrectAnswerLetter(q)}
                  </Text>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;
