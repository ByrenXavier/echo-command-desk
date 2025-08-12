import React, { useEffect, useMemo, useRef, useState } from "react";
import SEO from "@/components/SEO";
import { AppSidebar, AppSidebarProvider } from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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

const commandSections = [
  {
    title: "📊 Record Agent Tools",
    commands: [
      { label: "Check DO", example: "check do" },
      { label: "Check Holding Area", example: "check holding area" },
      { label: "Check Full Treatment", example: "check full treatment" },
      { label: "Check Full NCR", example: "check full ncr" },
    ],
  },
  {
    title: "🏭 Admin Functions",
    commands: [
      { label: "Generate DO", example: "generate do" },
      { label: "DO Download Link", example: "do download link" },
      { label: "Parse Supplier DO", example: "parse supplier do" },
    ],
  },
  {
    title: "💰 Account Functions",
    commands: [
      { label: "Approve PO", example: "approve po 12345" },
      { label: "Partial PO", example: "partial po 12345 qty 10" },
      { label: "Reject PO", example: "reject po 12345" },
      { label: "USD→SGD Rate", example: "usd to sgd rate" },
    ],
  },
];

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ts = () => new Date().toLocaleTimeString();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSend = async () => {
    if (!input.trim() && !file) return;
    setSending(true);

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: (
      <div>
        <p className="whitespace-pre-wrap">{input}</p>
        {file && <p className="text-xs text-muted-foreground mt-1">Attached: {file.name}</p>}
      </div>
    ), ts: ts() };
    setMessages((m) => [...m, userMsg]);

    try {
      const lower = input.toLowerCase();
      let response: React.ReactNode = <p className="text-muted-foreground">No handler yet.</p>;

      if (lower.includes("check do")) {
        const r = await checkDO();
        response = r.ok ? (
          <div>
            <p className="font-medium mb-2">Delivery Orders</p>
            <pre className="text-xs p-3 rounded-md bg-muted/40 overflow-auto">{JSON.stringify(r.data, null, 2)}</pre>
          </div>
        ) : "Error";
      } else if (lower.includes("check holding")) {
        const r = await checkHoldingArea();
        response = <pre className="text-xs p-3 rounded-md bg-muted/40 overflow-auto">{JSON.stringify(r.data, null, 2)}</pre>;
      } else if (lower.includes("check full treatment")) {
        const r = await checkFullTreatment();
        response = <pre className="text-xs p-3 rounded-md bg-muted/40 overflow-auto">{JSON.stringify(r.data, null, 2)}</pre>;
      } else if (lower.includes("check full ncr")) {
        const r = await checkFullNCR();
        response = <pre className="text-xs p-3 rounded-md bg-muted/40 overflow-auto">{JSON.stringify(r.data, null, 2)}</pre>;
      } else if (lower.includes("generate do")) {
        const r = await generateDO();
        response = r.ok ? <a className="text-primary underline" href={r.link} target="_blank">Download DO</a> : "Error";
      } else if (lower.includes("download link")) {
        const r = await getDODownloadLink();
        response = r.ok ? <a className="text-primary underline" href={r.link} target="_blank">Latest DO</a> : "Error";
      } else if (lower.includes("parse supplier do")) {
        if (!file) {
          response = <p className="text-destructive">Please attach a PDF first.</p>;
        } else {
          const r = await parseSupplierDO(file);
          response = <pre className="text-xs p-3 rounded-md bg-muted/40 overflow-auto">{JSON.stringify(r.summary, null, 2)}</pre>;
        }
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
      }

      const agentMsg: Msg = { id: crypto.randomUUID(), role: "agent", content: response, ts: ts() };
      setMessages((m) => [...m, agentMsg]);
      toast({ title: "Action completed", description: "Mock response shown." });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message ?? "Something went wrong" });
    } finally {
      setSending(false);
      setInput("");
      setFile(null);
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Chat</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-2xl font-semibold mt-2">Chat</h1>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              <span>Last sync: {lastSync}</span>
              <Button variant="outline" size="sm" onClick={() => toast({ title: "Synced", description: "Data refreshed." })}>Refresh</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 rounded-2xl">
              <CardHeader>
                <CardTitle>Available Commands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {commandChips.map((section) => (
                    <div key={section.title}>
                      <div className="text-sm font-medium mb-2">{section.title}</div>
                      <div className="flex flex-wrap gap-2">
                        {section.commands.map((cmd) => (
                          <button
                            key={cmd.label}
                            className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setInput(cmd.example)}
                            aria-label={`Prefill: ${cmd.example}`}
                          >
                            {cmd.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 rounded-2xl">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[60vh] overflow-auto pr-2">
                  {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground">Type a command… e.g., "check do"</div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                      <div className={`inline-flex max-w-[80%] items-start gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`rounded-2xl px-3 py-2 border ${m.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40"}`}>
                          {m.content}
                        </div>
                        <div className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground">
                          <span>{m.ts}</span>
                          <button
                            className="underline flex items-center gap-1"
                            onClick={() => {
                              const text = typeof m.content === "string" ? m.content : (m as any).content?.props?.children ?? "";
                              navigator.clipboard.writeText(typeof text === "string" ? text : "");
                              toast({ title: "Copied" });
                            }}
                            aria-label="Copy message"
                          >
                            <Copy className="h-3 w-3" /> Copy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
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
                    />
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-muted-foreground px-2 py-2 rounded-md hover:bg-accent">
                    <Paperclip className="h-4 w-4" />
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <Button onClick={handleSend} disabled={sending} aria-label="Send message">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </AppSidebarProvider>
    </>
  );
};

export default ChatPage;
