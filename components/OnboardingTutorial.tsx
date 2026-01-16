import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { KeyIcon, ChatBubbleBottomCenterTextIcon, ChartBarIcon, ShieldCheckIcon, AcademicCapIcon, SparklesIcon } from '@heroicons/react/24/solid';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tip?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Chào mừng đến TheKey AI! 🔑',
        description: 'TheKey AI là huấn luyện viên trading cá nhân, giúp bạn phát triển kỷ luật và tâm lý vững vàng để sinh tồn trên thị trường.',
        icon: <KeyIcon className="w-12 h-12 text-accent-neon" />,
        tip: 'Kỷ luật là chìa khóa sinh tồn trong trading.'
    },
    {
        id: 'checkin',
        title: 'Bước 1: Daily Check-in 📝',
        description: 'Mỗi ngày, thực hiện check-in để đánh giá trạng thái tâm lý trước khi trade. AI sẽ phân tích và đưa ra cảnh báo nếu bạn không ở trạng thái tốt nhất.',
        icon: <ChatBubbleBottomCenterTextIcon className="w-12 h-12 text-accent-blue" />,
        tip: 'Check-in giúp bạn tự nhận thức trước mỗi session trading.'
    },
    {
        id: 'trade-input',
        title: 'Bước 2: Ghi nhận Giao dịch 📊',
        description: 'Ghi lại mỗi giao dịch của bạn. AI sẽ phân tích hành vi trading, phát hiện patterns và đưa ra feedback coaching cá nhân hóa.',
        icon: <ChartBarIcon className="w-12 h-12 text-accent-yellow" />,
        tip: 'Mỗi lệnh là một bài học - hãy ghi chép cẩn thận!'
    },
    {
        id: 'ai-coach',
        title: 'Bước 3: Chat với AI Coach 🤖',
        description: 'Kaito là AI Coach của bạn - chuyên về tâm lý và kỷ luật trading. Hãy chia sẻ suy nghĩ, cảm xúc và nhận được coaching 24/7.',
        icon: <SparklesIcon className="w-12 h-12 text-accent-neon" />,
        tip: 'Kaito không cho tín hiệu vào lệnh - chỉ coaching về mindset.'
    },
    {
        id: 'process-dojo',
        title: 'Bước 4: Process Dojo 🥋',
        description: 'Sau mỗi giao dịch, đánh giá QUY TRÌNH của bạn (không phải kết quả P&L). Đây là nơi bạn rèn luyện kỷ luật thực sự.',
        icon: <AcademicCapIcon className="w-12 h-12 text-accent-red" />,
        tip: 'Trader giỏi tập trung vào quy trình, không phải lợi nhuận ngắn hạn.'
    },
    {
        id: 'market-intel',
        title: 'Bước 5: Market Intelligence 📡',
        description: 'AI phân tích mức độ nguy hiểm của thị trường hiện tại, giúp bạn điều chỉnh khối lượng và quản lý rủi ro phù hợp.',
        icon: <ShieldCheckIcon className="w-12 h-12 text-accent-yellow" />,
        tip: 'Khi thị trường DANGER, hãy giảm size hoặc đứng ngoài.'
    },
    {
        id: 'progress',
        title: 'Bước 6: Theo dõi Tiến độ 📈',
        description: 'Xem báo cáo hành vi hàng tuần, mục tiêu, và Shadow Score - chỉ số đo lường kỷ luật thực sự của bạn.',
        icon: <ChartBarIcon className="w-12 h-12 text-accent-blue" />,
        tip: 'Survival Days quan trọng hơn lợi nhuận!'
    },
    {
        id: 'complete',
        title: 'Sẵn sàng! 🚀',
        description: 'Bạn đã hiểu các tính năng cơ bản. Hãy bắt đầu hành trình trading có kỷ luật với TheKey AI!',
        icon: <CheckCircleIcon className="w-12 h-12 text-accent-neon" />,
        tip: 'Nhớ: Một ngày không trade cũng là chiến thắng.'
    }
];

interface OnboardingTutorialProps {
    onComplete: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const step = ONBOARDING_STEPS[currentStep];
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Tutorial Card */}
            <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative w-full max-w-lg bg-gradient-to-br from-gray-900/95 to-black/95 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white/80 transition-colors"
                    title="Bỏ qua hướng dẫn"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-1.5 mb-8">
                    {ONBOARDING_STEPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep
                                    ? 'w-8 bg-accent-neon'
                                    : idx < currentStep
                                        ? 'w-3 bg-accent-neon/50'
                                        : 'w-3 bg-white/20'
                                }`}
                        />
                    ))}
                </div>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        {step.icon}
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white text-center mb-4 uppercase tracking-wide">
                    {step.title}
                </h2>

                {/* Description */}
                <p className="text-base text-white/70 text-center leading-relaxed mb-6">
                    {step.description}
                </p>

                {/* Tip box */}
                {step.tip && (
                    <div className="bg-accent-neon/10 border border-accent-neon/30 rounded-xl p-4 mb-8">
                        <p className="text-sm text-accent-neon font-medium text-center">
                            💡 {step.tip}
                        </p>
                    </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between gap-4">
                    <button
                        onClick={handlePrev}
                        disabled={isFirstStep}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${isFirstStep
                                ? 'text-white/20 cursor-not-allowed'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        Trước
                    </button>

                    <span className="text-xs text-white/30 font-bold">
                        {currentStep + 1} / {ONBOARDING_STEPS.length}
                    </span>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-3 bg-accent-neon text-black rounded-xl font-black text-sm uppercase tracking-wider hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,245,155,0.3)]"
                    >
                        {isLastStep ? 'Bắt đầu!' : 'Tiếp'}
                        {!isLastStep && <ChevronRightIcon className="w-5 h-5" />}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
