
import React, { useState, useEffect } from 'react';
import { LightbulbIcon } from './icons';

const PRINCIPLES = [
    { title: "Thành công được đo bằng 'Ngày Sống Sót'", text: "Chỉ số quan trọng nhất không phải là PnL, mà là số ngày bạn có thể duy trì tài khoản của mình." },
    { title: "Quy trình quan trọng hơn Kết quả", text: "Một lệnh thua từ một quy trình tốt còn tốt hơn một lệnh thắng từ một quy trình tồi." },
    { title: "Giao dịch tốt nhất đôi khi là không giao dịch", text: "Bảo vệ vốn trong điều kiện thị trường không chắc chắn là một hành động có lợi nhuận." },
    { title: "Bảo vệ vốn trước, phát triển nó sau", text: "Nhiệm vụ đầu tiên của bạn là đảm bảo bạn có thể giao dịch vào ngày mai." },
    { title: "Đừng để một lệnh thua biến thành một thảm họa", text: "Tuân thủ stop-loss không phải là một lựa chọn, đó là một quy tắc sinh tồn." },
];

export const PrinciplesWidget: React.FC = () => {
    const [principle, setPrinciple] = useState(PRINCIPLES[0]);

    useEffect(() => {
        // Select a random principle when the component mounts
        const randomIndex = Math.floor(Math.random() * PRINCIPLES.length);
        setPrinciple(PRINCIPLES[randomIndex]);
    }, []);

    return (
        <div className="space-y-4">
            <h3 className="flex items-center text-xs font-bold text-white/40 uppercase tracking-[0.2em]">
                <LightbulbIcon className="w-4 h-4 mr-2 text-accent-yellow-neon neon-text-yellow" />
                Principle of the Day
            </h3>
            <div className="bg-white/5 p-5 rounded-2xl border border-white/10 group hover:border-accent-primary/30 transition-all duration-500">
                <p className="font-bold text-accent-primary-neon text-base leading-snug group-hover:neon-text-blue transition-all">"{principle.title}"</p>
                <p className="text-xs text-text-secondary mt-3 leading-relaxed opacity-80">{principle.text}</p>
            </div>
        </div>
    );
};
