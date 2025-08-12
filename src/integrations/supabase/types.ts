export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bill_of_materials: {
        Row: {
          ax_item_number: string | null
          bb_item_number: string | null
          bom_level: number | null
          bom_text1: string | null
          bom_text2: string | null
          bom_text3: string | null
          bom_text4: string | null
          bom_text5: string | null
          buyer: string | null
          country_of_origin: string | null
          effectivity_date: string | null
          expiry_date: string | null
          final_position: string | null
          gold_cm: string | null
          halogen_free: string | null
          hardware_selection: string | null
          hts_code: string | null
          id: number
          id_dispo: string | null
          item: string | null
          item_description: string | null
          item_spool: string | null
          item_status: string | null
          item_text_1: string | null
          item_type: string | null
          jde_item_number: string | null
          kns_ref_pn_eu_rohs: string | null
          manufacturer_eu_rohs_status: string | null
          manufacturer_family: string | null
          manufacturer_name: string | null
          manufacturer_name_2: string | null
          manufacturer_part_number: string | null
          manufacturer_part_number_2: string | null
          manufacturing_item: string | null
          manufacturing_item_description: string | null
          manufacturing_item_rev: string | null
          mpn_status: string | null
          oe_item_number: string | null
          op_seq: string | null
          po_commodity_code: string | null
          pos: string | null
          qty: string | null
          rev: string | null
          rohs: string | null
          seq: string | null
          show_exploded: string | null
          source: string | null
          status_eu_rohs: string | null
          tantalum_cm: string | null
          tin_cm: string | null
          tungsten_cm: string | null
          uom: string | null
          validation_status: string | null
        }
        Insert: {
          ax_item_number?: string | null
          bb_item_number?: string | null
          bom_level?: number | null
          bom_text1?: string | null
          bom_text2?: string | null
          bom_text3?: string | null
          bom_text4?: string | null
          bom_text5?: string | null
          buyer?: string | null
          country_of_origin?: string | null
          effectivity_date?: string | null
          expiry_date?: string | null
          final_position?: string | null
          gold_cm?: string | null
          halogen_free?: string | null
          hardware_selection?: string | null
          hts_code?: string | null
          id: number
          id_dispo?: string | null
          item?: string | null
          item_description?: string | null
          item_spool?: string | null
          item_status?: string | null
          item_text_1?: string | null
          item_type?: string | null
          jde_item_number?: string | null
          kns_ref_pn_eu_rohs?: string | null
          manufacturer_eu_rohs_status?: string | null
          manufacturer_family?: string | null
          manufacturer_name?: string | null
          manufacturer_name_2?: string | null
          manufacturer_part_number?: string | null
          manufacturer_part_number_2?: string | null
          manufacturing_item?: string | null
          manufacturing_item_description?: string | null
          manufacturing_item_rev?: string | null
          mpn_status?: string | null
          oe_item_number?: string | null
          op_seq?: string | null
          po_commodity_code?: string | null
          pos?: string | null
          qty?: string | null
          rev?: string | null
          rohs?: string | null
          seq?: string | null
          show_exploded?: string | null
          source?: string | null
          status_eu_rohs?: string | null
          tantalum_cm?: string | null
          tin_cm?: string | null
          tungsten_cm?: string | null
          uom?: string | null
          validation_status?: string | null
        }
        Update: {
          ax_item_number?: string | null
          bb_item_number?: string | null
          bom_level?: number | null
          bom_text1?: string | null
          bom_text2?: string | null
          bom_text3?: string | null
          bom_text4?: string | null
          bom_text5?: string | null
          buyer?: string | null
          country_of_origin?: string | null
          effectivity_date?: string | null
          expiry_date?: string | null
          final_position?: string | null
          gold_cm?: string | null
          halogen_free?: string | null
          hardware_selection?: string | null
          hts_code?: string | null
          id?: number
          id_dispo?: string | null
          item?: string | null
          item_description?: string | null
          item_spool?: string | null
          item_status?: string | null
          item_text_1?: string | null
          item_type?: string | null
          jde_item_number?: string | null
          kns_ref_pn_eu_rohs?: string | null
          manufacturer_eu_rohs_status?: string | null
          manufacturer_family?: string | null
          manufacturer_name?: string | null
          manufacturer_name_2?: string | null
          manufacturer_part_number?: string | null
          manufacturer_part_number_2?: string | null
          manufacturing_item?: string | null
          manufacturing_item_description?: string | null
          manufacturing_item_rev?: string | null
          mpn_status?: string | null
          oe_item_number?: string | null
          op_seq?: string | null
          po_commodity_code?: string | null
          pos?: string | null
          qty?: string | null
          rev?: string | null
          rohs?: string | null
          seq?: string | null
          show_exploded?: string | null
          source?: string | null
          status_eu_rohs?: string | null
          tantalum_cm?: string | null
          tin_cm?: string | null
          tungsten_cm?: string | null
          uom?: string | null
          validation_status?: string | null
        }
        Relationships: []
      }
      current_balance_sgd: {
        Row: {
          actual_qoh: number | null
          current_balance: number | null
          description: string | null
          extra_qty_no_value: number | null
          id: number
          location: string | null
          part_number: string | null
          quantity_on_order: number | null
          replacement_to_customer: string | null
          rev: string | null
          risk_stock_value: string | null
          sales_order_quantity: number | null
          shortage_extra: string | null
          supplier: string | null
          supplier_replacement: string | null
          total_cost: string | null
          treatment: string | null
        }
        Insert: {
          actual_qoh?: number | null
          current_balance?: number | null
          description?: string | null
          extra_qty_no_value?: number | null
          id?: number
          location?: string | null
          part_number?: string | null
          quantity_on_order?: number | null
          replacement_to_customer?: string | null
          rev?: string | null
          risk_stock_value?: string | null
          sales_order_quantity?: number | null
          shortage_extra?: string | null
          supplier?: string | null
          supplier_replacement?: string | null
          total_cost?: string | null
          treatment?: string | null
        }
        Update: {
          actual_qoh?: number | null
          current_balance?: number | null
          description?: string | null
          extra_qty_no_value?: number | null
          id?: number
          location?: string | null
          part_number?: string | null
          quantity_on_order?: number | null
          replacement_to_customer?: string | null
          rev?: string | null
          risk_stock_value?: string | null
          sales_order_quantity?: number | null
          shortage_extra?: string | null
          supplier?: string | null
          supplier_replacement?: string | null
          total_cost?: string | null
          treatment?: string | null
        }
        Relationships: []
      }
      current_balance_usd: {
        Row: {
          actual_qoh: number | null
          current_balance: number | null
          description: string | null
          extra_qty_no_value: number | null
          id: number
          location: string | null
          part_number: string | null
          quantity_on_order: number | null
          replacement_to_customer: string | null
          rev: string | null
          risk_stock_value: string | null
          sales_order_quantity: number | null
          shortage_extra: string | null
          supplier: string | null
          supplier_replacement: string | null
          total_cost: string | null
          treatment: string | null
        }
        Insert: {
          actual_qoh?: number | null
          current_balance?: number | null
          description?: string | null
          extra_qty_no_value?: number | null
          id?: number
          location?: string | null
          part_number?: string | null
          quantity_on_order?: number | null
          replacement_to_customer?: string | null
          rev?: string | null
          risk_stock_value?: string | null
          sales_order_quantity?: number | null
          shortage_extra?: string | null
          supplier?: string | null
          supplier_replacement?: string | null
          total_cost?: string | null
          treatment?: string | null
        }
        Update: {
          actual_qoh?: number | null
          current_balance?: number | null
          description?: string | null
          extra_qty_no_value?: number | null
          id?: number
          location?: string | null
          part_number?: string | null
          quantity_on_order?: number | null
          replacement_to_customer?: string | null
          rev?: string | null
          risk_stock_value?: string | null
          sales_order_quantity?: number | null
          shortage_extra?: string | null
          supplier?: string | null
          supplier_replacement?: string | null
          total_cost?: string | null
          treatment?: string | null
        }
        Relationships: []
      }
      customer: {
        Row: {
          balance_po_qty: number | null
          buyer: string | null
          current_balance: string | null
          customer: string | null
          customer_required_date: string | null
          days_to_deliver: string | null
          description: string | null
          id: number | null
          part_number: string | null
          po_date: string | null
          po_number: string | null
          po_qty: number | null
          pos: string | null
          project: string | null
          quotation_no: string | null
          rev: string | null
          suppliers_po: string | null
          total_price: string | null
          unit_selling_price: string | null
        }
        Insert: {
          balance_po_qty?: number | null
          buyer?: string | null
          current_balance?: string | null
          customer?: string | null
          customer_required_date?: string | null
          days_to_deliver?: string | null
          description?: string | null
          id?: number | null
          part_number?: string | null
          po_date?: string | null
          po_number?: string | null
          po_qty?: number | null
          pos?: string | null
          project?: string | null
          quotation_no?: string | null
          rev?: string | null
          suppliers_po?: string | null
          total_price?: string | null
          unit_selling_price?: string | null
        }
        Update: {
          balance_po_qty?: number | null
          buyer?: string | null
          current_balance?: string | null
          customer?: string | null
          customer_required_date?: string | null
          days_to_deliver?: string | null
          description?: string | null
          id?: number | null
          part_number?: string | null
          po_date?: string | null
          po_number?: string | null
          po_qty?: number | null
          pos?: string | null
          project?: string | null
          quotation_no?: string | null
          rev?: string | null
          suppliers_po?: string | null
          total_price?: string | null
          unit_selling_price?: string | null
        }
        Relationships: []
      }
      customer_companies: {
        Row: {
          address: string | null
          bank: string | null
          bank_number: string | null
          company_name: string
          id: number
          method_of_payment: string | null
          remarks: string | null
        }
        Insert: {
          address?: string | null
          bank?: string | null
          bank_number?: string | null
          company_name: string
          id?: number
          method_of_payment?: string | null
          remarks?: string | null
        }
        Update: {
          address?: string | null
          bank?: string | null
          bank_number?: string | null
          company_name?: string
          id?: number
          method_of_payment?: string | null
          remarks?: string | null
        }
        Relationships: []
      }
      customer_contacts: {
        Row: {
          customer_company: string | null
          email: string | null
          id: number
          name: string
          number: string | null
          position: string | null
        }
        Insert: {
          customer_company?: string | null
          email?: string | null
          id?: number
          name: string
          number?: string | null
          position?: string | null
        }
        Update: {
          customer_company?: string | null
          email?: string | null
          id?: number
          name?: string
          number?: string | null
          position?: string | null
        }
        Relationships: []
      }
      inventory_in: {
        Row: {
          aging: string | null
          available: string | null
          date_in: string | null
          description: string | null
          id: number
          part_number: string | null
          qty: string | null
          qty_out: string | null
          remarks: string | null
          rev: string | null
          total_cost: string | null
          unit_cost: string | null
          value: string | null
        }
        Insert: {
          aging?: string | null
          available?: string | null
          date_in?: string | null
          description?: string | null
          id?: number
          part_number?: string | null
          qty?: string | null
          qty_out?: string | null
          remarks?: string | null
          rev?: string | null
          total_cost?: string | null
          unit_cost?: string | null
          value?: string | null
        }
        Update: {
          aging?: string | null
          available?: string | null
          date_in?: string | null
          description?: string | null
          id?: number
          part_number?: string | null
          qty?: string | null
          qty_out?: string | null
          remarks?: string | null
          rev?: string | null
          total_cost?: string | null
          unit_cost?: string | null
          value?: string | null
        }
        Relationships: []
      }
      inventory_out: {
        Row: {
          date_out: string | null
          description: string | null
          id: number
          part_number: string | null
          qty: number | null
          remark: string | null
          rev: string | null
        }
        Insert: {
          date_out?: string | null
          description?: string | null
          id?: number
          part_number?: string | null
          qty?: number | null
          remark?: string | null
          rev?: string | null
        }
        Update: {
          date_out?: string | null
          description?: string | null
          id?: number
          part_number?: string | null
          qty?: number | null
          remark?: string | null
          rev?: string | null
        }
        Relationships: []
      }
      qa_inspections: {
        Row: {
          corrective_action: string | null
          created_at: string | null
          inspected_by: string | null
          inspection_date: string | null
          inspection_notes: string | null
          inspection_status: string | null
          manufacturing_item: string | null
          manufacturing_item_description: string | null
          qa_id: number
          quantity_failed: number | null
          quantity_passed: number | null
          quantity_received: number | null
          received_date: string
          rev: string | null
          updated_at: string | null
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string | null
          inspected_by?: string | null
          inspection_date?: string | null
          inspection_notes?: string | null
          inspection_status?: string | null
          manufacturing_item?: string | null
          manufacturing_item_description?: string | null
          qa_id?: number
          quantity_failed?: number | null
          quantity_passed?: number | null
          quantity_received?: number | null
          received_date: string
          rev?: string | null
          updated_at?: string | null
        }
        Update: {
          corrective_action?: string | null
          created_at?: string | null
          inspected_by?: string | null
          inspection_date?: string | null
          inspection_notes?: string | null
          inspection_status?: string | null
          manufacturing_item?: string | null
          manufacturing_item_description?: string | null
          qa_id?: number
          quantity_failed?: number | null
          quantity_passed?: number | null
          quantity_received?: number | null
          received_date?: string
          rev?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier: {
        Row: {
          acknowledge_date: string | null
          balance: number | null
          bsl_required_date: string | null
          customer_po: string | null
          days_to_expired: string | null
          description: string | null
          id: number | null
          job_no: string | null
          part_number: string | null
          po_date: string | null
          po_number: string | null
          po_qty: string | null
          rev: string | null
          supplier: string | null
          total_price: string | null
          unit_cost: string | null
        }
        Insert: {
          acknowledge_date?: string | null
          balance?: number | null
          bsl_required_date?: string | null
          customer_po?: string | null
          days_to_expired?: string | null
          description?: string | null
          id?: number | null
          job_no?: string | null
          part_number?: string | null
          po_date?: string | null
          po_number?: string | null
          po_qty?: string | null
          rev?: string | null
          supplier?: string | null
          total_price?: string | null
          unit_cost?: string | null
        }
        Update: {
          acknowledge_date?: string | null
          balance?: number | null
          bsl_required_date?: string | null
          customer_po?: string | null
          days_to_expired?: string | null
          description?: string | null
          id?: number | null
          job_no?: string | null
          part_number?: string | null
          po_date?: string | null
          po_number?: string | null
          po_qty?: string | null
          rev?: string | null
          supplier?: string | null
          total_price?: string | null
          unit_cost?: string | null
        }
        Relationships: []
      }
      supplier_companies: {
        Row: {
          address: string | null
          bank: string | null
          bank_number: string | null
          company_name: string
          id: number
          method_of_payment: string | null
          remarks: string | null
        }
        Insert: {
          address?: string | null
          bank?: string | null
          bank_number?: string | null
          company_name: string
          id?: number
          method_of_payment?: string | null
          remarks?: string | null
        }
        Update: {
          address?: string | null
          bank?: string | null
          bank_number?: string | null
          company_name?: string
          id?: number
          method_of_payment?: string | null
          remarks?: string | null
        }
        Relationships: []
      }
      supplier_contacts: {
        Row: {
          email: string | null
          id: number
          name: string
          number: string | null
          position: string | null
          supplier_company_id: number | null
        }
        Insert: {
          email?: string | null
          id?: number
          name: string
          number?: string | null
          position?: string | null
          supplier_company_id?: number | null
        }
        Update: {
          email?: string | null
          id?: number
          name?: string
          number?: string | null
          position?: string | null
          supplier_company_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contacts_supplier_company_id_fkey"
            columns: ["supplier_company_id"]
            isOneToOne: false
            referencedRelation: "supplier_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_master_list: {
        Row: {
          bsl_quotation_number_to_customer: string | null
          customer: string | null
          description: string | null
          extended_price: string | null
          extended_price_second: string | null
          first_source_extended_price: string | null
          first_source_supplier: string | null
          first_source_supplier_quotation_number: string | null
          first_source_unit_price: string | null
          id: number
          moq: string | null
          part_number: string | null
          requestor: string | null
          rev: string | null
          second_source_extended_price: string | null
          second_source_supplier: string | null
          second_source_supplier_quotation_number: string | null
          second_source_unit_price: string | null
          sgd_currency: string | null
        }
        Insert: {
          bsl_quotation_number_to_customer?: string | null
          customer?: string | null
          description?: string | null
          extended_price?: string | null
          extended_price_second?: string | null
          first_source_extended_price?: string | null
          first_source_supplier?: string | null
          first_source_supplier_quotation_number?: string | null
          first_source_unit_price?: string | null
          id: number
          moq?: string | null
          part_number?: string | null
          requestor?: string | null
          rev?: string | null
          second_source_extended_price?: string | null
          second_source_supplier?: string | null
          second_source_supplier_quotation_number?: string | null
          second_source_unit_price?: string | null
          sgd_currency?: string | null
        }
        Update: {
          bsl_quotation_number_to_customer?: string | null
          customer?: string | null
          description?: string | null
          extended_price?: string | null
          extended_price_second?: string | null
          first_source_extended_price?: string | null
          first_source_supplier?: string | null
          first_source_supplier_quotation_number?: string | null
          first_source_unit_price?: string | null
          id?: number
          moq?: string | null
          part_number?: string | null
          requestor?: string | null
          rev?: string | null
          second_source_extended_price?: string | null
          second_source_supplier?: string | null
          second_source_supplier_quotation_number?: string | null
          second_source_unit_price?: string | null
          sgd_currency?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
