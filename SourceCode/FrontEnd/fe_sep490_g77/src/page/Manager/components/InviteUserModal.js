import React, { useState } from 'react';
import { Modal, Form, AutoComplete, Switch, Button, message } from 'antd';
import { searchUserToInvite, inviteUser } from '../../../services/api';
import { useSelector } from 'react-redux';
import {jwtDecode} from 'jwt-decode';
import { toast } from 'react-toastify';

const InviteUserModal = ({ visible, onClose, bankId }) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]); // Lưu trữ danh sách gợi ý
  const [loadingSearch, setLoadingSearch] = useState(false);

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

  // Gọi API khi người dùng gõ vào AutoComplete
  const handleSearch = async (value) => {
    if (!value) {
      setOptions([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const users = await searchUserToInvite(value);
      console.log("users from API:", users);
      const newOptions = users.map((item) => ({
        label: `${item.name} - ${item.email}`,
        value: `${item.name} - ${item.email}`, // Giá trị hiển thị trong input
        accId: item.accId ,                     // Lưu ID thật
      }));
      setOptions(newOptions);
    } catch (error) {
      message.error(error.message || "Tìm kiếm không thành công.");
      console.error(error);
    }
    setLoadingSearch(false);
  };

  // Khi người dùng chọn một item trong dropdown
  const handleSelect = (value, option) => {
    console.log("Selected option:", option);
    form.setFieldsValue({
      displayValue: value,
      accid: option.accId,
    });
    console.log("accid", option.accId);
  };
  

  // Xử lý khi submit form
  const onFinish = async (values) => {
    // values.accid chứa ID thật của người dùng được chọn
    const payload = {
      resource: {
        ResourceType: 'Bank',
        ResourceId: bankId,  // Sử dụng bankId từ props
        accid: values.accid,
      },
      accessRole: {
        RoleName: values.roleName,
        CanModify: values.canModify,
        CanRead: true,  
        CanDelete: values.canDelete,
      },
    };
    console.log(payload);

    try {
      await inviteUser(payload);
      message.success("Người dùng đã được mời thành công.");
      form.resetFields();
      onClose();
    } catch (error) {
      message.error(error.message || "Quá trình mời người dùng thất bại.");
      console.error(error);
    }
  };

  return (
    <Modal
      title="Mời Người Dùng"
      visible={visible}
      onCancel={onClose}
      footer={null}
      className="rounded-lg" // Sử dụng Tailwind cho border-radius
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-4">
        
        {/* Trường ẩn để lưu Accid thật */}
        <Form.Item name="accid" hidden>
          <input type="hidden" />
        </Form.Item>

        {/* Trường AutoComplete để hiển thị tên - email */}
        <Form.Item
          label="Tìm kiếm người dùng"
          name="displayValue" // Tên field hiển thị
          rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
        >
          <AutoComplete
            options={options}
            onSearch={handleSearch}
            onSelect={handleSelect}
            placeholder="Nhập email hoặc số điện thoại"
            notFoundContent={loadingSearch ? 'Đang tìm kiếm...' : 'Không có dữ liệu'}
            className="w-full"
            allowClear
          />
        </Form.Item>

        {/* Nhập tên vai trò cho người được mời */}
        <Form.Item
          label="Tên vai trò"
          name="roleName"
          rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}
        >
          <input 
            type="text"
            className="ant-input" // Dùng class của Antd
            placeholder="Nhập tên vai trò"
          />
        </Form.Item>

        {/* Quyền sửa (Can Modify) */}
        <Form.Item
          label="Quyền sửa (Can Modify)"
          name="canModify"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>

        {/* Quyền xóa (Can Delete) */}
        <Form.Item
          label="Quyền xóa (Can Delete)"
          name="canDelete"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>

        {/* Nút submit */}
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Mời Người Dùng
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InviteUserModal;
