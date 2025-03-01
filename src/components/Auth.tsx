import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { SERVER_URL } from '../config/env'

const { Title } = Typography

interface AuthFormData {
  username: string;
  password: string;
}

const StyledWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  padding: 20px;
`

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
`

const LogoTitle = styled(Title)`
  text-align: center;
  margin-bottom: 32px !important;
  color: #1890ff !important;
`

function Auth() {
  const [activeTab, setActiveTab] = useState('login')
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const handleSubmit = async (values: AuthFormData) => {
    try {
      const endpoint = activeTab === 'login' ? 'users/login' : 'users/register'
      const response = await fetch(`${SERVER_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        message.success(`${activeTab === 'login' ? 'Login' : 'Registration'} successful!`)
        navigate('/game')
      } else {
        message.error(data.message || `${activeTab === 'login' ? 'Login' : 'Registration'} failed`)
      }
    } catch (error) {
      console.error('Auth error:', error)
      message.error('An error occurred. Please try again.')
    }
  }

  const items = [
    {
      key: 'login',
      label: 'Login',
    },
    {
      key: 'register',
      label: 'Register',
    },
  ]

  return (
    <StyledWrapper>
      <StyledCard>
        <LogoTitle level={2}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          GlobeTrotter
        </LogoTitle>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          centered
        />

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Please input your username!' },
              { min: 3, message: 'Username must be at least 3 characters!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {activeTab === 'login' ? 'Login' : 'Register'}
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>
    </StyledWrapper>
  )
}

export default Auth 