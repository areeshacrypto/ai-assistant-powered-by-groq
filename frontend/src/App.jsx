import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  MessageSquare, FileText, Calculator, Lightbulb, Settings, Trash2, Send, 
  Bot, User, Copy, Check, Cpu, ChevronRight, Plus, RefreshCw, Zap, Sparkles, Sun, Moon 
} from 'lucide-react';

const MODES = [
  { id: 'qa', name: 'Q&A Assistant', icon: MessageSquare, color: 'from-blue-500 to-cyan-500', desc: 'General knowledge & chat assistant' },
  { id: 'summarize', name: 'Summarizer', icon: FileText, color: 'from-emerald-500 to-teal-500', desc: 'Condense long articles and documents' },
  { id: 'math', name: 'Math Solver', icon: Calculator, color: 'from-amber-500 to-orange-500', desc: 'Step-by-step mathematical problem solving' },
  { id: 'explain', name: 'Concept Explainer', icon: Lightbulb, color: 'from-purple-500 to-indigo-500', desc: 'Break down complex topics simply' }
];

const GROQ_MODELS = [
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B' }
];

const MODE_PROMPTS = {
  qa: [
    "When was Quaid-e-Azam born?",
    "Explain quantum computing simply",
    "What are the top 3 best practices for Python clean code?"
  ],
  summarize: [
    "Summarize the key points of the theory of relativity",
    "TL;DR of object-oriented programming concepts",
    "Provide a 3-bullet summary on how neural networks work"
  ],
  math: [
    "Solve 2x + 5 = 15 step by step",
    "Calculate the derivative of f(x) = 3x^2 + 4x - 5",
    "Explain Bayes' Theorem with a quick example"
  ],
  explain: [
    "Explain API rate limits like I am 10 years old",
    "How does Docker containerization work under the hood?",
    "What is the difference between synchronous and asynchronous code?"
  ]
};

const estimateTokens = (text) => {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.3);
};

