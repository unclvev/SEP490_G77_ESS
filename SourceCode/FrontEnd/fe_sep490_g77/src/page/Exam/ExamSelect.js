import React from 'react';
import { Layout, Row, Col, Card, Space, Typography } from 'antd';
import { Link } from 'react-router-dom';
import {
  EditOutlined,
  FileSearchOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content } = Layout;

const ExamSelect = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Content>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Col xs={22} sm={18} md={12} lg={10} xl={8}>
            <Space
              direction="vertical"
              size="large"
              style={{ width: '100%' }}
            >
              <Title level={3} style={{ textAlign: 'center' }}>
                Chọn cách tạo đề
              </Title>

              <Link to={`/`}>
                <Card
                  hoverable
                  style={{ borderRadius: 12 }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  <Space size="large">
                    <EditOutlined style={{ fontSize: 24 }} />
                    <Text style={{ fontSize: 18 }}>
                      Tự soạn đề thi / Bài tập
                    </Text>
                  </Space>
                </Card>
              </Link>

              <Link to={`/exam/matrix`}>
                <Card
                  hoverable
                  style={{ borderRadius: 12 }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  <Space size="large">
                    <FileSearchOutlined style={{ fontSize: 24 }} />
                    <Text style={{ fontSize: 18 }}>
                      Tạo đề thi MCQ 50 câu
                    </Text>
                  </Space>
                </Card>
              </Link>

              <Link to={`/exam/matrix3t`}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    opacity: 0.6,
                    pointerEvents: 'none',
                  }}
                  bodyStyle={{ padding: '20px 24px' }}
                >
                  <Space size="large">
                    <BarcodeOutlined style={{ fontSize: 24 }} />
                    <Text style={{ fontSize: 18 }}>
                      Tạo đề thi MCQ 3 phần (Đang phát triển)
                    </Text>
                  </Space>
                </Card>
              </Link>
            </Space>
          </Col>
        </div>
      </Content>
    </Layout>
  );
};

export default ExamSelect;
