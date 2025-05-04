import React, { useState, useEffect } from "react";
import { Modal, Input, List, Avatar, message } from "antd";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { checkIsOwner, getMembers, removeUser } from "../../../services/api";
import { toast } from "react-toastify";
import UpdateRoleModal from "./UpdateRoleModal";

const ListMemberForExam = ({ visible, onClose, examId }) => {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State for confirmation modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // State for role update modal
  const [updateRoleVisible, setUpdateRoleVisible] = useState(false);
  const [selectedMemberForUpdate, setSelectedMemberForUpdate] = useState(null);
  const [isOwner, setIsOwner] = useState(true);

  // Get token from Redux store
  const token = useSelector((state) => state.token);
  let currentUserId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token.token);
      currentUserId = decoded.AccId || null;
    } catch (error) {
      console.error("Invalid token", error);
    }
  }

//   const fetchIsOwner = async () => {
//     try {
//       const response = await checkIsOwner(examId);
//       setIsOwner(response.data.isOwner);
//     } catch (error) {
//       toast.error("Không kiểm tra được chủ đề thi");
//     }
//   };

  // Set resourceType to "exam"
  const resourceType = "exam";

  // Fetch members when modal is visible
  useEffect(() => {
    if (visible) {
      // fetchIsOwner();
      setLoadingMembers(true);
      getMembers(examId, resourceType)
        .then((data) => {
          setMembers(data);
        })
        .catch((error) => {
          message.error(error.message || "Không thể tải danh sách thành viên.");
          console.error(error);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [visible, examId, resourceType]);

  // Filter members based on search term
  const filteredMembers = members.filter((member) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (member.username || "").toLowerCase().includes(lowerSearch) ||
      (member.email || "").toLowerCase().includes(lowerSearch) ||
      (member.role || "").toLowerCase().includes(lowerSearch)
    );
  });

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Handle edit role
  const handleEdit = (member) => {
    setSelectedMemberForUpdate(member);
    setUpdateRoleVisible(true);
    console.log("UUpdate:", member);
  };

  // Handle delete member
  const handleDelete = (member) => {
    setSelectedMember(member);
    setConfirmVisible(true);
    console.log(" delete:", member);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedMember) {
      removeUser(examId, selectedMember.accid)
        .then(() => {
          toast.success(`Đã xóa thành viên: ${selectedMember.username}`);
          setMembers((prevMembers) =>
            prevMembers.filter((m) => m.accid !== selectedMember.accid)
          );
        })
        .catch((error) => {
          toast.error(error.message || "Xóa thành viên thất bại");
          console.error(error);
        })
        .finally(() => {
          setConfirmVisible(false);
          setSelectedMember(null);
        });
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setConfirmVisible(false);
    setSelectedMember(null);
    message.info("Hủy thao tác xóa");
  };

  return (
    <>
      <Modal
        title="Danh Sách Thành Viên Đề Thi"
        visible={visible}
        onCancel={onClose}
        footer={null}
        className="rounded-lg"
        width={600}
      >
        {/* Search bar */}
        <Input.Search
          placeholder="Tìm kiếm thành viên..."
          onSearch={handleSearch}
          enterButton
          allowClear
          style={{ marginBottom: 16 }}
        />

        {/* Member list */}
        <List
          loading={loadingMembers}
          itemLayout="horizontal"
          dataSource={filteredMembers}
          renderItem={(item) => (
            <List.Item
              key={item.accid}
              actions={[
                isOwner && !item.IsOwner && item.accid != currentUserId && (
                  <button
                    key="edit"
                    type="button"
                    onClick={() => handleEdit(item)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1890ff",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                ),
                isOwner && !item.IsOwner && item.accid != currentUserId && (
                  <button
                    key="delete"
                    type="button"
                    onClick={() => handleDelete(item)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#1890ff",
                      cursor: "pointer",
                    }}
                  >
                    Xóa
                  </button>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: "#87d068" }}>
                    {item.username
                      ? item.username.charAt(0).toUpperCase()
                      : "U"}
                  </Avatar>
                }
                title={<div>{item.email}</div>}
                description={
                  <div>
                    Số điện thoại: {item.phone} <br />
                    Vai trò: {item.Role}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        title="Xác nhận xóa thành viên"
        visible={confirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Đồng ý"
        cancelText="Hủy bỏ"
      >
        <p>
          Bạn có chắc chắn muốn xóa thành viên "
          {selectedMember ? selectedMember.username : ""}" không?
        </p>
      </Modal>

      {/* Role update modal */}
      {selectedMemberForUpdate && selectedMemberForUpdate.role !== "Owner" && (
        <UpdateRoleModal
          visible={updateRoleVisible}
          onClose={() => {
            setUpdateRoleVisible(false);
            setSelectedMemberForUpdate(null);
          }}
          examId={examId}
          member={selectedMemberForUpdate}
        />
      )}
    </>
  );
};

export default ListMemberForExam;
