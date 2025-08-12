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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface QAInspection {
  qa_id: number;
  manufacturing_item: string | null;
  manufacturing_item_description: string | null;
  rev: string | null;
  inspection_status: string | null;
  inspected_by?: string | null;
  inspection_date?: string | null;
  created_at?: string | null;
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

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from("qa_inspections").select("qa_id, manufacturing_item, manufacturing_item_description, rev, inspection_status, inspected_by, inspection_date, created_at", { count: "exact" })
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
    const headers = ["manufacturing_item","manufacturing_item_description","rev","inspection_status","inspected_by","inspection_date"];
    const rows = data.map((r) => [r.manufacturing_item ?? "", r.manufacturing_item_description ?? "", r.rev ?? "", r.inspection_status ?? "", r.inspected_by ?? "", r.inspection_date ?? ""]); 
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
  const handleReject = (id: number) => {
    toast({ title: "Rejected", description: `QA #${id} marked as rejected.` });
  };
  const handlePartial = (id: number) => {
    toast({ title: "Partially accepted", description: `QA #${id} marked as partially accepted.` });
  };
  const handleAccept = (id: number) => {
    toast({ title: "Accepted", description: `QA #${id} accepted in full.` });
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
                        <TableHead>Status</TableHead>
                        <TableHead>Inspector</TableHead>
                        <TableHead>Inspected At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">No results</TableCell>
                        </TableRow>
                      ) : (
                        data.map((row) => (
                          <TableRow key={row.qa_id}>
                            <TableCell>{row.manufacturing_item}</TableCell>
                            <TableCell>{row.manufacturing_item_description}</TableCell>
                            <TableCell>{row.rev}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs border ${row.inspection_status === 'Pass' ? 'bg-green-100/60 text-green-700 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-800' : row.inspection_status === 'Fail' ? 'bg-red-100/60 text-red-700 border-red-200 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800' : 'bg-yellow-100/60 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-800'}`}>
                                {row.inspection_status || '—'}
                              </span>
                            </TableCell>
                            <TableCell>{row.inspected_by || '—'}</TableCell>
                            <TableCell>{row.inspection_date ? new Date(row.inspection_date).toLocaleDateString() : '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="destructive" size="sm" onClick={() => handleReject(row.qa_id)} aria-label={`Reject QA ${row.qa_id}`}>Reject</Button>
                                <Button variant="secondary" size="sm" onClick={() => handlePartial(row.qa_id)} aria-label={`Partially accept QA ${row.qa_id}`}>Partially accept</Button>
                                <Button size="sm" onClick={() => handleAccept(row.qa_id)} aria-label={`Accept all for QA ${row.qa_id}`}>Accept all</Button>
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
    </>
  );
};

export default QAPage;
