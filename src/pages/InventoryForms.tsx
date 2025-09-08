import React, { useEffect, useMemo, useState } from "react";
import SEO from "@/components/SEO";
import { AppSidebar, AppSidebarProvider } from "@/components/AppSidebar";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type InventoryFormType = "bom" | "inventory_sgd" | "inventory_usd" | "ncr" | "treatment";

const InventoryFormsPage: React.FC = () => {
  const [formType, setFormType] = useState<InventoryFormType>("bom");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 10;
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [ncrStatus, setNcrStatus] = useState<string>("all");

  // BOM form state (minimal useful fields)
  const [bom, setBom] = useState({
    manufacturing_item: "",
    manufacturing_item_description: "",
    manufacturing_item_rev: "",
    item: "",
    item_description: "",
    qty: "",
    uom: "",
  });

  // Inventory form state (shared fields)
  const [inv, setInv] = useState({
    part_number: "",
    description: "",
    rev: "",
    location: "",
    supplier: "",
    current_balance: "",
    actual_qoh: "",
    quantity_on_order: "",
    sales_order_quantity: "",
    total_cost: "",
    treatment: "",
  });

  // NCR form state (subset of qa_inspections)
  const [ncr, setNcr] = useState({
    manufacturing_item: "",
    manufacturing_item_description: "",
    rev: "",
    inspection_status: "Pending",
    inspected_by: "",
    inspection_date: "",
    quantity_received: "",
    inspection_notes: "",
  });

  // Treatment form (basic fields; sheet will map as needed)
  const [treatmentForm, setTreatmentForm] = useState({
    part_number: "",
    description: "",
    rev: "",
    treatment: "",
    supplier: "",
    location: "",
    quantity: "",
    notes: "",
  });

  const resetPagination = () => { setPage(1); };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Treatment from Google Sheets (client-side paginate/sort/filter)
        if (formType === "treatment") {
          const sheetId = "1DLvGtHU2v1m-xDKo_Jqwct0RZUziwW0FfK5OLy30R4E";
          const sheetName = encodeURIComponent("Treatment Parts");
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}`;
          const res = await fetch(url);
          const text = await res.text();
          const jsonStr = text.substring(text.indexOf("(") + 1, text.lastIndexOf(")"));
          const json = JSON.parse(jsonStr);
          const headers = (json.table.cols || []).map((c: any) => c.label || c.id);
          const dataRows = (json.table.rows || []).map((r: any) => {
            const obj: any = {};
            r.c.forEach((cell: any, idx: number) => { obj[headers[idx] || `col_${idx}`] = cell ? cell.v : null; });
            return obj;
          });
          // Filter
          let filtered = dataRows;
          if (search.trim()) {
            const s = search.toLowerCase();
            filtered = filtered.filter((row: any) => Object.values(row).some(v => String(v ?? "").toLowerCase().includes(s)));
          }
          // Sort
          if (sortField) {
            filtered = [...filtered].sort((a: any, b: any) => {
              const av = a[sortField] ?? ""; const bv = b[sortField] ?? "";
              if (av < bv) return sortDirection === "asc" ? -1 : 1;
              if (av > bv) return sortDirection === "asc" ? 1 : -1;
              return 0;
            });
          }
          // Paginate
          const start = (page - 1) * PAGE_SIZE;
          const end = start + PAGE_SIZE;
          setTotal(filtered.length);
          setRows(filtered.slice(start, end));
          return;
        }

        // Supabase-backed tables
        let table = "";
        if (formType === "inventory_sgd") table = "current_balance_sgd";
        else if (formType === "inventory_usd") table = "current_balance_usd";
        else if (formType === "bom") table = "bill_of_materials";
        else if (formType === "ncr") table = "qa_inspections";

        if (!table) { setRows([]); setTotal(0); return; }

        let query: any = supabase.from(table).select("*", { count: "exact" });

        // Search filters per type (basic across common columns)
        if (search.trim()) {
          const s = search;
          if (table === "bill_of_materials") {
            query = query.or(`manufacturing_item.ilike.%${s}%,item.ilike.%${s}%,item_description.ilike.%${s}%`);
          } else if (table.startsWith("current_balance_")) {
            query = query.or(`part_number.ilike.%${s}%,description.ilike.%${s}%,supplier.ilike.%${s}%`);
          } else if (table === "qa_inspections") {
            query = query.or(`manufacturing_item.ilike.%${s}%,manufacturing_item_description.ilike.%${s}%`);
          }
        }

        // NCR status filter
        if (table === "qa_inspections" && ncrStatus !== "all") {
          query = query.eq("inspection_status", ncrStatus);
        }

        // Sorting
        if (sortField) {
          query = query.order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });
        }

        const start = (page - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;
        const { data, error, count } = await query.range(start, end);
        if (error) throw error;
        setRows(data || []);
        setTotal(count ?? 0);
      } catch (e) {
        console.error(e);
        setRows([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [formType, page, search, sortField, sortDirection, ncrStatus]);

  const submitBOM = async () => {
    try {
      const payload = {
        manufacturing_item: bom.manufacturing_item,
        manufacturing_item_description: bom.manufacturing_item_description,
        manufacturing_item_rev: bom.manufacturing_item_rev,
        item: bom.item,
        item_description: bom.item_description,
        qty: bom.qty,
        uom: bom.uom,
      };
      const res = await fetch('https://bslunifyone.app.n8n.cloud/webhook/form_bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: "BOM entry added" });
      setBom({ manufacturing_item: "", manufacturing_item_description: "", manufacturing_item_rev: "", item: "", item_description: "", qty: "", uom: "" });
      resetPagination();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed", description: e?.message ?? "Error", variant: "destructive" });
    }
  };

  const submitInventory = async (currency: "sgd" | "usd") => {
    try {
      const path = currency === "sgd" ? 'form_invsgd' : 'form_invusd';
      const payload = {
        part_number: inv.part_number,
        description: inv.description,
        rev: inv.rev,
        location: inv.location,
        supplier: inv.supplier,
        current_balance: inv.current_balance,
        actual_qoh: inv.actual_qoh,
        quantity_on_order: inv.quantity_on_order,
        sales_order_quantity: inv.sales_order_quantity,
        total_cost: inv.total_cost,
        treatment: inv.treatment,
      };
      const res = await fetch(`https://bslunifyone.app.n8n.cloud/webhook/${path}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: `Inventory (${currency.toUpperCase()}) entry added` });
      setInv({ part_number: "", description: "", rev: "", location: "", supplier: "", current_balance: "", actual_qoh: "", quantity_on_order: "", sales_order_quantity: "", total_cost: "", treatment: "" });
      resetPagination();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed", description: e?.message ?? "Error", variant: "destructive" });
    }
  };

  const submitNCR = async () => {
    try {
      const payload = {
        manufacturing_item: ncr.manufacturing_item,
        manufacturing_item_description: ncr.manufacturing_item_description,
        rev: ncr.rev,
        inspection_status: ncr.inspection_status,
        inspected_by: ncr.inspected_by,
        inspection_date: ncr.inspection_date,
        quantity_received: ncr.quantity_received,
        inspection_notes: ncr.inspection_notes,
      };
      const res = await fetch('https://bslunifyone.app.n8n.cloud/webhook/form_ncr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: "NCR entry added" });
      setNcr({ manufacturing_item: "", manufacturing_item_description: "", rev: "", inspection_status: "Pending", inspected_by: "", inspection_date: "", quantity_received: "", inspection_notes: "" });
      resetPagination();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed", description: e?.message ?? "Error", variant: "destructive" });
    }
  };

  const submitTreatment = async () => {
    try {
      const payload = {
        part_number: treatmentForm.part_number,
        description: treatmentForm.description,
        rev: treatmentForm.rev,
        treatment: treatmentForm.treatment,
        supplier: treatmentForm.supplier,
        location: treatmentForm.location,
        quantity: treatmentForm.quantity,
        notes: treatmentForm.notes,
      };
      const res = await fetch('https://bslunifyone.app.n8n.cloud/webhook/form_treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: "Treatment entry sent" });
      setTreatmentForm({ part_number: "", description: "", rev: "", treatment: "", supplier: "", location: "", quantity: "", notes: "" });
      resetPagination();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed", description: e?.message ?? "Error", variant: "destructive" });
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <>
      <SEO title="Inventory Forms – BSL AI Dashboard" description="Add records to inventory-related tables." />
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
                    <BreadcrumbPage>Inventory Forms</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-2xl font-semibold mt-2">Inventory Forms</h1>
            </div>
          </div>

          <Card className="rounded-2xl mb-4">
            <CardHeader>
              <CardTitle>Select Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={formType} onValueChange={(v) => { setFormType(v as InventoryFormType); resetPagination(); }}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Choose form" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bom">Bill of Materials</SelectItem>
                    <SelectItem value="inventory_sgd">Inventory (SGD)</SelectItem>
                    <SelectItem value="inventory_usd">Inventory (USD)</SelectItem>
                    <SelectItem value="ncr">NCR</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                  </SelectContent>
                </Select>
                <div className="ml-auto flex gap-2 items-end">
                  <div>
                    <Label className="block text-xs text-muted-foreground mb-1">Search</Label>
                    <Input value={search} onChange={(e) => { setSearch(e.target.value); resetPagination(); }} placeholder="Search..." />
                  </div>
                  {formType === "ncr" && (
                    <div>
                      <Label className="block text-xs text-muted-foreground mb-1">Status</Label>
                      <Select value={ncrStatus} onValueChange={(v) => { setNcrStatus(v); resetPagination(); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="Pass">Pass</SelectItem>
                          <SelectItem value="Fail">Fail</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Partial Pass">Partial Pass</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {formType === "bom" && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>Bill of Materials</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Manufacturing Item</Label>
                    <Input value={bom.manufacturing_item} onChange={(e) => setBom({ ...bom, manufacturing_item: e.target.value })} />
                  </div>
                  <div>
                    <Label>Manufacturing Item Description</Label>
                    <Input value={bom.manufacturing_item_description} onChange={(e) => setBom({ ...bom, manufacturing_item_description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Manufacturing Item Rev</Label>
                    <Input value={bom.manufacturing_item_rev} onChange={(e) => setBom({ ...bom, manufacturing_item_rev: e.target.value })} />
                  </div>
                  <div>
                    <Label>Component Item</Label>
                    <Input value={bom.item} onChange={(e) => setBom({ ...bom, item: e.target.value })} />
                  </div>
                  <div>
                    <Label>Component Description</Label>
                    <Input value={bom.item_description} onChange={(e) => setBom({ ...bom, item_description: e.target.value })} />
                  </div>
                  <div>
                    <Label>Qty</Label>
                    <Input value={bom.qty} onChange={(e) => setBom({ ...bom, qty: e.target.value })} />
                  </div>
                  <div>
                    <Label>UOM</Label>
                    <Input value={bom.uom} onChange={(e) => setBom({ ...bom, uom: e.target.value })} />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={submitBOM}>Add BOM</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(formType === "inventory_sgd" || formType === "inventory_usd") && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>Inventory ({formType === "inventory_sgd" ? "SGD" : "USD"})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Part Number</Label><Input value={inv.part_number} onChange={(e) => setInv({ ...inv, part_number: e.target.value })} /></div>
                  <div><Label>Description</Label><Input value={inv.description} onChange={(e) => setInv({ ...inv, description: e.target.value })} /></div>
                  <div><Label>Rev</Label><Input value={inv.rev} onChange={(e) => setInv({ ...inv, rev: e.target.value })} /></div>
                  <div><Label>Location</Label><Input value={inv.location} onChange={(e) => setInv({ ...inv, location: e.target.value })} /></div>
                  <div><Label>Supplier</Label><Input value={inv.supplier} onChange={(e) => setInv({ ...inv, supplier: e.target.value })} /></div>
                  <div><Label>Current Balance</Label><Input type="number" value={inv.current_balance} onChange={(e) => setInv({ ...inv, current_balance: e.target.value })} /></div>
                  <div><Label>Actual QOH</Label><Input type="number" value={inv.actual_qoh} onChange={(e) => setInv({ ...inv, actual_qoh: e.target.value })} /></div>
                  <div><Label>Quantity On Order</Label><Input type="number" value={inv.quantity_on_order} onChange={(e) => setInv({ ...inv, quantity_on_order: e.target.value })} /></div>
                  <div><Label>Sales Order Quantity</Label><Input type="number" value={inv.sales_order_quantity} onChange={(e) => setInv({ ...inv, sales_order_quantity: e.target.value })} /></div>
                  <div><Label>Total Cost</Label><Input value={inv.total_cost} onChange={(e) => setInv({ ...inv, total_cost: e.target.value })} /></div>
                  <div><Label>Treatment</Label><Input value={inv.treatment} onChange={(e) => setInv({ ...inv, treatment: e.target.value })} /></div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => submitInventory(formType === "inventory_sgd" ? "sgd" : "usd")}>Add Inventory</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {formType === "ncr" && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>NCR</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Manufacturing Item</Label><Input value={ncr.manufacturing_item} onChange={(e) => setNcr({ ...ncr, manufacturing_item: e.target.value })} /></div>
                  <div><Label>Description</Label><Input value={ncr.manufacturing_item_description} onChange={(e) => setNcr({ ...ncr, manufacturing_item_description: e.target.value })} /></div>
                  <div><Label>Rev</Label><Input value={ncr.rev} onChange={(e) => setNcr({ ...ncr, rev: e.target.value })} /></div>
                  <div>
                    <Label>Status</Label>
                    <Select value={ncr.inspection_status} onValueChange={(v) => setNcr({ ...ncr, inspection_status: v })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Pass">Pass</SelectItem>
                        <SelectItem value="Fail">Fail</SelectItem>
                        <SelectItem value="Partial Pass">Partial Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Inspected By</Label><Input value={ncr.inspected_by} onChange={(e) => setNcr({ ...ncr, inspected_by: e.target.value })} /></div>
                  <div><Label>Inspection Date</Label><Input type="date" value={ncr.inspection_date} onChange={(e) => setNcr({ ...ncr, inspection_date: e.target.value })} /></div>
                  <div><Label>Quantity Received</Label><Input type="number" value={ncr.quantity_received} onChange={(e) => setNcr({ ...ncr, quantity_received: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Input value={ncr.inspection_notes} onChange={(e) => setNcr({ ...ncr, inspection_notes: e.target.value })} /></div>
                </div>
                <div className="mt-4 flex justify-end"><Button onClick={submitNCR}>Add NCR</Button></div>
              </CardContent>
            </Card>
          )}

          {formType === "treatment" && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>Treatment</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Part Number</Label><Input value={treatmentForm.part_number} onChange={(e) => setTreatmentForm({ ...treatmentForm, part_number: e.target.value })} /></div>
                  <div><Label>Description</Label><Input value={treatmentForm.description} onChange={(e) => setTreatmentForm({ ...treatmentForm, description: e.target.value })} /></div>
                  <div><Label>Rev</Label><Input value={treatmentForm.rev} onChange={(e) => setTreatmentForm({ ...treatmentForm, rev: e.target.value })} /></div>
                  <div><Label>Treatment</Label><Input value={treatmentForm.treatment} onChange={(e) => setTreatmentForm({ ...treatmentForm, treatment: e.target.value })} /></div>
                  <div><Label>Supplier</Label><Input value={treatmentForm.supplier} onChange={(e) => setTreatmentForm({ ...treatmentForm, supplier: e.target.value })} /></div>
                  <div><Label>Location</Label><Input value={treatmentForm.location} onChange={(e) => setTreatmentForm({ ...treatmentForm, location: e.target.value })} /></div>
                  <div><Label>Quantity</Label><Input type="number" value={treatmentForm.quantity} onChange={(e) => setTreatmentForm({ ...treatmentForm, quantity: e.target.value })} /></div>
                  <div className="sm:col-span-2"><Label>Notes</Label><Input value={treatmentForm.notes} onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })} /></div>
                </div>
                <div className="mt-4 flex justify-end"><Button onClick={submitTreatment}>Add Treatment</Button></div>
                <p className="text-xs text-muted-foreground mt-2">Records below load from the Treatment Parts Google Sheet.</p>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <div className="w-full sm:w-64">
                  <Label className="block text-xs text-muted-foreground mb-1">Search</Label>
                  <Input value={search} onChange={(e) => { setSearch(e.target.value); resetPagination(); }} placeholder="Search..." />
                </div>
                {formType === "ncr" && (
                  <div>
                    <Label className="block text-xs text-muted-foreground mb-1">Status</Label>
                    <Select value={ncrStatus} onValueChange={(v) => { setNcrStatus(v); resetPagination(); }}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Pass">Pass</SelectItem>
                        <SelectItem value="Fail">Fail</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Partial Pass">Partial Pass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No results.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(rows[0] || {}).slice(0, 8).map((k) => (
                          <TableHead key={k} className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort(k)}>
                            <div className="flex items-center gap-2">
                              {k}
                              {getSortIcon(k)}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={idx}>
                          {Object.entries(row).slice(0, 8).map(([k, v]) => (
                            <TableCell key={k}>{String(v ?? "—")}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div>Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))} • {total} total</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                      <Button variant="outline" size="sm" disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(total / PAGE_SIZE)), p + 1))}>Next</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AppLayout>
      </AppSidebarProvider>
    </>
  );
};

export default InventoryFormsPage;


