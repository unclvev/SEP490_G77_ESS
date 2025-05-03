import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Await } from "react-router-dom";
import {
  Collapse,
  Dropdown,
  Input,
  Modal,
  Button,
  message,
  Skeleton,
} from "antd";
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserAddOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast } from "react-toastify";
import InviteUserModal from "../../Manager/components/InviteUserModal";
import ListMemberModal from "../../Manager/components/ListMemberModal";
import {
  getBankById,
  getSectionsByBankId,
  addMainSection,
  addSubSection,
  editSection,
  deleteSection,
  checkIsOwner,
} from "../../../services/api";

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
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [listMemberModalVisible, setListMemberModalVisible] = useState(false);
  const [isOwner, setIsOwner] = useState(true);

  useEffect(() => {
    if (bankId) {
      fetchIsOwner();
      fetchSections();
      fetchBankInfo();
    }
  }, [bankId]);

  const fetchIsOwner =  async () => {
    try{
      const response = await checkIsOwner(bankId);
      setIsOwner(response.data.isOwner);
    } catch (error){
      toast.error("Không kiểm tra được chủ ngân hàng");
    }
  }

  /** ✅ Lấy thông tin ngân hàng câu hỏi */
  const fetchBankInfo = async () => {
    try {
      const response = await getBankById(bankId);
      setBankInfo(response.data);
    } catch (error) {
      console.error("❌ Lỗi khi gọi API:", error);
      toast.error("Không thể tải dữ liệu!");
    }
  };
  /** ✅ Lấy danh sách Sections từ API */
  const fetchSections = async () => {
    try {
      const response = await getSectionsByBankId(bankId);
      console.log(response.data);
      setSections(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu section!");
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
      if (modalType === "add-main") {
        await addMainSection(bankId, { secname: sectionName });
      } else {
        await addSubSection(currentSection.secid, { secname: sectionName });
      }
      toast.success("✅ Thêm section thành công!", 2); // 🟢 Thông báo UI thành công
      setIsModalVisible(false);
      setSectionName("");
      fetchSections();
      message.success("Thêm section thành công!");
      setIsModalVisible(false);
      setSectionName("");
    } catch (error) {
      toast.error("Lỗi khi thêm section!");
    }
  };

  /** ✅ Sửa tên Section */
  const handleEditSection = async () => {
    if (!sectionName.trim()) {
      toast.warning("Tên section không được để trống!");
      return;
    }
    try {
      await editSection(currentSection.secid, { secname: sectionName });

      fetchSections();
      toast.success("Cập nhật section thành công!");
      setIsModalVisible(false);
      setSectionName("");
    } catch (error) {
      toast.error("Lỗi khi cập nhật section!");
    }
  };

  /** ✅ Xóa Section */
  const handleDeleteSection = async (sectionId) => {
    try {
      await deleteSection(sectionId);
      fetchSections();
      toast.success("Xóa section thành công!");
    } catch (error) {
      toast.error("Lỗi khi xóa section!");
    }
  };

  /** ✅ Điều hướng đến trang danh sách câu hỏi của section */
  const handleGoToQuestionList = (sectionId) => {
    navigate(`/question-list/${sectionId}`);
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
                  e.stopPropagation(); // Ngăn chặn sự kiện click mở/đóng panel
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
          <Collapse className="ml-4">
            {renderSections(section.children)}
          </Collapse>
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
            <h1 className="text-2xl font-bold mb-2">
               {bankInfo.bankname}
            </h1>
            <p className="text-gray-600">Khối: {bankInfo.grade}</p>
            <p className="text-gray-600">Môn: {bankInfo.subject}</p>
            <p className="text-gray-600 font-semibold">
              Tổng số câu hỏi:{" "} 
              <span className="text-blue-600">
                {bankInfo.totalquestion !== undefined
                  ? bankInfo.totalquestion
                  : "Đang tải..."}
              </span>
            </p>
          </>
        ) : (
          <Skeleton active />
        )}
      </div>

      <div className="flex justify-start mb-4 w-3/4 mx-auto gap-2">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal("add-main")}
        >
          Thêm Section
        </Button>
        <Button
          type="primary"
          icon={<UserAddOutlined />}
          onClick={() => setInviteModalVisible(true)}
          disabled = {!isOwner}
        >
          Mời Người Dùng
        </Button>
        <Button
          type="primary"
          icon={<TeamOutlined />}
          onClick={() => setListMemberModalVisible(true)}
        >
          Danh Sách Thành Viên
        </Button>
      </div>

      {/* ✅ Hiển thị danh sách section */}
      <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-5xl mx-auto">
        <Collapse>
          {sections.length > 0 ? (
            renderSections(sections)
          ) : (
            <p>Không có dữ liệu</p>
          )}
        </Collapse>
      </div>

      {/* ✅ Modal thêm/sửa section */}
      <Modal
        title={
          modalType === "add-main"
            ? "Thêm Section"
            : modalType === "add-sub"
            ? "Thêm Section con"
            : "Sửa Section"
        }
        open={isModalVisible}
        onOk={
          modalType === "add-main"
            ? handleAddSection
            : modalType === "add-sub"
            ? handleAddSection
            : handleEditSection
        }
        onCancel={() => setIsModalVisible(false)}
      >
        <Input
          value={sectionName}
          onChange={(e) => setSectionName(e.target.value)}
          placeholder="Nhập tên section"
        />
      </Modal>

      <InviteUserModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        bankId={bankId}
        resourceType="bank"
      />

      <ListMemberModal
        visible={listMemberModalVisible}
        onClose={() => setListMemberModalVisible(false)}
        bankId={bankId}
        resourceType="bank"
      />
    </div>
  );
};

export default QuestionBankDetail;
