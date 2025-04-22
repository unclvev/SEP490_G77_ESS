import React, { useState } from 'react';
import { Modal, Button, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { saveStudentList } from '../../services/api';

const { Dragger } = Upload;

/**
 * Props:
 *  - visible (bool)
 *  - examId (string|number)
 *  - onClose () => void
 *  - onImportSuccess (students: array) => void
 *  - importStudents (formData) async function
 */
export default function ImportStudentModal({
  visible,
  examId,
  onClose,
  onImportSuccess,
}) {
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = ({ fileList }) => {
    setFileList(fileList.slice(-1));
  };

  const handleSave = async () => {
    if (!fileList.length) {
      message.error('Vui lòng chọn file trước khi lưu');
      return;
    }

    const file = fileList[0].originFileObj;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('examId', examId);

    setLoading(true);
    try {
      // importStudents phải trả về { data: [...] }
      const response = await saveStudentList(formData);
      console.log(response);
      const students = response.data;
      message.success(`Import thành công: ${students.length} học sinh`);
      setFileList([]);
      onImportSuccess(students);
      onClose();
    } catch (err) {
      console.error(err);
      message.error('Import thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Import danh sách học sinh"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Hủy
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          Lưu
        </Button>,
      ]}
    >
      <Dragger
        accept=".xlsx,.csv"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={handleChange}
        multiple={false}
        icon={<InboxOutlined />}
      >
        <p style={{ textAlign: 'center', margin: '16px 0' }}>
          Kéo hoặc nhấn để chọn file
        </p>
      </Dragger>
    </Modal>
  );
}
