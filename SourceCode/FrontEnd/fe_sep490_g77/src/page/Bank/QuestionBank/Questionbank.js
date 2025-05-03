import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Card,
  Pagination,
  Modal,
  message,
  Select,
  Tabs,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import {
  getBankGrades,
  getBankSubjects,
  getBankCurriculums,
  getBanksByAccount,
  getDefaultBanks,
  getSharedBank,
  updateBankName,
  deleteBank,
} from "../../../services/api";
import "tailwindcss/tailwind.css";

const { TabPane } = Tabs;
const { Option } = Select;

const QuestionBank = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useSelector((state) => state.token);
  let accid = searchParams.get("accid") || localStorage.getItem("accid");
  if (token) {
    try {
      const decoded = jwtDecode(token.token);
      accid = decoded.AccId || accid;
    } catch {}
  }

  // data from BE
  const [banks, setBanks] = useState([]);
  const [defaultBanks, setDefaultBanks] = useState([]);
  const [sharedBanks, setSharedBanks] = useState([]);

  // loading flags
  const [loading, setLoading] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);

  // filter inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [defaultSearchQuery, setDefaultSearchQuery] = useState("");
  const [sharedSearchQuery, setSharedSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDefaultPage, setCurrentDefaultPage] = useState(1);
  const [currentSharedPage, setCurrentSharedPage] = useState(1);
  const itemsPerPage = 8;

  // modal/edit/delete
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [deletingBank, setDeletingBank] = useState(null);
  const [newBankName, setNewBankName] = useState("");

  // lookup data
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [curriculums, setCurriculums] = useState([]);

  useEffect(() => {
    getBankGrades()
      .then((r) => setGrades(r.data))
      .catch(() => {});
    getBankSubjects()
      .then((r) => setSubjects(r.data))
      .catch(() => {});
    getBankCurriculums()
      .then((r) => setCurriculums(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getBanksByAccount(accid)
      .then((r) => setBanks(r.data))
      .catch(() => message.error("❌ Lỗi khi tải dữ liệu!"))
      .finally(() => setLoading(false));
  }, [accid]);

  useEffect(() => {
    setLoadingDefault(true);
    getDefaultBanks()
      .then((r) => setDefaultBanks(r.data))
      .catch(() => {})
      .finally(() => setLoadingDefault(false));

      
  }, []);

  useEffect(() => {
    setLoadingShared(true);
    getSharedBank()
      .then((r) => setSharedBanks(r.data))
      .catch(() => {})
      .finally(() => setLoadingShared(false));
  }, []);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const handleCreateBank = () => navigate("/create-question-bank");
  const handleCardClick = (id) => navigate(`/question-bank-detail/${id}`);
  const handleDefaultCardClick = (id) => navigate(`/default-bank-detail/${id}`);
  const handleEditBank = (bank, e) => {
    e.stopPropagation();
    setEditingBank(bank);
    setNewBankName(bank.bankname);
    setIsEditModalOpen(true);
  };
  const confirmDeleteBank = async () => {
    try {
      await deleteBank(deletingBank.bankId);
      toast.success("✅ Xóa thành công!", 2);
      setIsDeleteModalOpen(false);
      setBanks(banks.filter((b) => b.bankId !== deletingBank.bankId));
    } catch {
      toast.error("❌ Lỗi khi xóa!");
    }
  };
  const handleUpdateBankName = async () => {
    if (!newBankName.trim()) {
      message.warning("⚠️ Tên không được để trống");
      return;
    }
    try {
      await updateBankName(
        editingBank.bankId,
        { bankId: editingBank.bankId, bankname: newBankName },
        { headers: { Authorization: `Bearer ${token.token}` } }
      );
      toast.success("✅ Cập nhật thành công!", 2);
      setIsEditModalOpen(false);
      setBanks(
        banks.map((b) =>
          b.bankId === editingBank.bankId ? { ...b, bankname: newBankName } : b
        )
      );
    } catch {
      toast.error("❌ Lỗi khi cập nhật!");
    }
  };

  // compute filtered + paged lists
  const filterAndPage = (data, query, page) => {
    const q = query.trim().toLowerCase();
    const filtered = data.filter((bank) => {
      // đảm bảo luôn có string để gọi toLowerCase()
      const name = (bank.bankname ?? bank.bankName ?? "").toLowerCase();

      const bySearch = q ? name.includes(q) : true;
      const byGrade = selectedGrade ? bank.grade === selectedGrade : true;
      const bySubj = selectedSubject ? bank.subject === selectedSubject : true;
      const byCurr = selectedCurriculum
        ? bank.curriculum === selectedCurriculum
        : true;

      return bySearch && byGrade && bySubj && byCurr;
    });

    const total = filtered.length;
    const pageData = filtered.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
    return { total, pageData };
  };

  const { total: personalTotal, pageData: personalPageData } = filterAndPage(
    banks,
    searchQuery,
    currentPage
  );

  const { total: defaultTotal, pageData: defaultPageData } = filterAndPage(
    defaultBanks,
    defaultSearchQuery,
    currentDefaultPage
  );

  const { total: sharedTotal, pageData: sharedPageData } = filterAndPage(
    sharedBanks,
    sharedSearchQuery,
    currentSharedPage
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">
        QUẢN LÝ NGÂN HÀNG CÂU HỎI
      </h1>
      <Tabs defaultActiveKey="personal">
        <TabPane tab="Ngân hàng của bạn" key="personal">
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Khối"
              allowClear
              value={selectedGrade}
              onChange={(v) => {
                setSelectedGrade(v);
                setCurrentPage(1);
              }}
              style={{ width: 120 }}
            >
              {grades.map((g) => (
                <Option key={g.gradeId} value={g.gradeLevel}>
                  {g.gradeLevel}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Môn"
              allowClear
              value={selectedSubject}
              onChange={(v) => {
                setSelectedSubject(v);
                setCurrentPage(1);
              }}
              style={{ width: 140 }}
            >
              {subjects.map((s) => (
                <Option key={s.subjectId} value={s.subjectName}>
                  {s.subjectName}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Chương trình"
              allowClear
              value={selectedCurriculum}
              onChange={(v) => {
                setSelectedCurriculum(v);
                setCurrentPage(1);
              }}
              style={{ width: 180 }}
            >
              {curriculums.map((c) => (
                <Option key={c.curriculumId} value={c.curriculumName}>
                  {c.curriculumName}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleCreateBank}
            >
              Tạo ngân hàng đề thi
            </Button>
          </div>
          {loading ? (
            <p className="text-center">Đang tải...</p>
          ) : personalPageData.length === 0 ? (
            <p className="text-center">Không tìm thấy kết quả.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {personalPageData.map((bank) => (
                <Card
                  key={bank.bankId}
                  className="cursor-pointer"
                  onClick={() => handleCardClick(bank.bankId)}
                >
                  <h2 className="font-bold">{bank.bankname}</h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(bank.createDate)}
                  </p>
                  <p>{bank.totalQuestion || 0} câu hỏi</p>
                  <div className="mt-2 flex gap-2 text-xs text-gray-600">
                    <span>{bank.grade}</span>
                    <span>{bank.subject}</span>
                    <span>{bank.curriculum}</span>
                  </div>
                  <div className="mt-3 flex justify-between">
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={(e) => handleEditBank(bank, e)}
                    />
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingBank(bank);
                        setIsDeleteModalOpen(true);
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <Pagination
              current={currentPage}
              total={personalTotal}
              pageSize={itemsPerPage}
              onChange={setCurrentPage}
              showSizeChanger={false}
            />
          </div>
        </TabPane>

        <TabPane tab="Ngân hàng hệ thống" key="system">
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Tìm kiếm hệ thống..."
              value={defaultSearchQuery}
              onChange={(e) => {
                setDefaultSearchQuery(e.target.value);
                setCurrentDefaultPage(1);
              }}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Khối"
              allowClear
              value={selectedGrade}
              onChange={(v) => {
                setSelectedGrade(v);
                setCurrentDefaultPage(1);
              }}
              style={{ width: 120 }}
            >
              {grades.map((g) => (
                <Option key={g.gradeId} value={g.gradeLevel}>
                  {g.gradeLevel}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Môn"
              allowClear
              value={selectedSubject}
              onChange={(v) => {
                setSelectedSubject(v);
                setCurrentDefaultPage(1);
              }}
              style={{ width: 140 }}
            >
              {subjects.map((s) => (
                <Option key={s.subjectId} value={s.subjectName}>
                  {s.subjectName}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Chương trình"
              allowClear
              value={selectedCurriculum}
              onChange={(v) => {
                setSelectedCurriculum(v);
                setCurrentDefaultPage(1);
              }}
              style={{ width: 180 }}
            >
              {curriculums.map((c) => (
                <Option key={c.curriculumId} value={c.curriculumName}>
                  {c.curriculumName}
                </Option>
              ))}
            </Select>
          </div>
          {loadingDefault ? (
            <p className="text-center">Đang tải...</p>
          ) : defaultPageData.length === 0 ? (
            <p className="text-center">Không tìm thấy hệ thống.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {defaultPageData.map((bank) => (
                <Card
                  key={bank.bankId}
                  className="cursor-pointer"
                  onClick={() => handleDefaultCardClick(bank.bankId)}
                >
                  <h2 className="font-bold">{bank.bankname}</h2>
                  <p className="text-sm text-gray-500">
                    {formatDate(bank.createDate)}
                  </p>
                  <p>{bank.totalQuestion || 0} câu hỏi</p>
                  <div className="mt-2 flex gap-2 text-xs text-gray-600">
                    <span>{bank.grade}</span>
                    <span>{bank.subject}</span>
                    <span>{bank.curriculum}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <Pagination
              current={currentDefaultPage}
              total={defaultTotal}
              pageSize={itemsPerPage}
              onChange={setCurrentDefaultPage}
              showSizeChanger={false}
            />
          </div>
        </TabPane>

        <TabPane tab="Ngân hàng được chia sẻ" key="shared">
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Tìm kiếm chia sẻ..."
              value={sharedSearchQuery}
              onChange={(e) => {
                setSharedSearchQuery(e.target.value);
                setCurrentSharedPage(1);
              }}
              style={{ width: 200 }}
            />
            <Select
              placeholder="Khối"
              allowClear
              value={selectedGrade}
              onChange={(v) => {
                setSelectedGrade(v);
                setCurrentSharedPage(1);
              }}
              style={{ width: 120 }}
            >
              {grades.map((g) => (
                <Option key={g.gradeId} value={g.gradeLevel}>
                  {g.gradeLevel}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Môn"
              allowClear
              value={selectedSubject}
              onChange={(v) => {
                setSelectedSubject(v);
                setCurrentSharedPage(1);
              }}
              style={{ width: 140 }}
            >
              {subjects.map((s) => (
                <Option key={s.subjectId} value={s.subjectName}>
                  {s.subjectName}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Chương trình"
              allowClear
              value={selectedCurriculum}
              onChange={(v) => {
                setSelectedCurriculum(v);
                setCurrentSharedPage(1);
              }}
              style={{ width: 180 }}
            >
              {curriculums.map((c) => (
                <Option key={c.curriculumId} value={c.curriculumName}>
                  {c.curriculumName}
                </Option>
              ))}
            </Select>
          </div>
          {loadingShared ? (
            <p className="text-center">Đang tải...</p>
          ) : sharedPageData.length === 0 ? (
            <p className="text-center">Không có chia sẻ.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {sharedPageData.map((bank) => (
                <Card
                  key={bank.bankId}
                  className="cursor-pointer"
                  onClick={() => handleCardClick(bank.bankId)}
                >
                  <h2 className="font-bold">
                    {bank.bankname || bank.bankName}
                  </h2>
                  <p>{bank.totalQuestion ?? bank.totalQuestion} câu hỏi</p>
                  <div className="mt-2 flex gap-2 text-xs text-gray-600">
                    <span>{bank.grade}</span>
                    <span>{bank.subject}</span>
                    <span>{bank.curriculum}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-center">
            <Pagination
              current={currentSharedPage}
              total={sharedTotal}
              pageSize={itemsPerPage}
              onChange={setCurrentSharedPage}
              showSizeChanger={false}
            />
          </div>
        </TabPane>
      </Tabs>

      <Modal
        title="Xác nhận xóa"
        open={isDeleteModalOpen}
        onOk={confirmDeleteBank}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Xóa"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn xóa “{deletingBank?.bankname}”?</p>
      </Modal>

      <Modal
        title="Đổi tên"
        open={isEditModalOpen}
        onOk={handleUpdateBankName}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Input
          value={newBankName}
          onChange={(e) => setNewBankName(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default QuestionBank;
