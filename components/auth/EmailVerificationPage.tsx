/**
 * THEKEY AI - Email Verification Page
 * Handles the email verification token from the URL
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { KeyIcon, CheckCircleIcon, XCircleIcon } from '../icons';
import { authService } from '../../services/authService';
import { AuthLayout } from './AuthLayout';

export const EmailVerificationPage: React.FC = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Đang xác thực email của bạn...');

    useEffect(() => {
        const verify = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Mã xác thực không hợp lệ hoặc đã hết hạn.');
                return;
            }

            try {
                await authService.verifyEmail(token);
                setStatus('success');
                setMessage('Email của bạn đã được xác thực thành công! Bạn hiện đã có quyền truy cập vào các tính năng Pro.');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Xác thực thất bại. Vui lòng thử lại sau.');
            }
        };

        verify();
    }, []);

    return (
        <AuthLayout title="Xác thực Email">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <KeyIcon className="w-12 h-12 text-cyan-500" />
                </div>

                {status === 'loading' && (
                    <div className="space-y-4">
                        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
                        <p className="text-gray-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-center">
                            <CheckCircleIcon className="w-16 h-16 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Thành công!</h2>
                            <p className="text-gray-400 max-w-xs mx-auto">{message}</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                        >
                            Về Trang Chủ
                        </button>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-center">
                            <XCircleIcon className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Lỗi Xác Thực</h2>
                            <p className="text-red-400/80 max-w-xs mx-auto">{message}</p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/auth'}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-all"
                        >
                            Quay lại Đăng nhập
                        </button>
                    </motion.div>
                )}
            </div>
        </AuthLayout>
    );
};
