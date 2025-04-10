import React from 'react';
import { Layout, Row, Col, Upload, Card, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {
  UploadOutlined,
  EditOutlined,
  FileSearchOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;
const { Content } = Layout;

const ExamSelect = () => {
  // Cấu hình upload, bạn có thể mở rộng nếu cần upload thực sự
  const propsUpload = {
    name: 'file',
    multiple: true,
    action: '', // API xử lý upload thực tế, tạm để trống
    onChange(info) {
      // Xử lý trạng thái file, log ra console để xem
      console.log(info);
    },
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Content style={{ padding: '24px' }}>
        <Row gutter={24}>
          {/* Khu vực upload (bên trái) */}
          <Col xs={24} md={16} style={{ marginBottom: 24 }}>
            <Card
              style={{
                borderRadius: 8,
                minHeight: '400px',
              }}
            >
              <Dragger
                {...propsUpload}
                style={{
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: 32 }} />
                </p>
                <Title level={4}>Chọn File hoặc kéo thả File vào đây ( tính năng đang không được cung cấp )</Title>
              </Dragger>
            </Card>
          </Col>

          {/* Khu vực các lựa chọn (bên phải) */}
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Card: Tự soạn đề thi / Bài tập */}
              <Link to={`/`}>
                <Card
                  hoverable
                  style={{ borderRadius: 8 }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space>
                    <EditOutlined />
                    <Text>Tự soạn đề thi / Bài tập</Text>
                  </Space>
                </Card>
              </Link>

              {/* Card: Tạo đề thi MCQ 3 phần */}
              <Link to={`/exam/matrix`}>
                <Card
                  hoverable
                  style={{ borderRadius: 8 }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space>
                    <FileSearchOutlined />
                    <Text>Tạo đề thi MCQ 50 câu</Text>
                  </Space>
                </Card>
              </Link>

              {/* Card: Tạo đề thi MCQ 50 câu */}
              <Link to={`/exam/matrix3t`}>
                <Card
                  hoverable
                  style={{ borderRadius: 8 }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space>
                    <BarcodeOutlined />
                    <Text>Tạo đề thi MCQ 3 phần</Text>
                  </Space>
                </Card>
              </Link>
            </Space>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default ExamSelect;
