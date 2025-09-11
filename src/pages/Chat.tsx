import React, { useEffect, useMemo, useRef, useState } from "react";
import SEO from "@/components/SEO";
import { AppSidebar, AppSidebarProvider } from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, Copy, Plus, MessageSquare, Clock, RefreshCw } from "lucide-react";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";



// Fallback function for generating unique IDs
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments where crypto.randomUUID is not available
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Loading animation component
const LoadingDots = () => (
  <div className="flex items-end space-x-1 h-6">
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
  </div>
);

// Function to convert ASCII tables to HTML
const convertAsciiTableToHtml = (text: string): string => {
  // Check if this looks like an ASCII table (contains | and - characters in a table-like pattern)
  if (!text.includes('|') || !text.includes('-')) {
    return text;
  }

      console.log('Attempting to parse ASCII table:', text.substring(0, 200) + '...');
    console.log('Full text length:', text.length);
    console.log('Contains pipes:', text.includes('|'));
    console.log('Contains hyphens:', text.includes('-'));

  const lines = text.split('\n');
  let result = text;
  let currentIndex = 0;
  let tables: Array<{ start: number, end: number, headers: string[], rows: string[][] }> = [];

  // Find and convert all tables in the text
  while (currentIndex < lines.length) {
    let inTable = false;
    let tableStart = -1;
    let tableEnd = -1;

    // Find table boundaries - look for lines with multiple | characters
    for (let i = currentIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      const pipeCount = (line.match(/\|/g) || []).length;
      
      if (pipeCount >= 3 && line.includes('|')) {
        if (!inTable) {
          inTable = true;
          tableStart = i;
        }
      } else if (inTable && pipeCount < 3) {
        tableEnd = i;
        break;
      }
    }

    if (tableEnd === -1 && inTable) {
      tableEnd = lines.length;
    }

    if (!inTable || tableStart === -1 || tableEnd === -1) {
      console.log('No more table boundaries found');
      break;
    }

    console.log('Table boundaries found:', { tableStart, tableEnd });

    // Extract table content
    const tableLines = lines.slice(tableStart, tableEnd);
    console.log('Table lines:', tableLines);
    
    // Parse the table
    let rows: string[][] = [];
    let headers: string[] = [];
    let separatorFound = false;

    for (const line of tableLines) {
      const trimmedLine = line.trim();
      
      // Skip separator lines (lines with only |, -, and spaces)
      if (/^[|\s-]+$/.test(trimmedLine)) {
        separatorFound = true;
        console.log('Found separator line:', trimmedLine);
        continue;
      }

      if (trimmedLine.includes('|')) {
        const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        console.log('Parsed cells:', cells);
        
        if (!separatorFound) {
          // This is the header row
          headers = cells;
          console.log('Found headers:', headers);
        } else {
          // This is a data row
          if (cells.length > 0) {
            rows.push(cells);
            console.log('Added row:', cells);
          }
        }
      }
    }

    console.log('Final headers:', headers);
    console.log('Final rows:', rows);

    if (headers.length === 0 || rows.length === 0) {
      console.log('No valid headers or rows found, trying fallback parsing');
      
      // Fallback: try to parse without relying on separator lines
      const allLinesWithPipes = tableLines.filter(line => line.trim().includes('|'));
      if (allLinesWithPipes.length >= 2) {
        headers = allLinesWithPipes[0].split('|').map(cell => cell.trim()).filter(cell => cell !== '');
        rows = allLinesWithPipes.slice(1).map(line => 
          line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
        ).filter(row => row.length > 0);
        
        console.log('Fallback parsing - headers:', headers);
        console.log('Fallback parsing - rows:', rows);
      }
    }

    if (headers.length === 0 || rows.length === 0) {
      console.log('No valid headers or rows found even with fallback, moving to next potential table');
      currentIndex = tableEnd;
      continue;
    }

    // Store table data for React component
    tables.push({ start: tableStart, end: tableEnd, headers, rows });
    
    // Update currentIndex to continue looking for more tables
    currentIndex = tableEnd;
  }

  // If we found tables, create HTML tables
  if (tables.length > 0) {
    let result = '';
    let lastIndex = 0;

    tables.forEach((table, tableIndex) => {
      // Add text before table
      if (table.start > lastIndex) {
        const beforeText = lines.slice(lastIndex, table.start).join('\n');
        if (beforeText.trim()) {
          result += beforeText + '\n\n';
        }
      }

      // Add HTML table with proper horizontal scrolling
      result += '<div style="width: 100%; margin: 1rem 0; overflow: hidden; position: relative; box-sizing: border-box;" class="table-wrapper"><div style="width: 100%; overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; position: relative; box-sizing: border-box; display: block;" class="table-scroll-wrapper"><table style="width: max-content; border-collapse: collapse; font-size: 0.75rem; table-layout: auto; display: table;">';
      
      // Add header
      result += '<thead style="background-color: #f9fafb;"><tr>';
      table.headers.forEach(header => {
        result += `<th style="padding: 0.5rem; text-align: left; font-weight: 500; color: #374151; border-bottom: 1px solid #d1d5db; white-space: nowrap;">${header}</th>`;
      });
      result += '</tr></thead>';
      
      // Add body
      result += '<tbody>';
      table.rows.forEach((row, index) => {
        result += `<tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">`;
        table.headers.forEach((header, colIndex) => {
          const cellContent = row[colIndex] || '';
          result += `<td style="padding: 0.5rem; color: #111827; border-bottom: 1px solid #e5e7eb; white-space: nowrap;">${cellContent}</td>`;
        });
        result += '</tr>';
      });
      result += '</tbody></table></div></div>';

      lastIndex = table.end;
    });

    // Add remaining text after last table
    if (lastIndex < lines.length) {
      const afterText = lines.slice(lastIndex).join('\n');
      if (afterText.trim()) {
        result += '\n\n' + afterText;
      }
    }

    return result;
  }
  
  return text;
};

