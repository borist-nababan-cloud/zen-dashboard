export interface MasterOutlet {
  kode_outlet: string;
  name_outlet: string;
  alamat?: string;
  no_telp?: string;
  city?: string;
  province?: string;
  active: boolean;
}

export interface PosTransMaster {
  trans_id: string;
  kode_outlet: string;
  tanggal: string;
  start_time: string;
  end_time?: string;
  status_trans: string;
  nama_customer?: string;
  room_id?: string;
  subtotal: number;
  kodekaryawan?: string;
  byrequest?: string;
  typejasa?: string;
  rcpt?: string;
  id_payment?: string;
  user_uid?: string;
}

export interface PosPaymentDetails {
  id_payment: string;
  kode_outlet: string;
  tanggal?: string;
  namapromo?: string;
  refpromo?: string;
  vpromo: number;
  refdisc?: string;
  vdisc: number;
  total: number;
  vredeem: number;
  refgift?: string;
  vgift: number;
  vcash: number;
  payment1?: string;
  bank1?: string;
  refpayment1?: string;
  vpayment1: number;
  payment2?: string;
  bank2?: string;
  refpayment2?: string;
  vpayment2: number;
  rcpt?: string;
  created_at?: string;
}

export interface PosTransReject {
  local_autonum?: number;
  kode_outlet: string;
  jenis_jasa?: string;
  reason?: string;
  reject_date: string;
  lasteditdate?: string;
}

export interface PosTransDetail {
  id?: string;
  trans_id: string;
  kode_outlet: string;
  tanggal: string;
  trans_type_id?: string;
  produk_jasa_id?: string;
  produk_jasa_nama?: string;
  qty: number;
  price?: number;
  subtotal?: number;
}

export interface CategoryMix {
  footAndBody: number; // BJ: Foot & Body
  additional: number;  // BA: Additional
  product: number;     // BP: Product
  gcSales: number;     // BG: GC Sales
  total: number;
}

export interface ItemRankItem {
  name: string;
  count: number;
  category?: string;
}

export interface OutletCardMetrics {
  outlet: MasterOutlet;
  totalSales: number;
  cashOnHand: number;
  gcPayment: number;
  gcPaymentCount: number;
  activeGuests: number;
  completedGuests: number;
  rejectionCount: number;
  categoryMix: CategoryMix;
  topItems: ItemRankItem[];
  targetSales?: number;
  progressPercent: number;
}

export interface PaymentMethodItem {
  method: string;
  total: number;
  count: number;
}

export interface PromoImpactItem {
  promoName: string;
  totalDiscount: number;
  usageCount: number;
}

export interface RejectionReasonItem {
  reason: string;
  count: number;
  serviceTypes: string[];
}

export interface GlobalGardenSummary {
  totalSales: number;
  cashOnHand: number;
  gcPayment: number;
  gcPaymentCount: number;
  activeCheckIns: number;
  completedTransactions: number;
  totalDiscounts: number;
  totalPromos: number;
  totalRejections: number;
  categoryMix: CategoryMix;
  topItems: ItemRankItem[];
}

export interface DashboardDataState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  summary: GlobalGardenSummary;
  outlets: OutletCardMetrics[];
  paymentBreakdown: PaymentMethodItem[];
  promoImpact: PromoImpactItem[];
  rejectionReasons: RejectionReasonItem[];
  allActiveOutlets: MasterOutlet[];
}

