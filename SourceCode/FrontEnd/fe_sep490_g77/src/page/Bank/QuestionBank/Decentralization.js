import React from "react";
import { Button, Table } from "antd";
import "tailwindcss/tailwind.css";

const Decentralization = () => {
  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      key: "stt",
    },
    {
      title: "THÀNH VIÊN",
      dataIndex: "member",
      key: "member",
    },
    {
      title: "VAI TRÒ",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Hành động",
      key: "action",
      render: () => <span role="img" aria-label="edit">✏️</span>,
    },
  ];

  const data = [
    {
      key: "1",
      stt: "1",
      member: "Hoàng Thu Phương\nPhuongHTHE172196@FPT.EDU.VN",
      role: "Chủ sở hữu",
    },
    {
      key: "2",
      stt: "2",
      member: "Nguyễn Thành Đức\nPhuongHTHE172196@FPT.EDU.VN",
      role: "Người soạn thảo",
    },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">NGÂN HÀNG CÂU HỎI TOÁN 2</h1>

      <div className="flex justify-start mb-4">
        <Button type="primary" className="bg-blue-500 hover:bg-blue-600 text-white">
          + Thêm thành viên
        </Button>
      </div>

      <div className="bg-green-200 p-4 rounded shadow-md">
        <Table columns={columns} dataSource={data} pagination={false} />
      </div>
    </div>
  );
};

export default Decentralization;
