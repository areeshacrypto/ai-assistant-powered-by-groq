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
  bluedark: {
    name: 'Electric Blue (Dark)',
    bgMain: 'bg-slate-950',
    bgSidebar: 'bg-slate-900',
    bgHeader: 'bg-slate-900/40',
    border: 'border-blue-500/40',
    textPrimary: 'text-blue-400 font-semibold', // Average dark blue (bright enough to read clearly)
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
    textPrimary: 'text-blue-600 font-semibold', // Lighter, clean blue for light mode
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

// Exact Spider Web SVG from your Screenshot
const SpiderWebIcon = ({ className = "w-10 h-10" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" xmlns="http://www.w3.org/2000/svg">
    {/* Radial strands */}
    <line x1="50" y1="0" x2="50" y2="100" strokeOpacity="0.6" />
    <line x1="0" y1="50" x2="100" y2="50" strokeOpacity="0.6" />
    <line x1="15" y1="15" x2="85" y2="85" strokeOpacity="0.6" />
    <line x1="85" y1="15" x2="15" y2="85" strokeOpacity="0.6" />
    
    {/* Concentric curved web loops */}
    <path d="M 50 30 Q 60 40 70 50 Q 60 60 50 70 Q 40 60 30 50 Q 40 40 50 30 Z" strokeOpacity="0.7" />
    <path d="M 50 15 Q 67 33 85 50 Q 67 67 50 85 Q 33 67 15 50 Q 33 33 50 15 Z" strokeOpacity="0.5" />
    <path d="M 50 5 Q 75 25 95 50 Q 75 75 50 95 Q 25 75 5 50 Q 25 25 50 5 Z" strokeOpacity="0.3" />
  </svg>
);

// Dynamic Background Component handling both dark and light spider versions
const ThemeBackground = ({ themeKey }) => {
  if (themeKey === 'spiderman') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {SPIDERMAN_CUSTOM_BG ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-85" 
            style={{ backgroundImage: `url(${SPIDERMAN_CUSTOM_BG})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        
        {/* Random scattered webs across dark background */}
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
        {/* Random scattered webs across light background */}
        {SPIDER_LIGHT_CUSTOM_BG ? (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-85" 
            style={{ backgroundImage: `url(${SPIDER_LIGHT_CUSTOM_BG})` }}
          />
        ) : null}
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
  };
  JavaScript
const SparkleEffect = ({ isSpiderman, isSpiderLight, isBlueTheme }) => {
  // ... (keep your mousemove and click listener logic here)

  // Inside your particle generation (where color is assigned):
  const color = isBlueTheme 
    ? ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#ffffff'][Math.floor(Math.random() * 5)] // Blue bubble/glitter shades
    : isSpiderman 
    ? ['#ec4899', '#f472b6', '#ffffff'][Math.floor(Math.random() * 3)] 
    : ['#f472b6', '#fb7185', '#e879f9'][Math.floor(Math.random() * 3)];

  // ... (inside your map return JSX where the particle renders):
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
const ThemeBackground = ({ themeKey }) => {
  const isBlueTheme = themeKey === 'bluedark' || themeKey === 'bluelight';

  if (!isBlueTheme) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${themeKey === 'bluedark' ? 'bg-slate-950' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
      {/* Randomized floating glowing bubbles */}
      <div className="absolute top-[15%] left-[10%] w-24 h-24 rounded-full bg-blue-400/10 blur-xl animate-pulse" />
      <div className="absolute top-[60%] right-[15%] w-36 h-36 rounded-full bg-cyan-400/15 blur-2xl animate-pulse [animation-delay:1s]" />
      <div className="absolute bottom-[20%] left-[25%] w-20 h-20 rounded-full bg-blue-500/10 blur-lg animate-pulse [animation-delay:2s]" />
      <div className="absolute top-[30%] right-[30%] w-16 h-16 rounded-full bg-indigo-400/15 blur-xl animate-pulse [animation-delay:1.5s]" />
    </div>
  );
};

  return null;
};

// Smooth Sparkle / Spider Trail Effect
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
        color: isSpiderman ? ['#ec4899', '#f472b6', '#ffffff'][Math.floor(Math.random() * 3)] : isSpiderLight ? ['#db2777', '#f43f5e', '#e11d48'][Math.floor(Math.random() * 3)] : ['#f472b6', '#fb7185', '#e879f9', '#fbcfe8', '#fda4af'][Math.floor(Math.random() * 5)],
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
        burstParticles.push({
          id: Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 12 + 8,
          color: isSpiderman ? ['#ec4899', '#fbcfe8', '#ffffff'][Math.floor(Math.random() * 3)] : isSpiderLight ? ['#db2777', '#f43f5e', '#fda4af'][Math.floor(Math.random() * 3)] : ['#f472b6', '#fb7185', '#e879f9', '#ffffff', '#fbcfe8'][Math.floor(Math.random() * 5)],
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
  }, [isSpiderman, isSpiderLight]);

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
          {isSpiderman || isSpiderLight ? <span className="text-sm drop-shadow-[0_0_6px_rgba(236,72,153,0.9)]">🕷️</span> : <Sparkles className="w-full h-full" />}
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
    document.title = "Tink- AI";
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
      
      {/* Sparkle / Spider Trail Effect */}
      <SparkleEffect isSpiderman={isSpiderman} isSpiderLight={isSpiderLight} />

      {/* Dynamic Theme Background */}
      <ThemeBackground themeKey={currentThemeKey} />

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" />
      )}

      {/* Sidebar with Random Scattered Spider Webs */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 w-80 ${theme.bgSidebar} border-r ${theme.border} flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-hidden`}>
        
        {/* Random Scattered Spider Webs & Spiders Overlay in Sidebar */}
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
              <div className={`p-2 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white shadow-sm' : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'} rounded-xl shadow-sm flex items-center justify-center`}>
                {isSpiderman || isSpiderLight ? <span className="text-base font-bold">🕷️</span> : <Sparkles className="w-5 h-5" />}
              </div>
              <h1 className={`font-bold text-base tracking-wide ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'bg-gradient-to-r from-pink-300 via-pink-200 to-rose-300 bg-clip-text text-transparent'}`}>Tink- AI</h1>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => createNewSession()} className={`p-2 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} transition-colors`} title="New Whimsy Journey">
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
                        ? isSpiderman ? 'bg-black/90 border-pink-500 text-pink-400 shadow-sm font-bold' : isSpiderLight ? 'bg-pink-100/80 border-pink-400 text-pink-900 shadow-sm font-bold' : 'bg-slate-800 border-slate-700 text-pink-200 shadow-sm'
                        : `${theme.bgCard} ${theme.border} ${theme.textSecondary}`
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mb-1.5 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : `bg-gradient-to-r ${mode.color}`} text-white`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold leading-tight">{mode.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chat Tab */}
          <div className="p-4 pb-2 space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} block`}>Current Journey</label>
            <div className={`flex items-center justify-between p-2.5 rounded-xl border ${theme.border} ${theme.bgCard} font-medium text-xs shadow-sm ${isSpiderman || isSpiderLight ? 'text-slate-800 font-semibold' : ''}`}>
              <div className="flex items-center space-x-2 truncate">
                <MessageSquare className={`w-4 h-4 shrink-0 ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'text-pink-400'}`} />
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

          {/* History */}
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
                <span className={`w-2 h-2 rounded-full ${isSpiderman || isSpiderLight ? 'bg-pink-600' : 'bg-emerald-500'} animate-pulse`}></span>
                <span className={`font-medium ${theme.textPrimary}`}>System Online</span>
              </div>
              <button onClick={() => { setShowSettings(!showSettings); setIsMobileMenuOpen(false); }} className={`p-1.5 hover:${theme.bgCard} rounded-xl ${theme.textSecondary} transition-colors`} title="Settings">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        <header className={`h-16 border-b ${theme.border} ${theme.bgHeader} backdrop-blur px-4 md:px-6 flex items-center justify-between z-10`}>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-xl border ${theme.border} ${theme.bgCard} md:hidden`}>
              <Menu className="w-5 h-5" />
            </button>
            <div className={`p-2 rounded-xl ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : `bg-gradient-to-r ${MODES.find(m => m.id === activeMode)?.color}`}`}>
              {isSpiderman || isSpiderLight ? <span className="text-sm font-bold">🕷️</span> : React.createElement(MODES.find(m => m.id === activeMode)?.icon || MessageSquare, { className: 'w-4 h-4 text-white' })}
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'bg-gradient-to-r from-pink-300 via-pink-200 to-rose-300 bg-clip-text text-transparent'} flex items-center gap-1`}>
                Tink- AI ({MODES.find(m => m.id === activeMode)?.name})
              </h2>
              <p className={`text-xs ${theme.textSecondary} hidden sm:block`}>Model: <span className="font-mono">{selectedModel}</span></p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Selector Dropdown */}
            <select
              value={currentThemeKey}
              onChange={(e) => setCurrentThemeKey(e.target.value)}
              className={`px-3 py-1.5 text-xs rounded-xl border ${theme.border} ${theme.bgCard} ${isSpiderman || isSpiderLight ? 'text-pink-700 font-bold' : theme.textPrimary} font-medium focus:outline-none cursor-pointer shadow-sm`}
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key} className={key.includes('light') ? 'bg-white text-slate-900' : 'bg-black text-pink-300'}>
                  Theme: {t.name}
                </option>
              ))}
            </select>

            <div className={`hidden sm:flex items-center space-x-1.5 text-xs px-3 py-1.5 rounded-full border ${theme.border} ${theme.bgCard} ${theme.textSecondary}`}>
              <Zap className={`w-3.5 h-3.5 ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'text-pink-400'}`} />
              <span>Est. Tokens: <strong className="font-mono">{totalTokens}</strong></span>
            </div>
            <button onClick={() => createNewSession()} className={`text-xs flex items-center space-x-1.5 ${theme.bgCard} px-3 py-2 rounded-xl border ${theme.border} ${theme.textSecondary}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </header>

        {/* Scrollable Chat Feed Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4">
              <div className={`p-4 ${theme.bgCard} border ${theme.border} rounded-2xl shadow-sm backdrop-blur-md`}>
                <div className={`p-3 ${isSpiderman || isSpiderLight ? 'bg-pink-600 text-white' : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white'} rounded-xl inline-flex shadow-sm`}>
                  {isSpiderman || isSpiderLight ? <span className="text-xl font-bold">🕷️</span> : <Sparkles className="w-6 h-6" />}
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isSpiderman || isSpiderLight ? 'text-pink-700' : 'bg-gradient-to-r from-pink-300 via-pink-200 to-rose-300 bg-clip-text text-transparent'}`}>What shall we manifest today?</h3>
                <p className={`text-sm ${theme.textSecondary} mt-1`}>Pick a prompt below or type your question to get started.</p>
              </div>
              <div className="w-full space-y-2 pt-4">
                {MODE_PROMPTS[activeMode]?.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className={`w-full text-left p-3.5 rounded-xl ${theme.bgCard} border ${theme.border} text-xs font-medium transition-all flex items-center justify-between group hover:border-pink-500 backdrop-blur-md ${theme.textPrimary}`}
                  >
                    <span>"{prompt}"</span>
                    <ChevronRight className={`w-4 h-4 ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'text-pink-300 group-hover:text-pink-400'}`} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-3 sm:gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${msg.isError ? 'bg-pink-600/10 border-pink-600 text-pink-600' : `${theme.bgCard} ${theme.border}`}`}>
                    {isSpiderman || isSpiderLight ? <span className="text-sm font-bold text-pink-600">🕷️</span> : <Sparkles className="w-4 h-4 text-pink-400" />}
                  </div>
                )}
                <div className={`group relative max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed border backdrop-blur-md ${
                  msg.role === 'user'
                    ? isSpiderman || isSpiderLight ? 'bg-pink-600 border-pink-500 text-white font-semibold rounded-tr-none shadow-sm' : 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-400 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-pink-600/10 border-pink-600 text-pink-600 rounded-tl-none'
                    : `${theme.bgCard} ${theme.border} ${theme.textPrimary} rounded-tl-none shadow-sm`
                }`}>
                  {msg.role === 'assistant' && (
                    <div className={`flex items-center justify-between border-b ${theme.border} pb-2 mb-2 text-xs ${theme.textSecondary}`}>
                      <span className={`font-mono text-[11px] font-bold ${isSpiderman || isSpiderLight ? 'text-pink-600' : 'bg-gradient-to-r from-pink-300 to-rose-300 bg-clip-text text-transparent'}`}>Tink AI</span>
                      <button onClick={() => copyToClipboard(msg.content, index)} className="p-1 hover:opacity-80">
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                  {msg.image && (
                    <div className="mb-3 overflow-hidden rounded-xl border border-pink-500/30">
                      <img src={msg.image} alt="User attachment" className="max-h-60 w-auto object-cover" />
                    </div>
                  )}
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
                placeholder="Sparkle your thoughts here..."
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

            {/* Footer with Made by Areesha Riaz */}
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