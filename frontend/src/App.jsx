import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  MessageSquare, FileText, Calculator, Lightbulb, Settings, Trash2, Send, 
  Bot, User, Copy, Check, Cpu, ChevronRight, ChevronDown, Plus, RefreshCw, Zap, Sparkles, Sun, Moon,
  Menu, X, History, Paperclip, Heart
} from 'lucide-react';

// Custom Whimsical Bow Component
const BowIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 11C11.3 9.8 9.5 8 7 8C4.2 8 2 10.2 2 12C2 13.8 4.2 16 7 16C9.5 16 11.3 14.2 12 13C12.7 14.2 14.5 16 17 16C19.8 16 22 13.8 22 12C22 10.2 19.8 8 17 8C14.5 8 12.7 9.8 12 11ZM7 14C5.3 14 4 13.1 4 12C4 10.9 5.3 10 7 10C8.8 10 10.2 11.2 10.8 12C10.2 12.8 8.8 14 7 14ZM17 14C15.2 14 13.8 12.8 13.2 12C13.8 11.2 15.2 10 17 10C18.7 10 20 10.9 20 12C20 13.1 18.7 14 17 14Z" />
    <path d="M12 12.5M10.5 12C10.5 11.2 11.2 10.5 12 10.5C12.8 10.5 13.5 11.2 13.5 12C13.5 12.8 12.8 13.5 12 13.5C11.2 13.5 10.5 12.8 10.5 12Z" />
    <path d="M9.5 14.5L7 20L10 19L11.5 15.5" />
    <path d="M14.5 14.5L17 20L14 19L12.5 15.5" />
  </svg>
);

const MODES = [
  { id: 'qa', name: 'Q&A Assistant', icon: MessageSquare, color: 'from-pink-400 to-rose-400', desc: 'Direct, to-the-point concise answers' },
  { id: 'summarize', name: 'Summarizer', icon: FileText, color: 'from-purple-300 to-pink-300', desc: 'Strictly short summaries only' },
  { id: 'math', name: 'Math Solver', icon: Calculator, color: 'from-amber-300 to-pink-300', desc: 'Step-by-step mathematical problem solving' },
  { id: 'explain', name: 'Concept Explainer', icon: Lightbulb, color: 'from-indigo-300 to-purple-300', desc: 'Detailed explanations regardless of length' }
];

const GROQ_MODELS = [
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B (Default)' },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' }
];

const MODE_PROMPTS = {
  qa: ["When was Quaid-e-Azam born?", "What is the capital of France?", "List 3 clean code tips for Python"],
  summarize: ["Summarize the theory of relativity in two lines", "TL;DR of object-oriented programming", "Give a short summary of quantum computing"],
  math: ["Solve 2x + 5 = 15 step by step", "Calculate the derivative of f(x) = 3x^2 + 4x - 5", "What is the integral of 2x dx?"],
  explain: ["Explain APIs", "How does Docker work?", "What is recursion?"]
};

const MODE_RULES = {
  math: `MODE-SPECIFIC INSTRUCTIONS FOR MATH SOLVER:
1. You are strictly a Math Solver.
2. If the query is NOT a math question:
   - If it is a direct or to-the-point question, reply ONLY: "Use Q&A Assistant for this question"
   - If it asks to explain something, reply ONLY: "Use Concept Explainer for this question"
   - If it asks to summarize something, reply ONLY: "Use Summarizer for this question"
3. For valid math queries, provide clear step-by-step math reasoning without LaTeX ($ or $$).`,

  explain: `MODE-SPECIFIC INSTRUCTIONS FOR CONCEPT EXPLAINER:
1. You are a Concept Explainer.
2. ALWAYS provide a thorough, detailed, and clear explanation with examples, no matter how short or simple the user query is.`,

  summarize: `MODE-SPECIFIC INSTRUCTIONS FOR SUMMARIZER:
1. You are strictly a Summarizer.
2. Strictly output ONLY a short, brief summary. Do not write full-length articles or long explanations.`,

  qa: `MODE-SPECIFIC INSTRUCTIONS FOR Q&A ASSISTANT:
1. You are a Q&A Assistant.
2. Answer directly, stay strictly to the point, and write NO MORE THAN 2 LINES total in your response.`
};