// Helper function to escape HTML
const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// Rich formatter: handles markdown formatting, lists, headers, bold text
const formatTextContent = (text: string): string => {
  try {
    if (!text || typeof text !== 'string') return '';
    const raw = text.trim();

    // 1) Convert ASCII tables first
    let formatted = convertAsciiTableToHtml(raw);

    // 2) Markdown headers
    formatted = formatted
      .replace(/^###\s+(.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

    // 3) Lists (ul/ol). Build by scanning lines to avoid breaking paragraphs
    const lines = formatted.split('\n');
    const out: string[] = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        out.push('<ul class="list-disc list-inside space-y-1 my-2">' + items.map(li => `<li>${li}</li>`).join('') + '</ul>');
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        out.push('<ol class="list-decimal list-inside space-y-1 my-2">' + items.map(li => `<li>${li}</li>`).join('') + '</ol>');
        continue;
      }
      out.push(line);
      i++;
    }
    formatted = out.join('\n');

    // 4) Inline styles: bold/italic/code
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

    // 5) Paragraph spacing
    formatted = formatted.replace(/\n\n+/g, '<br><br>');

    return formatted;
  } catch (error) {
    console.error('Error formatting text:', error);
    return escapeHtml(text);
  }
};

// Mocked action handlers (replace with real endpoints later)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function checkDO() { await wait(600); return { ok: true, data: [{ id: "DO-1021", status: "Ready", items: 12 }] } }
async function checkHoldingArea() { await wait(500); return { ok: true, data: [{ part: "PN-100", qty: 5, location: "Holding A" }] } }
async function checkFullTreatment() { await wait(500); return { ok: true, data: [{ item: "MI-203", stage: "Heat Treat" }] } }
async function checkFullNCR() { await wait(500); return { ok: true, data: [{ ncr: "NCR-778", severity: "High" }] } }
async function generateDO() { await wait(800); return { ok: true, link: "https://example.com/do/DO-1021.pdf" } }
async function getDODownloadLink() { await wait(500); return { ok: true, link: "https://example.com/do/latest.pdf" } }
async function parseSupplierDO(_file: File) { await wait(900); return { ok: true, summary: { supplier: "ACME", lines: 14 } } }
async function approvePO(id: string) { await wait(500); return { ok: true, id } }
async function partialPO(id: string, qty: number) { await wait(500); return { ok: true, id, qty } }
async function rejectPO(id: string) { await wait(500); return { ok: true, id } }
async function getUsdToSgdRate() { await wait(400); return { ok: true, rate: 1.34 } }

type Msg = { id: string; role: "user" | "agent"; content: React.ReactNode; ts: string };

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  file_attached?: string;
  webhook_response?: any;
  created_at: string;
}

