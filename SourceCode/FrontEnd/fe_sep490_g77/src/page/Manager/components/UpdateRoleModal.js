import React, { useEffect } from "react";
import { Modal, Form, Input, Switch, Button } from "antd";
import { updateRole } from "../../../services/api";
import { toast } from "react-toastify"; // Import toast

const UpdateRoleModal = ({ visible, onClose, bankId, member }) => {
  const [form] = Form.useForm();

  // Khi modal mở và có member, set giá trị ban đầu cho form
  useEffect(() => {
    if (visible && member) {
      form.setFieldsValue({
        roleName: member.role || "",
        canModify: member.canModify || false,
        canDelete: member.canDelete || false,
      });
    }
  }, [visible, member, form]);

  const onFinish = async (values) => {
    // Xây dựng payload theo yêu cầu của API UpdateRole
    const payload = {
      RoleName: values.roleName,
      CanModify: values.canModify,
      CanRead: true, // Giả sử canRead luôn là true
      CanDelete: values.canDelete,
    };

    try {
      await updateRole(bankId, member.accid, payload);
      toast.success("Cập nhật quyền truy cập thành công."); // Thành công
      onClose();
    } catch (error) {
      toast.error(error.message || "Cập nhật quyền truy cập thất bại."); // Thất bại
    }
  };

  return (
    <Modal
      title={`Cập nhật vai trò cho ${member?.username || ""}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tên vai trò"
          name="roleName"
          rules={[{ required: true, message: "Vui lòng nhập tên vai trò" }]}
        >
          <Input placeholder="Nhập tên vai trò" />
        </Form.Item>
        <Form.Item
          label="Quyền sửa (Can Modify)"
          name="canModify"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
        <Form.Item
          label="Quyền xóa (Can Delete)"
          name="canDelete"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Cập nhật vai trò
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateRoleModal;