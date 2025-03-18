import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Collapse, Skeleton, Button } from "antd";
import axios from "axios";
import { toast } from "react-toastify";

const { Panel } = Collapse;

const EssQuestionBankDetail = () => {
  const { bankId } = useParams();
  const [sections, setSections] = useState([]);
  const [bankInfo, setBankInfo] = useState(null);

  useEffect(() => {
    if (bankId) {
      fetchSections();
      fetchBankInfo();
    }
  }, [bankId]);

  /** ✅ Lấy thông tin ngân hàng câu hỏi ESS */
  const fetchBankInfo = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Bank/default/${bankId}`);
      console.log("✅ API Response:", response.data); // Debug API response
      setBankInfo(response.data);
    } catch (error) {
      toast.error("Không thể tải dữ liệu!");
    }
  };

  /** ✅ Lấy danh sách Sections của ngân hàng ESS */
  /** ✅ Lấy danh sách Sections của ngân hàng ESS */
const fetchSections = async () => {
    try {
      const response = await axios.get(`https://localhost:7052/api/Bank/default/${bankId}/sections`);
      setSections(response.data);  // Lưu toàn bộ cây section
    } catch (error) {
      toast.error("Lỗi khi tải dữ liệu section!");
    }
  };
  

  /** ✅ Hiển thị danh sách Sections */
  /** ✅ Hiển thị danh sách Sections dưới dạng cây */
const renderSections = (sections) => {
    return sections.map((section) => (
      <Panel key={section.secid} header={`${section.secname} (${section.questionCount} câu hỏi)`}>
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
      <div className="bg-white p-6 shadow-md rounded-lg mb-6 w-3/4 mx-auto">
        {bankInfo ? (
          <>
            <h1 className="text-2xl font-bold mb-2">{bankInfo.bankName}</h1>
            <p className="text-gray-600">Khối: <span className="font-semibold">{bankInfo.grade}</span></p>
            <p className="text-gray-600">Môn: <span className="font-semibold">{bankInfo.subject}</span></p>
            <p className="text-gray-600">Chương trình học: <span className="font-semibold">{bankInfo.curriculum}</span></p>
            <p className="text-gray-600 font-semibold">
              Tổng số câu hỏi: <span className="text-blue-600">{bankInfo.totalQuestion}</span>
            </p>
          </>
        ) : (
          <Skeleton active />
        )}
      </div>

      <div className="bg-white p-6 shadow-lg rounded-lg w-full max-w-5xl mx-auto">
        <h2 className="text-lg font-bold mb-4">Cấu trúc ngân hàng</h2>
        <Collapse>{sections.length > 0 ? renderSections(sections) : <p>Không có dữ liệu</p>}</Collapse>
      </div>

      <div className="flex justify-center mt-6">
        <Button type="default" onClick={() => window.history.back()}>
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default EssQuestionBankDetail;
