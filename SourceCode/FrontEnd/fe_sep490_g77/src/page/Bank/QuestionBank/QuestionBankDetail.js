import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Collapse, Dropdown, Menu, Input, Modal, message } from "antd";
import { MoreOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import axios from "axios";

const { Panel } = Collapse;
const { confirm } = Modal;

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

  /** ✅ Thêm Section con */
  const handleAddSection = async () => {
    if (!sectionName.trim()) {
      message.warning("Tên section không được để trống!");
      return;
    }
    try {
      const response = await axios.post(`https://localhost:7052/api/Bank/${currentSection.secid}/add-section`, {
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

  /** ✅ Xóa Section (Chặn sự kiện mở rộng) */
  const handleDeleteSection = async (sectionId) => {
    try {
      await axios.delete(`https://localhost:7052/api/Bank/section/${sectionId}`);

      setSections((prevSections) =>
        prevSections.filter((sec) => sec.secid !== sectionId)
      );

      message.success("Xóa section thành công!");
    } catch (error) {
      message.error("Lỗi khi xóa section!");
    }
  };

  /** ✅ Hiển thị modal */
  const showModal = (type, section, e) => {
    if (e && e.stopPropagation) e.stopPropagation(); // ✅ Chặn sự kiện mở rộng Panel khi bấm nút

    setModalType(type);
    setCurrentSection(section);
    setSectionName(type === "edit" ? section.secname : "");
    setIsModalVisible(true);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">CHI TIẾT NGÂN HÀNG CÂU HỎI</h1>

      <div className="bg-white p-4 shadow-md rounded">
        <h2 className="text-xl font-semibold mb-4">Cấu trúc ngân hàng câu hỏi</h2>
        <Collapse accordion>
          {sections.map((section) => (
            <Panel
              key={section.secid}
              header={
                <div className="flex justify-between items-center">
                  <span>{section.secname}</span>
                  <Dropdown
                    overlay={
                      <Menu>
                        <Menu.Item key="1" icon={<PlusOutlined />} onClick={(e) => showModal("add", section, e)}>
                          Thêm cấu trúc con
                        </Menu.Item>
                        <Menu.Item key="2" icon={<EditOutlined />} onClick={(e) => showModal("edit", section, e)}>
                          Sửa
                        </Menu.Item>
                        <Menu.Item key="3" icon={<DeleteOutlined />} danger onClick={(e) => handleDeleteSection(section.secid, e)}>
                          Xóa
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={["click"]}
                  >
                    <MoreOutlined className="text-xl cursor-pointer" onClick={(e) => e.stopPropagation()} />
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

      {/* Modal Thêm / Sửa Section */}
      <Modal
        title={modalType === "add" ? "Thêm Section" : "Sửa Section"}
        open={isModalVisible}
        onOk={modalType === "add" ? handleAddSection : handleEditSection}
        onCancel={() => setIsModalVisible(false)}
      >
        <Input value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Nhập tên section" />
      </Modal>
    </div>
  );
};

export default QuestionBankDetail;
