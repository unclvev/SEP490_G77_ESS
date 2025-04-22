// components/ListMemberModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, message } from 'antd';
import { useSelector } from 'react-redux';
import {jwtDecode} from 'jwt-decode';
import { getMembers, removeUser } from '../../../services/api';
import { toast } from "react-toastify";

// Import UpdateRoleModal vừa tạo
import UpdateRoleModal from './UpdateRoleModal';

const ListMemberModal = ({ visible, onClose, bankId }) => {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State dành cho modal xác nhận xóa
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // State dành cho modal cập nhật vai trò
  const [updateRoleVisible, setUpdateRoleVisible] = useState(false);
  const [selectedMemberForUpdate, setSelectedMemberForUpdate] = useState(null);

  // Lấy token từ Redux store
  const token = useSelector((state) => state.token);
  let accid = null;
  if (token) {
    try {
      const decoded = jwtDecode(token.token);
      accid = decoded.AccId || null;
    } catch (error) {
      console.error('Invalid token', error);
    }
  }

  // Mặc định resourceType = "bank"
  const resourceType = "bank";

  // Gọi API lấy danh sách thành viên khi modal hiển thị
  useEffect(() => {
    if (visible) {
      setLoadingMembers(true);
      getMembers(bankId, resourceType)
        .then((data) => {
          setMembers(data);
        })
        .catch((error) => {
          message.error(error.message || 'Không thể tải danh sách thành viên.');
          console.error(error);
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    }
  }, [visible, bankId, resourceType]);

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredMembers = members.filter((member) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      (member.username || '').toLowerCase().includes(lowerSearch) ||
      (member.email || '').toLowerCase().includes(lowerSearch) ||
      (member.role || '').toLowerCase().includes(lowerSearch)
    );
  });

  // Xử lý khi bấm tìm kiếm
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Hàm xử lý khi nhấn nút Edit: mở modal cập nhật vai trò
  const handleEdit = (member) => {
    setSelectedMemberForUpdate(member);
    setUpdateRoleVisible(true);
  };

  // Khi người dùng nhấn nút Xóa, mở modal xác nhận
  const handleDelete = (member) => {
    setSelectedMember(member);
    setConfirmVisible(true);
  };

  // Khi người dùng xác nhận xóa
  const handleConfirmDelete = () => {
    if (selectedMember) {
      removeUser(bankId, selectedMember.accid)
        .then(() => {
            toast.success(`Đã xóa thành viên: ${selectedMember.username}`);

          // Cập nhật lại danh sách thành viên
          setMembers((prevMembers) =>
            prevMembers.filter((m) => m.accid !== selectedMember.accid)
          );
        })
        .catch((error) => {
          toast.error(error.message || 'Xóa thành viên thất bại');
          console.error(error);
        })
        .finally(() => {
          setConfirmVisible(false);
          setSelectedMember(null);
        });
    }
  };

  // Khi người dùng hủy thao tác xóa
  const handleCancelDelete = () => {
    setConfirmVisible(false);
    setSelectedMember(null);
    message.info("Hủy thao tác xóa");
  };

  return (
    <>
      <Modal
        title="Danh Sách Thành Viên"
        visible={visible}
        onCancel={onClose}
        footer={null}
        className="rounded-lg"
        width={600}
      >
        {/* Thanh tìm kiếm */}
        <Input.Search
          placeholder="Tìm kiếm thành viên..."
          onSearch={handleSearch}
          enterButton
          allowClear
          style={{ marginBottom: 16 }}
        />

        {/* Danh sách thành viên */}
        <List
          loading={loadingMembers}
          itemLayout="horizontal"
          dataSource={filteredMembers}
          renderItem={(item) => (
            <List.Item
              key={item.accid}
              actions={[
                item.role !== "Owner" && (
                  <button 
                    key="edit" 
                    type="button"
                    onClick={() => handleEdit(item)}
                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                ),
                item.role !== "Owner" && (
                  <button 
                    key="delete" 
                    type="button"
                    onClick={() => handleDelete(item)}
                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer' }}
                  >
                    Xóa
                  </button>
                ),
              ].filter(Boolean)} // Remove null/undefined items from the array
            >
              <List.Item.Meta
                avatar={
                  <Avatar style={{ backgroundColor: '#87d068' }}>
                    {item.username ? item.username.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                }
                title={<div>{item.email}</div>}
                description={
                  <div>
                    Số điện thoại: {item.phone} <br />
                    Vai trò: {item.role}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Modal xác nhận xóa thành viên */}
      <Modal
        title="Xác nhận xóa thành viên"
        visible={confirmVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Đồng ý"
        cancelText="Hủy bỏ"
      >
        <p>
          Bạn có chắc chắn muốn xóa thành viên "{selectedMember ? selectedMember.username : ''}" không?
        </p>
      </Modal>

      {/* Modal cập nhật vai trò */}
      {selectedMemberForUpdate && selectedMemberForUpdate.role !== "Owner" && (
        <UpdateRoleModal
          visible={updateRoleVisible}
          onClose={() => {
            setUpdateRoleVisible(false);
            setSelectedMemberForUpdate(null);
          }}
          bankId={bankId}
          member={selectedMemberForUpdate}
        />
      )}
    </>
  );
};

export default ListMemberModal;