export default function App() {
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-32b');
  const [maxTokens, setMaxTokens] = useState(500);
  const [activeMode, setActiveMode] = useState('qa');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('areesha_sessions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [{ id: Date.now(), title: 'Initial Chat Session', mode: 'qa', messages: [] }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id || Date.now());
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('areesha_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];
  const totalTokens = messages.reduce((acc, m) => acc + estimateTokens(m.content), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createNewSession = (mode = activeMode) => {
    const newSession = {
      id: Date.now(),
      title: `New ${MODES.find(m => m.id === mode)?.name || 'Chat'}`,
      mode: mode,
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setActiveMode(mode);
  };

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
    if (!text || isLoading) return;

    const userMessage = { 
      role: 'user', 
      content: text, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const title = s.messages.length === 0 ? (text.length > 25 ? text.substring(0, 25) + '...' : text) : s.title;
        return { ...s, title, messages: [...s.messages, userMessage] };
      }
      return s;
    }));

    setInputMessage('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are a helpful CLI AI assistant operating in "${activeMode}" mode. Provide clear, concise responses using structured markdown tables where appropriate. Whenever you create a table, you MUST include a standard header separator row (e.g., |---|---|) right beneath the column titles so it renders properly as a UI grid instead of raw text pipes. Avoid raw unformatted LaTeX text.`;
      const historyForApi = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text }
      ];

      // Relative fetch URL works both locally and on Vercel deployments
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: historyForApi,
          max_tokens: Number(maxTokens)
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.detail || `Server error (${response.status})`);
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
        content: `Error: ${err.message || 'Failed to connect to backend.'}`,
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
    bgMain: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
    bgSidebar: isDarkMode ? 'bg-slate-900/90' : 'bg-white',
    bgHeader: isDarkMode ? 'bg-slate-900/40' : 'bg-white',
    border: isDarkMode ? 'border-slate-800' : 'border-slate-200',
    textPrimary: isDarkMode ? 'text-slate-100' : 'text-slate-900',
    textSecondary: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    bgCard: isDarkMode ? 'bg-slate-900' : 'bg-slate-100',
    bgInput: isDarkMode ? 'bg-slate-950' : 'bg-white',
  };

  return (
    <div className={`flex h-screen w-full ${theme.bgMain} ${theme.textPrimary} font-sans antialiased overflow-hidden transition-colors duration-200`}>
      
      {/* Sidebar */}
      <aside className={`w-80 ${theme.bgSidebar} border-r ${theme.border} flex flex-col justify-between shrink-0 z-20`}>
        <div className="flex flex-col h-full overflow-hidden">
          
          <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-wide">Areesha's AI assistant</h1>
                <p className={`text-xs ${theme.textSecondary} flex items-center gap-1`}>
                  Powered by <span className="text-cyan-500 font-semibold">Groq</span>
                </p>
              </div>
            </div>
            
            <button
              onClick={() => createNewSession()}
              className={`p-2 hover:${theme.bgCard} rounded-lg ${theme.textSecondary} transition-colors`}
              title="New Chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className={`p-4 border-b ${theme.border}`}>
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} mb-2 block`}>
              Assistant Mode
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
                      }
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all border ${
                      isActive
                        ? isDarkMode ? 'bg-slate-800 border-cyan-500/50 text-white shadow-md' : 'bg-white border-cyan-500 text-slate-900 shadow-md'
                        : `${theme.bgCard} ${theme.border} ${theme.textSecondary}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mb-1.5 bg-gradient-to-r ${mode.color} text-white`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>
                Recent Sessions
              </span>
              <span className={`text-[10px] ${theme.bgCard} px-2 py-0.5 rounded-full ${theme.textSecondary}`}>
                {sessions.length}
              </span>
            </div>

            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  setActiveMode(s.mode || 'qa');
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-sm transition-all border ${
                  s.id === activeSessionId
                    ? `${theme.bgCard} border-slate-400/30 text-cyan-500 font-medium`
                    : `bg-transparent border-transparent ${theme.textSecondary}`
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate text-xs">{s.title}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-500 transition-all"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className={`p-4 border-t ${theme.border} space-y-3`}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-medium">Vercel API Active</span>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 hover:${theme.bgCard} rounded-lg ${theme.textSecondary} transition-colors`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        <header className={`h-16 border-b ${theme.border} ${theme.bgHeader} backdrop-blur px-6 flex items-center justify-between z-10`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl bg-gradient-to-r ${MODES.find(m => m.id === activeMode)?.color}`}>
              {React.createElement(MODES.find(m => m.id === activeMode)?.icon || MessageSquare, { className: 'w-4 h-4 text-white' })}
            </div>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2">
                {MODES.find(m => m.id === activeMode)?.name}
              </h2>
              <p className={`text-xs ${theme.textSecondary}`}>
                Model: <span className="font-mono">{selectedModel}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-full border ${theme.border} ${theme.bgCard}`}>
              <Zap className="w-3.5 h-3.5 text-cyan-500" />
              <span>Est. Tokens: <strong className="font-mono">{totalTokens}</strong></span>
            </div>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle Theme"
              className={`p-1.5 rounded-lg border ${theme.border} ${theme.bgCard} transition-all`}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => createNewSession()}
              className={`text-xs flex items-center space-x-1.5 ${theme.bgCard} px-3 py-1.5 rounded-lg border ${theme.border} transition-colors`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className={`p-4 ${theme.bgCard} border ${theme.border} rounded-2xl shadow-xl`}>
                <Bot className="w-10 h-10 text-cyan-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">How can I help you today?</h3>
                <p className={`text-sm ${theme.textSecondary} mt-1`}>
                  Select a prompt below or type your message to get started.
                </p>
              </div>

              <div className="w-full space-y-2 pt-4">
                {MODE_PROMPTS[activeMode]?.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className={`w-full text-left p-3 rounded-xl ${theme.bgCard} border ${theme.border} text-xs transition-all flex items-center justify-between group`}
                  >
                    <span>"{prompt}"</span>
                    <ChevronRight className="w-4 h-4 text-cyan-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-4 max-w-3xl mx-auto ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    msg.isError ? 'bg-rose-500/10 border-rose-500 text-rose-500' : `${theme.bgCard} ${theme.border} text-cyan-500`
                  }`}>
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`group relative max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-500 text-white rounded-tr-none shadow-lg'
                    : msg.isError
                    ? 'bg-rose-500/10 border-rose-500 text-rose-500 rounded-tl-none'
                    : `${theme.bgCard} ${theme.border} rounded-tl-none shadow-md`
                }`}>
                  
                  {msg.role === 'assistant' && (
                    <div className={`flex items-center justify-between border-b ${theme.border} pb-2 mb-2 text-xs ${theme.textSecondary}`}>
                      <span className="font-mono text-[11px] text-cyan-500">Assistant ({selectedModel})</span>
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="p-1 hover:opacity-80 transition-opacity"
                        title="Copy text"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Markdown Renderer with Clean UI Tables and Divider Rules */}
                  <div className={`font-sans text-sm space-y-3 
                    [&_h1]:text-lg [&_h1]:font-bold 
                    [&_h2]:text-base [&_h2]:font-bold 
                    [&_h3]:text-sm [&_h3]:font-bold 
                    [&_ul]:list-disc [&_ul]:pl-4 
                    [&_ol]:list-decimal [&_ol]:pl-4
                    [&_hr]:my-4 [&_hr]:border-t [&_hr]:border-slate-700
                    [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:text-xs
                    [&_th]:border [&_th]:border-slate-600 [&_th]:bg-slate-800/60 [&_th]:p-2 [&_th]:text-left
                    [&_td]:border [&_td]:border-slate-700/60 [&_td]:p-2`}
                  >
                    {msg.role === 'assistant' && !msg.isError ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>

                  <div className={`text-[10px] mt-2 text-right ${
                    msg.role === 'user' ? 'text-cyan-100/70' : theme.textSecondary
                  }`}>
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className={`w-8 h-8 rounded-xl ${theme.bgCard} border ${theme.border} flex items-center justify-center shrink-0`}>
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-4 max-w-3xl mx-auto items-center">
              <div className={`w-8 h-8 rounded-xl ${theme.bgCard} border ${theme.border} flex items-center justify-center text-cyan-500`}>
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className={`${theme.bgCard} border ${theme.border} rounded-2xl p-4 text-xs ${theme.textSecondary} flex items-center space-x-2`}>
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                <span>Generating answer using Groq...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-4 border-t ${theme.border} ${theme.bgHeader} backdrop-blur`}>
          <div className="max-w-3xl mx-auto space-y-2">
            <div className={`relative flex items-center ${theme.bgInput} border ${theme.border} focus-within:border-cyan-500 rounded-2xl p-2 transition-all shadow-lg`}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask ${MODES.find(m => m.id === activeMode)?.name}... (Press Enter to send)`}
                rows={1}
                className={`flex-1 bg-transparent px-3 py-1.5 text-sm ${theme.textPrimary} placeholder-slate-400 focus:outline-none resize-none max-h-32`}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className={`p-2.5 rounded-xl transition-all ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md hover:opacity-90'
                    : `${theme.bgCard} ${theme.textSecondary} cursor-not-allowed`
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className={`flex items-center justify-between px-2 text-[11px] ${theme.textSecondary}`}>
              <span>Enter to send, Shift+Enter for newline</span>
              <span>Max Tokens: {maxTokens}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex justify-end">
          <div className={`w-96 ${theme.bgSidebar} h-full border-l ${theme.border} p-6 flex flex-col justify-between shadow-2xl`}>
            <div className="space-y-6">
              <div className={`flex items-center justify-between border-b ${theme.border} pb-4`}>
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-cyan-500" />
                  <h3 className="font-semibold">Model Settings</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`${theme.textSecondary} hover:${theme.textPrimary}`}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold flex items-center justify-between">
                  <span>Model Selector</span>
                  <Cpu className="w-3.5 h-3.5" />
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`w-full ${theme.bgInput} border ${theme.border} rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500`}
                >
                  {GROQ_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Max Response Tokens</span>
                  <span className="font-mono text-cyan-500">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="w-full accent-cyan-500 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Save & Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}