import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Typography, Layout, Space, Progress, message, Modal } from 'antd'
import { LogoutOutlined, GlobalOutlined, TrophyOutlined, ShareAltOutlined, WhatsAppOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import Confetti from 'react-confetti'
import { SERVER_URL } from '../config/env'
import html2canvas from 'html2canvas'

const { Title, Text } = Typography
const { Header, Content } = Layout

interface GameQuestion {
  id: string;
  destination: string;
  clues: string[];
  funFacts: string[];
  options: string[];
  challenge?: {
    inviterUsername: string;
    inviterScore: number;
  };
}

interface AnswerResponseDto {
  isCorrect: boolean;
  correctAnswer: string;
  fact: string;
}

interface ShareableScore {
  username: string;
  score: {
    correct: number;
    total: number;
  };
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

const ShareCard = styled(Card)`
  background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
  color: white;
  text-align: center;
  padding: 20px;
  margin-bottom: 16px;
`

const ChallengeBanner = styled(Card)`
  background: linear-gradient(135deg, #722ed1 0%, #1890ff 100%);
  margin-bottom: 24px;
  border: none;
  
  .ant-card-body {
    padding: 16px;
  }
`

function Game() {
  const navigate = useNavigate()
  const [currentQuestion, setCurrentQuestion] = useState<GameQuestion | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answerResponse, setAnswerResponse] = useState<AnswerResponseDto | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareableLink, setShareableLink] = useState('')
  const scoreCardRef = useRef<HTMLDivElement>(null)
  const [challengeInfo, setChallengeInfo] = useState<GameQuestion['challenge']>()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
      return
    }

    // Check for challenge parameters in URL
    const urlParams = new URLSearchParams(window.location.search)
    const challengeData = urlParams.get('challenge')
    if (challengeData) {
      try {
        const decodedChallenge = JSON.parse(atob(challengeData))
        setChallengeInfo(decodedChallenge)
      } catch (error) {
        console.error('Error parsing challenge data:', error)
      }
    }

    fetchNewQuestion()
  }, [navigate])

  useEffect(() => {
    // Check if this is a shared game
    const urlParams = new URLSearchParams(window.location.search)
    const sharedScore = urlParams.get('score')
    if (sharedScore) {
      try {
        const decodedScore: ShareableScore = JSON.parse(atob(sharedScore))
        message.info(
          `${decodedScore.username}'s score: ${decodedScore.score.correct}/${decodedScore.score.total}. 
          Can you beat it?`
        )
      } catch (error) {
        console.error('Error parsing shared score:', error)
      }
    }
  }, [])

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
          questionId: currentQuestion?.id,
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

  const generateShareableLink = async () => {
    try {
      const username = localStorage.getItem('username') || 'A friend'
      const challengeData = {
        inviterUsername: username,
        inviterScore: score.correct
      }
      const encodedChallenge = btoa(JSON.stringify(challengeData))
      const baseUrl = window.location.origin
      const shareableLink = `${baseUrl}/game?challenge=${encodedChallenge}`
      setShareableLink(shareableLink)
      
      if (scoreCardRef.current) {
        const canvas = await html2canvas(scoreCardRef.current)
        const imageUrl = canvas.toDataURL()
        // You could upload this image to a service and include it in the share
      }
      
      setIsShareModalOpen(true)
    } catch (error) {
      console.error('Error generating shareable link:', error)
      message.error('Failed to generate share link')
    }
  }

  const handleShare = (platform: 'whatsapp' | 'copy') => {
    if (platform === 'whatsapp') {
      const challengeText = `🌍 I scored ${score.correct} points in GlobeTrotter! Think you can beat my score? Accept the challenge here: ${shareableLink}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(challengeText)}`
      window.open(whatsappUrl, '_blank')
    } else {
      navigator.clipboard.writeText(shareableLink)
      message.success('Challenge link copied to clipboard!')
    }
    setIsShareModalOpen(false)
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
            icon={<ShareAltOutlined />}
            onClick={generateShareableLink}
            ghost
            style={{ marginRight: 8 }}
          >
            Challenge Friends
          </Button>
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
        {challengeInfo && (
          <ChallengeBanner>
            <Space align="center" style={{ width: '100%', justifyContent: 'center' }}>
              <TrophyOutlined style={{ fontSize: 24, color: 'white' }} />
              <Text style={{ color: 'white', fontSize: 16 }}>
                {challengeInfo.inviterUsername} challenged you! Their score: {challengeInfo.inviterScore} points
              </Text>
            </Space>
          </ChallengeBanner>
        )}

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

      <Modal
        title="Challenge Your Friends!"
        open={isShareModalOpen}
        onCancel={() => setIsShareModalOpen(false)}
        footer={null}
      >
        <div ref={scoreCardRef}>
          <ShareCard>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              🌍 GlobeTrotter Challenge!
            </Title>
            <Text style={{ color: 'white', fontSize: 18, display: 'block', margin: '16px 0' }}>
              I scored {score.correct} points!
            </Text>
            <Text style={{ color: 'white' }}>
              Think you can beat my score?
            </Text>
          </ShareCard>
        </div>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<WhatsAppOutlined />}
            block
            onClick={() => handleShare('whatsapp')}
            style={{ backgroundColor: '#25D366', marginBottom: 8 }}
          >
            Share via WhatsApp
          </Button>
          <Button
            block
            onClick={() => handleShare('copy')}
          >
            Copy Link
          </Button>
        </Space>
      </Modal>
    </StyledLayout>
  )
}

export default Game 