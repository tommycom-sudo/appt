'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Slider, Space, Typography, Button } from 'antd';
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function MarqueePage() {
  const [speed, setSpeed] = useState(50); // 默认速度
  const [isPaused, setIsPaused] = useState(false);
  const [text, setText] = useState('欢迎使用跑马灯效果！这是一个可以调节速度的跑马灯演示。');
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // 动画函数
  const animate = () => {
    if (isPaused) return;

    setPosition(prev => {
      if (!containerRef.current || !textRef.current) return prev;
      
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.offsetWidth;
      
      // 当文本完全移出容器时，重置位置
      if (prev <= -textWidth) {
        return containerWidth;
      }
      
      // 根据速度调整移动距离
      return prev - (speed / 10);
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  // 初始化动画
  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, isPaused]);

  // 暂停/继续
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 重置位置
  const resetPosition = () => {
    if (containerRef.current) {
      setPosition(containerRef.current.offsetWidth);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>跑马灯效果</Title>
          
          <div style={{ marginBottom: '20px' }}>
            <div>速度调节：</div>
            <Slider 
              min={1} 
              max={100} 
              value={speed} 
              onChange={setSpeed}
              style={{ width: '300px' }}
            />
            <div>当前速度: {speed}</div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <Space>
              <Button 
                icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />} 
                onClick={togglePause}
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
              <Button onClick={resetPosition}>重置位置</Button>
            </Space>
          </div>
          
          <div 
            ref={containerRef}
            style={{ 
              width: '100%', 
              height: '50px', 
              overflow: 'hidden', 
              position: 'relative',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5'
            }}
          >
            <div 
              ref={textRef}
              style={{ 
                position: 'absolute',
                whiteSpace: 'nowrap',
                transform: `translateX(${position}px)`,
                fontSize: '16px',
                lineHeight: '50px',
                padding: '0 10px'
              }}
            >
              {text}
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
} 