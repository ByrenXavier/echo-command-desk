import React, { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { AppSidebar, AppSidebarProvider } from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Eye } from "lucide-react";

interface QAInspection {
  qa_id: number;
  manufacturing_item: string | null;
  manufacturing_item_description: string | null;
  rev: string | null;
  inspection_status: string | null;
  inspected_by?: string | null;
  inspection_date?: string | null;
  created_at?: string | null;
  quantity_received?: number | null;
  quantity_passed?: number | null;
  quantity_failed?: number | null;
  inspection_notes?: string | null;
}

const PAGE_SIZE = 10;

const QAPage: React.FC = () => {
  const [data, setData] = useState<QAInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleString());
  
  // Partial accept modal state
  const [showPartialAcceptModal, setShowPartialAcceptModal] = useState(false);
  const [selectedQAId, setSelectedQAId] = useState<number | null>(null);
  const [partialAcceptData, setPartialAcceptData] = useState({
    type: "",
    qty: ""
  });

  // Notes modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedQAIdForNotes, setSelectedQAIdForNotes] = useState<number | null>(null);
  const [notesData, setNotesData] = useState<QAInspection | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");

  // Add Part modal state
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [addPartData, setAddPartData] = useState({
    manufacturing_item: "",
    manufacturing_item_description: "",
    rev: "",
    quantity_received: "",
    inspection_status: "Pending",
    inspection_notes: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from("qa_inspections").select("qa_id, manufacturing_item, manufacturing_item_description, rev, inspection_status, inspected_by, inspection_date, created_at, quantity_received, quantity_passed, quantity_failed, inspection_notes", { count: "exact" })
        .order("inspection_date", { ascending: false, nullsFirst: false });

      if (search.trim()) {
        // Simple OR search across manufacturing_item and description
        query = query.or(`manufacturing_item.ilike.%${search}%,manufacturing_item_description.ilike.%${search}%`);
      }
      if (status !== "all") {
        query = query.eq("inspection_status", status);
      }
      if (from) {
        query = query.gte("inspection_date", from);
      }
      if (to) {
        query = query.lte("inspection_date", to);
      }

      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      const { data, error, count } = await query.range(start, end);
      if (error) throw error;
      setData(data as QAInspection[]);
      setTotal(count ?? 0);
      setLastSync(new Date().toLocaleString());
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to load QA", description: e?.message ?? "Error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportCSV = () => {
    const headers = ["manufacturing_item","manufacturing_item_description","rev","inspection_status","quantity_received","quantity_passed","quantity_failed","inspected_by","inspection_date"];
    const rows = data.map((r) => [r.manufacturing_item ?? "", r.manufacturing_item_description ?? "", r.rev ?? "", r.inspection_status ?? "", r.quantity_received ?? "", r.quantity_passed ?? "", r.quantity_failed ?? "", r.inspected_by ?? "", r.inspection_date ?? ""]); 
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qa_inspections_page_${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Row action handlers (mock)
  const handleReject = async (id: number) => {
    try {
      // Find the QA inspection data
      const qaInspection = data.find(item => item.qa_id === id);
      if (!qaInspection) {
        toast({ title: "Error", description: "QA inspection not found", variant: "destructive" });
        return;
      }

      // Prepare data for webhook
      const webhookData = {
        action: 'qa_reject',
        qa_inspection: {
          qa_id: id,
          part_number: qaInspection.manufacturing_item,
          manufacturing_item_description: qaInspection.manufacturing_item_description,
          rev: qaInspection.rev,
          inspection_status: 'Rejected',
          inspected_by: qaInspection.inspected_by,
          inspection_date: qaInspection.inspection_date,
          created_at: qaInspection.created_at
        },
        rejection_details: {
          rejected_by: 'QA Inspector',
          rejection_reason: 'Quality standards not met',
          rejection_date: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user_agent: navigator.userAgent,
        current_url: window.location.href
      };

      // Send data to webhook
      console.log('Sending QA reject webhook data:', webhookData);
      
      const webhookResponse = await fetch('https://bslunifyone.app.n8n.cloud/webhook/qa_reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      console.log('QA reject webhook response status:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('QA reject webhook error response:', errorText);
        throw new Error(`Webhook failed with status: ${webhookResponse.status} - ${errorText}`);
      }

      toast({ title: "Rejected", description: `QA #${id} marked as rejected.` });
      
      // Refresh the data to show updated status
      setTimeout(() => {
        fetchData();
      }, 1500);
    } catch (error) {
      console.error('Error rejecting QA inspection:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to webhook. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ title: 'Failed to reject QA inspection', description: errorMessage, variant: 'destructive' });
    }
  };

  const handlePartial = async (id: number) => {
    setSelectedQAId(id);
    setPartialAcceptData({ type: "", qty: "" });
    setShowPartialAcceptModal(true);
  };

  const handlePartialAcceptSubmit = async () => {
    if (!selectedQAId || !partialAcceptData.type || !partialAcceptData.qty) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    try {
      // Find the QA inspection data
      const qaInspection = data.find(item => item.qa_id === selectedQAId);
      if (!qaInspection) {
        toast({ title: "Error", description: "QA inspection not found", variant: "destructive" });
        return;
      }

      // Prepare data for webhook
      const webhookData = {
        action: 'qa_partial_accept',
        qa_inspection: {
          qa_id: selectedQAId,
          part_number: qaInspection.manufacturing_item,
          manufacturing_item_description: qaInspection.manufacturing_item_description,
          rev: qaInspection.rev,
          inspection_status: 'Partially Accepted',
          inspected_by: qaInspection.inspected_by,
          inspection_date: qaInspection.inspection_date,
          created_at: qaInspection.created_at
        },
        partial_acceptance_details: {
          accepted_by: 'QA Inspector',
          acceptance_notes: 'Some quality criteria met, others need improvement',
          acceptance_date: new Date().toISOString(),
          partial_reason: 'Minor issues identified but overall acceptable',
          type: partialAcceptData.type,
          quantity: parseInt(partialAcceptData.qty)
        },
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user_agent: navigator.userAgent,
        current_url: window.location.href
      };

      // Send data to webhook
      console.log('Sending QA partial accept webhook data:', webhookData);
      
      const webhookResponse = await fetch('https://bslunifyone.app.n8n.cloud/webhook/qa_partialaccept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      console.log('QA partial accept webhook response status:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('QA partial accept webhook error response:', errorText);
        throw new Error(`Webhook failed with status: ${webhookResponse.status} - ${errorText}`);
      }

      toast({ title: "Partially accepted", description: `QA #${selectedQAId} marked as partially accepted.` });
      
      // Close modal and reset form
      setShowPartialAcceptModal(false);
      setSelectedQAId(null);
      setPartialAcceptData({ type: "", qty: "" });
      
      // Refresh the data to show updated status
      setTimeout(() => {
        fetchData();
      }, 1500);
    } catch (error) {
      console.error('Error partially accepting QA inspection:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to webhook. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ title: 'Failed to partially accept QA inspection', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleAccept = async (id: number) => {
    try {
      // Find the QA inspection data
      const qaInspection = data.find(item => item.qa_id === id);
      if (!qaInspection) {
        toast({ title: "Error", description: "QA inspection not found", variant: "destructive" });
        return;
      }

      // Prepare data for webhook
      const webhookData = {
        action: 'qa_accept',
        qa_inspection: {
          qa_id: id,
          part_number: qaInspection.manufacturing_item,
          manufacturing_item_description: qaInspection.manufacturing_item_description,
          rev: qaInspection.rev,
          inspection_status: 'Accepted',
          inspected_by: qaInspection.inspected_by,
          inspection_date: qaInspection.inspection_date,
          created_at: qaInspection.created_at
        },
        acceptance_details: {
          accepted_by: 'QA Inspector',
          acceptance_notes: 'All quality criteria met',
          acceptance_date: new Date().toISOString(),
          quality_score: '100%',
          compliance_status: 'Fully compliant'
        },
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user_agent: navigator.userAgent,
        current_url: window.location.href
      };

      // Send data to webhook
      console.log('Sending QA accept webhook data:', webhookData);
      
      const webhookResponse = await fetch('https://bslunifyone.app.n8n.cloud/webhook/qa_accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      console.log('QA accept webhook response status:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('QA accept webhook error response:', errorText);
        throw new Error(`Webhook failed with status: ${webhookResponse.status} - ${errorText}`);
      }

      toast({ title: "Accepted", description: `QA #${id} accepted in full.` });
      
      // Refresh the data to show updated status
      setTimeout(() => {
        fetchData();
      }, 1500);
    } catch (error) {
      console.error('Error accepting QA inspection:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error: Unable to connect to webhook. Please check your internet connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({ title: 'Failed to accept QA inspection', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleViewNotes = (id: number) => {
    const qaInspection = data.find(item => item.qa_id === id);
    if (qaInspection) {
      setNotesData(qaInspection);
      setSelectedQAIdForNotes(id);
      setEditedNotes(qaInspection.inspection_notes || "");
      setIsEditingNotes(false);
      setShowNotesModal(true);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedQAIdForNotes) return;

    try {
      const { error } = await supabase
        .from('qa_inspections')
        .update({ 
          inspection_notes: editedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('qa_id', selectedQAIdForNotes);

      if (error) {
        throw error;
      }

      // Update local data
      setData(prevData => 
        prevData.map(item => 
          item.qa_id === selectedQAIdForNotes 
            ? { ...item, inspection_notes: editedNotes }
            : item
        )
      );

      // Update notesData
      setNotesData(prev => prev ? { ...prev, inspection_notes: editedNotes } : null);

      setIsEditingNotes(false);
      toast({ title: "Success", description: "Notes updated successfully" });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({ title: "Error", description: "Failed to save notes", variant: "destructive" });
    }
  };

  const handleCancelEdit = () => {
    setEditedNotes(notesData?.inspection_notes || "");
    setIsEditingNotes(false);
  };

  const handleAddPart = async () => {
    // Validate required fields
    if (!addPartData.manufacturing_item.trim()) {
      toast({ title: "Error", description: "Manufacturing item is required", variant: "destructive" });
      return;
    }

    try {
      const newQAInspection = {
        manufacturing_item: addPartData.manufacturing_item.trim(),
        manufacturing_item_description: addPartData.manufacturing_item_description.trim() || null,
        rev: addPartData.rev.trim() || null,
        quantity_received: addPartData.quantity_received ? parseInt(addPartData.quantity_received) : null,
        inspection_status: addPartData.inspection_status,
        inspection_notes: addPartData.inspection_notes.trim() || null,
        received_date: new Date().toISOString().split('T')[0], // Today's date
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('qa_inspections')
        .insert([newQAInspection])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Reset form
      setAddPartData({
        manufacturing_item: "",
        manufacturing_item_description: "",
        rev: "",
        quantity_received: "",
        inspection_status: "Pending",
        inspection_notes: ""
      });

      // Close modal
      setShowAddPartModal(false);

      // Refresh data
      await fetchData();

      toast({ title: "Success", description: "QA inspection added successfully" });
    } catch (error) {
      console.error('Error adding QA inspection:', error);
      toast({ title: "Error", description: "Failed to add QA inspection", variant: "destructive" });
    }
  };

  const resetAddPartForm = () => {
    setAddPartData({
      manufacturing_item: "",
      manufacturing_item_description: "",
      rev: "",
      quantity_received: "",
      inspection_status: "Pending",
      inspection_notes: ""
    });
  };

  const statusToClass = (status: string | null | undefined) => {
    const s = (status || '').toLowerCase();
    if (s === 'pass' || s === 'passed') return 'qa-pill qa-pill--pass';
    if (s === 'fail' || s === 'failed') return 'qa-pill qa-pill--fail';
    if (s === 'partial pass' || s === 'partial' || s === 'partially accepted') return 'qa-pill qa-pill--partial';
    if (s === 'pending') return 'qa-pill qa-pill--pending';
    return 'qa-pill qa-pill--pending';
  };

  return (
    <>
      <SEO title="QA Inspections – BSL AI Dashboard" description="QA inspections table with search, filters, pagination." />
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
                    <BreadcrumbPage>QA</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-2xl font-semibold mt-2">QA Inspections</h1>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              <span>Last sync: {lastSync}</span>
              <Button variant="outline" size="sm" onClick={fetchData}>Refresh</Button>
              <Button variant="default" size="sm" onClick={() => setShowAddPartModal(true)}>Add Part</Button>
            </div>
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4 items-end">
                <div className="w-full sm:w-64">
                  <label className="block text-xs text-muted-foreground mb-1">Search</label>
                  <Input placeholder="Item or description" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">From</label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">To</label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="secondary" onClick={() => { setPage(1); fetchData(); }}>Apply</Button>
                  <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Manufacturing Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Rev</TableHead>
                        <TableHead>Quantity Received</TableHead>
                        <TableHead>Quantity Passed</TableHead>
                        <TableHead>Quantity Failed</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead>Inspected At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground">No results</TableCell>
                        </TableRow>
                      ) : (
                        data.map((row) => (
                          <TableRow key={row.qa_id}>
                            <TableCell>{row.manufacturing_item}</TableCell>
                            <TableCell>{row.manufacturing_item_description}</TableCell>
                            <TableCell>{row.rev}</TableCell>
                            <TableCell>{row.quantity_received || '—'}</TableCell>
                            <TableCell>{row.quantity_passed || '—'}</TableCell>
                            <TableCell>{row.quantity_failed || '—'}</TableCell>
                            <TableCell>{row.inspected_by || '—'}</TableCell>
                            <TableCell>{row.inspection_date ? new Date(row.inspection_date).toLocaleDateString() : '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="qa-btn qa-btn--reject" onClick={() => handleReject(row.qa_id)} aria-label={`Reject QA ${row.qa_id}`}>Reject</Button>
                                <Button variant="ghost" size="sm" className="qa-btn qa-btn--partial" onClick={() => handlePartial(row.qa_id)} aria-label={`Partially accept QA ${row.qa_id}`}>
                                  <span className="text-xs leading-tight">Partially<br />accept</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="qa-btn qa-btn--accept" onClick={() => handleAccept(row.qa_id)} aria-label={`Accept all for QA ${row.qa_id}`}>Accept all</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleViewNotes(row.qa_id)} aria-label={`View notes for QA ${row.qa_id}`}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div>
                      Page {page} of {totalPages} • {total} total
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </AppLayout>
      </AppSidebarProvider>

      <Dialog open={showPartialAcceptModal} onOpenChange={setShowPartialAcceptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partially Accept QA Inspection</DialogTitle>
            <DialogDescription>
              Mark this QA inspection as partially accepted. Please provide details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={partialAcceptData.type} onValueChange={(value) => setPartialAcceptData({ ...partialAcceptData, type: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NCR">NCR</SelectItem>
                  <SelectItem value="Treatment">Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="qty" className="text-right">
                Quantity
              </Label>
              <Input
                id="qty"
                type="number"
                value={partialAcceptData.qty}
                onChange={(e) => setPartialAcceptData({ ...partialAcceptData, qty: e.target.value })}
                className="col-span-3"
                placeholder="Enter quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPartialAcceptModal(false)}>Cancel</Button>
            <Button onClick={handlePartialAcceptSubmit}>Partially Accept</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notes for QA Inspection #{selectedQAIdForNotes}</DialogTitle>
            <DialogDescription>
              View and edit inspection notes for this QA inspection.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                <FileText className="h-4 w-4 mr-2 inline-block" />
                Inspection Notes:
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNotes(!isEditingNotes)}
              >
                {isEditingNotes ? 'View' : 'Edit'}
              </Button>
            </div>
            
            {isEditingNotes ? (
              <div>
                <textarea
                  className="w-full p-3 border rounded-md text-sm min-h-[120px] resize-y"
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Enter inspection notes..."
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  <Button onClick={handleSaveNotes}>Save</Button>
                </div>
              </div>
            ) : (
              <div className="p-3 border rounded-md bg-muted/20 min-h-[120px]">
                <p className="text-sm whitespace-pre-wrap">
                  {notesData?.inspection_notes || 'No notes available for this inspection.'}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotesModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Part Modal */}
      <Dialog open={showAddPartModal} onOpenChange={(open) => {
        setShowAddPartModal(open);
        if (!open) resetAddPartForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New QA Inspection</DialogTitle>
            <DialogDescription>
              Add a new part for QA inspection. Fill in the required details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manufacturing_item" className="text-right">
                Manufacturing Item *
              </Label>
              <Input
                id="manufacturing_item"
                value={addPartData.manufacturing_item}
                onChange={(e) => setAddPartData({ ...addPartData, manufacturing_item: e.target.value })}
                className="col-span-3"
                placeholder="Enter manufacturing item number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={addPartData.manufacturing_item_description}
                onChange={(e) => setAddPartData({ ...addPartData, manufacturing_item_description: e.target.value })}
                className="col-span-3"
                placeholder="Enter item description"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rev" className="text-right">
                Revision
              </Label>
              <Input
                id="rev"
                value={addPartData.rev}
                onChange={(e) => setAddPartData({ ...addPartData, rev: e.target.value })}
                className="col-span-3"
                placeholder="Enter revision number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity Received
              </Label>
              <Input
                id="quantity"
                type="number"
                value={addPartData.quantity_received}
                onChange={(e) => setAddPartData({ ...addPartData, quantity_received: e.target.value })}
                className="col-span-3"
                placeholder="Enter quantity received"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={addPartData.inspection_status} onValueChange={(value) => setAddPartData({ ...addPartData, inspection_status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Pass">Pass</SelectItem>
                  <SelectItem value="Fail">Fail</SelectItem>
                  <SelectItem value="Partial Pass">Partial Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <textarea
                id="notes"
                value={addPartData.inspection_notes}
                onChange={(e) => setAddPartData({ ...addPartData, inspection_notes: e.target.value })}
                className="col-span-3 p-3 border rounded-md text-sm min-h-[100px] resize-y"
                placeholder="Enter inspection notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddPartModal(false);
              resetAddPartForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddPart}>Add QA Inspection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QAPage;
