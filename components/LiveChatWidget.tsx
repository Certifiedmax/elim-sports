"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Sparkles, MapPin, Clock } from "lucide-react";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const quickPrompts = [
    "Do you have shoe sizes in stock?",
    "Is racket stringing available today?",
    "How does Juja campus delivery work?",
  ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || message;
    if (!text.trim()) return;

    const phone = "254794268983";
    const encoded = encodeURIComponent(
      `🏸 *ELIM SPORTS CUSTOMER QUERY*\n─────────────────────────\n${text.trim()}\n─────────────────────────\n(Sent via elimsports.co.ke live chat)`
    );

    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    setMessage("");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="relative mb-3 w-[calc(100vw-2.5rem)] sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Chat Header */}
          <div className="bg-emerald-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center font-bold text-sm">
                  ES
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600"></span>
              </div>
              <div>
                <h4 className="font-bold text-xs">Elim Sports Help Desk</h4>
                <p className="text-[10px] text-emerald-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span> Online • Moms & Dads Centre, Juja
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-black/10 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Body */}
          <div className="p-3.5 space-y-3 bg-slate-50 dark:bg-slate-950 text-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl rounded-tl-xs shadow-xs space-y-1">
              <p className="text-slate-800 dark:text-slate-200">
                👋 Hello! Looking for specific racket tensions, shoe sizes, or campus pickup?
              </p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick questions:
              </span>
              <div className="flex flex-col gap-1.5">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Type your question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition shadow-xs cursor-pointer shrink-0"
              title="Send to WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Bubble */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-full shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
      >
        <MessageCircle className="w-4 h-4 fill-black" />
        <span className="hidden sm:inline">Ask / Live Inquiries</span>
      </button>
    </div>
  );
}