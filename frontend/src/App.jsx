import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  MessageSquare, FileText, Calculator, Lightbulb, Settings, Trash2, Send, 
  Bot, User, Copy, Check, Cpu, ChevronRight, ChevronDown, Plus, RefreshCw, Zap, Sun, Moon,
  Menu, X, History, Paperclip, Heart, Sparkles, Star
} from 'lucide-react';

// ==========================================
// 🎨 YOUR LOCAL JPEG BACKGROUND SETUP
// ==========================================
import myCustomJpegBg from './my-background.jpeg';
import whiteSpiderBg from './white.png.jpeg';

const SPIDERMAN_CUSTOM_BG = myCustomJpegBg; 
const SPIDER_LIGHT_CUSTOM_BG = whiteSpiderBg;

const THEMES = {
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
  bluedark: {
    name: 'Electric Blue (Dark)',
    bgMain: 'bg-slate-950',
    bgSidebar: 'bg-slate-900',
    bgHeader: 'bg-slate-900/40',
    border: 'border-blue-500/40',
    textPrimary: 'text-blue-400 font-semibold',
    textSecondary: 'text-blue-300/80',
    bgCard: 'bg-slate-900/80',
    bgInput: 'bg-slate-950/90',
  },
  bluelight: {
    name: 'Electric Blue (Light)',
    bgMain: 'bg-blue-50/50',
    bgSidebar: 'bg-white/95',
    bgHeader: 'bg-white/85',
    border: 'border-blue-300/60',
    textPrimary: 'text-blue-600 font-semibold',
    textSecondary: 'text-blue-500/80',
    bgCard: 'bg-white/90',
    bgInput: 'bg-white',
  },
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

// Spider Web SVG
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

// Dynamic Background Component
const ThemeBackground = ({ themeKey }) => {
  if (themeKey === 'spiderman') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {SPIDERMAN_CUSTOM_BG && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-85" 
            style={{ backgroundImage: `url(${SPIDERMAN_CUSTOM_BG})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        
        <div className="absolute top-[8%] left-[25%] text-pink-500/40 w-16 h-16 rotate-12"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute top-[35%] right-[15%] text-pink-400/30 w-24 h-24 -rotate-45"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute bottom-[20%] left-[30%] text-pink-500/35 w-20 h-20 rotate-90"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute top-[65%] right-[35%] text-pink-400/25 w-14 h-14 rotate-[15deg]"><SpiderWebIcon className="w-full h-full" /></div>
      </div>
    );
  }

  if (themeKey === 'spiderlight') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-gradient-to-br from-pink-50 via-white to-rose-50">
        {SPIDER_LIGHT_CUSTOM_BG && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-85" 
            style={{ backgroundImage: `url(${SPIDER_LIGHT_CUSTOM_BG})` }}
          />
        )}
        <div className="absolute top-[10%] left-[20%] text-pink-400/35 w-20 h-20 rotate-12"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute top-[40%] right-[12%] text-rose-400/30 w-28 h-28 -rotate-30"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute bottom-[25%] left-[15%] text-pink-500/30 w-24 h-24 rotate-45"><SpiderWebIcon className="w-full h-full" /></div>
        <div className="absolute top-[70%] right-[30%] text-pink-400/25 w-16 h-16 rotate-[75deg]"><SpiderWebIcon className="w-full h-full" /></div>
      </div>
    );
  }

  if (themeKey === 'bluedark' || themeKey === 'bluelight') {
    return (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${themeKey === 'bluedark' ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
        <div className="absolute top-[15%] left-[10%] w-24 h-24 rounded-full bg-blue-400/10 blur-xl animate-pulse" />
        <div className="absolute top-[60%] right-[15%] w-36 h-36 rounded-full bg-cyan-400/15 blur-2xl animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-[20%] left-[25%] w-20 h-20 rounded-full bg-blue-500/10 blur-lg animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[30%] right-[30%] w-16 h-16 rounded-full bg-indigo-400/15 blur-xl animate-pulse [animation-delay:1.5s]" />
      </div>
    );
  }

  return null;
};

// Smooth Sparkle Effect
const SparkleEffect = ({ isSpiderman, isSpiderLight, isBlueTheme }) => {
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
      const color = isBlueTheme 
        ? ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#ffffff'][Math.floor(Math.random() * 5)]
        : isSpiderman 
        ? ['#ec4899', '#f472b6', '#ffffff'][Math.floor(Math.random() * 3)] 
        : isSpiderLight 
        ? ['#db2777', '#f43f5e', '#e11d48'][Math.floor(Math.random() * 3)] 
        : ['#f472b6', '#fb7185', '#e879f9', '#fbcfe8', '#fda4af'][Math.floor(Math.random() * 5)];

      const newSparkle = {
        id,
        x: e.clientX + (Math.random() * 16 - 8),
        y: e.clientY + (Math.random() * 16 - 8),
        size: Math.random() * 10 + 6,
        color,
        opacity: 1,
        rotation: Math.random() * 360,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
      };

      setSparkles(prev => [...prev.slice(-20), newSparkle]);

      stopTimeout.current = setTimeout(() => {
        isMoving.current = false;
      }, 80);
    };

    const handleClick = (e) => {
      const burstCount = 10;
      const burstParticles = [];
      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        const color = isBlueTheme 
          ? ['#3b82f6', '#60a5fa', '#93c5fd', '#ffffff'][Math.floor(Math.random() * 4)]
          : isSpiderman 
          ? ['#ec4899', '#fbcfe8', '#ffffff'][Math.floor(Math.random() * 3)] 
          : isSpiderLight 
          ? ['#db2777', '#f43f5e', '#fda4af'][Math.floor(Math.random() * 3)] 
          : ['#f472b6', '#fb7185', '#e879f9', '#ffffff', '#fbcfe8'][Math.floor(Math.random() * 5)];

        burstParticles.push({
          id: Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 12 + 8,
          color,
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
          .map(s => ({
            ...s,
            x: s.x + (s.vx || 0),
            y: s.y + (s.vy || 0),
            opacity: s.opacity - (!isMoving.current ? 0.05 : 0.025),
            rotation: s.rotation + 2
          }))
          .filter(s => s.opacity > 0)
      );
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (stopTimeout.current) clearTimeout(stopTimeout.current);
    };
  }, [isSpiderman, isSpiderLight, isBlueTheme]);

  if (sparkles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {sparkles.map(sparkle => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none transition-transform duration-75"
          style={{
            left: `${sparkle.x}px`,
            top: `${sparkle.y}px`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            transform: `translate(-50%, -50%) rotate(${sparkle.rotation}deg)`,
            color: sparkle.color,
            opacity: sparkle.opacity,
          }}
        >
          {isSpiderman || isSpiderLight ? (
            <span className="text-sm drop-shadow-[0_0_6px_rgba(236,72,153,0.9)]">🕷️</span>
          ) : isBlueTheme ? (
            <span className="text-xs drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]">🔵</span>
          ) : (
            <Sparkles className="w-full h-full" />
          )}
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
  const isBlueTheme = currentThemeKey === 'bluedark' || currentThemeKey === 'bluelight';

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
    document.title = "Nova AI - Assistant";
  }, []);

  useEffect(() => {
    localStorage.setItem('areesha_sessions', JSON.stringify(sessions));
  }, [sessions]);

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
      const systemPrompt = `You are Nova, a helpful AI assistant operating in "${activeMode}" mode.

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

  return (
    <div className={`flex h-screen w-full ${theme.bgMain} font-sans antialiased overflow-hidden transition-colors duration-200 relative`}>
      
      <SparkleEffect isSpiderman={isSpiderman} isSpiderLight={isSpiderLight} isBlueTheme={isBlueTheme} />

      <ThemeBackground themeKey={currentThemeKey} />

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-80 ${theme.bgSidebar} border-r ${theme.border} flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-hidden`}>
        
        {(isSpiderman || isSpiderLight) && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 select-none">
            <div className="absolute top-[10%] left-[5%] w-16 h-16 rotate-12 text-pink-600"><SpiderWebIcon className="w-full h-full" /></div>
            <div className="absolute top-[32%] left-[70%] w-20 h-20 -rotate-45 text-pink-500"><SpiderWebIcon className="w-full h-full" /></div>
            <div className="absolute top-[55%] left-[10%] w-14 h-14 rotate-[30deg] text-rose-500"><SpiderWebIcon className="w-full h-full" /></div>
            <div className="absolute top-[75%] left-[65%] w-24 h-24 rotate-[15deg] text-pink-600"><SpiderWebIcon className="w-full h-full" /></div>
            <span className="absolute top-[20%] left-[80%] text-pink-500 text-sm">🕷️</span>
            <span className="absolute top-[68%] left-[20%] text-rose-600 text-base">🕷️</span>
          </div>
        )}

        <div className="flex flex-col h-full overflow-hidden relative z-10">
          
          <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white shadow-sm' : isBlueTheme ? 'bg-blue-600 text-white shadow-sm' : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'} rounded-xl shadow-sm flex items-center justify-center`}>
                {isSpiderman || isSpiderLight ? <span className="text-base font-bold">🕷️</span> : isBlueTheme ? <span className="text-base font-bold">⚡</span> : <Sparkles className="w-5 h-5" />}
              </div>
              <h1 className={`font-bold text-base tracking-wide ${isSpiderman || isSpiderLight ? 'text-pink-600' : isBlueTheme ? 'text-blue-500' : 'bg-gradient-to-r from-pink-300 via-pink-200 to-rose-300 bg-clip-text text-transparent'}`}>Nova AI</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => createNewSession()} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} transition-colors`} title="New Chat">
                <Plus className="w-5 h-5" />
              </button>
              <button onClick={() => setIsMobileMenuOpen(false)} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} md:hidden`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className={`p-4 border-b ${theme.border}`}>
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} mb-2 block`}>
              Mission Control Mode
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
                    className={`flex flex-col items-start p-2.5 rounded-xl text-left transition-all border ${
                      isActive
                        ? isSpiderman 
                          ? 'bg-black/90 border-pink-500 text-pink-400 shadow-sm font-bold' 
                          : isSpiderLight 
                          ? 'bg-pink-100/80 border-pink-400 text-pink-900 shadow-sm font-bold' 
                          : isBlueTheme 
                          ? 'bg-blue-950/60 border-blue-400 text-blue-300 shadow-sm font-bold'
                          : 'bg-slate-800 border-slate-700 text-pink-200 shadow-sm'
                        : `${theme.bgCard} ${theme.border}${theme.textSecondary}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mb-1.5 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : isBlueTheme ? 'bg-blue-600 text-white' : `bg-gradient-to-r ${mode.color}`} text-white`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold leading-tight">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 pb-2 space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} block`}>Current Journey</label>
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${theme.border} ${theme.bgCard} font-medium text-xs shadow-sm ${theme.textPrimary}`}>
              <div className="flex items-center space-x-2 truncate">
                <MessageSquare className={`w-4 h-4 shrink-0 ${isSpiderman || isSpiderLight ? 'text-pink-600' : isBlueTheme ? 'text-blue-500' : 'text-pink-400'}`} />
                <span className="truncate">{activeSession.title}</span>
              </div>
            </div>
            <button
              onClick={() => createNewSession()}
              className={`w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl border border-dashed ${theme.border} hover:border-pink-500 ${theme.textSecondary} text-xs font-semibold transition-all`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Start New Whimsy Journey</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            <div className="flex items-center justify-between mb-2 px-1">
              <button 
                onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                className={`flex items-center space-x-1.5 text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} hover:text-pink-600 transition-colors`}
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
                {isHistoryVisible ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              <span className={`text-[10px] ${theme.bgCard} px-2 py-0.5 rounded-full ${theme.textSecondary} border ${theme.border}`}>
                {historicalSessions.length}
              </span>
            </div>

            {isHistoryVisible && (
              <div className="space-y-1">
                {historicalSessions.length === 0 ? (
                  <p className={`text-xs p-2 ${theme.textSecondary} italic`}>No past journeys yet</p>
                ) : (
                  historicalSessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSessionId(s.id);
                        setActiveMode(s.mode || 'qa');
                        setIsMobileMenuOpen(false);
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all border bg-transparent border-transparent ${theme.textSecondary} hover:${theme.bgCard} hover:${theme.border}`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </div>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-pink-600 hover:bg-pink-500/10 transition-all"
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
                <Cpu className={`w-4 h-4 ${theme.textSecondary}`} />
                <span className={`${theme.textSecondary} truncate max-w-[120px]`}>
                  {GROQ_MODELS.find(m => m.id === selectedModel)?.name.split(' ')[0]}
                </span>
              </div>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} transition-colors`}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative z-10">
        
        <header className={`h-16 border-b ${theme.border} ${theme.bgHeader} backdrop-blur-md px-4 md:px-6 flex items-center justify-between shrink-0`}>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} md:hidden`}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`font-bold text-sm md:text-base ${theme.textPrimary}`}>
                {MODES.find(m => m.id === activeMode)?.name}
              </h2>
              <p className={`text-xs ${theme.textSecondary} hidden sm:block`}>
                {MODES.find(m => m.id === activeMode)?.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-black/10 dark:bg-white/10 p-1 rounded-xl border border-white/10">
              {Object.keys(THEMES).map(key => (
                <button
                  key={key}
                  onClick={() => setCurrentThemeKey(key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    currentThemeKey === key 
                      ? 'bg-white text-slate-900 shadow-sm font-bold' 
                      : `${theme.textSecondary} hover:text-pink-500`
                  }`}
                >
                  {key === 'spiderlight' ? '🕸️ White' : key === 'spiderman' ? '🕷️ Dark' : key === 'bluedark' ? '⚡ Blue' : key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center p-4">
              <div className={`p-4 ${isSpiderman || isSpiderLight ? 'bg-pink-600/10 text-pink-600' : isBlueTheme ? 'bg-blue-500/10 text-blue-500' : 'bg-pink-500/10 text-pink-400'} rounded-2xl mb-4`}>
                {isSpiderman || isSpiderLight ? <span className="text-3xl">🕷️</span> : isBlueTheme ? <Zap className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
              </div>
              <h3 className={`text-lg font-bold ${theme.textPrimary} mb-2`}>
                Welcome to Nova AI
              </h3>
              <p className={`text-xs md:text-sm ${theme.textSecondary} mb-6 max-w-md`}>
                Select a suggested prompt below or type your question to begin.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {(MODE_PROMPTS[activeMode] || []).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className={`p-3 rounded-xl border ${theme.border} ${theme.bgCard} text-left text-xs ${theme.textPrimary} hover:border-pink-500 transition-all shadow-sm`}
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    : isSpiderman || isSpiderLight
                    ? 'bg-pink-600 text-white'
                    : isBlueTheme
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-pink-300'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`group relative p-4 rounded-2xl border ${theme.border} ${
                  msg.role === 'user' 
                    ? isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : isBlueTheme ? 'bg-blue-600 text-white' : 'bg-pink-600 text-white'
                    : `${theme.bgCard}${theme.textPrimary}`
                } text-xs md:text-sm leading-relaxed shadow-sm`}>
                  
                  {msg.image && (
                    <img src={msg.image} alt="User upload" className="max-w-xs rounded-lg mb-3 border border-white/20" />
                  )}

                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[10px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <button 
                        onClick={() => copyToClipboard(msg.content, idx)}
                        className="hover:opacity-100 transition-opacity p-1"
                        title="Copy text"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-pink-500 p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Nova is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls */}
        <footer className={`p-4 border-t ${theme.border} ${theme.bgHeader} backdrop-blur-md`}>
          <div className="max-w-4xl mx-auto space-y-2">
            
            {selectedImage && (
              <div className="relative inline-block">
                <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-pink-400" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className={`flex items-end space-x-2 p-2 rounded-2xl border ${theme.border} ${theme.bgInput} shadow-sm focus-within:border-pink-500 transition-all`}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2.5 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} transition-colors`}
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
                placeholder={`Ask Nova in ${MODES.find(m => m.id === activeMode)?.name}...`}
                rows={1}
                className={`flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 text-xs md:text-sm ${theme.textPrimary} placeholder:${theme.textSecondary} focus:outline-none`}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={(!inputMessage.trim() && !selectedImage) || isLoading}
                className={`p-2.5 rounded-xl font-bold text-white transition-all ${
                  (!inputMessage.trim() && !selectedImage) || isLoading
                    ? 'bg-slate-400/30 cursor-not-allowed'
                    : isSpiderman || isSpiderLight
                    ? 'bg-pink-600 hover:bg-pink-700 shadow-sm'
                    : isBlueTheme
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-sm'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] px-2 text-pink-400/70">
              <span>Tokens Used: {totalTokens}</span>
              <span>Model: {GROQ_MODELS.find(m => m.id === selectedModel)?.name}</span>
            </div>
          </div>
        </footer>

      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md ${theme.bgSidebar} border ${theme.border} rounded-2xl p-6 space-y-4 shadow-xl`}>
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className={`font-bold text-sm ${theme.textPrimary}`}>Settings & Configuration</h3>
              <button onClick={() => setShowSettings(false)} className={`${theme.textSecondary}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block font-semibold ${theme.textPrimary} mb-1`}>AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} focus:outline-none`}
                >
                  {GROQ_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-semibold ${theme.textPrimary} mb-1`}>Max Response Tokens ({maxTokens})</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs transition-colors"
            >
              Save & Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}