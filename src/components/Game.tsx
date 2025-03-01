import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Typography, Layout, Space, Progress, message } from 'antd'
import { LogoutOutlined, GlobalOutlined, TrophyOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import Confetti from 'react-confetti'
import { SERVER_URL } from '../config/env'

const { Title, Text } = Typography
const { Header, Content } = Layout

interface GameQuestion {
  questionId: string;
  clues: string[];
  options: string[];
}

interface AnswerResponseDto {
  isCorrect: boolean;
  correctAnswer: string;
  fact: string;
}

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
`

const StyledHeader = styled(Header)`
  background: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
`

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`

const StyledCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  margin-bottom: 24px;
`

const OptionButton = styled(Button)<{ $isCorrect?: boolean; $isWrong?: boolean }>`
  height: auto;
  padding: 16px;
  text-align: left;
  margin-bottom: 16px;
  border-radius: 8px;
  
  ${props => props.$isCorrect && `
    background-color: #52c41a !important;
    border-color: #52c41a !important;
    color: white !important;
  `}
  
  ${props => props.$isWrong && `
    background-color: #ff4d4f !important;
    border-color: #ff4d4f !important;
    color: white !important;
  `}
`

function Game() {
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answerResponse, setAnswerResponse] = useState<AnswerResponseDto | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
      return
    }
    fetchNewQuestion()
  }, [navigate])

  const fetchNewQuestion = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${SERVER_URL}/game/question`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        navigate('/')
        return
      }
      
      const data: GameQuestion = await response.json()
      setCurrentQuestion(data)
      setShowResult(false)
      setAnswerResponse(null)
      setSelectedAnswer('')
    } catch (error) {
      console.error('Error fetching question:', error)
    }
  }

  const handleAnswer = async (option: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${SERVER_URL}/game/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: currentQuestion?.questionId,
          selectedOption: option
        })
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        navigate('/')
        return
      }

      const data: AnswerResponseDto = await response.json()
      setAnswerResponse(data)
      setSelectedAnswer(option)
      setShowResult(true)
      setScore(prev => ({
        correct: prev.correct + (data.isCorrect ? 1 : 0),
        total: prev.total + 1
      }))
    } catch (error) {
      console.error('Error checking answer:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  if (!currentQuestion) {
    return (
      <StyledLayout>
        <StyledContent>
          <Card loading />
        </StyledContent>
      </StyledLayout>
    )
  }

  return (
    <StyledLayout>
      {answerResponse?.isCorrect && showResult && <Confetti />}
      
      <StyledHeader>
        <Space>
          <GlobalOutlined style={{ fontSize: 24, color: 'white' }} />
          <Title level={4} style={{ color: 'white', margin: 0 }}>GlobeTrotter</Title>
        </Space>
        <Space>
          <Space>
            <TrophyOutlined style={{ color: 'white' }} />
            <Text style={{ color: 'white' }}>Score: {score.correct}/{score.total}</Text>
          </Space>
          <Button 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            ghost
          >
            Logout
          </Button>
        </Space>
      </StyledHeader>

      <StyledContent>
        <StyledCard title="Guess the Destination">
          {currentQuestion.clues.map((clue, index) => (
            <Text key={index} style={{ display: 'block', marginBottom: 16 }}>
              🔍 {clue}
            </Text>
          ))}
        </StyledCard>

        <Space direction="vertical" style={{ width: '100%' }}>
          {currentQuestion.options.map((option) => (
            <OptionButton
              key={option}
              block
              onClick={() => !showResult && handleAnswer(option)}
              disabled={showResult}
              $isCorrect={showResult && option === answerResponse?.correctAnswer}
              $isWrong={showResult && option === selectedAnswer && !answerResponse?.isCorrect}
            >
              {option}
            </OptionButton>
          ))}
        </Space>

        {showResult && answerResponse && (
          <StyledCard style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>
                {answerResponse.isCorrect 
                  ? `🎉 Correct! You're amazing!` 
                  : '😢 Oops! Not quite right.'}
              </Title>
              {answerResponse.fact && (
                <Text>✨ Fun Fact: {answerResponse.fact}</Text>
              )}
              <Button 
                type="primary" 
                onClick={fetchNewQuestion}
                size="large"
                block
              >
                Next Question →
              </Button>
            </Space>
          </StyledCard>
        )}
      </StyledContent>
    </StyledLayout>
  )
}

export default Game 