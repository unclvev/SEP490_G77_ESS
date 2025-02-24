import { Button, Card, Input } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';

const RegistrationPage = () => {
  return (
    <div className="relative h-screen flex">
      <div className="absolute top-4 left-4">
        <Link to="/">
          <img width="120" src="/images/logo.svg" alt="Logo" />
        </Link>
      </div>
      <div
        className="flex-1 bg-cover bg-center bg-no-repeat border-r-4 border-gray-300 flex items-center justify-center"
        style={{
          width: '50%',
          height: '80vh',
          backgroundImage:
            'url(https://kissenglishcenter.com/wp-content/uploads/2022/05/1694-840x450.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '0 10px 10px 0',
          overflow: 'hidden',
          margin: 'auto'
        }}
      ></div>
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <Card title="Create an account" className="w-full max-w-md">
          <form className="space-y-4 mt-4">
            <Input type="text" name="userName" placeholder="Username" />
            <Input type="email" name="email" placeholder="Email" />
            <Input type="text" name="address" placeholder="Address" />
            <Input type="text" name="phoneNumber" placeholder="Phone Number" />
            <Input type="password" name="password" placeholder="Password" />
            <Input
              type="password"
              name="rePassword"
              placeholder="Re-enter Password"
            />
            <div className="text-gray-500 text-xs mt-4">
              By signing up, you agree to our{' '}
              <a href="/" className="text-black">
                User Agreement
              </a>{' '}
              and acknowledge reading our{' '}
              <a href="/" className="text-black">
                User Privacy Notice
              </a>.
            </div>
            <Button type="primary" htmlType="submit" className="w-full mt-4">
              Create account
            </Button>
            <span className="text-black text-sm text-center block mb-6">
                            Bạn đã có tài khoản ? <a className='text-blue-600' href='/login'>Đăng nhập</a>
            </span>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationPage;
