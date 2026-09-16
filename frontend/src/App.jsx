import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  MessageSquare, FileText, Calculator, Lightbulb, Settings, Trash2, Send, 
  Bot, User, Copy, Check, Cpu, ChevronRight, ChevronDown, Plus, RefreshCw, Zap, Sun, Moon,
  Menu, X, History, Paperclip, Heart, Sparkles, Star
} from 'lucide-react';

// ==========================================
// 🎨 YOUR LOCAL BACKGROUND ASSETS SETUP
// ==========================================
import myCustomJpegBg from './my-background.jpeg';
import whiteSpiderBg from './white.png.jpeg';

const SPIDERMAN_CUSTOM_BG = myCustomJpegBg; 
const SPIDER_LIGHT_CUSTOM_BG = whiteSpiderBg;

const THEMES = {
  dark: {
    name: 'Dark Slate',
    bgMain: 'bg-slate-950',
    bgSidebar: 'bg-slate-900',
    bgHeader: 'bg-slate-900/40',
    border: 'border-slate-800',
    textPrimary: 'text-pink-200',
    textSecondary: 'text-pink-300/70',
    bgCard: 'bg-slate-900',
    bgInput: 'bg-slate-950',
  },
  light: {
    name: 'Clean Light',
    bgMain: 'bg-slate-50',
    bgSidebar: 'bg-white',
    bgHeader: 'bg-white/80',
    border: 'border-slate-200',
    textPrimary: 'text-pink-900',
    textSecondary: 'text-pink-700/70',
    bgCard: 'bg-white',
    bgInput: 'bg-white',
  },
  spiderman: {
    name: 'Pink & Black Spider (Dark)',
    bgMain: 'bg-black',
    bgSidebar: 'bg-black/95',
    bgHeader: 'bg-black/85',
    border: 'border-pink-500/40',
    textPrimary: 'text-pink-200 font-semibold',
    textSecondary: 'text-pink-300/70',
    bgCard: 'bg-black/80',
    bgInput: 'bg-black/90',
  },
  spiderlight: {
    name: 'Pink & White Spider (Light)',
    bgMain: 'bg-pink-50/50',
    bgSidebar: 'bg-white/95',
    bgHeader: 'bg-white/85',
    border: 'border-pink-300/60',
    textPrimary: 'text-slate-900 font-semibold',
    textSecondary: 'text-pink-800/70',
    bgCard: 'bg-white/90',
    bgInput: 'bg-white',
  }
};

const MODES = [
  { id: 'qa', name: 'Q&A Assistant', icon: MessageSquare, color: 'from-pink-400 to-rose-400', desc: 'Direct, to-the-point concise answers' },
  { id: 'summarize', name: 'Summarizer', icon: FileText, color: 'from-purple-400 to-pink-400', desc: 'Strictly short summaries only' },
  { id: 'math', name: 'Math Solver', icon: Calculator, color: 'from-pink-500 to-rose-500', desc: 'Step-by-step mathematical problem solving' },
  { id: 'explain', name: 'Concept Explainer', icon: Lightbulb, color: 'from-fuchsia-400 to-pink-400', desc: 'Detailed explanations regardless of length' }
];

const GROQ_MODELS = [
  { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B (Default)' },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' }
];

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

// Spider Web SVG Component
const SpiderWebIcon = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="0" x2="50" y2="100" strokeOpacity="0.6" />
    <line x1="0" y1="50" x2="100" y2="50" strokeOpacity="0.6" />
    <line x1="15" y1="15" x2="85" y2="85" strokeOpacity="0.6" />
    <line x1="85" y1="15" x2="15" y2="85" strokeOpacity="0.6" />
    <path d="M 50 30 Q 60 40 70 50 Q 60 60 50 70 Q 40 60 30 50 Q 40 40 50 30 Z" strokeOpacity="0.7" />
    <path d="M 50 15 Q 67 33 85 50 Q 67 67 50 85 Q 33 67 15 50 Q 33 33 50 15 Z" strokeOpacity="0.5" />
    <path d="M 50 5 Q 75 25 95 50 Q 75 75 50 95 Q 25 75 5 50 Q 25 25 50 5 Z" strokeOpacity="0.3" />
  </svg>
);

