import { Modal, Input, List, Avatar, Button } from "antd";
import { useState } from "react";
import { SearchOutlined, CloseOutlined, UserOutlined } from "@ant-design/icons";

const users = [
  { id: 1, name: "phuongthte", email: "phuongthte170159@fpt.edu.vn" },
  { id: 2, name: "nguyenvanb", email: "nguyenvanb@fpt.edu.vn" },
  { id: 3, name: "tranthic", email: "tranthic@fpt.edu.vn" },
  { id: 4, name: "lequangd", email: "lequangd@fpt.edu.vn" },
  { id: 5, name: "phamthing", email: "phamthing@fpt.edu.vn" },
  { id: 6, name: "dangvanh", email: "dangvanh@fpt.edu.vn" },
];

const UserSearchModal = ({ visible, onClose }) => {
  const [searchText, setSearchText] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(users);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    setFilteredUsers(users.filter((user) => user.name.toLowerCase().includes(value)));
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      closeIcon={<CloseOutlined />}
      width={400}
    >
      <Input
        placeholder="Tìm kiếm người dùng"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={handleSearch}
        allowClear
        style={{ marginTop: 20 }}
      />
      
      <div style={{ maxHeight: 250, overflowY: "auto" }}>
        <List
          dataSource={filteredUsers}
          renderItem={(user) => (
            <List.Item style={{ padding: "10px 16px" }}>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={<strong>{user.name}</strong>}
                description={<span style={{ color: "gray" }}>{user.email}</span>}
              />
            </List.Item>
          )}
        />
      </div>
      <div style={{ textAlign: "right", marginTop: 15 }}>
        <Button type="primary" onClick={onClose}>
          Thêm
        </Button>
      </div>
    </Modal>
  );
};

export default UserSearchModal;
