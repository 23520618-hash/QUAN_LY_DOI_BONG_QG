import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info', // 'info', 'success', 'error', 'warning'
        onConfirm: null,
    });

    const showAlert = useCallback((message, type = 'info', title = 'Thông báo') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: null
        });
    }, []);

    const showConfirm = useCallback((message, onConfirm, title = 'Xác nhận', type = 'warning') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm
        });
    }, []);

    const closeAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (alertConfig.onConfirm) {
            alertConfig.onConfirm();
        }
        closeAlert();
    }, [alertConfig, closeAlert]);

    const renderIcon = () => {
        switch (alertConfig.type) {
            case 'error':
                return (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.3)] mb-6 animate-pulse-fast">
                        <svg className="h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'success':
                return (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] mb-6 animate-bounce-short">
                        <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-6">
                        <svg className="h-10 w-10 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'info':
            default:
                return (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/20 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.3)] mb-6">
                        <svg className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {alertConfig.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={!alertConfig.onConfirm ? closeAlert : undefined}></div>
                    
                    {/* Modal */}
                    <div className="relative w-full max-w-md bg-gradient-to-b from-[#1e293b]/95 to-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-[0_10px_50px_rgba(0,0,0,0.7)] animate-bounce-in">
                        
                        {/* Nút X đóng góc phải */}
                        <button 
                            onClick={closeAlert}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-rose-500/80 rounded-full p-2 transition-all duration-200 focus:outline-none"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="text-center">
                            {renderIcon()}
                            
                            <h3 className="text-2xl font-extrabold text-white mb-3 tracking-wide drop-shadow-md">
                                {alertConfig.title}
                            </h3>
                            
                            <div className="text-slate-300 text-[15px] leading-relaxed mb-8 font-medium px-2 whitespace-pre-wrap text-left max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                                {alertConfig.message}
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            {alertConfig.onConfirm ? (
                                <div className="flex gap-3">
                                    <button 
                                        onClick={closeAlert}
                                        className="flex-1 px-5 py-3.5 rounded-2xl text-slate-300 font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200 hover:text-white"
                                    >
                                        Thoát
                                    </button>
                                    <button 
                                        onClick={handleConfirm}
                                        className={`flex-1 px-5 py-3.5 rounded-2xl text-white font-bold shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:scale-[1.02] active:scale-95 ${
                                            alertConfig.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] border border-rose-500/50' :
                                            alertConfig.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-500/50' :
                                            'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-500/50'
                                        }`}
                                    >
                                        Tiếp tục Áp dụng
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={closeAlert}
                                    className={`w-full px-5 py-3.5 rounded-2xl text-white font-bold tracking-widest shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:scale-[1.02] active:scale-95 uppercase ${
                                        alertConfig.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-[0_0_25px_rgba(244,63,94,0.5)] border border-rose-500/50' :
                                        alertConfig.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-500/50' :
                                        alertConfig.type === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] border border-amber-500/50' :
                                        'bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-blue-500/50'
                                    }`}
                                >
                                    Đã Hiểu
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};

export default AlertProvider;
