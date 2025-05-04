import React, { useState } from 'react';
import { Modal, Form, AutoComplete, Switch, Button, message, Card, Typography, Row, Col } from 'antd';
import { searchUserToInvite, inviteUser } from '../../../services/api';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import {
  FileTextOutlined,
  BarChartOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const InviteUserForExam = ({ visible, onClose, examId }) => {
  const [form] = Form.useForm();
  const [options, setOptions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);

  const token = useSelector((state) => state.token);
  let accid = null;

  if (token) {
    try {
      const decoded = jwtDecode(token.token);
      accid = decoded.AccId || null;
    } catch (error) {
      console.error('Invalid token', error);
    }
  }

  const handleSearch = async (value) => {
    if (!value) {
      setOptions([]);
      return;
    }
    setLoadingSearch(true);
    try {
      const users = await searchUserToInvite(value);
      const newOptions = users.map((item) => ({
        label: `${item.name} - ${item.email}`,
        value: `${item.name} - ${item.email}`,
        accId: item.accId,
      }));
      setOptions(newOptions);
    } catch (error) {
      message.error(error.message || "Tìm kiếm không thành công.");
      console.error(error);
    }
    setLoadingSearch(false);
  };

  const handleSelect = (value, option) => {
    form.setFieldsValue({
      displayValue: value,
      accid: option.accId,
    });
  };

  const handleResourceChange = (resourceType, checked) => {
    if (checked) {
      setSelectedResources([...selectedResources, resourceType]);
    } else {
      setSelectedResources(selectedResources.filter(r => r !== resourceType));
    }
  };

  const onFinish = async (values) => {
    if (!values.accid) {
      message.error("Vui lòng chọn người dùng!");
      return;
    }

    if (!examId) {
      message.error("ExamId không được để trống!");
      return;
    }

    if (selectedResources.length === 0) {
      message.error("Vui lòng chọn ít nhất một quyền truy cập!");
      return;
    }

    try {
      for (const resourceType of selectedResources) {
        const payload = {
          resource: {
            ResourceType: resourceType,
            ResourceId: examId,
            accid: values.accid
          },
          accessRole: {
            RoleName: values.roleName,
            CanModify: resourceType === 'Exam' ? values.canModify : false,
            CanRead: true,
            CanDelete: resourceType === 'Exam' ? values.canDelete : false,
          },
        };

        await inviteUser(payload);
      }

      message.success("Người dùng đã được mời thành công.");
      form.resetFields();
      onClose();
    } catch (error) {
      const errorText = await error?.response?.text?.();
      message.error(errorText || "Quá trình mời người dùng thất bại.");
      console.error("Error details:", error);
    }
  };

  return (
    <Modal
      title={
        <div className="text-center">
          <Title level={4} className="mb-0">Mời Người Dùng</Title>
          <Text type="secondary">Cấp quyền truy cập cho người dùng mới</Text>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      className="rounded-lg"
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-6">
        <Form.Item name="accid" hidden>
          <input type="hidden" />
        </Form.Item>

        <Card title="Thông tin người dùng" className="mb-4">
          <Form.Item
            label="Tìm kiếm người dùng"
            name="displayValue"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng!' }]}
            tooltip="Nhập email hoặc tên người dùng để tìm kiếm"
          >
            <AutoComplete
              options={options}
              onSearch={handleSearch}
              onSelect={handleSelect}
              placeholder="Nhập email hoặc tên người dùng"
              notFoundContent={loadingSearch ? 'Đang tìm kiếm...' : 'Không tìm thấy người dùng'}
              className="w-full"
              allowClear
            />
          </Form.Item>

          <Form.Item
            label="Tên vai trò"
            name="roleName"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}
            tooltip="Tên vai trò sẽ hiển thị trong hệ thống"
          >
            <input
              type="text"
              className="ant-input"
              placeholder="Nhập tên vai trò"
            />
          </Form.Item>
        </Card>

        <Row gutter={16}>
          <Col span={12}>
            <Card title="Quyền truy cập tài nguyên" className="h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileTextOutlined className="text-2xl text-blue-500" />
                    <div>
                      <Text strong>Quản lý đề thi</Text>
                      <div className="text-gray-500">Truy cập và quản lý các đề thi</div>
                    </div>
                  </div>
                  <Form.Item name="hasExamAccess" valuePropName="checked" className="mb-0">
                    <Switch onChange={(checked) => handleResourceChange('Exam', checked)} />
                  </Form.Item>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BarChartOutlined className="text-2xl text-purple-500" />
                    <div>
                      <Text strong>Phân tích</Text>
                      <div className="text-gray-500">Xem và phân tích kết quả thi</div>
                    </div>
                  </div>
                  <Form.Item name="hasAnalysisAccess" valuePropName="checked" className="mb-0">
                    <Switch onChange={(checked) => handleResourceChange('Analysis', checked)} />
                  </Form.Item>
                </div>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Quyền thao tác" className="h-full">
              <div className="space-y-6">
                {!selectedResources.includes('Exam') && (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <EyeOutlined className="text-xl text-gray-500" />
                      <div>
                        <Text strong>Quyền đọc</Text>
                        <div className="text-gray-500">Xem thông tin và dữ liệu</div>
                      </div>
                    </div>
                    <Form.Item name="canRead" valuePropName="checked" initialValue={true} className="mb-0">
                      <Switch disabled />
                    </Form.Item>
                  </div>
                )}

                {selectedResources.includes('Exam') && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <EditOutlined className="text-xl text-blue-500" />
                        <div>
                          <Text strong>Quyền sửa</Text>
                          <div className="text-gray-500">Chỉnh sửa thông tin và dữ liệu</div>
                        </div>
                      </div>
                      <Form.Item name="canModify" valuePropName="checked" initialValue={false} className="mb-0">
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DeleteOutlined className="text-xl text-red-500" />
                        <div>
                          <Text strong>Quyền xóa</Text>
                          <div className="text-gray-500">Xóa thông tin và dữ liệu</div>
                        </div>
                      </div>
                      <Form.Item name="canDelete" valuePropName="checked" initialValue={false} className="mb-0">
                        <Switch />
                      </Form.Item>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <div className="flex justify-end space-x-4">
          <Button onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Mời Người Dùng
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default InviteUserForExam;
