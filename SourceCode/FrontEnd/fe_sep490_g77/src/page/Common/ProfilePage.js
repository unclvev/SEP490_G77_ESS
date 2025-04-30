import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { Form, Input, Select, Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { getProfile, updateProfile, changePassword } from '../../services/api';

const { Option } = Select;

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState('https://via.placeholder.com/150');
  const [userInfo, setUserInfo] = useState({
    accid: null,
    accname: '',
    email: ''
  });
  const fileInputRef = useRef(null);

  // ✅ Lấy token từ Redux và decode
  const token = useSelector((state) => state.token);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo({
          accid: decoded.AccId || null,
          accname: decoded.AccName || '',
          email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || ''
        });
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, [token]);

  useEffect(() => {
    getProfile()
      .then((response) => {
        const profile = response.data;
        form.setFieldsValue({
          accname: profile.accname,
          phone: profile.phone,
          gender: profile.gender,
          address: profile.address,
          subject: profile.subject,
          skill: profile.skill,
          email: profile.email,
        });
        if (profile.avatarUrl) {
          setAvatarUrl(profile.avatarUrl);
        }
        // Update user info with profile data
        setUserInfo(prev => ({
          ...prev,
          accname: profile.accname || prev.accname,
          email: profile.email || prev.email
        }));
      })
      .catch(() => {
        toast.error('Không thể tải thông tin người dùng!');
      });
  }, [form]);

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

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-200 to-blue-50 p-6 rounded-md shadow-sm">
        <div className="flex items-center">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            src={avatarUrl}
            className="mr-4 cursor-pointer"
            onClick={handleAvatarClick}
          />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div>
            <h2 className="text-xl font-semibold mb-0">
              {userInfo.accname || 'Tên người dùng'}
            </h2>
            <p className="text-sm text-gray-600">
              {userInfo.email || 'Email người dùng'}
            </p>
            {userInfo.accid && (
              <p className="text-xs text-gray-500">Mã tài khoản: {userInfo.accid}</p>
            )}
          </div>

        </div>
        {/* <Button type="primary" className="rounded-full px-6">
          Thay đổi
        </Button> */}
      </div>

      <div className="mt-8">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateInfo}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Form.Item label="Tên đầy đủ" name="accname">
            <Input placeholder="Tên đầy đủ của bạn" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input placeholder="Email của bạn" disabled />
          </Form.Item>

          <Form.Item label="Số điện thoại" name="phone">
            <Input placeholder="Số điện thoại của bạn" />
          </Form.Item>

          <Form.Item label="Giới tính" name="gender">
            <Select placeholder="Chọn giới tính">
              <Option value="male">Nam</Option>
              <Option value="female">Nữ</Option>
              <Option value="other">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Địa chỉ" name="address">
            <Input placeholder="Địa chỉ của bạn" />
          </Form.Item>

          <Form.Item label="Chuyên ngành" name="subject">
            <Input placeholder="Chuyên ngành của bạn" />
          </Form.Item>

          <Form.Item label="Trình độ" name="skill">
            <Input placeholder="Trình độ chuyên môn của bạn" />
          </Form.Item>

          <div className="col-span-1 md:col-span-2 flex justify-end">
            <Button type="primary" htmlType="submit" className="rounded-full">
              Cập nhật thông tin
            </Button>
          </div>
        </Form>

      </div>

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
