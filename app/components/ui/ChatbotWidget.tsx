"use client";

import { useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import axios from "axios";

type ChatMessage = {
    role: "user" | "bot";
    text: string;
};

type AIResponse = {
    success: boolean;
    response: string;
};

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: "bot",
            text: "Hi! I’m your AI assistant. Ask me anything about LeadWise.",
        },
    ]);

    const handleSubmit = async () => {
        const trimmed = input.trim();

        if (!trimmed || loading) return;

        const userMessage: ChatMessage = {
            role: "user",
            text: trimmed,
        };

        setMessages((prev) => [...prev, userMessage]);

        setInput("");
        setLoading(true);

        try {
            const response = await axios.post<AIResponse>(
                "/api/AI/Chat",
                {
                    message: trimmed,
                }
            );

            const botReply = response.data.response;

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    text: botReply,
                },
            ]);
        } catch (error: unknown) {

            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    text: "Sorry, I couldn’t reach the AI service. Please try again later.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:bottom-5 sm:right-5">

            {isOpen ? (
                <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-90 flex-col overflow-hidden rounded-2xl border border-[#E5CB90]/80 bg-white shadow-[0_18px_55px_rgba(17,24,39,0.16)] sm:w-90">

                    {/* Header */}
                    <div className="flex items-center justify-between bg-[#22303A] px-4 py-3 text-white">

                        <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFCC70] text-[#22303A]">
                                <Bot className="h-4 w-4" />
                            </div>

                            <div>
                                <p className="text-sm font-semibold">
                                    AI Assistant
                                </p>

                                <p className="text-[10px] text-slate-300">
                                    Online
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1.5 text-slate-200 transition hover:bg-white/10 hover:text-white"
                            aria-label="Close chat"
                        >
                            <X className="h-4 w-4" />
                        </button>

                    </div>


                    {/* Chat Area */}
                    <div className="flex min-h-0 flex-1 flex-col bg-[#FFF7E0]">

                        <div className="h-[min(28rem,calc(100dvh-9rem))] min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">

                            {messages.map((message, index) => (

                                <div
                                    key={`${message.role}-${index}`}
                                    className={`flex ${
                                        message.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >

                                    <div
                                        className={`max-w-[85%] wrap-break-word rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                                            message.role === "user"
                                                ? "bg-[#22303A] text-white"
                                                : "bg-white text-[#22303A] ring-1 ring-[#E5CB90]/70"
                                        }`}
                                    >
                                        {message.text}
                                    </div>

                                </div>

                            ))}


                            {/* Loading */}
                            {loading && (

                                <div className="flex justify-start">

                                    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-[#22303A] ring-1 ring-[#E5CB90]/70">

                                        <Sparkles className="h-3.5 w-3.5 animate-pulse text-[#458393]" />

                                        Thinking...

                                    </div>

                                </div>

                            )}

                        </div>


                        {/* Input */}
                        <div className="border-t border-[#E5CB90]/70 bg-white p-3">

                            <div className="flex min-w-0 items-center gap-2 rounded-xl border border-[#E5CB90]/70 bg-[#FFFDF8] px-2.5 py-2">

                                <input
                                    value={input}
                                    onChange={(event) =>
                                        setInput(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            void handleSubmit();
                                        }
                                    }}
                                    placeholder="Ask the AI..."
                                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[#22303A] outline-none placeholder:text-[#6B7280]"
                                />

                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={loading || !input.trim()}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#22303A] text-white transition hover:bg-[#31485a] disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label="Send message"
                                >

                                    <Send className="h-4 w-4" />

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            ) : (

                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="group ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#22303A] text-white shadow-[0_18px_40px_rgba(34,48,58,0.25)] transition duration-200 hover:scale-105 hover:bg-[#2d4353] sm:h-16 sm:w-16"
                    aria-label="Open AI chat"
                >

                    <MessageCircle className="h-5 w-5 md:h-7 md:w-7 transition group-hover:scale-110" />

                </button>

            )}

        </div>
    );
}