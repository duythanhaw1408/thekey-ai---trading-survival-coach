
import React, { useEffect } from 'react';
import type { Notification } from '../types';
import { AlertTriangleIcon, CheckCircleIcon, InformationCircleIcon } from './icons';

const NOTIFICATION_CONFIG = {
    LOW: { icon: <InformationCircleIcon className="w-6 h-6 text-accent-blue" />, color: 'border-accent-blue' },
    MEDIUM: { icon: <AlertTriangleIcon className="w-6 h-6 text-accent-yellow" />, color: 'border-accent-yellow' },
    HIGH: { icon: <AlertTriangleIcon className="w-6 h-6 text-accent-red" />, color: 'border-accent-red' },
    CRITICAL: { icon: <AlertTriangleIcon className="w-6 h-6 text-accent-red animate-pulse" />, color: 'border-accent-red' }
};

interface InAppNotificationProps {
    notification: Notification;
    onClose: () => void;
}

export const InAppNotification: React.FC<InAppNotificationProps> = ({ notification, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 8000); // Auto-close after 8 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    const config = NOTIFICATION_CONFIG[notification.priority];

    return (
        <div className={`fixed top-5 right-5 z-50 max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${config.color}`}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">{config.icon}</div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-gray-200">{notification.title}</p>
                        <p className="mt-1 text-sm text-gray-400">{notification.body}</p>
                        {notification.actions.length > 0 && (
                            <div className="mt-3 flex space-x-3">
                                {notification.actions.map(action => (
                                    <button key={action.id} className="bg-gray-700 text-xs text-gray-300 px-3 py-1 rounded-md hover:bg-gray-600">{action.label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={onClose} className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none">
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
