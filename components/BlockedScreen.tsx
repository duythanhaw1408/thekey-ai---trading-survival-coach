
import React, { useState, useEffect } from 'react';
import { StopCircleIcon } from './icons';

interface BlockedScreenProps {
  reason: string;
  cooldown: number; // in seconds
  onClose: () => void;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({ reason, cooldown, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(cooldown);

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose();
      return;
    };

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onClose]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel border border-divider rounded-xl shadow-2xl p-8 max-w-lg text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-800 mb-4">
            <StopCircleIcon className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">⛔ Hệ Thống Bảo Vệ Kích Hoạt</h2>
        <p className="text-text-secondary mb-6">{reason}</p>
        <div className="bg-background rounded-lg p-4">
          <p className="text-text-secondary">Thời gian chờ bắt buộc:</p>
          <p className="text-5xl font-mono font-bold text-white tracking-widest">{formatTime(timeLeft)}</p>
        </div>
         <div className="mt-6 text-left text-sm text-text-secondary p-4 bg-background rounded-lg">
            <p className="font-semibold text-text-main mb-2">💡 Trong lúc chờ:</p>
            <ul className="list-disc list-inside space-y-1">
                <li>Uống nước, thở sâu 10 lần.</li>
                <li>Đi dạo quanh nhà 5 phút.</li>
                <li>Viết ra: "Tại sao tôi muốn vào lệnh này ngay bây giờ?"</li>
            </ul>
        </div>
      </div>
    </div>
  );
};