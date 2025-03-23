import React, { useState, useRef, useEffect } from 'react';
import { Form, Input, Select, Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { getProfile, updateProfile, changePassword } from '../../services/api';

const { Option } = Select;

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // State lưu URL ảnh đại diện
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/150');
  // useRef dùng để trỏ đến thẻ input file ẩn
  const fileInputRef = useRef(null);

  // Khi component mount, gọi API lấy thông tin người dùng
  useEffect(() => {
    getProfile()
      .then((response) => {
        const profile = response.data;
        // Gán giá trị vào form
        form.setFieldsValue({
          fullName: profile.fullName,
          phone: profile.phone,
          gender: profile.gender,
          address: profile.address,
          major: profile.major,
          level: profile.level,
        });
        // Nếu có avatarUrl thì set vào state để hiển thị
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl);
        }
      })
      .catch(() => {
        toast.error('Không thể tải thông tin người dùng!');
      });
  }, [form]);

  // Xử lý cập nhật thông tin cá nhân
  const handleUpdateInfo = async (values) => {
    const payload = { ...values, avatarUrl };
    try {
      await updateProfile(payload);
      toast.success('Cập nhật thông tin thành công!');
    } catch (error) {
      const errMsg =
        error.response?.data?.message || 'Cập nhật thông tin thất bại!';
      toast.error(errMsg);
    }
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async (values) => {
    try {
      await changePassword(values);
      toast.success('Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    } catch (error) {
      const errMsg =
        error.response?.data?.message || 'Đổi mật khẩu thất bại!';
      toast.error(errMsg);
    }
  };

  // Khi người dùng nhấn vào Avatar, kích hoạt input file ẩn
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Khi người dùng chọn file, đọc file và cập nhật avatarUrl (dạng base64)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
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
          {/* Input file ẩn */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div>
            {/* Có thể hiển thị tạm cứng hoặc lấy từ profile */}
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