const ThemeBackground = ({ themeKey }) => {
  if (themeKey === 'spiderman') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {SPIDERMAN_CUSTOM_BG && (
          <div className="absolute inset-0 bg-cover bg-center opacity-85" style={{ backgroundImage: `url(${SPIDERMAN_CUSTOM_BG})` }} />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        <div className="absolute top-[8%] left-[25%] text-pink-500/40 w-16 h-16 rotate-12"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute top-[35%] right-[15%] text-pink-400/30 w-24 h-24 -rotate-45"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute bottom-[20%] left-[30%] text-pink-500/35 w-20 h-20 rotate-90"><SpiderWebIcon className="w-full h-full" /></div>
      </div>
    );
  }

  if (themeKey === 'spiderlight') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {SPIDER_LIGHT_CUSTOM_BG && (
          <div className="absolute inset-0 bg-cover bg-center opacity-85" style={{ backgroundImage: `url(${SPIDER_LIGHT_CUSTOM_BG})` }} />
        )}
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
        <div className="absolute top-[10%] left-[20%] text-pink-400/35 w-20 h-20 rotate-12"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute top-[40%] right-[12%] text-rose-400/30 w-28 h-28 -rotate-30"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute bottom-[25%] left-[15%] text-pink-500/30 w-24 h-24 rotate-45"><SpiderWebIcon className="w-full h-full" /></div>
      </div>
    );
  }

  return null;
};

