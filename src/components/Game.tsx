import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Typography, Layout, Space, message, Modal, Dropdown, Avatar } from 'antd'
import { LogoutOutlined, TrophyOutlined, ShareAltOutlined, WhatsAppOutlined, UserOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import Confetti from 'react-confetti'
import type { MenuProps } from 'antd'

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
  funFacts: string[];
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
  
  .ant-space {
    cursor: pointer;
    
    &:hover {
      opacity: 0.9;
    }
  }
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

const FactsCard = styled(Card)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 16px;

  .ant-card-body {
    padding: 16px;
  }
`

function Game() {
  const SERVER_URL='https://globetrotter-backend-production-bf50.up.railway.app'
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
  const username = localStorage.getItem('username') || 'User'
  

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      // Store the current URL's challenge parameter before redirecting
      const urlParams = new URLSearchParams(window.location.search)
      const challengeData = urlParams.get('challenge')
      if (challengeData) {
        localStorage.setItem('pendingChallenge', challengeData)
      }
      navigate('/')
      return
    }

    const score = localStorage.getItem('score')
    if (score) {
      setScore(JSON.parse(score))
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
    localStorage.removeItem('username')
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

  // First, update the dropdown items to remove score and challenge options
  const dropdownItems: MenuProps['items'] = [
    {
      key: 'username',
      label: (
        <div style={{ padding: '4px 0' }}>
          Signed in as <strong>{username}</strong>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          Logout
        </Space>
      ),
      onClick: handleLogout,
      danger: true,
    },
  ]

  // Add a styled component for the header actions
  const HeaderActions = styled(Space)`
    .score-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      gap: 12px;

      .anticon {
        font-size: 20px;
      }
    }

    .challenge-button {
      &:hover {
        opacity: 0.9;
      }
    }
  `

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
          <Title level={4} style={{ color: 'white', margin: 0 }}>🌍 GlobeTrotter</Title>
        </Space>

        <HeaderActions size="middle">
          <div className="score-badge">
            <TrophyOutlined style={{ color: 'white' }} />
            <Space direction="vertical" size={0} style={{ lineHeight: '1.2' }}>
              <Text style={{ color: 'white' }}>
                Score: {score.correct}
              </Text>
              <Text style={{ color: 'white', fontSize: '12px', opacity: 0.8 }}>
                Games: {score.total}
              </Text>
            </Space>
          </div>

          <Button
            icon={<ShareAltOutlined />}
            onClick={generateShareableLink}
            ghost
            className="challenge-button"
          >
            Challenge Friends
          </Button>

          <Dropdown 
            menu={{ items: dropdownItems }} 
            trigger={['click']}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar
                style={{ 
                  backgroundColor: '#1890ff',
                  verticalAlign: 'middle',
                }}
                icon={<UserOutlined />}
              />
              <Text style={{ color: 'white' }}>{username}</Text>
            </Space>
          </Dropdown>
        </HeaderActions>
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

              <div>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Show the answer fact */}
                  {answerResponse.funFacts && (
                    <FactsCard>
                      <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: '8px' }}>Fun Facts:</Text>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {answerResponse.funFacts.map((fact, index) => (
                          <li key={index}>
                            <Text>{fact}</Text>
                          </li>
                        ))}
                      </ul>
                    </FactsCard>
                  )}
                </Space>
              </div>

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