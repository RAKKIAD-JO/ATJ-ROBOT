"use client";

import React, { useState, useRef, useEffect } from "react";

interface ChatMessage {
    id: string;
    sender: "user" | "bot";
    text: string;
    timestamp: string;
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "welcome",
            sender: "bot",
            text: "สวัสดีครับ! ผมคือ ATJ BOT ผู้ช่วยประจำระบบ ATJ Robot สอบถามข้อมูลหุ่นยนต์ สถานะอุปกรณ์ หรือประวัติการทำงานในระบบได้เลยครับ 🤖✨",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userText = input.trim();
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: "user",
            text: userText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const response = await fetch(`${apiUrl}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText }),
            });

            const data = await response.json();

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text: data.reply || data.error || "ขออภัย ไม่สามารถดึงข้อมูลได้ในขณะนี้",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };

            setMessages((prev) => [...prev, botMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: "bot",
                    text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้ กรุณาตรวจสอบว่า Backend (port 5000) กำลังทำงานอยู่หรือไม่",
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Toggle Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold pl-3 pr-6 py-3 rounded-full shadow-2xl hover:shadow-emerald-600/30 transition-all duration-300 transform hover:scale-105 border border-emerald-400/40 cursor-pointer whitespace-nowrap"
                >
                    <div className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center shadow-md shrink-0">
                        <img src="/logomine1.png" alt="ATJ BOT Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-sm font-extrabold tracking-wider uppercase text-white drop-shadow-sm">
                        ATJ BOT
                    </span>
                </button>
            )}

            {/* Chat Window Container */}
            {isOpen && (
                <div className="flex flex-col w-[360px] sm:w-[400px] h-[530px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-inner shrink-0">
                                <img src="/logomine1.png" alt="ATJ BOT Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-base leading-tight tracking-wide text-white">ATJ BOT</h3>
                                <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-0.5 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block"></span>
                                    ผู้ช่วยระบบ ATJ Robot
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white/80 hover:text-white cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/80 dark:bg-slate-950/80">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[85%] ${
                                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                }`}
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden shadow-sm ${
                                        msg.sender === "user"
                                            ? "bg-emerald-600 text-white text-xs font-bold"
                                            : "bg-white p-1 border border-slate-200 dark:border-slate-700"
                                    }`}
                                >
                                    {msg.sender === "user" ? (
                                        "คุณ"
                                    ) : (
                                        <img src="/logomine1.png" alt="ATJ BOT" className="w-full h-full object-contain" />
                                    )}
                                </div>
                                <div>
                                    <div
                                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                            msg.sender === "user"
                                                ? "bg-emerald-600 text-white rounded-tr-none shadow-md font-medium"
                                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none shadow-sm"
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-1 block px-1">
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="flex gap-3 max-w-[85%] mr-auto items-center">
                                <div className="w-8 h-8 rounded-full bg-white p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                                    <img src="/logomine1.png" alt="ATJ BOT" className="w-full h-full object-contain" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shadow-sm">
                                    <svg className="w-4 h-4 animate-spin text-emerald-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>ATJ BOT กำลังประมวลผลคำตอบ...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Field */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="พิมพ์ถาม ATJ BOT..."
                                className="flex-1 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || loading}
                                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl transition-all shadow-md flex items-center justify-center cursor-pointer shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9-7-9-7-9 7 9 7zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
