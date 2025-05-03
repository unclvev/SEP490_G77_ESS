import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Collapse, Skeleton, Button } from "antd";
import axios from "axios";
import { toast } from "react-toastify";
import { getDefaultBank, getDefaultSections } from '../../../services/api';

const { Panel } = Collapse;

const EssQuestionBankDetail = () => {
  const { bankId } = useParams();
  const [sections, setSections] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (bankId) {
      fetchBankInfo();
      fetchSections();
    }
  }, [bankId]);

  // ✅ Lấy thông tin ngân hàng câu hỏi
  const fetchBankInfo = async () => {
    try {
      const response = await getDefaultBank(bankId);
      setBankInfo(response.data);
    } catch (error) {
      toast.error("Không thể tải dữ liệu ngân hàng!");
    }
  };

  // ✅ Lấy danh sách Sections của ngân hàng
  const fetchSections = async () => {
    try {
      const response = await getDefaultSections(bankId);

      setSections(response.data);
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu section!");
    }
  };

  // ✅ Hiển thị danh sách Sections dưới dạng cây
  const renderSections = (sections) => {
    return sections.map((section) => (
      <Panel
        key={section.secid}
        header={
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold">{section.secname}</span>
            <span
              className="text-blue-600 text-sm ml-2 cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/default-bank/${section.secid}/questions`);
              }}
            >
              ({section.questionCount} câu hỏi)
            </span>
          </div>
        }
      >
        {section.children?.length > 0 ? (
          <Collapse>{renderSections(section.children)}</Collapse>
        ) : (
          <p className="ml-4 text-gray-500">Không có section con</p>
        )}
      </Panel>
    ));
  };
  
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* ✅ Hiển thị thông tin ngân hàng câu hỏi */}
      <div className="bg-white p-6 shadow-md rounded-lg mb-6 w-3/4 mx-auto">
        {bankInfo ? (
          <>
            <h1 className="text-2xl font-bold mb-2">{bankInfo.bankname}</h1>
            <p className="text-gray-600">Khối: <span className="font-semibold">{bankInfo.grade}</span></p>
            <p className="text-gray-600">Môn: <span className="font-semibold">{bankInfo.subject}</span></p>
            {/* <p className="text-gray-600">Chương trình học: <span className="font-semibold">{bankInfo.curriculum}</span></p> */}
            <p className="text-gray-600 font-semibold">
              Tổng số câu hỏi: <span className="text-blue-600">{bankInfo.totalquestion}</span>
            </p>
          </>
        ) : (
          <Skeleton active />
        )}
      </div>

      {/* ✅ Hiển thị cấu trúc ngân hàng */}
      <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-5xl mx-auto">
        <h2 className="text-lg font-bold mb-4">Cấu trúc ngân hàng</h2>
        <Collapse>{sections.length > 0 ? renderSections(sections) : <p>Không có dữ liệu</p>}</Collapse>
      </div>

      {/* ✅ Nút quay lại */}
      <div className="flex justify-center mt-6">
        <Button type="default" onClick={() => window.history.back()}>Quay lại</Button>
      </div>
    </div>
  );
};

export default EssQuestionBankDetail;
