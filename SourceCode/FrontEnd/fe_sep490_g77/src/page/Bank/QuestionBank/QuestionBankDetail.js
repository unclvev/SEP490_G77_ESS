import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Collapse, Dropdown, Input, Modal, Button, message } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";

const { Panel } = Collapse;

const QuestionBankDetail = () => {
  const { bankId } = useParams();
  const [sections, setSections] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [currentSection, setCurrentSection] = useState(null);
  const [sectionName, setSectionName] = useState("");

  useEffect(() => {
    fetchSections();
  }, [bankId]);

  /** ✅ Lấy danh sách Sections từ API */
  const fetchSections = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Bank/${bankId}/sections`);
      if (response.data) {
        setSections(response.data);
      }
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu section!");
    }
  };

  /** ✅ Thêm Section chính */
  const handleAddMainSection = async () => {
    if (!sectionName.trim()) {
      message.warning("Tên section không được để trống!");
      return;
    }
    try {
      const response = await axios.post(`https://localhost:7052/api/Bank/${bankId}/add-section`, {
        secname: sectionName
      });

      if (response.data && response.data.newSection) {
        setSections((prev) => [...prev, response.data.newSection]);
      }

      message.success("Thêm section chính thành công!");
      setIsModalVisible(false);
      setSectionName("");
    } catch (error) {
      message.error("Lỗi khi thêm section chính!");
    }
  };

  /** ✅ Thêm Section con */
  const handleAddSubSection = async () => {
    if (!sectionName.trim()) {
      message.warning("Tên section không được để trống!");
      return;
    }
    try {
      const response = await axios.post(`https://localhost:7052/api/Bank/${currentSection.secid}/add-subsection`, {
        secname: sectionName
      });

      if (response.data && response.data.newSection) {
        setSections((prevSections) =>
          prevSections.map((sec) =>
            sec.secid === currentSection.secid
              ? {
                  ...sec,
                  children: [...(sec.children || []), { childId: response.data.newSection.secid, childName: response.data.newSection.secname }]
                }
              : sec
          )
        );
      }

      message.success("Thêm section con thành công!");
      setIsModalVisible(false);
      setSectionName("");
    } catch (error) {
      message.error("Lỗi khi thêm section con!");
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
        secname: sectionName
      });

      setSections((prevSections) =>
        prevSections.map((sec) =>
          sec.secid === currentSection.secid ? { ...sec, secname: sectionName } : sec
        )
      );

      message.success("Cập nhật section thành công!");
      setIsModalVisible(false);
      setSectionName("");
    } catch (error) {
      message.error("Lỗi khi cập nhật section!");
    }
  };

  /** ✅ Xóa Section ngay lập tức (KHÔNG hiển thị thông báo xác nhận) */
  const handleDeleteSection = async (sectionId) => {
    try {
      await axios.delete(`https://localhost:7052/api/Bank/section/${sectionId}`);

      setSections((prevSections) => prevSections.filter((sec) => sec.secid !== sectionId));
      message.success("Xóa section thành công!");
    } catch (error) {
      message.error("Lỗi khi xóa section!");
    }
  };

  /** ✅ Hiển thị modal */
  const showModal = (type, section = null) => {
    setModalType(type);
    setCurrentSection(section);
    setSectionName(type === "edit" ? section?.secname : "");
    setIsModalVisible(true);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">CHI TIẾT NGÂN HÀNG CÂU HỎI</h1>

      {/* ✅ Nút Thêm Section Chính */}
      <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal("add-main")} className="mb-4">
        Thêm Section
      </Button>

      <div className="bg-white p-4 shadow-md rounded">
        <Collapse accordion>
          {sections.map((section) => (
            <Panel
              key={section.secid}
              header={
                <div className="flex justify-between items-center">
                  <span>{section.secname}</span>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "1",
                          label: "Thêm cấu trúc con",
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
                          onClick: () => handleDeleteSection(section.secid), // ✅ Gọi hàm xóa trực tiếp
                        },
                      ],
                    }}
                  >
                    <MoreOutlined className="text-xl cursor-pointer" />
                  </Dropdown>
                </div>
              }
            >
              {section.children && section.children.length > 0 ? (
                <Collapse accordion>
                  {section.children.map((child) => (
                    <Panel key={child.childId} header={child.childName}>
                      <p>Nội dung {child.childName}</p>
                    </Panel>
                  ))}
                </Collapse>
              ) : (
                <p className="text-gray-500 italic">Không có section con</p>
              )}
            </Panel>
          ))}
        </Collapse>
      </div>

      {/* Modal */}
      <Modal
        title={modalType === "add-main" ? "Thêm Section" : modalType === "add-sub" ? "Thêm Section con" : "Sửa Section"}
        open={isModalVisible}
        onOk={modalType === "add-main" ? handleAddMainSection : modalType === "add-sub" ? handleAddSubSection : handleEditSection}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Nhập tên section" />
      </Modal>
    </div>
  );
};

export default QuestionBankDetail;
