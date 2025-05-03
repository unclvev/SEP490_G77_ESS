import React, { useState } from 'react';
import InviteUserModal from '../Manager/components/InviteUserModal';
import ListMemberModal from '../Manager/components/ListMemberModal'; // Import component ListMemberModal
import InviteUserForExam from '../Manager/components/InviteUserForExam'; // Import component InviteUserForExam
const ManagerPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [listMemberModalVisible, setListMemberModalVisible] = useState(false); // State cho ListMemberModal
  const [inviteUserForExamModalVisible, setInviteUserForExamModalVisible] = useState(false); // State cho InviteUserForExamModal
  return (
    <div className="p-4">
      <button
        className="px-4 py-2 bg-green-500 text-white rounded"
        onClick={() => setModalVisible(true)}
      >
        Mời Người Dùng
      </button>
      <InviteUserModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        bankId={2}
        resourceType="bank"
      />

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded ml-2"
        onClick={() => setListMemberModalVisible(true)}
      >
        Hiện Danh Sách Thành Viên
      </button>
      <ListMemberModal
        visible={listMemberModalVisible}
        onClose={() => setListMemberModalVisible(false)}
        bankId={2}
        resourceType="bank"
      />

      <button
        className="px-4 py-2 bg-blue-500 text-white rounded ml-2"
        onClick={() => setInviteUserForExamModalVisible(true)}
      >
        Mời Người Dùng Để Thi
      </button>
      <InviteUserForExam
        visible={inviteUserForExamModalVisible}
        onClose={() => setInviteUserForExamModalVisible(false)}
        examId={2}
        resourceType="exam"
      />
    </div>
  );
};

export default ManagerPage;
