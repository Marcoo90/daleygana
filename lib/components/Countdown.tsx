"use client";
import { useState, useEffect } from 'react';

interface CountdownProps {
  targetDate: string;
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeftValues = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };

      if (difference > 0) {
        timeLeftValues = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        setIsFinished(true);
      }

      return timeLeftValues;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isFinished) {
    return (
      <div className="countdown-container">
        <p className="countdown-finished">¡VENTA CERRADA! 🔒</p>
        <style jsx>{`
          .countdown-container {
            text-align: center;
            margin: 3rem 0;
            padding: 2rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 1.5rem;
            border: 1px solid rgba(239, 68, 68, 0.3);
          }
          .countdown-finished {
            color: #ef4444;
            font-size: 1.8rem;
            font-weight: 950;
            margin: 0;
            letter-spacing: 2px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="countdown-section">
      <p className="countdown-label">EL CIERRE DE VENTAS ES EN:</p>
      <div className="countdown-grid">
        <div className="countdown-item">
          <span className="count-value">{timeLeft.days}</span>
          <span className="count-label">DÍAS</span>
        </div>
        <div className="countdown-item">
          <span className="count-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="count-label">HORAS</span>
        </div>
        <div className="countdown-item">
          <span className="count-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="count-label">MIN</span>
        </div>
        <div className="countdown-item">
          <span className="count-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="count-label">SEG</span>
        </div>
      </div>

      <style jsx>{`
        .countdown-section {
          max-width: 800px;
          margin: 4rem auto;
          text-align: center;
          padding: 2.5rem;
          background: rgba(0, 229, 255, 0.03);
          border-radius: 2.5rem;
          border: 1px dashed rgba(0, 229, 255, 0.2);
          position: relative;
          overflow: hidden;
        }
        .countdown-label {
          color: var(--accent-cyan);
          font-weight: 900;
          font-size: 1.1rem;
          letter-spacing: 3px;
          margin-bottom: 2rem;
          text-transform: uppercase;
        }
        .countdown-grid {
          display: flex;
          justify-content: center;
          gap: 2rem;
        }
        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 90px;
        }
        .count-value {
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          font-weight: 950;
          color: #fff;
          line-height: 1;
          text-shadow: 0 0 20px rgba(0, 229, 255, 0.4);
        }
        .count-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 0.5rem;
          letter-spacing: 1px;
        }
        @media (max-width: 600px) {
          .countdown-grid { gap: 1rem; }
          .count-value { font-size: 2.5rem; }
          .countdown-item { min-width: 70px; }
        }
      `}</style>
    </div>
  );
}
