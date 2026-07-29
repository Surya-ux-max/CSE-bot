import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { Mail, BookOpen, Award, CheckCircle2, Sparkles, Send, Search, GraduationCap, Filter, Rocket, PlusCircle, Layers, FileText } from 'lucide-react'
import { apiClient } from '../services/ApiClient'
import { useFormatContent } from '../components/FormatContent'
import PlacementCard from '../components/hubs/PlacementCard'
import HubsSearchHeader from '../components/hubs/HubsSearchHeader'
import PosterPreviewModal from '../components/hubs/PosterPreviewModal'
import CourseCard from '../components/curriculum/CourseCard'
import SyllabusDetailModal from '../components/curriculum/SyllabusDetailModal'
import CurriculumOverviewHeader from '../components/curriculum/CurriculumOverviewHeader'

export default function CurriculumPage({ theme, setTheme, currentUser, onBackToHome }) {
  const navigate = useNavigate()
  const formatContent = useFormatContent()
  const [loading, setLoading] = useState(false)
  const [customMsg, setCustomMsg] = useState('')
  const [sendingCustom, setSendingCustom] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState('')
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState('')
  const [currentSelectedItem, setCurrentSelectedItem] = useState(null)
  const [copied, setCopied] = useState(false)

  // Modal State for Viewing Detailed Syllabus
  const [selectedCourseForSyllabus, setSelectedCourseForSyllabus] = useState(null)

  // Curriculum overall state
  const [selectedSem, setSelectedSem] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [curriculumAsk, setCurriculumAsk] = useState('')
  const [curriculumAnswer, setCurriculumAnswer] = useState('')
  const [askingCopilot, setAskingCopilot] = useState(false)

  // Placement Hub Search Engine & Live Cards state
  const [livePlacements, setLivePlacements] = useState([])
  const [placementSearchQuery, setPlacementSearchQuery] = useState('')
  const [selectedPlacementCategory, setSelectedPlacementCategory] = useState('All')

  const storedUser = (() => {
    try {
      const s = localStorage.getItem('sece_user')
      return s ? JSON.parse(s) : null
    } catch {
      return null
    }
  })()

  const student = currentUser || storedUser || {
    name: 'Placement Cell',
    email: 'placementcell@csebot.edu',
    section: 'All Sections',
    role: 'placement_cell',
    year: 'All Years'
  }

  const isPlacementCell = (student.email || '').toLowerCase().includes('placement') ||
                          (student.designation || '').toLowerCase().includes('placement') ||
                          student.role === 'placement_cell' ||
                          (student.name || '').toLowerCase().includes('placement')

  const cleanField = (raw) => {
    if (!raw) return ''
    let cleaned = raw
      .replace(/^[#*:\s\-\>]+/, '')
      .replace(/[*#]+/g, '')
      .replace(/^Name:\s*/i, '')
      .replace(/^Company:\s*/i, '')
      .replace(/^Title:\s*/i, '')
      .replace(/Drive Announcement\s*$/i, 'Drive')
      .replace(/Drive for\s*/i, '')
      .replace(/\*\*+/g, '')
      .strip?.() || raw.replace(/[*#]+/g, '').trim()
    return cleaned || raw
  }

  const fetchLivePlacements = async () => {
    try {
      const dbPlacements = await apiClient.getPlacements('All')
      if (Array.isArray(dbPlacements)) {
        const formatted = dbPlacements.map(p => {
          const rawTitle = p.title || ''
          const rawCompany = p.company || ''
          const cleanPartner = cleanField(rawCompany) || "Placement Partner"
          let cleanName = cleanField(rawTitle)
          if (!cleanName || cleanName.toLowerCase() === 'announcement' || cleanName.toLowerCase() === 'drive') {
            cleanName = `${cleanPartner} Recruitment Drive`
          }
          return {
            id: `db_${p.id}`,
            is_published: true,
            name: cleanName,
            partner: cleanPartner,
            status: p.status || "Active Drive",
            date: p.deadline || "Active",
            category: "Corporate Drive",
            desc: p.description || "Official placement opportunity poster published by SECE Placement Cell.",
            apply_link: p.apply_link || "#"
          }
        })
        setLivePlacements(formatted)
      }
    } catch (err) {
      console.warn("Failed to fetch live placements:", err)
    }
  }

  useEffect(() => {
    fetchLivePlacements()
  }, [])

  const allPlacementItems = livePlacements

  const filteredPlacements = allPlacementItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(placementSearchQuery.toLowerCase()) ||
                          item.partner.toLowerCase().includes(placementSearchQuery.toLowerCase()) ||
                          item.desc.toLowerCase().includes(placementSearchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(placementSearchQuery.toLowerCase());
    const matchesCat = selectedPlacementCategory === 'All' || 
                        item.category.toLowerCase().includes(selectedPlacementCategory.toLowerCase()) ||
                        (selectedPlacementCategory === 'CoE Certification' && item.partner.toLowerCase().includes('coe'));
    return matchesSearch && matchesCat;
  });

  const extractTitleFromText = (text, fallback) => {
    if (!text) return fallback || 'Placement Drive Opportunity'
    const m = text.match(/(?:drive\s*title|placement\s*title|company|job\s*title|title)[:\s]*([^\n*#]+)/i)
    if (m && m[1].trim() && !m[1].toLowerCase().includes('announcement')) {
      return m[1].replace(/[*#]+/g, '').trim()
    }
    const h2 = text.match(/##\s*\**([^*#\n]+)\**/)
    if (h2 && h2[1].trim()) {
      const cleanH2 = h2[1].replace(/[*#]+/g, '').replace(/Announcement\s*$/i, '').trim()
      if (cleanH2 && cleanH2.length > 2) return cleanH2
    }
    return fallback || 'Placement Drive Opportunity'
  }

  const handlePublishDirectly = async () => {
    setPublishing(true)
    try {
      const rawTitle = extractTitleFromText(generatedTemplate, currentSelectedItem?.name || customMsg)
      const title = cleanField(rawTitle) || "Placement Drive Opportunity"
      const company = cleanField(currentSelectedItem?.partner) || "SECE Corporate Partner"
      await apiClient.createPlacement({
        title: title,
        company: company,
        description: generatedTemplate || customMsg || "Official Placement Drive Poster",
        deadline: currentSelectedItem?.date || "Active",
        user_email: student.email,
        user_role: student.role || "placement_cell"
      })
      await fetchLivePlacements()
      setShowTemplateModal(false)
      setNotice(`🚀 Success: ${title} has been published directly to the Placement Hub! Students & Faculty can now view this poster on their dashboards.`)
    } catch (err) {
      console.error("Direct publish error:", err)
      setNotice(`⚠️ Failed to publish poster: ${err.message}`)
    } finally {
      setPublishing(false)
    }
  }

  const handleBroadcastDrive = async (coeItem) => {
    setLoading(true)
    setNotice('')
    setCurrentSelectedItem(coeItem)
    const title = coeItem.name
    const dateStr = coeItem.date
    try {
      const prompt = `Search details about ${title} (${coeItem.partner}) scheduled on ${dateStr} and generate a copy-ready poster card template for students.`
      const res = await apiClient.sendQuestion(prompt, 'curriculum_page_session', student.email, student.role || 'placement_cell')
      if (res && res.answer) {
        setGeneratedTemplate(res.answer)
        setShowTemplateModal(true)
        setNotice(`✨ AI Search Engine: Copy-ready poster template generated for ${title}!`)
      } else {
        setNotice(`⚠️ Failed to generate template.`)
      }
    } catch (err) {
      console.error("Placement broadcast err:", err)
      setNotice(`⚠️ Template generation failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendCustom = async () => {
    if (!customMsg.trim()) return
    const textToSend = customMsg.trim()
    setSendingCustom(true)
    setNotice('')
    try {
      const prompt = `Search details and draft a copy-ready announcement template for students regarding: ${textToSend}`
      const res = await apiClient.sendQuestion(prompt, 'curriculum_page_session', student.email, student.role || 'placement_cell')
      if (res && res.answer) {
        setGeneratedTemplate(res.answer)
        setShowTemplateModal(true)
        setNotice(`✨ AI Copilot: Custom announcement template generated!`)
        setCustomMsg('')
      } else {
        setNotice(`⚠️ Failed to generate template.`)
      }
    } catch (err) {
      console.error("Custom send error:", err)
      setNotice(`⚠️ Error: ${err.message}`)
    } finally {
      setSendingCustom(false)
    }
  }

  const handleAskCurriculumCopilot = async (customPrompt = null) => {
    const query = customPrompt || curriculumAsk.trim()
    if (!query) return
    setAskingCopilot(true)
    setNotice('')
    try {
      const res = await apiClient.sendQuestion(query, 'curriculum_student_session', student.email, student.role || 'student')
      if (res && res.answer) {
        setCurriculumAnswer(res.answer)
        setNotice(`✨ AI Curriculum Copilot generated syllabus response!`)
      } else {
        setNotice(`⚠️ Unable to fetch curriculum details.`)
      }
    } catch (err) {
      console.error("Curriculum query err:", err)
      setNotice(`⚠️ Error querying curriculum: ${err.message}`)
    } finally {
      setAskingCopilot(false)
    }
  }

  // Complete Semesters 1 - 8 CSE Curriculum Dataset
  const overallCurriculum = [
    // Semester 1 (14 Credits)
    {
      sem: "Sem 1", code: "22MA101", name: "Linear Algebra & Calculus", credits: 4, type: "Core Theory",
      desc: "Matrices, Eigen values and Eigen vectors, Vector calculus, Multivariable calculus and Ordinary differential equations.",
      units: [
        { title: "Unit I: Matrices & Eigen Values", desc: "Eigenvalues and Eigenvectors, Cayley-Hamilton Theorem, Diagonalization of matrices, Quadratic forms." },
        { title: "Unit II: Differential Calculus", desc: "Curvature, Evolutes, Envelopes, Functions of several variables, Taylor's expansion, Maxima and Minima." },
        { title: "Unit III: Multivariable Integration", desc: "Double integrals, Change of order of integration, Triple integrals, Area and Volume calculations." },
        { title: "Unit IV: Vector Calculus", desc: "Gradient, Divergence, Curl, Line and Surface integrals, Green's, Gauss Divergence, and Stokes Theorems." },
        { title: "Unit V: Differential Equations", desc: "Higher order linear ODEs with constant coefficients, Method of variation of parameters, Cauchy-Euler equation." }
      ]
    },
    {
      sem: "Sem 1", code: "22PH101", name: "Engineering Physics", credits: 3, type: "Theory + Lab",
      desc: "Laser physics, Quantum mechanics, Fiber optics, Semiconductor physics & Solid state electronic devices.",
      units: [
        { title: "Unit I: Lasers & Fiber Optics", desc: "Einstein's A and B coefficients, Semiconductor lasers, Optical fibers, Step index & Graded index fibers, Attenuation." },
        { title: "Unit II: Quantum Physics", desc: "Black body radiation, Compton effect, Wave function, Schrodinger time independent and dependent equations, Tunneling." },
        { title: "Unit III: Solid State Physics", desc: "Free electron theory, Fermi-Dirac distribution, Band theory of solids, Intrinsic and Extrinsic semiconductors." },
        { title: "Unit IV: Magnetic & Dielectric Materials", desc: "Dia, Para, Ferro magnetic materials, Hysteresis loop, Dielectric polarization, Clausius-Mossotti equation." },
        { title: "Unit V: Nanomaterials & Characterization", desc: "Synthesis of nanomaterials (PVD, CVD, Sol-gel), Carbon nanotubes, SEM, TEM, and XRD characterization." }
      ]
    },
    {
      sem: "Sem 1", code: "22CS101", name: "Problem Solving & Python Programming", credits: 4, type: "Theory + Lab",
      desc: "Algorithmic problem solving, Python data structures, File I/O, Object-Oriented principles, and modular programming.",
      units: [
        { title: "Unit I: Algorithmic Problem Solving", desc: "Algorithms, Flowcharts, Pseudocode, Building blocks of algorithms, Simple strategies for developing algorithms." },
        { title: "Unit II: Control Structures & Functions", desc: "Conditionals, Loops, Fruitful functions, Recursion, Scope of variables, Lambda functions, Exception handling." },
        { title: "Unit III: Compound Data Structures", desc: "Lists, Tuples, Dictionaries, Sets, List comprehensions, Sorting and Searching algorithms in Python." },
        { title: "Unit IV: File Handling & Modules", desc: "Text and Binary files, Reading & Writing, Command line arguments, Standard modules (math, random, os, sys)." },
        { title: "Unit V: Object Oriented Python", desc: "Classes, Objects, Inheritance, Polymorphism, Encapsulation, Operator overloading, Custom exceptions." }
      ]
    },
    {
      sem: "Sem 1", code: "22EE101", name: "Basic Electrical & Electronics Engineering", credits: 3, type: "Core Theory",
      desc: "DC/AC circuits analysis, Electrical transformers, Motors, Diodes, Transistors, and Operational Amplifiers.",
      units: [
        { title: "Unit I: DC Circuit Analysis", desc: "Ohm's Law, Kirchhoff's Laws, Mesh Analysis, Nodal Analysis, Thevenin and Norton Theorems." },
        { title: "Unit II: AC Circuits & Transformers", desc: "Single phase AC circuits, Phasor diagrams, Power factor, 3-phase circuits, Single phase transformers." },
        { title: "Unit III: Electrical Machines", desc: "DC Generators & Motors, Construction, Working principle, Speed control, Induction Motors." },
        { title: "Unit IV: Semiconductor Devices", desc: "PN Junction diode, Zener diode, Rectifiers, BJT, FET, MOSFET characteristics and biasing." },
        { title: "Unit V: Digital Fundamentals & Op-Amps", desc: "Logic gates, Boolean algebra, Op-Amp inverting & non-inverting amplifiers, Integrator & Differentiator." }
      ]
    },

    // Semester 2 (13 Credits)
    {
      sem: "Sem 2", code: "22MA201", name: "Discrete Mathematics & Graph Theory", credits: 4, type: "Core Theory",
      desc: "Mathematical logic, Relations, Combinatorics, Graph theory, Trees, and Algebraic structures.",
      units: [
        { title: "Unit I: Mathematical Logic", desc: "Propositional logic, Truth tables, Normal forms, Predicates and Quantifiers, Rules of inference." },
        { title: "Unit II: Combinatorics & Relations", desc: "Mathematical induction, Counting principles, Recurrence relations, Equivalence relations, Posets & Lattices." },
        { title: "Unit III: Algebraic Structures", desc: "Groups, Subgroups, Homomorphisms, Rings, Integral Domains, Fields, Lagrange's Theorem." },
        { title: "Unit IV: Graph Theory", desc: "Graphs, Subgraphs, Eulerian and Hamiltonian paths, Isomorphism, Planar graphs, Graph coloring." },
        { title: "Unit V: Trees & Algorithms", desc: "Trees, Spanning trees, Kruskal & Prim algorithms, Shortest path algorithms, Tree traversals." }
      ]
    },
    {
      sem: "Sem 2", code: "22CS201", name: "C Programming & Data Structures", credits: 4, type: "Theory + Lab",
      desc: "Pointers, Dynamic memory allocation, Stacks, Queues, Linked lists, Trees, and Hashing in C.",
      units: [
        { title: "Unit I: C Foundations & Pointers", desc: "Pointers, Pointer arithmetic, Arrays and Pointers, Dynamic memory allocation (malloc, calloc, realloc, free)." },
        { title: "Unit II: Linear Data Structures - Stacks & Queues", desc: "Stack ADT, Array and Linked implementation, Applications (Infix to Postfix, Recursion), Queue ADT, Circular Queue." },
        { title: "Unit III: Linked Lists", desc: "Singly linked list, Doubly linked list, Circular linked list, Operations, Polynomial manipulation." },
        { title: "Unit IV: Non-Linear Data Structures - Trees", desc: "Binary Trees, Binary Search Trees (BST), AVL Trees, B-Trees, Heap Trees, Traversals." },
        { title: "Unit V: Hashing & Sorting", desc: "Hash functions, Collision resolution techniques, Quick sort, Merge sort, Heap sort comparison." }
      ]
    },
    {
      sem: "Sem 2", code: "22EC201", name: "Digital Logic & Microprocessors", credits: 3, type: "Core Theory",
      desc: "Boolean algebra, Combinational & Sequential circuits, Flip-flops, 8086 Microprocessor architecture.",
      units: [
        { title: "Unit I: Boolean Algebra & K-Maps", desc: "Number systems, Logic gates, SOP & POS forms, Karnaugh Map minimization, Quine-McCluskey method." },
        { title: "Unit II: Combinational Circuits", desc: "Adders, Subtractors, Multiplexers, Demultiplexers, Encoders, Decoders, Code converters." },
        { title: "Unit III: Sequential Circuits", desc: "Latches, Flip-Flops (SR, JK, D, T), Counters, Shift registers, State machines (Mealy & Moore)." },
        { title: "Unit IV: 8086 Architecture", desc: "8086 Microprocessor internal architecture, Register organization, Memory segmentation, Bus interface." },
        { title: "Unit V: Assembly Programming & Interfacing", desc: "8086 Instruction set, Addressing modes, Interrupts, Interfacing 8255 PPI, 8259 PIC." }
      ]
    },
    {
      sem: "Sem 2", code: "22CY201", name: "Environmental Science & Sustainability", credits: 2, type: "Mandatory Non-Credit",
      desc: "Ecology, Biodiversity conservation, Environmental pollution control, Renewable energy & Sustainable engineering.",
      units: [
        { title: "Unit I: Ecosystems & Biodiversity", desc: "Structure & function of ecosystems, Food chains, Energy flow, Biodiversity hotspots and conservation." },
        { title: "Unit II: Environmental Pollution", desc: "Air, Water, Soil, Noise pollution, Municipal solid waste management, E-waste recycling." },
        { title: "Unit III: Renewable Energy Sources", desc: "Solar, Wind, Hydro, Biomass, Fuel cells, Energy storage devices, Green building concepts." },
        { title: "Unit IV: Sustainable Engineering Practices", desc: "Life cycle assessment, Circular economy, Carbon footprint reduction, ISO 14001 standards." },
        { title: "Unit V: Environmental Legislation", desc: "Water Act, Air Act, Wildlife Protection Act, Climate change agreements (Paris Accord, Kyoto Protocol)." }
      ]
    },

    // Semester 3 (15 Credits)
    {
      sem: "Sem 3", code: "22CS301", name: "Object Oriented Programming with Java", credits: 4, type: "Theory + Lab",
      desc: "Inheritance, Polymorphism, Exception handling, Multi-threading, Streams API, Swing & JavaFX.",
      units: [
        { title: "Unit I: Java Language Fundamentals", desc: "JVM Architecture, Primitive types, Arrays, Classes, Objects, Constructors, Garbage collection, Packages." },
        { title: "Unit II: Inheritance & Interfaces", desc: "Method overriding, Abstract classes, Interfaces, Multiple inheritance via interfaces, Sealed classes." },
        { title: "Unit III: Exception Handling & I/O", desc: "Try-catch-finally, Custom exceptions, File streams, Byte and Character streams, Serialization." },
        { title: "Unit IV: Multithreading & Concurrency", desc: "Thread lifecycle, Runnable interface, Synchronization, Inter-thread communication, Executor framework." },
        { title: "Unit V: GUI & Modern Java Features", desc: "Event handling, JavaFX UI controls, Lambda expressions, Streams API, Optional class." }
      ]
    },
    {
      sem: "Sem 3", code: "22CS302", name: "Data Structures & Algorithms Analysis", credits: 4, type: "Theory + Lab",
      desc: "Asymptotic notation, Heaps, Advanced Graph algorithms (Dijkstra, Kruskal, Bellman-Ford), Dynamic programming.",
      units: [
        { title: "Unit I: Algorithm Complexity", desc: "Asymptotic notations (Big O, Omega, Theta), Master theorem, Analysis of recursive algorithms." },
        { title: "Unit II: Priority Queues & Disjoint Sets", desc: "Binary Heap, Binomial Heap, Fibonacci Heap, Union-Find disjoint sets algorithm." },
        { title: "Unit III: Advanced Graph Algorithms", desc: "BFS, DFS, Topological sort, Dijkstra, Bellman-Ford, Prim's and Kruskal's MST, Floyd-Warshall." },
        { title: "Unit IV: Dynamic Programming", desc: "0/1 Knapsack, Longest Common Subsequence, Matrix Chain Multiplication, Optimal BST." },
        { title: "Unit V: String Matching & NP-Completeness", desc: "KMP algorithm, Rabin-Karp, Polynomial time verification, NP-Hard & NP-Complete problems." }
      ]
    },
    {
      sem: "Sem 3", code: "22CS303", name: "Computer Architecture & Organization", credits: 3, type: "Core Theory",
      desc: "MIPS Instruction set, ALU design, Pipelining, Memory hierarchy, Cache coherence, and I/O organization.",
      units: [
        { title: "Unit I: Instruction Set Architecture", desc: "MIPS instructions, Addressing modes, Register conventions, Machine language encoding." },
        { title: "Unit II: Arithmetic Logic Unit", desc: "Addition, Subtraction, Booth's multiplication algorithm, Restoring & Non-restoring division, IEEE 754 float." },
        { title: "Unit III: Processor & Pipelining", desc: "Datapath design, Single cycle & Multicycle implementations, Pipelining hazards (Data, Control, Structural)." },
        { title: "Unit IV: Memory Hierarchy", desc: "Cache memory mapping (Direct, Associative, Set-Associative), Virtual memory, TLB, Cache coherence." },
        { title: "Unit V: I/O & Multiprocessors", desc: "Interrupts, DMA controller, Bus arbitration, Shared memory multiprocessors, NUMA." }
      ]
    },
    {
      sem: "Sem 3", code: "22CS304", name: "Database Management Systems", credits: 4, type: "Theory + Lab",
      desc: "Relational algebra, Advanced SQL, Normalization (1NF to BCNF), Transaction ACID properties, Indexing & Query Tuning.",
      units: [
        { title: "Unit I: Relational Model & ER Diagrams", desc: "Database architecture, ER/EER Modeling, Relational Algebra, Relational Calculus." },
        { title: "Unit II: SQL & Database Programming", desc: "DDL, DML, DCL, Complex Joins, Subqueries, Views, Triggers, Stored Procedures, PL/SQL." },
        { title: "Unit III: Database Normalization", desc: "Functional Dependencies, Decomposition, 1NF, 2NF, 3NF, BCNF, 4NF, Lossless join property." },
        { title: "Unit IV: Transactions & Concurrency", desc: "ACID properties, Schedules, Serializability, Two-Phase Locking (2PL), Deadlock handling, Timestamp ordering." },
        { title: "Unit V: Storage & Indexing", desc: "RAID configurations, B+ Trees indexing, Hash indexing, Query optimization and execution plans." }
      ]
    },

    // Semester 4 (15 Credits)
    {
      sem: "Sem 4", code: "22CS401", name: "Operating Systems Concepts & Architecture", credits: 4, type: "Theory + Lab",
      desc: "Process synchronization, Deadlocks, Memory management, Paging, Virtual memory, File systems & Security.",
      units: [
        { title: "Unit I: OS Structure & Process Management", desc: "OS Services, System Calls, Process Control Block, Process Scheduling (FCFS, SJF, RR, Priority)." },
        { title: "Unit II: Synchronization & Deadlocks", desc: "Critical Section problem, Semaphores, Monitors, Producer-Consumer, Banker's Algorithm for Deadlock." },
        { title: "Unit III: Memory Management", desc: "Contiguous Allocation, Paging, Segmentation, Virtual Memory, Demand Paging, Page Replacement (FIFO, LRU, Optimal)." },
        { title: "Unit IV: Storage & File Systems", desc: "Disk scheduling (FCFS, SSTF, SCAN, C-SCAN), File System Interface, Directory structures, Allocation methods." },
        { title: "Unit V: Protection & Security", desc: "Access Control Matrix, Authentication, System Threats, Domain Protection, Linux & Windows Case Studies." }
      ]
    },
    {
      sem: "Sem 4", code: "22CS402", name: "Design & Analysis of Algorithms", credits: 4, type: "Theory + Lab",
      desc: "Divide and conquer, Greedy techniques, Dynamic Programming, Backtracking, Branch & Bound, NP-completeness.",
      units: [
        { title: "Unit I: Divide & Conquer", desc: "Merge sort, Quick sort, Strassen's matrix multiplication, Binary search, Analysis of space/time complexity." },
        { title: "Unit II: Greedy Strategy", desc: "Fractional Knapsack, Huffman coding, Job sequencing with deadlines, Prim's and Kruskal's algorithms." },
        { title: "Unit III: Dynamic Programming Applications", desc: "All-Pairs Shortest Path, Traveling Salesperson Problem, Edit Distance, Subset Sum." },
        { title: "Unit IV: Backtracking & Branch & Bound", desc: "N-Queens problem, Graph Coloring, Hamiltonian Circuits, 0/1 Knapsack Branch & Bound." },
        { title: "Unit V: Approximation & Randomized Algorithms", desc: "Vertex Cover approximation, Randomized Quick sort, Las Vegas and Monte Carlo algorithms." }
      ]
    },
    {
      sem: "Sem 4", code: "22CS403", name: "Software Engineering & Agile Practices", credits: 3, type: "Core Theory",
      desc: "SDLC models, Requirement engineering, UML design diagrams, Scrum framework, Continuous Integration & Automated Testing.",
      units: [
        { title: "Unit I: Software Process Models", desc: "Waterfall, Spiral, Prototyping, Agile Manifesto, Extreme Programming (XP), Scrum Roles and Ceremonies." },
        { title: "Unit II: Requirements Engineering", desc: "Functional & Non-functional requirements, Software Requirements Specification (SRS), User Stories, Use cases." },
        { title: "Unit III: Object Oriented Analysis & Design", desc: "UML Diagrams (Use Case, Class, Sequence, State Machine, Activity), Design Patterns (Gang of Four)." },
        { title: "Unit IV: Software Testing & QA", desc: "Black-box & White-box testing, Unit testing (JUnit), Integration testing, System testing, Regression testing." },
        { title: "Unit V: DevOps & Software Maintenance", desc: "Version Control (Git), CI/CD pipelines, Software metrics, Refactoring, Maintenance strategies." }
      ]
    },
    {
      sem: "Sem 4", code: "22CS404", name: "Computer Networks & Protocols", credits: 4, type: "Theory + Lab",
      desc: "OSI & TCP/IP layers, Routing algorithms, Transport protocols (TCP/UDP), Socket programming, Wireless networks.",
      units: [
        { title: "Unit I: Physical & Data Link Layer", desc: "Network Topologies, OSI model, Media Access Control (CSMA/CD, CSMA/CA), Ethernet, Error Detection (CRC)." },
        { title: "Unit II: Network Layer & IP Addressing", desc: "IPv4 & IPv6 Addressing, Subnetting, CIDR, ARP, ICMP, DHCP, NAT." },
        { title: "Unit III: Routing Protocols", desc: "Distance Vector Routing (RIP), Link State Routing (OSPF), Path Vector (BGP), Multicast routing." },
        { title: "Unit IV: Transport Layer", desc: "UDP, TCP segment structure, 3-way handshake, Connection termination, Flow control, Congestion control." },
        { title: "Unit V: Application Layer", desc: "HTTP/HTTPS, DNS, SMTP, FTP, Socket Programming in C/Python, Network Security (SSL/TLS)." }
      ]
    },

    // Semester 5 (14 Credits)
    {
      sem: "Sem 5", code: "22CS501", name: "Theory of Computation & Automata", credits: 3, type: "Core Theory",
      desc: "DFA, NFA, Regular expressions, Context-Free Grammars, Pushdown Automata, Turing Machines, and Decidability.",
      units: [
        { title: "Unit I: Finite Automata", desc: "Deterministic Finite Automata (DFA), Nondeterministic Finite Automata (NFA), NFA to DFA conversion, NFA with Epsilon." },
        { title: "Unit II: Regular Languages & Expressions", desc: "Regular Expressions, Pumping Lemma for Regular Languages, Equivalence of RE and FA, DFA Minimization." },
        { title: "Unit III: Context-Free Grammars", desc: "CFG derivation trees, Ambiguity, Simplification of CFGs, Chomsky Normal Form (CNF), Greibach Normal Form (GNF)." },
        { title: "Unit IV: Pushdown Automata", desc: "PDA definition, Acceptance by final state & empty stack, Equivalence of PDA and CFG, Pumping Lemma for CFL." },
        { title: "Unit V: Turing Machines & Decidability", desc: "Turing Machine model, Programming TMs, Halting Problem, Undecidability, Post Correspondence Problem." }
      ]
    },
    {
      sem: "Sem 5", code: "22CS502", name: "Artificial Intelligence & Machine Learning", credits: 4, type: "Theory + Lab",
      desc: "Supervised & Unsupervised learning, Neural networks, Decision trees, Support Vector Machines, PyTorch/TensorFlow.",
      units: [
        { title: "Unit I: AI Search & Heuristics", desc: "State space search, Uninformed (BFS, DFS), Informed (A* Search, Greedy Best First), Minimax algorithm with Alpha-Beta pruning." },
        { title: "Unit II: Supervised Learning - Regression & Classification", desc: "Linear Regression, Logistic Regression, Decision Trees, Random Forests, Naive Bayes Classifier." },
        { title: "Unit III: SVM & Kernel Methods", desc: "Support Vector Machines, Linear & Non-linear kernels, Hyperparameter tuning, Cross-validation." },
        { title: "Unit IV: Unsupervised Learning & Clustering", desc: "K-Means clustering, Hierarchical clustering, Principal Component Analysis (PCA) for dimensionality reduction." },
        { title: "Unit V: Neural Networks & Deep Learning", desc: "Perceptrons, Multilayer Perceptron (MLP), Backpropagation, Convolutional Neural Networks (CNN), PyTorch basics." }
      ]
    },
    {
      sem: "Sem 5", code: "22CS503", name: "Web Technologies & Microservices", credits: 4, type: "Theory + Lab",
      desc: "React.js, Node.js, Express, REST APIs, MongoDB, Docker containerization & Microservices architecture.",
      units: [
        { title: "Unit I: Frontend Foundations", desc: "HTML5 semantic elements, CSS3 Flexbox & Grid, JavaScript ES6+ features (Async/Await, Promises, Closures)." },
        { title: "Unit II: Modern React Development", desc: "React Components, JSX, Props, State, Hooks (useState, useEffect, useContext), Client-side routing." },
        { title: "Unit III: Node.js & Express Backend", desc: "Node event loop, Express routing, Middleware architecture, RESTful API design standards, JWT Authentication." },
        { title: "Unit IV: NoSQL Databases - MongoDB", desc: "Document databases vs RDBMS, MongoDB CRUD operations, Mongoose ORM, Aggregation pipelines, Indexing." },
        { title: "Unit V: Microservices & Docker Deployment", desc: "Monolith vs Microservices, Docker containerization, Docker Compose, API Gateways, Service discovery." }
      ]
    },
    {
      sem: "Sem 5", code: "22CS504", name: "Cyber Security Foundations", credits: 3, type: "Professional Elective",
      desc: "Network security defense, Firewalls, Penetration testing, Vulnerability assessment, Threat intelligence.",
      units: [
        { title: "Unit I: Security Principles & Threat Landscape", desc: "CIA Triad, Security Architecture, Malware types (Ransomware, Trojans, Rootkits), Social Engineering attacks." },
        { title: "Unit II: Network & Boundary Security", desc: "Firewall architectures (Packet filter, Stateful, WAF), Intrusion Detection/Prevention Systems (IDS/IPS)." },
        { title: "Unit III: Vulnerability Assessment & Pentesting", desc: "Nmap port scanning, OWASP Top 10 web vulnerabilities, Metasploit framework, Buffer overflows." },
        { title: "Unit IV: Identity & Access Management", desc: "Authentication protocols (OAuth 2.0, SAML, OpenID Connect), Multi-Factor Authentication (MFA), RBAC." },
        { title: "Unit V: Security Operations & Incident Response", desc: "SIEM tools (Splunk, Elastic SIEM), Log analysis, Digital forensics basics, Incident response lifecycle." }
      ]
    },

    // Semester 6 (14 Credits)
    {
      sem: "Sem 6", code: "22CS601", name: "Cloud Computing & DevOps", credits: 4, type: "Theory + Lab",
      desc: "AWS/GCP infrastructure, Kubernetes orchestration, CI/CD pipelines, Terraform Infrastructure as Code.",
      units: [
        { title: "Unit I: Cloud Service Models", desc: "IaaS, PaaS, SaaS, Public/Private/Hybrid clouds, AWS EC2, S3, IAM, VPC networking fundamentals." },
        { title: "Unit II: Virtualization & Containers", desc: "Hypervisors (KVM, ESXi), Docker Architecture, Image creation, Container networking & volumes." },
        { title: "Unit III: Kubernetes Orchestration", desc: "Kubernetes Cluster Architecture, Pods, Deployments, Services, Ingress Controllers, Helm charts." },
        { title: "Unit IV: Infrastructure as Code (IaC)", desc: "Terraform declarative syntax, State files, Modules, AWS provisioners, Ansible configuration management." },
        { title: "Unit V: CI/CD & Observability", desc: "GitHub Actions / Jenkins pipelines, Prometheus monitoring, Grafana dashboards, Distributed tracing." }
      ]
    },
    {
      sem: "Sem 6", code: "22CS602", name: "Compiler Design", credits: 3, type: "Core Theory",
      desc: "Lexical analysis, Lex/Yacc tools, Syntax-directed translation, Intermediate code generation, Code optimization.",
      units: [
        { title: "Unit I: Lexical Analysis", desc: "Role of lexical analyzer, Input buffering, Tokens & Lexemes, Regular expressions to Finite Automata, LEX tool." },
        { title: "Unit II: Syntax Analysis & Parsing", desc: "Context-Free Grammars, Top-down parsing (Recursive descent, LL(1)), Bottom-up parsing (LR(0), SLR, LALR), YACC tool." },
        { title: "Unit III: Syntax-Directed Translation & Symbol Tables", desc: "Syntax-Directed Definitions, Evaluation orders, Type checking, Symbol table data structures." },
        { title: "Unit IV: Intermediate Code Generation", desc: "Three-address code, Quadruples, Triples, Syntax trees, Translation of expressions & control flow statements." },
        { title: "Unit V: Code Optimization & Code Generation", desc: "Basic blocks, Flow graphs, Loop optimization, Constant folding, Register allocation, Target code generation." }
      ]
    },
    {
      sem: "Sem 6", code: "22CS603", name: "Full Stack AI Applications & LLMs", credits: 4, type: "Professional Elective",
      desc: "LLM integration, LangChain framework, RAG architectures, Vector databases (ChromaDB/FAISS), Next.js AI apps.",
      units: [
        { title: "Unit I: Large Language Model Architectures", desc: "Transformer architecture, Self-attention, Embeddings, GPT/Llama models, Tokenization, Context windows." },
        { title: "Unit II: Prompt Engineering & Fine-Tuning", desc: "Zero-shot, Few-shot prompting, Chain of Thought, LoRA, QLoRA Parameter Efficient Fine-Tuning." },
        { title: "Unit III: Retrieval-Augmented Generation (RAG)", desc: "RAG Pipeline design, Document chunking, Dense retrieval, Hybrid search, Reranking." },
        { title: "Unit IV: Vector Databases & Embeddings", desc: "Vector indexing (HNSW, IVF), ChromaDB, FAISS, Pinecone, Similarity metrics (Cosine, Euclidean)." },
        { title: "Unit V: Full-Stack AI Application Development", desc: "Building AI Agents with LangChain/LlamaIndex, Next.js UI integration, Streaming responses, Guardrails." }
      ]
    },
    {
      sem: "Sem 6", code: "22CS604", name: "Cyber Security & Cryptography", credits: 3, type: "Professional Elective",
      desc: "AES, RSA, ECC cryptography, Public Key Infrastructure (PKI), Hash functions, Zero-trust security.",
      units: [
        { title: "Unit I: Symmetric Cryptography", desc: "Classical ciphers, Stream ciphers, Block ciphers, DES, Advanced Encryption Standard (AES) operation modes." },
        { title: "Unit II: Asymmetric Cryptography", desc: "Number Theory (Modular arithmetic, Euler's Totient), RSA algorithm, Diffie-Hellman Key Exchange, Elliptic Curve Cryptography (ECC)." },
        { title: "Unit III: Hash Functions & Digital Signatures", desc: "Cryptographic hash functions (SHA-256, SHA-3), HMAC, Digital Signature Standard (DSS), Digital Certificates." },
        { title: "Unit IV: Public Key Infrastructure & Network Security", desc: "PKI Architecture, Certificate Authorities, TLS 1.3 protocol, IPsec framework, Wireless WPA3 security." },
        { title: "Unit V: Zero-Trust & Emerging Cryptography", desc: "Zero-Trust Architecture principles, Post-Quantum Cryptography standards, Homomorphic Encryption basics." }
      ]
    },

    // Semester 7 (15 Credits)
    {
      sem: "Sem 7", code: "22CS701", name: "Distributed Systems & Blockchain", credits: 4, type: "Theory + Lab",
      desc: "Consensus algorithms (Raft, Paxos), Smart contracts, Ethereum, Solidity development, Decentralized Apps.",
      units: [
        { title: "Unit I: Distributed Systems Architecture", desc: "Characterization of Distributed Systems, System Models, Logical Clocks (Lamport, Vector), Global States." },
        { title: "Unit II: Distributed Consensus & Fault Tolerance", desc: "Byzantine Generals Problem, Consensus protocols (Paxos, Raft), Replication, Fault Tolerance models." },
        { title: "Unit III: Blockchain Fundamentals", desc: "Distributed Ledger Technology, Cryptographic Hashes, Merkle Trees, Proof of Work (PoW), Proof of Stake (PoS)." },
        { title: "Unit IV: Smart Contracts & Ethereum", desc: "Ethereum Virtual Machine (EVM), Solidity programming language, ERC-20 & ERC-721 token standards." },
        { title: "Unit V: Decentralized Applications (DApps)", desc: "Web3.js/Ethers.js frontend integration, IPFS decentralized storage, Hardhat/Foundry testing, Layer-2 scaling." }
      ]
    },
    {
      sem: "Sem 7", code: "22CS702", name: "Natural Language Processing & RAG", credits: 4, type: "Professional Elective",
      desc: "Transformers, Attention mechanisms, BERT, GPT fine-tuning, Tokenization, Text summarization & Sentiment analysis.",
      units: [
        { title: "Unit I: Text Processing & Language Models", desc: "Tokenization, Stemming, Lemmatization, TF-IDF, N-gram language models, Word Embeddings (Word2Vec, GloVe)." },
        { title: "Unit II: Sequence Models for NLP", desc: "Recurrent Neural Networks (RNN), Long Short-Term Memory (LSTM), Gated Recurrent Units (GRU), Seq2Seq." },
        { title: "Unit III: Attention & Transformers", desc: "Self-Attention mechanism, Multi-Head Attention, Transformer Encoder-Decoder architecture, Positional Encoding." },
        { title: "Unit IV: Pretrained Language Models", desc: "BERT architecture and pretraining, RoBERTa, T5, Fine-tuning for downstream NLP tasks (NER, Classification)." },
        { title: "Unit V: Advanced NLP Applications", desc: "Neural Machine Translation, Abstractive Summarization, Question Answering systems, Conversational AI." }
      ]
    },
    {
      sem: "Sem 7", code: "22CS703", name: "Big Data Analytics & Data Engineering", credits: 3, type: "Professional Elective",
      desc: "Apache Hadoop, MapReduce, Spark streaming, Kafka real-time pipelines, Data warehousing & Lakehouses.",
      units: [
        { title: "Unit I: Big Data Ecosystem", desc: "Characteristics of Big Data (5 Vs), Hadoop Distributed File System (HDFS), YARN resource manager." },
        { title: "Unit II: MapReduce & Apache Hive", desc: "MapReduce execution framework, Combiners, Partitions, Hive QL for data warehousing, Pig Latin." },
        { title: "Unit III: Apache Spark Distributed Computing", desc: "Spark In-Memory Architecture, RDDs, Spark DataFrames, Spark SQL, Spark MLlib machine learning." },
        { title: "Unit IV: Real-Time Stream Processing", desc: "Apache Kafka architecture, Producers, Consumers, Topics, Spark Streaming, Structured Streaming." },
        { title: "Unit V: Modern Data Lakehouse Architectures", desc: "Delta Lake, Apache Iceberg, Snowflake data warehouse architecture, ETL/ELT pipeline design." }
      ]
    },
    {
      sem: "Sem 7", code: "22CS704", name: "Industrial Capstone Project Phase I", credits: 4, type: "Project Work",
      desc: "Literature survey, System design specifications, Initial prototype implementation, and progress defense.",
      units: [
        { title: "Phase I: Problem Definition & Requirement Analysis", desc: "Identification of real-world industry or research problem, feasibility study, and requirements modeling." },
        { title: "Phase II: Literature Survey & System Architecture", desc: "Comprehensive literature review, architectural design diagrams, tech stack selection, database schema." },
        { title: "Phase III: Module Implementation & Prototype Defense", desc: "Development of core functional prototype modules, unit testing, and Phase I evaluation defense." }
      ]
    },

    // Semester 8 (16 Credits)
    {
      sem: "Sem 8", code: "22CS801", name: "High Performance & Quantum Computing", credits: 3, type: "Professional Elective",
      desc: "Parallel programming (CUDA/OpenMP), MPI cluster computing, Quantum gates & Qiskit simulation.",
      units: [
        { title: "Unit I: Parallel Hardware Architectures", desc: "Flynn's Taxonomy, Symmetric Multiprocessors (SMP), GPU Architecture (Streaming Multiprocessors, CUDA Cores)." },
        { title: "Unit II: Shared & Distributed Memory Programming", desc: "OpenMP directives and thread synchronization, Message Passing Interface (MPI) point-to-point & collective communications." },
        { title: "Unit III: GPU Acceleration with CUDA", desc: "CUDA Programming Model, Kernels, Memory Hierarchy (Shared, Global, Constant memory), Parallel Reduction." },
        { title: "Unit IV: Quantum Computing Foundations", desc: "Qubits, Superposition, Entanglement, Quantum Gates (Pauli, Hadamard, CNOT), Quantum Circuit diagrams." },
        { title: "Unit V: Quantum Algorithms & Qiskit", desc: "Deutsch-Jozsa Algorithm, Grover's Search Algorithm, Shor's Factoring Algorithm, IBM Qiskit simulation." }
      ]
    },
    {
      sem: "Sem 8", code: "22CS802", name: "Industry 4.0 & IoT Architectures", credits: 3, type: "Open Elective",
      desc: "Edge computing, MQTT protocols, Sensor fusion, Smart factory automation, Digital twins.",
      units: [
        { title: "Unit I: IoT System Architecture", desc: "Sensors, Actuators, IoT Gateways, Edge computing vs Cloud computing, IoT Protocol Stack." },
        { title: "Unit II: Connectivity Protocols", desc: "MQTT, CoAP, HTTP/REST, LoRaWAN, Zigbee, Cellular 5G for Industrial IoT." },
        { title: "Unit III: Industry 4.0 & Smart Automation", desc: "Cyber-Physical Systems (CPS), Industrial Automation, PLC integration, Smart Factory frameworks." },
        { title: "Unit IV: Digital Twins & Edge Analytics", desc: "Digital Twin modeling, Predictive maintenance using machine learning at edge devices, Node-RED." },
        { title: "Unit V: Industrial IoT Security", desc: "Device authentication, Firmware security, Encryption for IoT devices, Compliance standards." }
      ]
    },
    {
      sem: "Sem 8", code: "22CS803", name: "Industrial Capstone Project Phase II", credits: 10, type: "Project Work",
      desc: "Full-scale application deployment, Rigorous testing, Research paper publication, and final Viva-Voce defense.",
      units: [
        { title: "Phase I: Advanced Implementation & Cloud Deployment", desc: "Full-stack system realization, cloud deployment, scaling optimization, and security auditing." },
        { title: "Phase II: Empirical Validation & Research Publication", desc: "Performance benchmark testing, comparative evaluation, and drafting research manuscript for IEEE/Springer conference." },
        { title: "Phase III: Final Viva-Voce & Project Defense", desc: "Project demonstration to external academic & industry panel, final dissertation submission." }
      ]
    }
  ]

  const semestersList = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']
  const categoriesList = ['All', 'Core Theory', 'Theory + Lab', 'Professional Elective', 'Open Elective', 'Project Work']

  const semCreditsMap = {
    'Sem 1': 14,
    'Sem 2': 13,
    'Sem 3': 15,
    'Sem 4': 15,
    'Sem 5': 14,
    'Sem 6': 14,
    'Sem 7': 15,
    'Sem 8': 16
  }

  const filteredCurriculum = overallCurriculum.filter(course => {
    return selectedSem === 'All' || course.sem === selectedSem
  })

  return (
    <DashboardLayout
      theme={theme}
      setTheme={setTheme}
      currentUser={student}
      onBackToHome={onBackToHome}
      title={isPlacementCell ? "Placement & CoE Skill Registry" : "CSE Curriculum & Syllabi Registry"}
    >
      <div className="max-w-6xl mx-auto space-y-6 text-left p-4 sm:p-6">
        
        {/* Placement Cell Special View */}
        {isPlacementCell ? (
          <div className="space-y-6 panel-theme p-6 rounded-3xl">
            <div className="space-y-2 border-b border-theme pb-4">
              <h2 className="text-2xl sm:text-3xl font-black uppercase font-display text-theme-primary">
                Placement & Centers of Excellence (CoE) Registry
              </h2>
              <p className="text-xs font-mono text-emerald-500 font-bold">
                SECE Corporate Training, CoE Labs & Placement Drives
              </p>
            </div>

            {/* Quick AI Announcement Template Generator */}
            <div className="p-5 rounded-3xl bg-[#f05030]/10 border-2 border-[#f05030] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-[#f05030] text-white font-black text-xs">✉️</div>
                  <span className="text-xs font-black uppercase text-theme-primary font-mono tracking-wider">
                    Quick AI Announcement Template Generator
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#f05030] text-white animate-pulse">
                  Copilot Enabled
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendCustom()}
                  placeholder="Type placement drive details (e.g. 'Amazon Recruitment Drive on 20 Aug 2026')..."
                  className="flex-1 px-4 py-3 rounded-2xl bg-theme-input border-2 border-black text-xs text-theme-primary font-mono font-semibold outline-none focus:border-[#f05030]"
                />
                <button
                  onClick={handleSendCustom}
                  disabled={sendingCustom || !customMsg.trim()}
                  className="px-5 py-3 rounded-2xl bg-[#f05030] text-white font-black text-xs hover:bg-[#f37359] transition flex items-center justify-center gap-2 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingCustom ? "Generating..." : "Generate Template"}</span>
                </button>
              </div>
            </div>

            <HubsSearchHeader
              searchQuery={placementSearchQuery}
              onSearchChange={setPlacementSearchQuery}
              selectedCategory={selectedPlacementCategory}
              onCategoryChange={setSelectedPlacementCategory}
              categories={['All', 'CoE Certification', 'Corporate Drive', 'Placement Prep']}
              placeholder="Search placement drives, CoEs, companies..."
            />

            {filteredPlacements.length === 0 ? (
              <div className="p-8 text-center bg-theme-input border border-theme rounded-3xl text-xs font-mono text-theme-secondary space-y-2">
                <Rocket className="w-8 h-8 mx-auto text-[#f05030] animate-bounce" />
                <p className="font-bold text-theme-primary text-sm">No active placement drive posters published yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlacements.map((item, idx) => (
                  <PlacementCard
                    key={idx}
                    item={item}
                    idx={idx}
                    isPlacementCell={isPlacementCell}
                    loading={loading}
                    currentSelectedItem={currentSelectedItem}
                    onBroadcastDrive={handleBroadcastDrive}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Student & Faculty Curriculum View */
          <div className="space-y-6">
            {/* Header & Overview Stats Bar */}
            <CurriculumOverviewHeader
              selectedSem={selectedSem}
              onSemChange={setSelectedSem}
              semestersList={semestersList}
              semCreditsMap={semCreditsMap}
              totalCoursesCount={overallCurriculum.length}
              filteredCount={filteredCurriculum.length}
            />

            {/* AI Curriculum Copilot Bar */}
            <div className="p-5 rounded-3xl bg-theme-card border border-theme shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-[#f05030] text-white font-medium text-xs">🎓</div>
                  <span className="text-xs font-semibold uppercase text-theme-primary tracking-wider">
                    AI Curriculum & Syllabus Copilot
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#f05030]/15 text-[#f05030] border border-[#f05030]/30">
                  Ask Syllabi / Electives / Credits
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={curriculumAsk}
                  onChange={e => setCurriculumAsk(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskCurriculumCopilot()}
                  placeholder="Ask syllabus details, electives, credit requirements (e.g. 'What electives are offered in Semester 6?')..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-theme-input border border-theme text-xs text-theme-primary font-mono outline-none focus:border-[#f05030] transition"
                />
                <button
                  onClick={() => handleAskCurriculumCopilot()}
                  disabled={askingCopilot || !curriculumAsk.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-[#f05030] text-white font-semibold text-xs hover:bg-[#d93d1d] transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{askingCopilot ? "Asking..." : "Ask Copilot"}</span>
                </button>
              </div>

              {curriculumAnswer && (
                <div className="p-4 rounded-2xl bg-theme-input/60 border border-theme text-xs text-theme-primary leading-relaxed whitespace-pre-wrap mt-2">
                  <span className="font-semibold text-[#f05030]">Chitti AI Assistant: </span>
                  {curriculumAnswer}
                </div>
              )}
            </div>

            {notice && (
              <div className="p-4 rounded-2xl bg-[#ffc815]/15 border border-[#ffc815]/40 text-xs font-mono font-medium text-theme-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ffc815]" />
                <span>{notice}</span>
              </div>
            )}

            {/* Course Cards Grid */}
            {filteredCurriculum.length === 0 ? (
              <div className="p-12 text-center bg-theme-card border border-theme rounded-3xl text-xs font-mono text-theme-secondary space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-[#f05030] opacity-50" />
                <p className="font-semibold text-theme-primary text-sm">No courses found matching your selected semester.</p>
                <p className="text-theme-muted font-normal">Select another semester tab above to view courses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCurriculum.map((course, idx) => (
                  <CourseCard
                    key={`${course.code}_${idx}`}
                    course={course}
                    onViewSyllabus={(c) => setSelectedCourseForSyllabus(c)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Detailed 5-Unit Syllabus Modal */}
        <SyllabusDetailModal
          course={selectedCourseForSyllabus}
          onClose={() => setSelectedCourseForSyllabus(null)}
          onAskCopilot={(prompt) => {
            setCurriculumAsk(prompt)
            handleAskCurriculumCopilot(prompt)
          }}
        />

        {/* Shared Poster Preview and Publish Modal */}
        <PosterPreviewModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          generatedTemplate={generatedTemplate}
          isPlacementCell={isPlacementCell}
          publishing={publishing}
          copied={copied}
          onCopy={() => {
            navigator.clipboard.writeText(generatedTemplate)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          onPublishDirectly={handlePublishDirectly}
          onNavigateToMessages={() => {
            setShowTemplateModal(false)
            navigate('/hubs/messages')
          }}
        />
      </div>
    </DashboardLayout>
  )
}
