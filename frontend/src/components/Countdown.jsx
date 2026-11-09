import { useEffect, useState } from 'react'

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) {
    return '00:00:00'
  }

  const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const secs = String(Math.floor(seconds % 60)).padStart(2, '0')
  return `${hrs}:${mins}:${secs}`
}

export default function Countdown({ remainingSeconds }) {
  const [display, setDisplay] = useState(remainingSeconds || 0)

  useEffect(() => {
    setDisplay(remainingSeconds || 0)
  }, [remainingSeconds])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplay((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return <span>{formatCountdown(display)}</span>
}
