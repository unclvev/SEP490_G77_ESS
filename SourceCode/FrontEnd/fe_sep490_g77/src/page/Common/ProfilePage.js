import React, { useState, useRef } from 'react';
import { Form, Input, Select, Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Option } = Select;

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // State lưu URL ảnh đại diện
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/150');
  // Dùng useRef để trỏ đến thẻ input file ẩn
  const fileInputRef = useRef(null);

  const handleUpdateInfo = (values) => {
    console.log('Thông tin cá nhân:', values);
    // TODO: Gửi thông tin lên server qua API
  };

  const handleChangePassword = (values) => {
    console.log('Đổi mật khẩu:', values);
    // TODO: Gửi mật khẩu cũ/mới lên server để xử lý
  };

  // Khi người dùng nhấn vào Avatar, kích hoạt input file
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Khi người dùng chọn file, ta đọc file và cập nhật avatarUrl
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      // event.target.result là chuỗi base64 của ảnh
      setAvatarUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-5xl mx-auto my-10">
      {/* Header - Thông tin người dùng */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-200 to-blue-50 p-6 rounded-md shadow-sm">
        <div className="flex items-center">
          {/* Avatar (nhấn vào để chọn ảnh) */}
          <Avatar
            size={64}
            icon={<UserOutlined />}
            src={avatarUrl} 
            className="mr-4 cursor-pointer"
            onClick={handleAvatarClick}
          />
          {/* input file ẩn */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div>
            <h2 className="text-xl font-semibold mb-0">Nguyễn Hoàng Việt</h2>
            <p className="text-sm text-gray-600">nhv298@gmail.com</p>
          </div>
        </div>
        <Button type="primary" className="rounded-full px-6">
          Thay đổi
        </Button>
      </div>

      {/* Form cập nhật thông tin cá nhân */}
      <div className="mt-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateInfo}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Form.Item
            label="Tên đầy đủ"
            name="fullName"
            rules={[{ required: true, message: 'Vui lòng nhập tên đầy đủ' }]}
          >
            <Input placeholder="Tên đầy đủ của bạn" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
          >
            <Input placeholder="Số điện thoại của bạn" />
          </Form.Item>

          <Form.Item
            label="Giới tính"
            name="gender"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
          >
            <Select placeholder="Chọn giới tính">
              <Option value="male">Nam</Option>
              <Option value="female">Nữ</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Địa chỉ"
            name="address"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
          >
            <Input placeholder="Địa chỉ của bạn" />
          </Form.Item>

          <Form.Item
            label="Chuyên ngành"
            name="major"
            rules={[{ required: true, message: 'Vui lòng nhập chuyên ngành' }]}
          >
            <Input placeholder="Chuyên ngành của bạn" />
          </Form.Item>

          <Form.Item
            label="Trình độ"
            name="level"
            rules={[{ required: true, message: 'Vui lòng nhập trình độ' }]}
          >
            <Input placeholder="Trình độ chuyên môn của bạn" />
          </Form.Item>

          <div className="col-span-1 md:col-span-2 flex justify-end">
            <Button type="primary" htmlType="submit" className="rounded-full">
              Cập nhật thông tin
            </Button>
          </div>
        </Form>
      </div>

      {/* Form đổi mật khẩu */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Đổi mật khẩu</h3>
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu cũ" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>

          <Form.Item
            label="Nhập lại mật khẩu mới"
            name="confirmNewPassword"
            dependencies={['newPassword']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Mật khẩu nhập lại không trùng khớp!')
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <div className="col-span-1 md:col-span-2 flex justify-end">
            <Button type="primary" htmlType="submit" className="rounded-full">
              Đổi mật khẩu
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ProfilePage;