const commandSections = [
  {
    title: "📊 Record Agent Tools",
    commands: [
      { label: "Check DO", example: "check do" },
      { label: "Check Customer Open PO", example: "check customer open po" },
      { label: "Check Supplier Open PO", example: "check supplier open po" },
      { label: "Check Holding Area", example: "check holding area" },
      { label: "Check NCR", example: "check ncr" },
      { label: "Check Treatment", example: "check treatment" },
    ],
  },
  {
    title: "🏭 Admin Functions",
    commands: [
      { label: "Generate DO", example: "generate do" },
    ],
  },
  {
    title: "💰 Account Functions",
    commands: [
      { label: "Approve PO", example: "approve po 12345" },
      { label: "Partial PO", example: "partial po 12345 qty 10" },
      { label: "Reject PO", example: "reject po 12345" },
      { label: "USD→SGD Rate", example: "get latest USD-SGD rate" },
    ],
  },
];

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Session management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessions, setShowSessions] = useState(false);
  const [showCommands, setShowCommands] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ts = () => new Date().toLocaleTimeString();

  // Fetch all chat sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        toast({ title: "Error", description: "Failed to load chat sessions", variant: "destructive" });
        return;
      }

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({ title: "Error", description: "Failed to load chat sessions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat session
  const createSession = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_sessions')
        .insert([{ title: 'New Chat' }])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        toast({ title: "Error", description: "Failed to create new chat", variant: "destructive" });
        return;
      }

      setSessions(prev => [data, ...prev]);
      setCurrentSession(data);
      setMessages([]);
      setShowSessions(false);
      toast({ title: "Success", description: "New chat created" });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({ title: "Error", description: "Failed to create new chat", variant: "destructive" });
    }
  };

  // Load messages for a specific session
  const loadSession = async (session: ChatSession) => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
        return;
      }

      // Convert database messages to display format
      const displayMessages: Msg[] = (data || []).map((msg: any) => {
        // Apply ASCII table conversion for assistant messages
        let content: React.ReactNode;
        if (msg.role === 'assistant') {
          // Convert the original text back to HTML for display
          const convertedContent = formatTextContent(msg.content);
          content = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
        } else {
          content = (
            <div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          );
        }

        return {
          id: msg.id,
          role: msg.role,
          content,
          ts: new Date(msg.created_at).toLocaleTimeString()
        };
      });

      setMessages(displayMessages);
      setCurrentSession(session);
      setShowSessions(false);
      
      // Check for any pending assistant responses that might have been missed
      const lastMessage = data && data.length > 0 ? data[data.length - 1] : null;
      if (lastMessage && lastMessage.role === 'user') {
        // If the last message is from user, check if there's a pending assistant response
        try {
          const { data: pendingData } = await (supabase as any)
            .from('chat_messages')
            .select('*')
            .eq('session_id', session.id)
            .eq('role', 'assistant')
            .gt('created_at', lastMessage.created_at)
            .order('created_at', { ascending: true })
            .limit(1);
            
          if (pendingData && pendingData.length > 0) {
            console.log('Found pending assistant response, updating UI...');
            const pendingRow = pendingData[0];
            const html = formatTextContent(String(pendingRow.content ?? ''));
            const pendingMsg: Msg = {
              id: pendingRow.id || generateId(),
              role: 'agent',
              content: <div dangerouslySetInnerHTML={{ __html: html }} />,
              ts: new Date(pendingRow.created_at || Date.now()).toLocaleTimeString(),
            };
            setMessages(prev => [...prev, pendingMsg]);
          }
        } catch (pendingError) {
          console.error('Error checking for pending messages:', pendingError);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      toast({ title: "Error", description: "Failed to load chat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Save message to database
  const saveMessage = async (sessionId: string, role: "user" | "assistant", content: string, webhookResponse?: any) => {
    try {
      const { data, error } = await (supabase as any)
        .from('chat_messages')
        .insert([{
          session_id: sessionId,
          role,
          content,
          webhook_response: webhookResponse
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      const { error } = await (supabase as any)
        .from('chat_sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating session title:', error);
        return;
      }

      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title } : null);
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const downloadInventory = async () => {
    setDownloading(true);
    try {
      const XLSX = await import('xlsx');
      const { data: sgdData, error: sgdError } = await supabase
        .from('current_balance_sgd')
        .select('*');
      if (sgdError) {
        toast({ title: "Error", description: "Failed to fetch SGD inventory data", variant: "destructive" });
        return;
      }
      const { data: usdData, error: usdError } = await supabase
        .from('current_balance_usd')
        .select('*');
      if (usdError) {
        toast({ title: "Error", description: "Failed to fetch USD inventory data", variant: "destructive" });
        return;
      }
      const workbook = XLSX.utils.book_new();
      const sgdWorksheet = XLSX.utils.json_to_sheet(sgdData || []);
      const usdWorksheet = XLSX.utils.json_to_sheet(usdData || []);
      XLSX.utils.book_append_sheet(workbook, sgdWorksheet, 'Current Balance SGD');
      XLSX.utils.book_append_sheet(workbook, usdWorksheet, 'Current Balance USD');
      const date = new Date().toISOString().split('T')[0];
      const filename = `BSL_Inventory_${date}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast({ title: "Success", description: "Inventory data downloaded successfully" });
    } catch (error) {
      console.error('Error downloading inventory:', error);
      toast({ title: "Error", description: "Failed to download inventory data", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const refreshCurrentSession = async () => {
    if (!currentSession) {
      toast({ title: "No active session", description: "Please start a new chat or select an existing one", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      // Reload the current session's messages
      await loadSession(currentSession);
      toast({ title: "Refreshed", description: "Chat session refreshed successfully" });
    } catch (error) {
      console.error('Error refreshing session:', error);
      toast({ title: "Error", description: "Failed to refresh chat session", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-scroll chat area on new messages
  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) return;
    try {
      const last = messages[messages.length - 1];
      const prev = messages[messages.length - 2];
      const bottom = el.scrollHeight - el.clientHeight;
      // If the last two messages are user then assistant, keep a small offset
      if (prev && last && prev.role === 'user' && last.role === 'agent') {
        const offset = 120; // leave some room to show the user's message above
        el.scrollTop = Math.max(0, bottom - offset);
      } else {
        // Default: scroll to bottom
        el.scrollTop = bottom;
      }
    } catch {}
  }, [messages]);

  // Subscribe to Supabase Realtime for assistant inserts in current session
  useEffect(() => {
    if (!currentSession) return;

    let channel: any;
    let reconnectTimer: NodeJS.Timeout;

    const setupChannel = () => {
      try {
        channel = (supabase as any)
          .channel(`chat_messages_session_${currentSession.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${currentSession.id}` },
            (payload: any) => {
              try {
                const row = payload.new;
                if (!row) return;
                if (row.role !== 'assistant') return;
                const html = formatTextContent(String(row.content ?? ''));
                const assistantMsg: Msg = {
                  id: row.id || generateId(),
                  role: 'agent',
                  content: <div dangerouslySetInnerHTML={{ __html: html }} />,
                  ts: new Date(row.created_at || Date.now()).toLocaleTimeString(),
                };
                // Replace the latest loading dot message if present, else append
                setMessages((prev) => {
                  const idx = prev.findIndex(m => typeof m.content === 'object' && (m.content as any)?.type === LoadingDots);
                  if (idx !== -1) {
                    const copy = [...prev];
                    copy[idx] = assistantMsg;
                    return copy;
                  }
                  return [...prev, assistantMsg];
                });
                setSending(false);
              } catch (e) {
                console.error('Realtime handler error:', e);
              }
            }
          )
          .subscribe((status: string) => {
            console.log('Realtime subscription status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('Realtime subscription established successfully');
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.log('Realtime subscription failed, will retry...');
              // Retry connection after a delay
              reconnectTimer = setTimeout(() => {
                if (currentSession) {
                  console.log('Attempting to reconnect realtime...');
                  setupChannel();
                }
              }, 2000);
            }
          });
      } catch (error) {
        console.error('Error setting up realtime channel:', error);
        // Fallback to polling if realtime setup fails
        reconnectTimer = setTimeout(() => {
          if (currentSession) {
            console.log('Retrying realtime setup...');
            setupChannel();
          }
        }, 3000);
      }
    };

    setupChannel();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { 
        if (channel) (supabase as any).removeChannel(channel); 
      } catch {}
      if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; }
    };
  }, [currentSession]);

  // Fallback polling if Realtime is unavailable
  const startAssistantPolling = (sessionId: string, sinceISO: string, loadingId: string) => {
    if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; }
    const started = Date.now();
    let pollAttempts = 0;
    const maxAttempts = 120; // 5 minutes at 2.5 second intervals
    
    const poll = async () => {
      try {
        pollAttempts++;
        const { data, error } = await (supabase as any)
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('role', 'assistant')
          .gt('created_at', sinceISO)
          .order('created_at', { ascending: true })
          .limit(1);
        
        if (!error && Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const html = formatTextContent(String(row.content ?? ''));
          const assistantMsg: Msg = {
            id: row.id || generateId(),
            role: 'agent',
            content: <div dangerouslySetInnerHTML={{ __html: html }} />,
            ts: new Date(row.created_at || Date.now()).toLocaleTimeString(),
          };
          setMessages((prev) => prev.map(m => m.id === loadingId ? assistantMsg : m));
          setSending(false);
          if (pollRef.current) { clearInterval(pollRef.current as any); pollRef.current = null; }
          console.log('Assistant response found via polling');
          return;
        }
        
        // Log polling progress for debugging
        if (pollAttempts % 10 === 0) {
          console.log(`Polling attempt ${pollAttempts}/${maxAttempts} for session ${sessionId}`);
        }
        
      } catch (e) {
        console.error('Polling error:', e);
      }
      
      // Stop after max attempts or 5 minutes
      if (pollAttempts >= maxAttempts || Date.now() - started > 5 * 60 * 1000) {
        if (pollRef.current) { 
          clearInterval(pollRef.current as any); 
          pollRef.current = null; 
        }
        console.log('Polling stopped after timeout or max attempts');
        // If polling fails completely, show error message
        setMessages((prev) => prev.map(m => 
          m.id === loadingId 
            ? { ...m, content: <p className="text-destructive">Failed to receive response. Please try again.</p> }
            : m
        ));
        setSending(false);
      }
    };
    
    pollRef.current = setInterval(poll, 2500);
    // Kick off immediately
    void poll();
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);

    // Create session if none exists
    let sessionToUse = currentSession;
    if (!sessionToUse) {
      try {
        const { data, error } = await (supabase as any)
          .from('chat_sessions')
          .insert([{ title: 'New Chat' }])
          .select()
          .single();

        if (error) {
          console.error('Error creating session:', error);
          toast({ title: "Error", description: "Failed to create chat session", variant: "destructive" });
          setSending(false);
          return;
        }

        sessionToUse = data;
        setCurrentSession(data);
        setSessions(prev => [data, ...prev]);
      } catch (error) {
        console.error('Error creating session:', error);
        toast({ title: "Error", description: "Failed to create chat session", variant: "destructive" });
        setSending(false);
        return;
      }
    }

    const userMsg: Msg = { id: generateId(), role: "user", content: (
      <div>
        <p className="whitespace-pre-wrap">{input}</p>
      </div>
    ), ts: ts() };
    setMessages((m) => [...m, userMsg]);

    // Add loading message
    const loadingMsg: Msg = { id: generateId(), role: "agent", content: (
      <div className="text-muted-foreground text-sm flex items-center gap-2">
        <span>Retrieving your information… this may take a bit</span>
        <LoadingDots />
      </div>
    ), ts: ts() };
    setMessages((m) => [...m, loadingMsg]);

    // Save user message to database
    await saveMessage(sessionToUse!.id, "user", input);

    try {
      const lower = input.toLowerCase();
      let response: React.ReactNode = <p className="text-muted-foreground">Processing your request...</p>;
      let webhookResponse: any = null;

      // Send to webhook for AI processing
      try {
        const webhookPayload = {
          action: 'send_message',
          session_id: sessionToUse!.id,
          message: input,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          current_url: window.location.href,
          context: {
            page: 'BSL QA Dashboard',
            user_type: 'QA Inspector',
            available_commands: commandSections.flatMap(section => section.commands.map(cmd => cmd.example))
          }
        };

        console.log('Sending chat webhook data:', webhookPayload);
        
        const webhookFetchResponse = await fetch('https://bslunifyone.app.n8n.cloud/webhook/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        });

        console.log('Chat webhook response status:', webhookFetchResponse.status);

        if (!webhookFetchResponse.ok) {
          const errorText = await webhookFetchResponse.text();
          console.error('Chat webhook error response:', errorText);
          throw new Error(`Webhook failed with status: ${webhookFetchResponse.status} - ${errorText}`);
        }

        const responseText = await webhookFetchResponse.text();
        console.log('Chat webhook raw response:', responseText);

        if (responseText.trim()) {
          try {
            const webhookData = JSON.parse(responseText);
            console.log('Chat webhook parsed response:', webhookData);
            webhookResponse = webhookData;
            
            // Handle different response formats from n8n
                                      if (webhookData.output) {
              // n8n returns { output: "message" }
              const convertedContent = formatTextContent(webhookData.output);
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            } else if (webhookData.message) {
              // Alternative format
              const convertedContent = formatTextContent(webhookData.message);
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            } else if (webhookData.content) {
              // Another alternative format
              const convertedContent = formatTextContent(webhookData.content);
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            } else if (webhookData.text) {
              // Another alternative format
              const convertedContent = formatTextContent(webhookData.text);
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            } else if (typeof webhookData === 'string') {
              // Direct string response
              const convertedContent = formatTextContent(webhookData);
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            } else if (webhookData.response) {
              // Response field
              const convertedContent = formatTextContent(webhookData.response);
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            } else {
              // Fallback: use the entire response as a string
              const convertedContent = formatTextContent(JSON.stringify(webhookData));
              response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
            }
            
          } catch (parseError) {
            console.error('Failed to parse webhook response as JSON:', parseError);
            response = <p className="whitespace-pre-wrap">{responseText}</p>;
            webhookResponse = { raw_response: responseText };
          }
        } else {
          console.log('Webhook returned empty response');
          response = <p className="text-muted-foreground">I received your message! The AI service is currently being configured. Please check back later for responses.</p>;
          webhookResponse = { status: 'configuring' };
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        
        // Fallback to mock responses for specific commands if webhook fails
        if (lower.includes("check do")) {
          const r = await checkDO();
          const mockResponse = r.ok ? 
            `Here are some details from the Delivery Orders (DOs) in the system:\n\n| ID | PO Number | Product Code | Ordered Date | Required Delivery Date | Ordered Quantity |\n|----|-----------|--------------|--------------|----------------------|------------------|\n| 1 | D-20266361-WB0 | WB395-2130-000-01/B | 2025-04-22 | 2025-07-25 | 1 |\n| 2 | D-20266361-WB0 | WB765-2104-000-00/B | 2025-04-22 | 2025-07-07 | 1 |\n| 3 | D-20273467-BB0 | 08088-0173-008-00/B | 2025-08-07 | 2026-02-02 | 533 |\n| 4 | D-20273467-BB0 | 08888-0031-051-00/A | 2025-08-07 | 2026-02-02 | 1217 |` :
            "Error retrieving delivery orders";
          const convertedContent = formatTextContent(mockResponse);
          response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
        } else if (lower.includes("check holding")) {
          const r = await checkHoldingArea();
          const mockResponse = `Holding Area Status:\n\n| Part | Quantity | Location | Status |\n|------|----------|----------|--------|\n| PN-100 | 5 | Holding A | Ready |\n| PN-200 | 12 | Holding B | Processing |\n| PN-300 | 3 | Holding C | Pending |`;
          const convertedContent = formatTextContent(mockResponse);
          response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
        } else if (lower.includes("check treatment")) {
          const r = await checkFullTreatment();
          const mockResponse = `Treatment Status:\n\n| Item | Stage | Duration | Status |\n|------|-------|----------|--------|\n| MI-203 | Heat Treat | 2 hours | In Progress |\n| MI-204 | Surface Finish | 1 hour | Completed |\n| MI-205 | Quality Check | 30 min | Pending |`;
          const convertedContent = formatTextContent(mockResponse);
          response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
        } else if (lower.includes("check full ncr")) {
          const r = await checkFullNCR();
          const mockResponse = `NCR (Non-Conformance Reports):\n\n| NCR ID | Severity | Description | Status |\n|--------|----------|-------------|--------|\n| NCR-778 | High | Material defect in batch | Open |\n| NCR-779 | Medium | Dimensional tolerance issue | Under Review |\n| NCR-780 | Low | Minor surface blemish | Resolved |`;
          const convertedContent = formatTextContent(mockResponse);
          response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
        } else if (lower.includes("generate do")) {
          const r = await generateDO();
          response = r.ok ? <a className="text-primary underline" href={r.link} target="_blank">Download DO</a> : "Error";
        } else if (lower.includes("download link")) {
          const r = await getDODownloadLink();
          response = r.ok ? <a className="text-primary underline" href={r.link} target="_blank">Latest DO</a> : "Error";
        } else if (lower.includes("parse supplier do")) {
          const r = await parseSupplierDO(null as any); // No file to pass
          const mockResponse = `Supplier DO Summary:\n\n| Field | Value |\n|-------|-------|\n| Supplier | ACME Corp |\n| Total Lines | 14 |\n| Total Amount | $12,450.00 |\n| Status | Processed |`;
          const convertedContent = formatTextContent(mockResponse);
          response = <div dangerouslySetInnerHTML={{ __html: convertedContent }} />;
        } else if (lower.startsWith("approve po")) {
          const id = lower.split(/\s+/).pop() || "";
          const r = await approvePO(id);
          response = <p>PO {r.id} approved.</p>;
        } else if (lower.startsWith("partial po")) {
          const match = lower.match(/partial po\s+(\S+)\s+qty\s+(\d+)/);
          if (match) {
            const r = await partialPO(match[1], Number(match[2]));
            response = <p>PO {r.id} partially approved for qty {r.qty}.</p>;
          } else {
            response = <p className="text-muted-foreground">Try: partial po 12345 qty 10</p>;
          }
        } else if (lower.startsWith("reject po")) {
          const id = lower.split(/\s+/).pop() || "";
          const r = await rejectPO(id);
          response = <p>PO {r.id} rejected.</p>;
        } else if (lower.includes("usd") && lower.includes("sgd")) {
          const r = await getUsdToSgdRate();
          response = <p>USD→SGD rate: <span className="font-medium">{r.rate}</span></p>;
        } else {
          response = <p className="text-muted-foreground">I received your message, but there was a temporary issue with the AI service. Your message has been saved and will be processed when the service is available.</p>;
        }
        webhookResponse = { error: webhookError instanceof Error ? webhookError.message : 'Unknown error' };
      }

      // Do not set assistant response here. We will wait for Supabase Realtime insert
      // from n8n and then update UI when it arrives.

      // Start fallback polling in case Realtime is unavailable
      if (sessionToUse) {
        const sinceISO = new Date().toISOString();
        // Start polling immediately as backup
        startAssistantPolling(sessionToUse.id, sinceISO, loadingMsg.id);
        console.log('Started fallback polling for session:', sessionToUse.id);
      }

      // Update session title if it's still "New Chat"
      if (sessionToUse!.title === 'New Chat') {
        const newTitle = input.length > 30 ? input.substring(0, 30) + '...' : input;
        await updateSessionTitle(sessionToUse!.id, newTitle);
      }

      // Removed success toast notification
    } catch (e: any) {
      // Replace loading message with error
      setMessages((m) => m.map(msg => 
        msg.id === loadingMsg.id 
          ? { ...msg, content: <p className="text-destructive">Failed to send message. Please try again.</p> }
          : msg
      ));
      toast({ title: "Failed", description: e?.message ?? "Something went wrong" });
          } finally {
        setInput("");
      }
  };

  const commandChips = useMemo(() => commandSections, []);

  const lastSync = useMemo(() => new Date().toLocaleString(), [messages.length]);

  return (
    <>
      <SEO title="Chat – BSL AI Dashboard" description="Command-driven chat for BSL operations." />
      <AppSidebarProvider>
        <AppSidebar />
        <AppLayout>
          <Card className="h-[calc(100vh-200px)] flex flex-col main-chat-card" style={{ maxWidth: '100vw', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
            <CardHeader className="flex-shrink-0 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-4 w-4" />
                  AI Assistant
                </CardTitle>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      if (currentSession?.id) formData.append('session_id', currentSession.id);
                      formData.append('timestamp', new Date().toISOString());
                      formData.append('current_url', window.location.href);
                      const res = await fetch('https://bslunifyone.app.n8n.cloud/webhook/upload-file', {
                        method: 'POST',
                        body: formData,
                      });
                      if (!res.ok) {
                        const t = await res.text();
                        throw new Error(t || 'Upload failed');
                      }
                      toast({ title: 'Uploaded', description: `${file.name} uploaded successfully` });
                    } catch (err: any) {
                      toast({ title: 'Upload failed', description: err?.message || 'Please try again', variant: 'destructive' });
                    } finally {
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={true}
                    title="WIP - Work in Progress"
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://docs.google.com/spreadsheets/d/1DLvGtHU2v1m-xDKo_Jqwct0RZUziwW0FfK5OLy30R4E/edit?usp=sharing', '_blank')}
                  >
                    Check Inventory
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadInventory}
                    disabled={downloading}
                  >
                    {downloading ? "Downloading..." : "Download Inventory"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCommands(!showCommands)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Commands
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSessions(!showSessions)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Previous Chats
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshCurrentSession}
                    disabled={loading || !currentSession}
                    title={currentSession ? "Refresh current chat session" : "No active session to refresh"}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createSession}
                    disabled={loading}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {currentSession && (
                <p className="text-xs text-muted-foreground">
                  Current: {currentSession.title}
                </p>
              )}
            </CardHeader>
            
            <div className={`flex flex-1 overflow-hidden ${showCommands || showSessions ? 'gap-0' : ''}`}>
              {/* Commands Sidebar */}
              {showCommands && (
                <div className="w-56 border-r bg-muted/20 p-3 overflow-y-auto flex-shrink-0">
                  <h3 className="font-medium mb-2 text-sm">Available Commands</h3>
                  <div className="space-y-3">
                    {commandSections.map((section) => (
                      <div key={section.title}>
                        <div className="text-xs font-medium mb-1">{section.title}</div>
                        <div className="space-y-1">
                          {section.commands.map((cmd) => (
                            <button
                              key={cmd.label}
                              className="w-full text-left p-1.5 rounded hover:bg-accent hover:text-accent-foreground transition-colors text-xs"
                              onClick={() => setInput(cmd.example)}
                              disabled={sending}
                            >
                              <div className="font-medium">{cmd.label}</div>
                              <div className="text-xs text-muted-foreground">{cmd.example}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sessions Sidebar */}
              {showSessions && (
                <div className="w-56 border-r bg-muted/20 p-3 overflow-y-auto flex-shrink-0">
                  <h3 className="font-medium mb-2 text-sm">Chat Sessions</h3>
                  {loading ? (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  ) : sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No previous chats</p>
                  ) : (
                    <div className="space-y-1">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-2 rounded cursor-pointer transition-colors ${
                            currentSession?.id === session.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted'
                          }`}
                          onClick={() => loadSession(session)}
                        >
                          <p className="font-medium text-xs truncate">{session.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Chat Area */}
              <div className={`flex flex-col chat-container ${!showCommands && !showSessions ? 'w-full' : 'flex-1'}`} style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}>
                <CardContent ref={chatAreaRef} className="flex-1 overflow-y-auto p-3 space-y-3 chat-area" style={{ overflowX: 'hidden', maxWidth: '100%', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start a conversation with the AI assistant</p>
                      <p className="text-xs mt-1">Use the commands sidebar to get started</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "user" ? (
                          // User message - simple bubble
                          <div
                            className="bg-primary text-primary-foreground rounded p-2 max-w-[80%]"
                            style={{ 
                              maxWidth: "80%",
                              width: "auto",
                              boxSizing: "border-box"
                            }}
                          >
                            <div>{message.content}</div>
                            <div className="text-xs opacity-70 mt-1">{message.ts}</div>
                          </div>
                        ) : (
                          // AI message - card with independent scrolling
                          <Card className="w-full message-card" style={{ maxWidth: '100%', overflow: 'hidden', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                            <CardContent className="p-3" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', minWidth: 0, boxSizing: 'border-box' }}>
                              <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', minWidth: 0, boxSizing: 'border-box', position: 'relative' }}>
                                {message.content}
                              </div>
                              <div className="text-xs text-muted-foreground mt-2">{message.ts}</div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>

                <div className="p-3 flex items-center gap-2 border-t">
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      placeholder='Type a command… e.g., "check do"'
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      aria-label="Chat input"
                      disabled={sending}
                      className="h-8"
                    />
                  </div>
                  <Button onClick={handleSend} disabled={sending} aria-label="Send message" size="sm" className="h-8">
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </AppLayout>
      </AppSidebarProvider>
    </>
  );
};

export default ChatPage;

