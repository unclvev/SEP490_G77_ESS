import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Collapse, Dropdown, Input, Modal, Button, message, Skeleton, Upload } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UploadOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Panel } = Collapse;

const QuestionBankDetail = () => {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionName, setSectionName] = useState("");

  useEffect(() => {
    if (bankId) {
      fetchSections();
      fetchBankInfo();
    }
  }, [bankId]);

  /** ✅ Lấy thông tin ngân hàng câu hỏi */
  const fetchBankInfo = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Bank/${bankId}`);
      setBankInfo(response.data);
    } catch (error) {
      message.error("Lỗi khi tải thông tin ngân hàng câu hỏi!");
    }
  };

  /** ✅ Lấy danh sách Sections từ API */
  const fetchSections = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Bank/${bankId}/sections`);
      setSections(response.data);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu section!");
    }
  };

  /** ✅ Hiển thị modal */
  const showModal = (type, section = null) => {
    setModalType(type);
    setCurrentSection(section);
    setSectionName(type === "edit" ? section?.secname : "");
    setIsModalVisible(true);
  };

  /** ✅ Thêm Section chính hoặc con */
  const handleAddSection = async () => {
    if (!sectionName.trim()) {
      message.warning("Tên section không được để trống!");
      return;
    }
    try {
      const url =
        modalType === "add-main"
          ? `https://localhost:7052/api/Bank/${bankId}/add-section`
          : `https://localhost:7052/api/Bank/${currentSection.secid}/add-subsection`;

      await axios.post(url, { secname: sectionName });
      message.success("✅ Thêm section thành công!");
      setIsModalVisible(false);
      setSectionName("");
      fetchSections();
    } catch (error) {
      message.error("Lỗi khi thêm section!");
    }
  };

  /** ✅ Sửa tên Section */
  const handleEditSection = async () => {
    if (!sectionName.trim()) {
      message.warning("Tên section không được để trống!");
      return;
    }
    try {
      await axios.put(`https://localhost:7052/api/Bank/section/${currentSection.secid}`, {
        secname: sectionName,
      });

      fetchSections();
      message.success("Cập nhật section thành công!");
      setIsModalVisible(false);
      setSectionName("");
    } catch (error) {
      message.error("Lỗi khi cập nhật section!");
    }
  };

  /** ✅ Xóa Section */
  const handleDeleteSection = async (sectionId) => {
    try {
      await axios.delete(`https://localhost:7052/api/Bank/section/${sectionId}`);
      fetchSections();
      message.success("Xóa section thành công!");
    } catch (error) {
      message.error("Lỗi khi xóa section!");
    }
  };

  /** ✅ Điều hướng đến trang danh sách câu hỏi của section */
  const handleGoToQuestionList = (sectionId) => {
    navigate(`/question-list/${sectionId}`);
  };

  /** ✅ Export Excel */
  const handleExportExcel = () => {
    window.location.href = `https://localhost:7052/api/Bank/${bankId}/export-excel`;
  };

  /** ✅ Import Excel */
 /** ✅ Import Excel & Cập nhật UI */
const handleImportExcel = async ({ file }) => {
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    await axios.post(`https://localhost:7052/api/Bank/${bankId}/import-excel`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    message.success("Import Excel thành công!");

    fetchSections();  // 🔄 Cập nhật danh sách Sections ngay sau khi import
    fetchQuestions(); // 🔄 Cập nhật danh sách câu hỏi để hiển thị trong Question List

  } catch (error) {
    message.error("Lỗi khi import Excel!");
  }
};


  /** ✅ Hiển thị danh sách Sections */
  const renderSections = (sections) => {
    return sections.map((section) => (
      <Panel
        key={section.secid}
        header={
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <span className="font-semibold">{section.secname}</span>
              <span
                className="text-blue-600 text-sm ml-2 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGoToQuestionList(section.secid);
                }}
              >
                ({section.questionCount} câu hỏi)
              </span>
            </div>
            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    label: "Thêm Section con",
                    icon: <PlusOutlined />,
                    onClick: () => showModal("add-sub", section),
                  },
                  {
                    key: "2",
                    label: "Sửa",
                    icon: <EditOutlined />,
                    onClick: () => showModal("edit", section),
                  },
                  {
                    key: "3",
                    label: "Xóa",
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDeleteSection(section.secid),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <MoreOutlined className="text-xl cursor-pointer" />
            </Dropdown>
          </div>
        }
      >
        {section.children?.length > 0 ? (
          <Collapse className="ml-4">{renderSections(section.children)}</Collapse>
        ) : (
          <p className="ml-4 text-gray-500">Không có section con</p>
        )}
      </Panel>
    ));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 shadow-md rounded-lg mb-6 w-3/4 mx-auto">
        {bankInfo ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Tên Bank: {bankInfo.bankname}</h1>
            <p className="text-gray-600">Khối: {bankInfo.grade}</p>
            <p className="text-gray-600">Môn: {bankInfo.subject}</p>
            <p className="text-gray-600 font-semibold">
              Tổng số câu hỏi:{" "}
              <span className="text-blue-600">
                {bankInfo.totalquestion !== undefined ? bankInfo.totalquestion : "Đang tải..."}
              </span>
            </p>
          </>
        ) : (
          <Skeleton active />
        )}
      </div>

      <div className="flex justify-between mb-4 w-3/4 mx-auto">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal("add-main")}>
          Thêm Section
        </Button>
        <Button type="default" icon={<DownloadOutlined />} onClick={handleExportExcel}>
          Export Excel
        </Button>
        <Upload customRequest={handleImportExcel} showUploadList={false}>
          <Button type="primary" icon={<UploadOutlined />}>Import Excel</Button>
        </Upload>
      </div>

      <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-5xl mx-auto">
        <Collapse>{sections.length > 0 ? renderSections(sections) : <p>Không có dữ liệu</p>}</Collapse>
      </div>
    </div>
  );
};

export default QuestionBankDetail;