const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.3);
};

export default function App() {
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-32b');
  const [maxTokens, setMaxTokens] = useState(500);
  const [activeMode, setActiveMode] = useState('qa');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [glitters, setGlitters] = useState([]);

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('areesha_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse history from localStorage:", e);
      }
    }
    return [{ id: Date.now(), title: 'New Chat', mode: 'qa', messages: [] }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || Date.now());
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('areesha_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Handle click glitter animation
  const handleGlobalClick = (e) => {
    const colors = ['#f472b6', '#fb7185', '#f43f5e', '#e879f9', '#ffffff', '#fbbf24'];
    const newGlitters = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: e.clientX,
      y: e.clientY,
      dx: (Math.random() - 0.5) * 60,
      dy: (Math.random() - 0.5) * 60 - 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4
    }));

    setGlitters(prev => [...prev, ...newGlitters]);

    setTimeout(() => {
      setGlitters(prev => prev.filter(g => !newGlitters.includes(g)));
    }, 600);
  };

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || sessions[0] || { id: Date.now(), title: 'New Chat', mode: 'qa', messages: [] };
  }, [sessions, activeSessionId]);

  const historicalSessions = useMemo(() => {
    return sessions.filter(s => s.id !== activeSessionId);
  }, [sessions, activeSessionId]);

  const messages = activeSession.messages;

  const totalTokens = useMemo(() => {
    return messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
    }
  }, [inputMessage]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const createNewSession = useCallback((mode = activeMode) => {
    const newSession = {
      id: Date.now(),
      title: 'New Chat',
      mode: mode,
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveMode(mode);
    setIsMobileMenuOpen(false);
  }, [activeMode]);

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const fresh = { id: Date.now(), title: 'New Chat', mode: 'qa', messages: [] };
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
  };

  const handleSendMessage = async (textToSend = inputMessage) => {
    const text = textToSend.trim();
    if ((!text && !selectedImage) || isLoading) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = { role: 'user', content: text, image: selectedImage, timestamp };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const titleText = text || 'Image Query';
        const title = s.messages.length === 0 ? (titleText.length > 25 ? titleText.substring(0, 25) + '...' : titleText) : s.title;
        return { ...s, title, messages: [...s.messages, userMessage] };
      }
      return s;
    }));

    const currentImage = selectedImage;
    setInputMessage('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const systemPrompt = `You are Poodle, a helpful AI assistant operating in "${activeMode}" mode.

${MODE_RULES[activeMode] || ''}

STRICT FORMATTING RULES:
1. NEVER use LaTeX formatting under any circumstances (do NOT use $, $$, \\begin, \\end, \\frac, \\sum, or any LaTeX symbols).
2. Write all math and technical expressions in plain, standard text or simple Unicode.
3. DO NOT use asterisks (*) for emphasis, bolding, or lists.
4. DO NOT use horizontal lines, dividers, or dashes (---, ___).
5. Output pure, clean plain text with standard line breaks for paragraphs.`;

      const historyForApi = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content, image: m.image || null })),
        { role: 'user', content: text, image: currentImage }
      ];

      const effectiveModel = currentImage && selectedModel === 'qwen/qwen3-32b' 
        ? 'llama-3.2-11b-vision-preview' 
        : selectedModel;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeMode,
          model: effectiveModel,
          messages: historyForApi,
          max_tokens: Number(maxTokens)
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.detail || `Server status ${response.status}`);
      }

      const data = await response.json();
      const assistantReply = data.response || 'No response returned from backend.';

      const botMessage = {
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, botMessage] };
        }
        return s;
      }));
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        isError: true,
        content: `Error: ${err.message || 'Failed to connect to API service.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const theme = {
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-pink-50/40',
    bgSidebar: isDarkMode ? 'bg-slate-900' : 'bg-pink-100/30',
    bgHeader: isDarkMode ? 'bg-slate-900/40' : 'bg-white/60',
    border: isDarkMode ? 'border-slate-800' : 'border-pink-200/50',
    textPrimary: isDarkMode ? 'text-slate-100' : 'text-pink-950/80',
    textSecondary: isDarkMode ? 'text-pink-400' : 'text-pink-900/70',
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-white/80',
    bgInput: isDarkMode ? 'bg-slate-950' : 'bg-white',
  };

  return (
    <div onClick={handleGlobalClick} className={`flex h-screen w-full ${theme.bgMain} ${theme.textPrimary} font-sans antialiased overflow-hidden transition-colors duration-200 relative`}>
      
      {/* Click Sparkles Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {glitters.map(g => (
          <div
            key={g.id}
            className="absolute rounded-full animate-ping"
            style={{
              left: `${g.x}px`,
              top: `${g.y}px`,
              width: `${g.size}px`,
              height: `${g.size}px`,
              backgroundColor: g.color,
              transform: `translate(${g.dx}px, ${g.dy}px)`,
              transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
              opacity: 0.8
            }}
          />
        ))}
      </div>

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm z-30 md:hidden" />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-80 ${theme.bgSidebar} border-r ${theme.border} flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          
          <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-pink-400 to-rose-300 rounded-2xl shadow-md shadow-pink-300/30 relative">
                <Sparkles className="w-5 h-5 text-white" />
                <BowIcon className="w-3.5 h-3.5 text-rose-500 absolute -top-1.5 -right-1.5 drop-shadow-sm" />
              </div>
              <h1 className="font-bold text-base tracking-wide text-rose-500 flex items-center gap-1.5">
                Poodle AI <BowIcon className="w-4 h-4 text-pink-400" />
              </h1>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => createNewSession()} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} hover:text-rose-400 transition-colors`} title="New Chat">
                <Plus className="w-5 h-5" />
              </button>
              <button onClick={() => setIsMobileMenuOpen(false)} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} md:hidden`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={`p-4 border-b ${theme.border}`}>
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} mb-2 flex items-center justify-between`}>
              <span>Assistant Mode</span>
              <BowIcon className="w-3.5 h-3.5 text-pink-300" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(mode => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setActiveMode(mode.id);
                      if (activeSession.messages.length > 0) {
                        createNewSession(mode.id);
                      } else {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-2xl text-left transition-all border ${
                      isActive
                        ? isDarkMode ? 'bg-slate-800 border-pink-400 text-white shadow-md' : 'bg-white border-rose-300 text-pink-950 shadow-md shadow-pink-100/50'
                        : `${theme.bgCard} ${theme.border} ${theme.textSecondary}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl mb-1.5 bg-gradient-to-r ${mode.color} text-white`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Tab */}
          <div className="p-4 pb-2 space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} block`}>Current Chat</label>
            <div className={`flex items-center justify-between p-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 text-rose-500 font-medium text-xs shadow-sm`}>
              <div className="flex items-center space-x-2 truncate">
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="truncate">{activeSession.title}</span>
              </div>
              <BowIcon className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            </div>
            <button
              onClick={() => createNewSession()}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-2xl border border-dashed border-rose-300 hover:border-rose-400 text-rose-400 hover:bg-rose-50 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Start New Chat</span>
            </button>
          </div>

          {/* Collapsible History Section */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <button 
                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                className={`flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} hover:text-rose-400 transition-colors`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {isHistoryVisible ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <span className={`text-[10px] ${theme.bgCard} px-2 py-0.5 rounded-full ${theme.textSecondary} border border-pink-200/50`}>
                {historicalSessions.length}
              </span>
            </div>

            {isHistoryVisible && (
              <div className="space-y-1">
                {historicalSessions.length === 0 ? (
                  <p className={`text-xs p-2 ${theme.textSecondary} italic`}>No past chats yet</p>
                ) : (
                  historicalSessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setActiveMode(s.mode || 'qa');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer text-xs transition-all border bg-transparent border-transparent ${theme.textSecondary} hover:${theme.bgCard}`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </div>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className={`p-4 border-t ${theme.border}`}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"></span>
                <span className="font-medium text-pink-500">Poodle Active</span>
              </div>
              <button onClick={() => { setShowSettings(!showSettings); setIsMobileMenuOpen(false); }} className={`p-1.5 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} transition-colors`} title="Settings">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <header className={`h-16 border-b ${theme.border} ${theme.bgHeader} backdrop-blur px-4 md:px-6 flex items-center justify-between z-10`}>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-2xl border ${theme.border} ${theme.bgCard} md:hidden text-pink-400`}>
              <Menu className="w-5 h-5" />
            </button>
            <div className={`p-2 rounded-2xl bg-gradient-to-r ${MODES.find(m => m.id === activeMode)?.color}`}>
              {React.createElement(MODES.find(m => m.id === activeMode)?.icon || MessageSquare, { className: 'w-4 h-4 text-white' })}
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-1">
                Poodle ({MODES.find(m => m.id === activeMode)?.name})
              </h2>
              <p className={`text-xs ${theme.textSecondary} hidden sm:block`}>Model: <span className="font-mono">{selectedModel}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className={`hidden sm:flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-full border ${theme.border} ${theme.bgCard}`}>
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span>Est. Tokens: <strong className="font-mono">{totalTokens}</strong></span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl border ${theme.border} ${theme.bgCard}`}>
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-pink-400" />}
            </button>
            <button onClick={() => createNewSession()} className={`text-xs flex items-center space-x-1.5 ${theme.bgCard} px-3 py-2 rounded-xl border ${theme.border}`}>
              <RefreshCw className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </header>

        {/* Scrollable Chat Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className={`p-5 ${theme.bgCard} border ${theme.border} rounded-3xl shadow-lg relative`}>
                <Bot className="w-10 h-10 text-pink-400" />
                <BowIcon className="w-5 h-5 text-rose-400 absolute -top-2 -right-2 drop-shadow" />
              </div>
              <div>
                <h3 className="text-lg font-semibold flex items-center justify-center gap-1.5">
                  How can Poodle help you today? <BowIcon className="w-4 h-4 text-rose-400" />
                </h3>
                <p className={`text-sm ${theme.textSecondary} mt-1`}>Select a prompt below or type your message to get started.</p>
              </div>
              <div className="w-full space-y-2 pt-4">
                {MODE_PROMPTS[activeMode]?.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className={`w-full text-left p-3.5 rounded-2xl ${theme.bgCard} border ${theme.border} text-xs transition-all flex items-center justify-between group hover:border-pink-300`}
                  >
                    <span>"{prompt}"</span>
                    <ChevronRight className="w-4 h-4 text-pink-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 sm:gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border ${msg.isError ? 'bg-rose-500/10 border-rose-500 text-rose-500' : `${theme.bgCard} ${theme.border} text-pink-400`}`}>
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={`group relative max-w-[90%] sm:max-w-[85%] rounded-3xl p-3.5 sm:p-4 text-sm leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 border-pink-300 text-white rounded-tr-none shadow-md'
                    : msg.isError
                    ? 'bg-rose-500/10 border-rose-500 text-rose-500 rounded-tl-none'
                    : `${theme.bgCard} ${theme.border} rounded-tl-none shadow-sm`
                }`}>
                  {msg.role === 'assistant' && (
                    <div className={`flex items-center justify-between border-b ${theme.border} pb-2 mb-2 text-xs ${theme.textSecondary}`}>
                      <span className="font-mono text-[11px] text-pink-400 flex items-center gap-1">
                        Poodle <BowIcon className="w-3 h-3 text-pink-300" />
                      </span>
                      <button onClick={() => copyToClipboard(msg.content, index)} className="p-1 hover:opacity-80">
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                  {msg.image && (
                    <div className="mb-3 overflow-hidden rounded-2xl border border-white/20">
                      <img src={msg.image} alt="User attachment" className="max-h-60 w-auto object-cover" />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
                  <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-pink-100' : theme.textSecondary}`}>{msg.timestamp}</div>
                </div>
                {msg.role === 'user' && (
                  <div className={`w-8 h-8 rounded-2xl ${theme.bgCard} border ${theme.border} flex items-center justify-center shrink-0`}>
                    <User className="w-4 h-4 text-pink-400" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-4 max-w-3xl mx-auto items-center">
              <div className={`w-8 h-8 rounded-2xl ${theme.bgCard} border ${theme.border} flex items-center justify-center text-pink-400`}>
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 text-xs ${theme.textSecondary} flex items-center space-x-2`}>
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping"></span>
                <span>Poodle is thinking...</span>
              </div>
            </div>
          )}

          {/* Banner positioned directly above the input section */}
          <div className="max-w-3xl mx-auto pt-4 flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              Made by <span className="text-rose-400 font-bold">Areesha Riaz</span>
              <BowIcon className="w-3.5 h-3.5 text-pink-400" />
            </span>
            <span className={`text-xs font-medium ${theme.textSecondary} flex items-center gap-1`}>
              Powered by <span className="text-pink-500 font-semibold">Groq</span>
            </span>
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-3 sm:p-4 border-t ${theme.border} ${theme.bgHeader} backdrop-blur`}>
          <div className="max-w-3xl mx-auto space-y-2">
            
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />

            {selectedImage && (
              <div className="relative inline-block mb-1">
                <img src={selectedImage} alt="Attachment preview" className="w-16 h-16 object-cover rounded-2xl border-2 border-pink-400 shadow-md" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-rose-400 text-white rounded-full p-1 text-xs">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className={`relative flex items-center ${theme.bgInput} border ${theme.border} focus-within:border-pink-300 rounded-3xl p-2 transition-all shadow-md`}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-2xl text-pink-300 hover:text-pink-400 hover:${theme.bgCard} transition-colors`}
                title="Attach Image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask Poodle...`}
                rows={1}
                className={`flex-1 bg-transparent px-2 py-1.5 text-sm ${theme.textPrimary} placeholder-pink-300 focus:outline-none resize-none overflow-y-auto max-h-32`}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                className={`p-2.5 rounded-2xl transition-all ${
                  (inputMessage.trim() || selectedImage) && !isLoading
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md hover:opacity-90'
                    : `${theme.bgCard} ${theme.textSecondary} cursor-not-allowed`
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between px-2 text-[11px]">
              <span className={theme.textSecondary}>Enter to send, Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-pink-950/20 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-full sm:w-96 ${theme.bgSidebar} h-full border-l ${theme.border} p-6 flex flex-col justify-between shadow-2xl`}>
            <div className="space-y-6">
              <div className={`flex items-center justify-between border-b ${theme.border} pb-4`}>
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-pink-400" />
                  <h3 className="font-semibold flex items-center gap-1.5">
                    Poodle Settings <BowIcon className="w-4 h-4 text-pink-300" />
                  </h3>
                </div>
                <button onClick={() => setShowSettings(false)} className={`${theme.textSecondary} hover:${theme.textPrimary}`}>✕</button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>Model Selector</span>
                  <Cpu className="w-3.5 h-3.5 text-pink-400" />
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`w-full ${theme.bgInput} border ${theme.border} rounded-2xl px-3 py-2 text-xs focus:outline-none focus:border-pink-300`}
                >
                  {GROQ_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Max Response Tokens</span>
                  <span className="font-mono text-pink-400">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="w-full accent-pink-400 bg-pink-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <button onClick={() => setShowSettings(false)} className="w-full py-2.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-2xl text-xs font-semibold shadow-md">
              Save & Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}