import React, { useState } from 'react';
import InviteUserModal from '../Manager/components/InviteUserModal';

const ManagerPage = () => {
  const [modalVisible, setModalVisible] = useState(false);

    

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
        bankId={3} // Thay bằng BankId thực tế
      />
    </div>
  );
};

export default ManagerPage;