const SparkleEffect = ({ isSpiderman, isSpiderLight }) => {
  const [sparkles, setSparkles] = useState([]);
  const requestRef = useRef(null);
  const isMoving = useRef(false);
  const stopTimeout = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      isMoving.current = true;
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
      if (Math.random() > 0.35) return;

      const id = Math.random();
      const newSparkle = {
        id,
        x: e.clientX + (Math.random() * 16 - 8),
        y: e.clientY + (Math.random() * 16 - 8),
        size: Math.random() * 10 + 6,
        color: isSpiderman ? ['#ec4899', '#f472b6', '#ffffff'][Math.floor(Math.random() * 3)] : isSpiderLight ? ['#db2777', '#f43f5e', '#e11d48'][Math.floor(Math.random() * 3)] : ['#f472b6', '#fb7185', '#e879f9'][Math.floor(Math.random() * 3)],
        opacity: 1,
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
      };

      setSparkles(prev => [...prev.slice(-20), newSparkle]);
      stopTimeout.current = setTimeout(() => { isMoving.current = false; }, 80);
    };

    const handleClick = (e) => {
      const burstParticles = [];
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        burstParticles.push({
          id: Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 12 + 8,
          color: isSpiderman ? '#ec4899' : isSpiderLight ? '#db2777' : '#f472b6',
          opacity: 1,
          rotation: Math.random() * 360,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
      setSparkles(prev => [...prev.slice(-15), ...burstParticles]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    const animate = () => {
      setSparkles(prev => 
        prev
          .map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, opacity: s.opacity - (!isMoving.current ? 0.05 : 0.025), rotation: s.rotation + 2 }))
          .filter(s => s.opacity > 0)
      );
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSpiderman, isSpiderLight]);

  if (sparkles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {sparkles.map(s => (
        <div key={s.id} className="absolute pointer-events-none" style={{ left: `${s.x}px`, top: `${s.y}px`, width: `${s.size}px`, height: `${s.size}px`, transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`, color: s.color, opacity: s.opacity }}>
          {isSpiderman || isSpiderLight ? <span className="text-sm">🕷️</span> : <Sparkles className="w-full h-full" />}
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-32b');
  const [maxTokens, setMaxTokens] = useState(500);
  const [activeMode, setActiveMode] = useState('qa');
  const [currentThemeKey, setCurrentThemeKey] = useState('spiderlight'); 
  const theme = THEMES[currentThemeKey] || THEMES.spiderlight;
  const isSpiderman = currentThemeKey === 'spiderman';
  const isSpiderLight = currentThemeKey === 'spiderlight';

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('areesha_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
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

  useEffect(() => { document.title = "Nova AI - Assistant"; }, []);
  useEffect(() => { localStorage.setItem('areesha_sessions', JSON.stringify(sessions)); }, [sessions]);

  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || sessions[0], [sessions, activeSessionId]);
  const historicalSessions = useMemo(() => sessions.filter(s => s.id !== activeSessionId), [sessions, activeSessionId]);
  const messages = activeSession.messages;
  const totalTokens = useMemo(() => messages.reduce((acc, m) => acc + estimateTokens(m.content), 0), [messages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result);
    reader.readAsDataURL(file);
  };

  const createNewSession = useCallback((mode = activeMode) => {
    const newSession = { id: Date.now(), title: 'New Chat', mode, messages: [] };
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
      if (activeSessionId === id) setActiveSessionId(updated[0].id);
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
      const systemPrompt = `You are Nova, a helpful AI assistant operating in "${activeMode}" mode.\n${MODE_RULES[activeMode] || ''}\nSTRICT FORMATTING: No LaTeX, no markdown asterisks for bolding/lists, no horizontal divider lines.`;
      const historyForApi = [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content, image: m.image || null })),
        { role: 'user', content: text, image: currentImage }
      ];

      const effectiveModel = currentImage && selectedModel === 'qwen/qwen3-32b' ? 'llama-3.2-11b-vision-preview' : selectedModel;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: activeMode, model: effectiveModel, messages: historyForApi, max_tokens: Number(maxTokens) })
      });

      if (!response.ok) throw new Error('API server error');
      const data = await response.json();

      const botMessage = { role: 'assistant', content: data.response || 'No response', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, botMessage] } : s));
    } catch (err) {
      const errorMessage = { role: 'assistant', isError: true, content: `Error: ${err.message}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, errorMessage] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className={`flex h-screen w-full ${theme.bgMain} font-sans antialiased overflow-hidden relative`}>
      <SparkleEffect isSpiderman={isSpiderman} isSpiderLight={isSpiderLight} />
      <ThemeBackground themeKey={currentThemeKey} />

      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" />}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-80 ${theme.bgSidebar} border-r ${theme.border} flex flex-col justify-between shrink-0 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-hidden`}>
        <div className="flex flex-col h-full overflow-hidden relative z-10">
          <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'} rounded-xl`}>
                {isSpiderman || isSpiderLight ? <span className="text-base">🕷️</span> : <Sparkles className="w-5 h-5" />}
              </div>
              <h1 className={`font-bold text-base ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent'}`}>Nova AI</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => createNewSession()} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary}`}><Plus className="w-5 h-5" /></button>
              <button onClick={() => setIsMobileMenuOpen(false)} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} md:hidden`}><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className={`p-4 border-b ${theme.border}`}>
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} mb-2 block`}>Mission Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(mode => {
                const Icon = mode.icon;
                const isActive = activeMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => { setActiveMode(mode.id); if (activeSession.messages.length > 0) createNewSession(mode.id); else setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-left border transition-all ${isActive ? (isSpiderman ? 'bg-black border-pink-500 text-pink-400 font-bold' : isSpiderLight ? 'bg-pink-100 border-pink-400 text-pink-900 font-bold' : 'bg-slate-800 text-pink-200 border-slate-700') : `${theme.bgCard} ${theme.border} ${theme.textSecondary}`}`}
                  >
                    <div className={`p-1.5 rounded-lg mb-1.5 text-white ${isSpiderman || isSpiderLight ? 'bg-pink-600' : `bg-gradient-to-r ${mode.color}`}`}><Icon className="w-3.5 h-3.5" /></div>
                    <span className="text-xs font-semibold">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <button onClick={() => setIsHistoryVisible(!isHistoryVisible)} className={`flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider ${theme.textSecondary}`}>
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {isHistoryVisible ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
            {isHistoryVisible && historicalSessions.map(s => (
              <div key={s.id} onClick={() => { setActiveSessionId(s.id); setActiveMode(s.mode || 'qa'); setIsMobileMenuOpen(false); }} className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs border border-transparent ${theme.textSecondary} hover:${theme.bgCard} hover:${theme.border}`}>
                <div className="flex items-center space-x-2 truncate"><MessageSquare className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{s.title}</span></div>
                <button onClick={(e) => deleteSession(s.id, e)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-pink-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className={`p-4 border-t ${theme.border} flex items-center justify-between text-xs`}>
            <div className="flex items-center space-x-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span className={theme.textPrimary}>Online</span></div>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 hover:${theme.bgCard} rounded-xl ${theme.textSecondary}`}><Settings className="w-4 h-4" /></button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        <header className={`h-16 border-b ${theme.border} ${theme.bgHeader} backdrop-blur px-4 sm:px-6 flex items-center justify-between z-10`}>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-xl border ${theme.border} ${theme.bgCard} md:hidden`}><Menu className="w-5 h-5" /></button>
            <div className={`p-2 rounded-xl text-white ${isSpiderman || isSpiderLight ? 'bg-pink-600' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`}>
              {isSpiderman || isSpiderLight ? <span className="text-sm">🕷️</span> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'text-pink-200'}`}>Nova ({MODES.find(m => m.id === activeMode)?.name})</h2>
              <p className={`text-xs ${theme.textSecondary}`}>Model: <span className="font-mono">{selectedModel}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select value={currentThemeKey} onChange={(e) => setCurrentThemeKey(e.target.value)} className={`px-3 py-1.5 text-xs rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} font-medium`}>
              {Object.entries(THEMES).map(([k, t]) => <option key={k} value={k}>{t.name}</option>)}
            </select>
            <button onClick={() => createNewSession()} className={`text-xs flex items-center space-x-1.5 ${theme.bgCard} px-3 py-2 rounded-xl border ${theme.border} ${theme.textSecondary}`}><RefreshCw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reset</span></button>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-3">
              <div className={`p-4 ${theme.bgCard} border ${theme.border} rounded-2xl shadow-sm`}>
                <div className={`p-3 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'} rounded-xl inline-flex`}><Sparkles className="w-6 h-6" /></div>
              </div>
              <h3 className={`text-lg font-bold ${isSpiderman || isSpiderLight ? 'text-pink-700' : 'text-pink-200'}`}>Welcome to Nova AI</h3>
              <p className={`text-xs ${theme.textSecondary}`}>Ask anything or select a mode to begin your journey.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-xl ${theme.bgCard} border ${theme.border} flex items-center justify-center shrink-0`}>
                    {isSpiderman || isSpiderLight ? <span className="text-sm text-pink-600 font-bold">🕷️</span> : <Bot className="w-4 h-4 text-pink-400" />}
                  </div>
                )}
                <div className={`p-4 rounded-2xl border max-w-[80%] shadow-sm ${msg.role === 'user' ? (isSpiderman || isSpiderLight ? 'bg-pink-600 text-white border-pink-500 rounded-br-none' : 'bg-pink-500 text-white border-pink-400 rounded-br-none') : `${theme.bgCard} ${theme.border} ${theme.textPrimary} rounded-bl-none`}`}>
                  {msg.image && <img src={msg.image} alt="Upload" className="max-h-48 rounded-xl mb-2 object-cover border border-white/20" />}
                  <div className="whitespace-pre-wrap font-sans text-sm">{msg.content}</div>
                  <div className={`text-[10px] mt-2 text-right ${msg.role === 'user' ? 'text-pink-100' : theme.textSecondary}`}>{msg.timestamp}</div>
                </div>
                {msg.role === 'user' && (
                  <div className={`w-8 h-8 rounded-xl ${theme.bgCard} border ${theme.border} flex items-center justify-center shrink-0`}>
                    <User className={`w-4 h-4 ${isSpiderman || isSpiderLight ? 'text-pink-600' : ''}`} />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-4 max-w-3xl mx-auto items-center">
              <div className={`w-8 h-8 rounded-xl ${theme.bgCard} border ${theme.border} flex items-center justify-center`}>
                {isSpiderman || isSpiderLight ? <span className="text-sm font-bold text-pink-600">🕷️</span> : <Sparkles className="w-4 h-4 text-pink-400" />}
              </div>
              <div className={`${theme.bgCard} border ${theme.border} rounded-xl p-4 text-xs ${theme.textSecondary} flex items-center space-x-2 backdrop-blur-md`}>
                <span className={`w-2 h-2 rounded-full ${isSpiderman || isSpiderLight ? 'bg-pink-600' : 'bg-pink-400'} animate-ping`}></span>
                <span>Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Footer */}
        <div className={`p-3 sm:p-4 border-t ${theme.border} ${theme.bgHeader} backdrop-blur-md`}>
          <div className="max-w-3xl mx-auto space-y-2">
            
            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />

            {selectedImage && (
              <div className="relative inline-block mb-1">
                <img src={selectedImage} alt="Attachment preview" className="w-16 h-16 object-cover rounded-xl border border-pink-500/40 shadow-md" />
                <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-pink-600 text-white rounded-full p-1 text-xs">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className={`relative flex items-center ${theme.bgInput} border ${theme.border} focus-within:border-pink-500 rounded-2xl p-2 transition-all shadow-sm backdrop-blur-md`}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl ${theme.textSecondary} hover:text-pink-600 transition-colors`}
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
                placeholder={`Ask ${MODES.find(m => m.id === activeMode)?.name} anything...`}
                rows={1}
                className={`flex-1 bg-transparent border-none focus:outline-none ${theme.textPrimary} placeholder:text-slate-400 text-sm px-3 resize-none max-h-32`}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                className={`p-2.5 rounded-xl ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'} font-medium shadow-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Footer with Made by Areesha */}
            <div className="flex items-center justify-between px-2 text-[12px]">
              <span className={theme.textSecondary}>Enter to send, Shift+Enter for newline</span>
              <span className="font-semibold flex items-center gap-1">
                Made by <span className={`font-bold ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'bg-gradient-to-r from-pink-300 via-pink-200 to-rose-300 bg-clip-text text-transparent'}`}>Areesha</span>
              </span>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}