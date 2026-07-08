import { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  Trash2, 
  Home, 
  MessageSquare, 
  BookOpen, 
  User, 
  Info, 
  Wifi, 
  WifiOff, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  Layers, 
  ArrowLeft,
  RefreshCw,
  Cpu,
  Paperclip,
  Folder
} from 'lucide-react'
import './App.css'

function App() {
  const [view, setView] = useState('landing') // 'landing' or 'chat'
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState('default')
  const [isConnected, setIsConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)
  
  const messagesEndRef = useRef(null)

  // Generate a random session ID on component mount
  useEffect(() => {
    const randomId = 'session_' + Math.random().toString(36).substring(2, 9)
    setSessionId(randomId)
    checkServerConnection()
  }, [])

  // Auto-scroll to the bottom of the chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const checkServerConnection = async () => {
    setCheckingConnection(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/', { method: 'GET' })
      if (response.ok) {
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.log('Backend connection failed, running in Offline Demo Mode.')
      setIsConnected(false)
    } finally {
      setCheckingConnection(false)
    }
  }

  // Pre-configured questions for quick interaction
  const suggestedPrompts = [
    { label: "Who is the Head of the Department?", query: "Who is the Head of the Department?" },
    { label: "Who teaches Java Programming?", query: "Who teaches Java Programming?" },
    { label: "UG PAC Coordinator?", query: "Who is the UG Programme Assessment Committee Coordinator?" },
    { label: "Syllabus details for Cloud?", query: "What is the course details or syllabus for Cloud Computing?" },
    { label: "Explain Recursion", query: "Explain recursion in C++ with a quick code example." },
    { label: "Show POs & PEOs", query: "What are the Program Outcomes (POs) and Program Educational Objectives?" }
  ]

  // Mock answers for Offline Demo Mode
  const getMockAnswer = (query) => {
    const q = query.toLowerCase()
    if (q.includes('hod') || q.includes('head of the department') || q.includes('subha')) {
      return "**Dr. R. Subha** is the Professor and Head of the Department of Computer Science and Engineering at Sri Eshwar College of Engineering.\n\nShe leads the department with a focus on academic quality, curriculum delivery, and Outcome-Based Education (OBE) implementation."
    }
    if (q.includes('java') || q.includes('giridharan')) {
      return "**Mr. R. Giridharan** is the Assistant Professor and Module Coordinator for the **Java Programming** course (both Theory and Practical).\n\nHe is responsible for organizing core coursework, assessments, and lab practices for Java within the CSE curriculum."
    }
    if (q.includes('pac') || q.includes('assessment') || q.includes('sivakumar')) {
      return "**Dr. T. Sivakumar** (Professor, CSE) is the UG Programme Assessment Committee (PAC) Coordinator for the Academic Year 2024–2025.\n\nThe PAC coordinates curriculum delivery, monitors continuous academic quality, and supports Outcome-Based Education."
    }
    if (q.includes('cloud')) {
      return "Cloud Computing (Theory and Practical) is coordinated by **Dr. S. Ananthi**, Assistant Professor, Department of Computer Science and Engineering.\n\nThe course covers deployment models, cloud architecture, and practical virtualization exercises."
    }
    if (q.includes('po') || q.includes('outcome')) {
      return "The Department has **12 Program Outcomes (POs)** including:\n- **PO1: Engineering Knowledge** - Apply mathematical, scientific, and engineering fundamentals to solve complex computing problems.\n- **PO2: Problem Analysis** - Identify and analyze engineering problems using database/research principles.\n- **PO3: Design/Development of Solutions** - Design system components or processes that meet specific academic and industry needs.\n\n*(Note: Full outcomes can be semantically retrieved when connected to the backend database).* "
    }
    if (q.includes('recursion') || q.includes('python') || q.includes('quicksort') || q.includes('c++')) {
      return "### Recursion Explanation\nRecursion is a programming technique where a function calls itself to solve a smaller instance of the same problem.\n\nHere is a simple example in C++:\n\n```cpp\n#include <iostream>\nusing namespace std;\n\n// Recursive function to find factorial\nint factorial(int n) {\n    if (n <= 1) // Base case\n        return 1;\n    return n * factorial(n - 1); // Recursive call\n}\n\nint main() {\n    cout << \"Factorial of 5: \" << factorial(5) << endl;\n    return 0;\n}\n```"
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greet')) {
      return "Hello! I am **CSE-BOT**, the official AI assistant for the Department of Computer Science and Engineering at Sri Eshwar College of Engineering.\n\nHow can I help you today? You can ask me about courses, faculty, committees, or general academic topics."
    }
    return "I couldn't find that specific information in the department knowledge base.\n\n> [!NOTE]\n> **Offline Demo Mode**\n> The frontend is currently running in offline simulation. To query the live Chroma vector database and get semantically retrieved answers from the department txt files, please start the FastAPI backend by running `python main.py` inside the `/server` directory."
  }

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input
    if (!messageText.trim()) return

    // Add user message to UI
    const newUserMessage = { role: 'user', content: messageText }
    setMessages(prev => [...prev, newUserMessage])
    setInput('')
    setIsTyping(true)

    // Send to backend or use Mock
    if (isConnected) {
      try {
        const response = await fetch('http://127.0.0.1:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            question: messageText,
            session_id: sessionId
          })
        })
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
      } catch (error) {
        console.error('Error posting chat:', error)
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the server. Falling back to demo mode.' }])
      } finally {
        setIsTyping(false)
      }
    } else {
      // Simulate typing delay in offline mode
      setTimeout(() => {
        const answer = getMockAnswer(messageText)
        setMessages(prev => [...prev, { role: 'assistant', content: answer }])
        setIsTyping(false)
      }, 800)
    }
  }

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear this session's history?")) {
      if (isConnected) {
        try {
          await fetch('http://127.0.0.1:8000/session/clear', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              session_id: sessionId
            })
          })
        } catch (error) {
          console.error('Error clearing session:', error)
        }
      }
      setMessages([])
    }
  }

  // Parse custom markdown layout inside message bubbles
  const renderFormattedContent = (content) => {
    if (!content) return null
    
    // Split by code blocks
    const blocks = content.split(/(```[\s\S]*?```)/g)
    
    return blocks.map((block, idx) => {
      if (block.startsWith("```")) {
        const code = block.replace(/```[a-zA-Z]*\n?|```$/g, "").trim()
        return (
          <pre key={idx} className="bg-brand-bg/90 border border-brand-border/60 rounded-md p-3 my-2 overflow-x-auto text-xs md:text-sm font-mono text-yellow-100">
            <code>{code}</code>
          </pre>
        )
      }
      
      const lines = block.split("\n")
      const renderedLines = []
      
      // Inline bold syntax parser: **text** -> <strong>text</strong>
      const parseBold = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pIdx} className="font-bold text-accent-yellow">{part.slice(2, -2)}</strong>
          }
          return part
        })
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.trim().startsWith("- ") || line.trim().startsWith("• ") || line.trim().startsWith("* ")) {
          const text = line.replace(/^[-•*]\s+/, "")
          renderedLines.push(
            <li key={i} className="list-disc ml-5 mb-1 leading-relaxed text-gray-200">
              {parseBold(text)}
            </li>
          )
        } else if (line.trim().startsWith("> [!")) {
          // Alert block parsing
          const alertType = line.includes("NOTE") ? "Note" : "Important"
          const alertText = lines[++i] ? lines[i].replace(/^>\s+/, "") : ""
          renderedLines.push(
            <div key={i} className="border-l-4 border-accent-yellow bg-brand-light/40 p-3 my-2 rounded-r-md text-sm text-gray-300">
              <span className="block font-bold text-accent-yellow mb-1">{alertType}</span>
              {parseBold(alertText)}
            </div>
          )
        } else {
          if (line.trim()) {
            renderedLines.push(
              <p key={i} className="mb-2 leading-relaxed text-gray-200">
                {parseBold(line)}
              </p>
            )
          } else {
            renderedLines.push(<div key={i} className="h-2"></div>)
          }
        }
      }
      return <div key={idx}>{renderedLines}</div>
    })
  }

  return (
    <div className="min-height-svh bg-brand-bg text-gray-100 flex flex-col selection:bg-accent-yellow/30 selection:text-white">
      
      {/* -------------------- HEADER -------------------- */}
      {view === 'chat' && (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-dark/85 border-b border-brand-border/40 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
              <div className="w-10 h-10 rounded-lg bg-brand-light border border-brand-border flex items-center justify-center relative overflow-hidden">
                <img src="/robot_avatar.png" alt="Avatar" className="w-8 h-8 object-contain" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-accent-yellow rounded-full border border-brand-bg glow-accent"></div>
              </div>
              <div>
                <span className="font-display font-extrabold text-lg tracking-tight text-white">
                  CSE-<span className="text-accent-yellow">BOT</span>
                </span>
                <span className="hidden sm:block text-[10px] text-gray-400 font-sans tracking-widest uppercase">
                  Sri Eshwar College
                </span>
              </div>
            </div>

            <button 
              onClick={() => setView('landing')}
              className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Home size={16} />
              <span>Back to Home</span>
            </button>

            <div className="flex items-center gap-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center gap-2 bg-brand-light border border-brand-border/60 py-1.5 px-3 rounded-full text-xs">
                {checkingConnection ? (
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                ) : isConnected ? (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                )}
                <span className="text-[10px] text-gray-400 font-medium">
                  {checkingConnection ? "Connecting..." : isConnected ? "Live Server" : "Offline Demo"}
                </span>
                <button 
                  onClick={checkServerConnection} 
                  className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
                  title="Refresh connection"
                >
                  <RefreshCw size={10} className={checkingConnection ? "animate-spin" : ""} />
                </button>
              </div>

              <button 
                onClick={handleClearHistory}
                className="bg-transparent border border-red-500/30 hover:border-red-500/60 text-red-400 hover:bg-red-500/10 font-medium py-2 px-3 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Clear Memory</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* -------------------- VIEW 1: LANDING PAGE -------------------- */}
      {view === 'landing' && (
        <main className="flex-1 flex flex-col justify-center relative overflow-hidden bg-[#0c0c0e] min-h-screen p-8 md:p-16 lg:p-24 select-none bg-[url('/hero_bg.png')] bg-cover bg-center bg-no-repeat">
          
          {/* Subtle horizontal gradient to keep left text readable, leaving right side fully transparent and clear */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/95 via-[#030712]/60 to-transparent pointer-events-none z-0"></div>

          {/* Faint technical grid overlay layer */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none z-0"></div>

          {/* Hero Content Area */}
          <div className="w-full max-w-7xl mx-auto relative z-10">
            
            {/* Left Content Column (generous spacing, leaving the right side open to show the blueprint graphic) */}
            <div className="max-w-2xl flex flex-col items-center lg:items-start text-center lg:text-left">
              
              {/* Institution Tag/Badge */}
              <div className="inline-flex items-center gap-2 bg-brand-light/80 border border-brand-border py-1.5 px-4 rounded-full mb-6 max-w-max select-none">
                <div className="w-2 h-2 bg-accent-yellow rounded-full animate-ping glow-accent"></div>
                <div className="w-2 h-2 bg-accent-yellow rounded-full absolute glow-accent"></div>
                <span className="text-xs text-gray-300 font-sans tracking-wide">
                  Sri Eshwar College of Engineering — CSE Department
                </span>
              </div>

              {/* Bold Neo-Grotesque Title */}
              <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-[-0.04em] leading-[0.9] text-white mb-6">
                CSE-BOT
              </h1>

              {/* Premium Subtitle Description */}
              <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed mb-8">
                The smartest way to navigate CSE at SECE — query official syllabus structures, faculty coordinators, committees, and placements in real-time.
              </p>

              {/* Launch Assistant CTA Button */}
              <button 
                onClick={() => setView('chat')}
                className="bg-accent-yellow hover:bg-accent-yellow-dark text-brand-bg font-extrabold text-base py-3.5 px-8 rounded-xl shadow-lg hover:shadow-yellow-400/20 transition-all duration-300 flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto justify-center cursor-pointer max-w-max"
              >
                <span>Launch Assistant</span>
                <ArrowRight size={18} />
              </button>
            </div>
            
          </div>
        </main>
      )}

      {/* -------------------- VIEW 2: CHAT INTERFACE -------------------- */}
      {view === 'chat' && (
        <main className="flex-1 flex flex-col md:flex-row relative overflow-hidden h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]">
          
          {/* Left Sidebar (Desktop only) */}
          <aside className="hidden md:flex md:w-80 flex-col bg-brand-dark/50 border-r border-brand-border/40 p-4 justify-between h-full">
            <div className="flex flex-col gap-6 overflow-y-auto">
              <div>
                <button 
                  onClick={() => setView('landing')}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-4 group font-medium cursor-pointer"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span>Back to Home</span>
                </button>
                <div className="border-t border-brand-border/40 my-3"></div>
                <h4 className="text-xs font-semibold text-gray-400 tracking-wider uppercase mb-3">Suggested Queries</h4>
                <div className="flex flex-col gap-2">
                  {suggestedPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(p.query)}
                      className="text-left text-xs bg-brand-light/35 border border-brand-border/60 hover:border-accent-yellow/40 hover:bg-brand-light/75 text-gray-300 hover:text-white p-2.5 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border/40 pt-4 flex flex-col gap-3">
              <div className="bg-brand-light/40 border border-brand-border/60 p-3 rounded-lg text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-accent-yellow block mb-1">How to Use:</span>
                Ask questions about faculty coordinators, PAC committees, semester syllabus, or coding and technology advice.
              </div>
              <button
                onClick={handleClearHistory}
                className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 py-2.5 px-4 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Reset Chat History</span>
              </button>
            </div>
          </aside>

          {/* Main Chat Area */}
          <section className="flex-1 flex flex-col justify-between bg-[#040817] h-full relative">
            
            {/* Top Bar for Mobile */}
            <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-brand-border/40 bg-brand-dark/40">
              <button 
                onClick={() => setView('landing')}
                className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <Home size={15} />
                <span>Home</span>
              </button>
              <span className="font-display font-bold text-sm text-white">CSE-BOT Chat</span>
              <button 
                onClick={handleClearHistory}
                className="text-red-400 hover:text-red-300 p-1"
                title="Clear Session"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {messages.length === 0 ? (
                /* Welcome Screen if empty */
                <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-8">
                  <div className="w-20 h-20 rounded-2xl bg-brand-light border border-brand-border flex items-center justify-center relative overflow-hidden animate-float mb-6">
                    <img src="/robot_avatar.png" alt="Avatar" className="w-16 h-16 object-contain" />
                    <div className="absolute bottom-1 right-1 w-4.5 h-4.5 bg-accent-yellow rounded-full border-2 border-brand-bg glow-accent"></div>
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-white">
                    Welcome to <span className="text-accent-yellow">CSE-BOT</span>
                  </h2>
                  <p className="text-sm text-gray-400 mt-2 max-w-md">
                    I am the virtual advisor for the Computer Science and Engineering Department at Sri Eshwar College of Engineering. Ask me anything to get started!
                  </p>

                  {/* Suggestion Grid for mobile/desktop layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full">
                    {suggestedPrompts.slice(0, 4).map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(p.query)}
                        className="bg-brand-light/35 border border-brand-border/60 hover:border-accent-yellow/50 hover:bg-brand-light/80 text-gray-300 hover:text-white p-3.5 rounded-xl text-xs text-left transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-between"
                      >
                        <span>{p.label}</span>
                        <ChevronRight size={14} className="text-gray-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat Messages Rendering */
                <div className="space-y-6 max-w-4xl mx-auto">
                  {messages.map((m, idx) => (
                    <div 
                      key={idx}
                      className={`flex gap-3.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-[fadeIn_0.3s_ease-out]`}
                    >
                      {/* Avatar for assistant */}
                      {m.role === 'assistant' && (
                        <div className="w-9 h-9 rounded-lg bg-brand-light border border-brand-border flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                          <img src="/robot_avatar.png" alt="Bot" className="w-7 h-7 object-contain" />
                        </div>
                      )}

                      <div className={`max-w-[85%] rounded-2xl px-4.5 py-3.5 text-sm sm:text-base leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-[#1d4ed8] text-white rounded-tr-none' 
                          : 'bg-brand-light/45 border border-brand-border/40 text-gray-100 rounded-tl-none shadow-sm'
                      }`}>
                        
                        {/* Message content formatted parser */}
                        {m.role === 'user' ? (
                          <p>{m.content}</p>
                        ) : (
                          renderFormattedContent(m.content)
                        )}
                        
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-3.5 justify-start animate-pulse">
                      <div className="w-9 h-9 rounded-lg bg-brand-light border border-brand-border flex items-center justify-center overflow-hidden shrink-0">
                        <img src="/robot_avatar.png" alt="Bot" className="w-7 h-7 object-contain" />
                      </div>
                      <div className="bg-brand-light/45 border border-brand-border/40 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1 shadow-sm">
                        <div className="w-2.5 h-2.5 bg-accent-yellow rounded-full animate-[bounce_1.4s_infinite_0s] glow-accent"></div>
                        <div className="w-2.5 h-2.5 bg-accent-yellow rounded-full animate-[bounce_1.4s_infinite_0.2s] glow-accent"></div>
                        <div className="w-2.5 h-2.5 bg-accent-yellow rounded-full animate-[bounce_1.4s_infinite_0.4s] glow-accent"></div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-brand-border/30 bg-brand-dark/20 relative z-10">
              <div className="max-w-4xl mx-auto">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="relative flex items-center bg-brand-light/60 border border-brand-border/80 focus-within:border-accent-yellow/60 rounded-xl pr-2 transition-all shadow-lg focus-within:glow-accent"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about the department syllabus, faculty, or technical concepts..."
                    className="flex-1 bg-transparent border-0 py-3.5 px-4 outline-none text-sm placeholder-gray-500 text-white"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-accent-yellow hover:bg-accent-yellow-dark disabled:bg-brand-border/40 text-brand-bg disabled:text-gray-600 p-2 rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>
                <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2 px-1">
                  <span>Press Enter to send. Keep it academic.</span>
                  <span>Session: {sessionId}</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default App


