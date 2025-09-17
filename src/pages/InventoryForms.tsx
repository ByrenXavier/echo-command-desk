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
import { ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
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
  const [showForm, setShowForm] = useState(false);

  // BOM form state (all fields from bill_of_materials)
  const [bom, setBom] = useState({
    ax_item_number: "",
    bb_item_number: "",
    bom_level: "",
    bom_text1: "",
    bom_text2: "",
    bom_text3: "",
    bom_text4: "",
    bom_text5: "",
    buyer: "",
    country_of_origin: "",
    effectivity_date: "",
    expiry_date: "",
    final_position: "",
    gold_cm: "",
    halogen_free: "",
    hardware_selection: "",
    hts_code: "",
    id_dispo: "",
    item: "",
    item_description: "",
    item_spool: "",
    item_status: "",
    item_text_1: "",
    item_type: "",
    jde_item_number: "",
    kns_ref_pn_eu_rohs: "",
    manufacturer_eu_rohs_status: "",
    manufacturer_family: "",
    manufacturer_name: "",
    manufacturer_name_2: "",
    manufacturer_part_number: "",
    manufacturer_part_number_2: "",
    manufacturing_item: "",
    manufacturing_item_description: "",
    manufacturing_item_rev: "",
    mpn_status: "",
    oe_item_number: "",
    op_seq: "",
    po_commodity_code: "",
    pos: "",
    qty: "",
    rev: "",
    rohs: "",
    seq: "",
    show_exploded: "",
    source: "",
    status_eu_rohs: "",
    tantalum_cm: "",
    tin_cm: "",
    tungsten_cm: "",
    uom: "",
    validation_status: "",
  });

  // Inventory form state (all fields from current_balance_sgd/usd)
  const [inv, setInv] = useState({
    part_number: "",
    description: "",
    rev: "",
    location: "",
    supplier: "",
    current_balance: "",
    actual_qoh: "",
    extra_qty_no_value: "",
    quantity_on_order: "",
    replacement_to_customer: "",
    risk_stock_value: "",
    sales_order_quantity: "",
    shortage_extra: "",
    supplier_replacement: "",
    total_cost: "",
    treatment: "",
  });

  // NCR form state (all fields from qa_inspections)
  const [ncr, setNcr] = useState({
    qa_id: "",
    manufacturing_item: "",
    manufacturing_item_description: "",
    rev: "",
    inspection_status: "Pending",
    inspected_by: "",
    inspection_date: "",
    created_at: "",
    quantity_received: "",
    quantity_passed: "",
    quantity_failed: "",
    inspection_notes: "",
  });

  // Treatment form (basic fields; sheet will map as needed)
  // Treatment form state (dynamic based on Google Sheet columns)
  const [treatmentForm, setTreatmentForm] = useState<any>({});
  const [treatmentHeaders, setTreatmentHeaders] = useState<string[]>([]);

  // Define column order for each table (based on Supabase schema order)
  const getColumnOrder = (tableName: string): string[] => {
    switch (tableName) {
      case "bill_of_materials":
        return [
          "id", "manufacturing_item", "manufacturing_item_description", "bom_level", "pos", "op_seq", "item", "rev",
          "oe_item_number", "bb_item_number", "buyer", "hardware_selection", "jde_item_number", "ax_item_number",
          "item_description", "qty", "uom", "effectivity_date", "expiry_date", "item_type", "item_status", "id_dispo",
          "po_commodity_code", "item_spool", "bom_text1", "bom_text2", "bom_text3", "bom_text4", "bom_text5", "item_text_1",
          "manufacturer_name", "manufacturer_part_number", "manufacturer_eu_rohs_status", "manufacturer_family", "hts_code",
          "country_of_origin", "rohs", "validation_status", "final_position", "seq", "show_exploded", "status_eu_rohs",
          "kns_ref_pn_eu_rohs", "tantalum_cm", "gold_cm", "tin_cm", "tungsten_cm", "halogen_free", "source", "mpn_status",
          "manufacturing_item_rev", "manufacturer_name_2", "manufacturer_part_number_2"
        ];
      case "current_balance_sgd":
      case "current_balance_usd":
        return [
          "id", "part_number", "description", "rev", "location", "supplier", "quantity_on_order", "sales_order_quantity",
          "supplier_replacement", "replacement_to_customer", "treatment", "extra_qty_no_value", "shortage_extra",
          "current_balance", "actual_qoh", "total_cost", "risk_stock_value"
        ];
      case "qa_inspections":
        return [
          "qa_id", "manufacturing_item", "manufacturing_item_description", "rev", "received_date", "inspected_by",
          "inspection_date", "inspection_status", "inspection_notes", "quantity_received", "quantity_passed",
          "quantity_failed", "corrective_action", "created_at", "updated_at"
        ];
      default:
        return [];
    }
  };

  const resetPagination = () => { setPage(1); };

  const changePage = (newPage: number) => {
    // Store current scroll position
    const currentScrollY = window.scrollY;
    setPage(newPage);
    
    // Restore scroll position after a brief delay to allow for re-render
    setTimeout(() => {
      window.scrollTo(0, currentScrollY);
    }, 100);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Treatment from Google Sheets (client-side paginate/sort/filter)
        if (formType === "treatment") {
          const sheetId = "1DLvGtHU2v1m-xDKo_Jqwct0RZUziwW0FfK5OLy30R4E";
          const sheetName = encodeURIComponent("Treatment Parts");
          const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tqx=out:json`;
          const res = await fetch(url);
          const text = await res.text();
          const jsonStr = text.substring(text.indexOf("(") + 1, text.lastIndexOf(")"));
          const json = JSON.parse(jsonStr);
          
          console.log('Treatment sheet data:', json);
          
          const headers = (json.table.cols || []).map((c: any) => c.label || c.id || `Column_${c.id}`);
          const dataRows = (json.table.rows || []).map((r: any) => {
            const obj: any = {};
            if (r.c) {
              r.c.forEach((cell: any, idx: number) => { 
                const headerName = headers[idx] || `col_${idx}`;
                obj[headerName] = cell ? (cell.v || cell.f || null) : null; 
              });
            }
            return obj;
          });
          
          console.log('Treatment headers:', headers);
          console.log('Treatment sample row:', dataRows[0]);
          
          // Set headers and initialize form with empty values
          setTreatmentHeaders(headers);
          const emptyForm: any = {};
          headers.forEach(header => {
            emptyForm[header] = "";
          });
          setTreatmentForm(emptyForm);
          
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
        } else {
          // Default sorting for each table to match Supabase order
          if (table === "bill_of_materials") {
            query = query.order("id", { ascending: true, nullsFirst: false });
          } else if (table.startsWith("current_balance_")) {
            query = query.order("id", { ascending: true, nullsFirst: false });
          } else if (table === "qa_inspections") {
            query = query.order("qa_id", { ascending: true, nullsFirst: false });
          }
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

  const resetBomForm = () => {
    setBom({
      ax_item_number: "", bb_item_number: "", bom_level: "", bom_text1: "", bom_text2: "", bom_text3: "", bom_text4: "", bom_text5: "",
      buyer: "", country_of_origin: "", effectivity_date: "", expiry_date: "", final_position: "", gold_cm: "", halogen_free: "",
      hardware_selection: "", hts_code: "", id_dispo: "", item: "", item_description: "", item_spool: "", item_status: "", item_text_1: "",
      item_type: "", jde_item_number: "", kns_ref_pn_eu_rohs: "", manufacturer_eu_rohs_status: "", manufacturer_family: "",
      manufacturer_name: "", manufacturer_name_2: "", manufacturer_part_number: "", manufacturer_part_number_2: "", manufacturing_item: "",
      manufacturing_item_description: "", manufacturing_item_rev: "", mpn_status: "", oe_item_number: "", op_seq: "", po_commodity_code: "",
      pos: "", qty: "", rev: "", rohs: "", seq: "", show_exploded: "", source: "", status_eu_rohs: "", tantalum_cm: "",
      tin_cm: "", tungsten_cm: "", uom: "", validation_status: "",
    });
  };

  const resetInvForm = () => {
    setInv({
      part_number: "", description: "", rev: "", location: "", supplier: "", current_balance: "", actual_qoh: "", extra_qty_no_value: "",
      quantity_on_order: "", replacement_to_customer: "", risk_stock_value: "", sales_order_quantity: "", shortage_extra: "",
      supplier_replacement: "", total_cost: "", treatment: "",
    });
  };

  const submitBOM = async () => {
    try {
      const payload = {
        ...bom,
        bom_level: bom.bom_level ? Number(bom.bom_level) : null,
      };
      const res = await fetch('https://bslunifyone.app.n8n.cloud/webhook/form_bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: "BOM entry added" });
      resetBomForm();
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
        ...inv,
        current_balance: inv.current_balance ? Number(inv.current_balance) : null,
        actual_qoh: inv.actual_qoh ? Number(inv.actual_qoh) : null,
        extra_qty_no_value: inv.extra_qty_no_value ? Number(inv.extra_qty_no_value) : null,
        quantity_on_order: inv.quantity_on_order ? Number(inv.quantity_on_order) : null,
        sales_order_quantity: inv.sales_order_quantity ? Number(inv.sales_order_quantity) : null,
      };
      const res = await fetch(`https://bslunifyone.app.n8n.cloud/webhook/${path}` , {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: `Inventory (${currency.toUpperCase()}) entry added` });
      resetInvForm();
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
      // Send all form data dynamically
      const payload = { ...treatmentForm };
      const res = await fetch('https://bslunifyone.app.n8n.cloud/webhook/form_treatment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Success", description: "Treatment entry sent" });
      // Reset form to empty values for all headers
      const emptyForm: any = {};
      treatmentHeaders.forEach(header => {
        emptyForm[header] = "";
      });
      setTreatmentForm(emptyForm);
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
                <Select value={formType} onValueChange={(v) => { setFormType(v as InventoryFormType); resetPagination(); setShowForm(false); }}>
                  <SelectTrigger className="w-64"><SelectValue placeholder="Choose form" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bom">Bill of Materials</SelectItem>
                    <SelectItem value="inventory_sgd">Inventory (SGD)</SelectItem>
                    <SelectItem value="inventory_usd">Inventory (USD)</SelectItem>
                    <SelectItem value="ncr">NCR</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowForm(true)} disabled={!formType}>
                  Open Form
                </Button>
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

          {formType === "bom" && showForm && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>Bill of Materials</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {getColumnOrder("bill_of_materials").map((key) => (
                    <div key={key}>
                      <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                      <Input 
                        value={bom[key] || ""} 
                        onChange={(e) => setBom({ ...bom, [key]: e.target.value })} 
                        type={key.includes('date') ? 'date' : key.includes('level') ? 'number' : 'text'}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={submitBOM}>Add BOM</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(formType === "inventory_sgd" || formType === "inventory_usd") && showForm && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>Inventory ({formType === "inventory_sgd" ? "SGD" : "USD"})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {getColumnOrder(formType === "inventory_sgd" ? "current_balance_sgd" : "current_balance_usd").map((key) => (
                    <div key={key}>
                      <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                      <Input 
                        value={inv[key] || ""} 
                        onChange={(e) => setInv({ ...inv, [key]: e.target.value })} 
                        type={key.includes('quantity') || key.includes('balance') || key.includes('qoh') || key.includes('value') ? 'number' : 'text'}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => submitInventory(formType === "inventory_sgd" ? "sgd" : "usd")}>Add Inventory</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {formType === "ncr" && showForm && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>NCR</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {getColumnOrder("qa_inspections").map((key) => (
                    <div key={key}>
                      <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                      {key === 'inspection_status' ? (
                        <Select value={ncr[key] || ""} onValueChange={(v) => setNcr({ ...ncr, [key]: v })}>
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Pass">Pass</SelectItem>
                            <SelectItem value="Fail">Fail</SelectItem>
                            <SelectItem value="Partial Pass">Partial Pass</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input 
                          value={ncr[key] || ""} 
                          onChange={(e) => setNcr({ ...ncr, [key]: e.target.value })} 
                          type={key.includes('date') ? 'date' : key.includes('quantity') || key.includes('qa_id') ? 'number' : 'text'}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end"><Button onClick={submitNCR}>Add NCR</Button></div>
              </CardContent>
            </Card>
          )}

          {formType === "treatment" && showForm && (
            <Card className="rounded-2xl mb-4">
              <CardHeader><CardTitle>Treatment</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {treatmentHeaders.map((header) => (
                    <div key={header}>
                      <Label className="capitalize">{header.replace(/_/g, ' ')}</Label>
                      <Input 
                        value={treatmentForm[header] || ""} 
                        onChange={(e) => setTreatmentForm({ ...treatmentForm, [header]: e.target.value })} 
                        type={header.toLowerCase().includes('date') ? 'date' : 
                              header.toLowerCase().includes('quantity') || header.toLowerCase().includes('qty') ? 'number' : 'text'}
                      />
                    </div>
                  ))}
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
                        {(() => {
                          // Get ordered columns based on form type
                          let orderedColumns: string[] = [];
                          if (formType === "treatment") {
                            // For treatment, use the headers from Google Sheet
                            orderedColumns = treatmentHeaders;
                          } else {
                            // For Supabase tables, use the defined column order
                            const tableName = formType === "bom" ? "bill_of_materials" :
                                            formType === "inventory_sgd" ? "current_balance_sgd" :
                                            formType === "inventory_usd" ? "current_balance_usd" :
                                            formType === "ncr" ? "qa_inspections" : "";
                            const definedOrder = getColumnOrder(tableName);
                            const availableColumns = Object.keys(rows[0] || {});
                            // Use defined order, but only include columns that actually exist in the data
                            orderedColumns = definedOrder.filter(col => availableColumns.includes(col));
                            // Add any extra columns that aren't in the defined order
                            const extraColumns = availableColumns.filter(col => !definedOrder.includes(col));
                            orderedColumns = [...orderedColumns, ...extraColumns];
                          }
                          return orderedColumns;
                        })().map((k) => {
                          const isDescription = k.toLowerCase().includes('description') || k.toLowerCase().includes('notes');
                          const isPartNumber = k.toLowerCase().includes('part') || k.toLowerCase().includes('item') || k.toLowerCase().includes('number');
                          
                          let cellClass = "min-w-24 max-w-48";
                          if (isDescription) {
                            cellClass = "min-w-32 max-w-64";
                          } else if (isPartNumber) {
                            cellClass = "min-w-28 max-w-56";
                          }
                          
                          return (
                            <TableHead key={k} className={`cursor-pointer hover:bg-muted/50 select-none ${cellClass}`} onClick={() => handleSort(k)}>
                              <div className="flex items-center gap-2">
                                {k}
                                {getSortIcon(k)}
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, idx) => (
                        <TableRow key={idx}>
                          {(() => {
                            // Get the same ordered columns as the header
                            let orderedColumns: string[] = [];
                            if (formType === "treatment") {
                              orderedColumns = treatmentHeaders;
                            } else {
                              const tableName = formType === "bom" ? "bill_of_materials" :
                                              formType === "inventory_sgd" ? "current_balance_sgd" :
                                              formType === "inventory_usd" ? "current_balance_usd" :
                                              formType === "ncr" ? "qa_inspections" : "";
                              const definedOrder = getColumnOrder(tableName);
                              const availableColumns = Object.keys(row);
                              orderedColumns = definedOrder.filter(col => availableColumns.includes(col));
                              const extraColumns = availableColumns.filter(col => !definedOrder.includes(col));
                              orderedColumns = [...orderedColumns, ...extraColumns];
                            }
                            return orderedColumns;
                          })().map((k) => {
                            const v = row[k];
                            const content = String(v ?? "—");
                            const isLongContent = content.length > 20;
                            const isDescription = k.toLowerCase().includes('description') || k.toLowerCase().includes('notes');
                            const isPartNumber = k.toLowerCase().includes('part') || k.toLowerCase().includes('item') || k.toLowerCase().includes('number');
                            
                            let cellClass = "min-w-24 max-w-48";
                            if (isDescription) {
                              cellClass = "min-w-32 max-w-64";
                            } else if (isPartNumber) {
                              cellClass = "min-w-28 max-w-56";
                            } else if (isLongContent) {
                              cellClass = "min-w-32 max-w-60";
                            }
                            
                            return (
                              <TableCell key={k} className={cellClass}>
                                <div className="max-h-16 overflow-y-auto text-sm leading-relaxed">
                                  {content}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between mt-4 text-sm">
                    <div>Page {page} of {Math.max(1, Math.ceil(total / PAGE_SIZE))} • {total} total</div>
                    <div className="flex gap-2 items-center">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => changePage(Math.max(1, page - 1))}>Prev</Button>
                      <div className="flex items-center gap-2">
                        <span>Go to:</span>
                        <Input 
                          type="number" 
                          min="1" 
                          max={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                          value={page}
                          onChange={(e) => {
                            const newPage = parseInt(e.target.value);
                            if (newPage >= 1 && newPage <= Math.max(1, Math.ceil(total / PAGE_SIZE))) {
                              changePage(newPage);
                            }
                          }}
                          className="w-16 h-8 text-center"
                        />
                      </div>
                      <Button variant="outline" size="sm" disabled={page >= Math.max(1, Math.ceil(total / PAGE_SIZE))} onClick={() => changePage(Math.min(Math.max(1, Math.ceil(total / PAGE_SIZE)), page + 1))}>Next</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AppLayout>
      </AppSidebarProvider>

      {/* Help Center Button */}
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50 bg-white shadow-lg hover:bg-gray-50"
        onClick={() => window.open('https://bslx3echohelpcenter.lovable.app/', '_blank')}
      >
        <FileText className="h-4 w-4 mr-2" />
        Help Center
      </Button>
    </>
  );
};

export default InventoryFormsPage;


