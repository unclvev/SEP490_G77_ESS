import React, { useEffect, useState } from 'react';
import { Layout, Avatar, Input, Badge, Dropdown } from 'antd';
import { BellOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { jwtDecode } from 'jwt-decode';

const { Header } = Layout;

const AppHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);

  const [userInfo, setUserInfo] = useState({
    accname: 'Người dùng',
    avatarUrl: 'https://via.placeholder.com/40x40',
  });

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserInfo({
          accname: decoded?.AccName || 'Người dùng',
          avatarUrl: decoded?.AvatarUrl || 'https://via.placeholder.com/40x40',
        });
      } catch (error) {
        console.error('Token không hợp lệ', error);
      }
    }
  }, [token]);

  const handleMenuClick = (info) => {
    if (info.key === 'profile') {
      navigate('/profile');
    } else if (info.key === 'settings') {
      navigate('/settings');
    } else if (info.key === 'logout') {
      dispatch({ type: 'LOGOUT' }); // đảm bảo reducer có case 'LOGOUT'
      navigate('/login');
    }
  };

  const menuProps = {
    items: [
      {
        key: 'profile',
        label: 'Hồ sơ cá nhân',
      },
      {
        key: 'settings',
        label: 'Cài đặt',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: 'Đăng xuất',
      },
    ],
    onClick: handleMenuClick,
  };

  return (
    <Header className="flex items-center justify-between px-4 bg-white shadow">
      {/* Logo hoặc Tên Hệ Thống */}
      <div className="text-lg font-bold">ESS - Hệ Thống Hỗ Trợ Thi Cử</div>

      {/* Khu vực bên phải: Search, Bell, Avatar */}
      <div className="flex items-center space-x-4">
        <div className="hidden sm:block">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm"
            style={{ width: 200 }}
          />
        </div>

        <Badge dot>
          <BellOutlined style={{ fontSize: '1.25rem' }} />
        </Badge>

        <Dropdown menu={menuProps} trigger={['hover']} placement="bottomRight">
          <div className="flex items-center space-x-2 cursor-pointer">
            <Avatar src={userInfo.avatarUrl} size="large" />
            <span className="hidden sm:inline text-sm font-medium">
              {userInfo.accname}
            </span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AppHeader;
