import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  MasterOutlet,
  PosTransMaster,
  PosPaymentDetails,
  PosTransReject,
  PosTransDetail,
  CategoryMix,
  ItemRankItem,
  DashboardDataState,
  OutletCardMetrics,
  PaymentMethodItem,
  PromoImpactItem,
  RejectionReasonItem,
  GlobalGardenSummary,
  MasterRoom,
  HrdAbsenHarian,
  HrdKaryawanInfo,
  OutletHRMetrics,
  OutletRoomMetrics,
  OutletTherapistMetrics,
} from '../types/dashboard';
import { getAutoWIBOperationalDate, getOperationalBounds } from '../lib/dateUtils';

// Default mock target sales for outlets to show meaningful progress bars
const DEFAULT_TARGET_SALES: Record<string, number> = {
  '101': 15000000, // Zen Sukajadi
  '102': 12000000, // Zen Riau
  '103': 10000000, // Surya Sumantri
  '105': 18000000, // Gunawarman
  '106': 16000000, // Pakubuwono
  '107': 8000000,  // Palu
  '108': 9000000,  // Samarinda
  '109': 14000000, // Sunda
  '110': 20000000, // Bali
  '112': 11000000, // Depok
  '115': 10000000, // Makassar
  '116': 13000000, // Mekarwangi
  '117': 11000000, // Padalarang
  '218': 15000000, // Hilton
};

const DEPT_LABELS: Record<string, string> = {
  TR: 'Therapist Foot (Reflexology)',
  TB: 'Therapist Body Massage',
  FO: 'Front Office / Reception',
  KASIR: 'Cashier Desk',
  OB: 'Office Boy / Cleaning',
  SEC: 'Security',
  SPV: 'Supervisor / Head of Shift',
  MGR: 'Branch Manager',
  ADM: 'Administration',
  WH: 'Warehouse / Supply',
  OTHER: 'General Staff',
};

const createEmptyCategoryMix = (): CategoryMix => ({
  footAndBody: 0,
  additional: 0,
  product: 0,
  gcSales: 0,
  total: 0,
});

const createEmptyHRMetrics = (): OutletHRMetrics => ({
  totalActiveStaff: 0,
  activeTR: 0,
  activeTB: 0,
  departments: [],
});

const createEmptyRoomMetrics = (): OutletRoomMetrics => ({
  totalRooms: 0,
  roomsBM: 0,
  roomsRF: 0,
  usedRooms: 0,
  usedBM: 0,
  usedRF: 0,
  availableRooms: 0,
  availableBM: 0,
  availableRF: 0,
  occupancyPercent: 0,
  cumulativeTurnover: 0,
});

const createEmptyTherapistMetrics = (): OutletTherapistMetrics => ({
  inChargeTR: 0,
  inChargeTB: 0,
  totalInCharge: 0,
  onTreatmentRF: 0,
  onTreatmentBM: 0,
  totalOnTreatment: 0,
  availableTR: 0,
  availableTB: 0,
  totalAvailable: 0,
  utilizationPercent: 0,
  cumulativeProductivity: 0,
});

export function useDashboardData(selectedOutletCode: string = 'ALL') {
  const [data, setData] = useState<DashboardDataState>({
    loading: true,
    error: null,
    lastUpdated: null,
    summary: {
      totalSales: 0,
      cashOnHand: 0,
      gcPayment: 0,
      gcPaymentCount: 0,
      activeCheckIns: 0,
      completedTransactions: 0,
      totalDiscounts: 0,
      totalPromos: 0,
      totalRejections: 0,
      categoryMix: createEmptyCategoryMix(),
      topItems: [],
      hrMetrics: createEmptyHRMetrics(),
      roomMetrics: createEmptyRoomMetrics(),
      therapistMetrics: createEmptyTherapistMetrics(),
    },
    outlets: [],
    paymentBreakdown: [],
    promoImpact: [],
    rejectionReasons: [],
    allActiveOutlets: [],
  });

  const [countdown, setCountdown] = useState<number>(30);
  const [userDateOverride, setUserDateOverride] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const autoDateInfo = getAutoWIBOperationalDate();
  const activeDateStr = userDateOverride || autoDateInfo.dateStr;
  const isOvernightWindow = autoDateInfo.isOvernight && (!userDateOverride || userDateOverride === autoDateInfo.dateStr);

  const fetchDashboardMetrics = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setData((prev) => ({ ...prev, loading: prev.lastUpdated === null }));
      const { localDateStr, yymmdd } = getOperationalBounds(activeDateStr);

      // Parallel Network Execution: Outlets, Master, Details, Payments, Rejections, GC Payments, Rooms, Attendance, Employees
      const [
        outletsRes,
        masterTransRes,
        detailsRes,
        paymentDetailsRes,
        rejectsRes,
        gcPaymentsRes,
        roomsRes,
        absenRes,
        karyawanRes,
      ] = await Promise.all([
        // 1. Master Outlets (Active Only)
        supabase
          .from('master_outlet')
          .select('kode_outlet, name_outlet, alamat, no_telp, city, province, active')
          .eq('active', true)
          .order('kode_outlet', { ascending: true }),

        // 2. POS Trans Master for Operational Date (subtotal >= 0)
        supabase
          .from('ot_pos_trans_master')
          .select('trans_id, kode_outlet, tanggal, start_time, end_time, status_trans, nama_customer, room_id, subtotal, kodekaryawan, byrequest, typejasa, rcpt, id_payment, user_uid')
          .eq('tanggal', localDateStr)
          .gte('subtotal', 0),

        // 3. POS Trans Detail for Today (products, treatments, additional, GC)
        supabase
          .from('ot_pos_trans_detail')
          .select('trans_id, kode_outlet, tanggal, trans_type_id, produk_jasa_id, produk_jasa_nama, qty, price, subtotal')
          .eq('tanggal', localDateStr),

        // 4. POS Trans Payment Details (Exact indexed tanggal with legacy payment code fallback)
        supabase
          .from('ot_pos_trans_payment_details')
          .select('id_payment, kode_outlet, tanggal, namapromo, refpromo, vpromo, refdisc, vdisc, total, vredeem, refgift, vgift, vcash, payment1, bank1, refpayment1, vpayment1, payment2, bank2, refpayment2, vpayment2, rcpt, created_at')
          .or(`tanggal.eq.${localDateStr},id_payment.like.%.PAY.${yymmdd}%`),

        // 5. POS Trans Rejection / Walk-in cancellations (Strict indexed tanggal filter)
        supabase
          .from('ot_pos_trans_reject')
          .select('local_autonum, kode_outlet, tanggal, jenis_jasa, reason, reject_date, lasteditdate')
          .eq('tanggal', localDateStr),

        // 6. POS Trans Payment Details with Gift Certificate tender (vgift > 0)
        supabase
          .from('ot_pos_trans_payment_details')
          .select('id_payment, kode_outlet, tanggal, namapromo, refpromo, vpromo, refdisc, vdisc, total, vredeem, refgift, vgift, vcash, payment1, bank1, refpayment1, vpayment1, payment2, bank2, refpayment2, vpayment2, rcpt, created_at')
          .gt('vgift', 0)
          .or(`tanggal.eq.${localDateStr},id_payment.like.%.PAY.${yymmdd}%`)
          .order('created_at', { ascending: false }),

        // 7. Master Rooms (Active Rooms per Outlet)
        supabase
          .from('ot_master_room')
          .select('uid, kode_outlet, room_id, active, jenis_jasa, room_gender, available, keterangan')
          .eq('active', true),

        // 8. HR Daily Attendance (ot_hrd_absen_harian)
        supabase
          .from('ot_hrd_absen_harian')
          .select('kode_outlet, kodekaryawan, id_karyawan, nama, tanggal, fp_in, fp_out')
          .eq('tanggal', localDateStr),

        // 9. Employee Master Info (ot_hrd_karyawan_info)
        supabase
          .from('ot_hrd_karyawan_info')
          .select('kode_outlet, kodekaryawan, idkaryawan, namakaryawan, departemen, active')
          .eq('active', 'Y'),
      ]);

      if (outletsRes.error) throw new Error(`Outlets Error: ${outletsRes.error.message}`);
      if (masterTransRes.error) throw new Error(`Trans Master Error: ${masterTransRes.error.message}`);
      if (detailsRes.error) throw new Error(`Trans Detail Error: ${detailsRes.error.message}`);
      if (paymentDetailsRes.error) throw new Error(`Payment Details Error: ${paymentDetailsRes.error.message}`);
      if (rejectsRes.error) throw new Error(`Rejections Error: ${rejectsRes.error.message}`);
      if (gcPaymentsRes.error) throw new Error(`GC Payments Error: ${gcPaymentsRes.error.message}`);

      const rawOutlets: MasterOutlet[] = (outletsRes.data as MasterOutlet[]) || [];
      const rawMasters: PosTransMaster[] = (masterTransRes.data as PosTransMaster[]) || [];
      const rawDetails: PosTransDetail[] = (detailsRes.data as PosTransDetail[]) || [];
      const rawRejects: PosTransReject[] = (rejectsRes.data as PosTransReject[]) || [];
      const rawRooms: MasterRoom[] = (roomsRes.data as MasterRoom[]) || [];
      const rawAbsen: HrdAbsenHarian[] = (absenRes.data as HrdAbsenHarian[]) || [];
      const rawKaryawan: HrdKaryawanInfo[] = (karyawanRes.data as HrdKaryawanInfo[]) || [];

      // Combine payment records with deduplication by id_payment
      const paymentMap = new Map<string, PosPaymentDetails>();
      for (const p of ((paymentDetailsRes.data as PosPaymentDetails[]) || [])) {
        paymentMap.set(p.id_payment, p);
      }
      for (const p of ((gcPaymentsRes.data as PosPaymentDetails[]) || [])) {
        if (!paymentMap.has(p.id_payment)) {
          paymentMap.set(p.id_payment, p);
        }
      }

      // Combine with any additional linked payments from today's master transactions
      const masterPayIds = Array.from(
        new Set(rawMasters.map((m) => m.id_payment).filter((id): id is string => Boolean(id) && !paymentMap.has(id)))
      );

      if (masterPayIds.length > 0) {
        const { data: extraPayments } = await supabase
          .from('ot_pos_trans_payment_details')
          .select('id_payment, kode_outlet, namapromo, refpromo, vpromo, refdisc, vdisc, total, vredeem, refgift, vgift, vcash, payment1, bank1, refpayment1, vpayment1, payment2, bank2, refpayment2, vpayment2, rcpt, created_at')
          .in('id_payment', masterPayIds);
        if (extraPayments && extraPayments.length > 0) {
          for (const p of (extraPayments as PosPaymentDetails[])) {
            paymentMap.set(p.id_payment, p);
          }
        }
      }

      const rawPayments = Array.from(paymentMap.values());

      // =========================================================================
      // 1. HR KARYAWAN & ATTENDANCE AGGREGATION
      // Standard shift completion rule:
      // If fp_in is present and fp_out is present, and (fp_out - fp_in) >= 2 hours:
      // Employee has completed their shift and gone home -> EXCLUDE.
      // =========================================================================
      const karyawanInfoMap = new Map<string, HrdKaryawanInfo>();
      for (const k of rawKaryawan) {
        if (k.kodekaryawan) {
          karyawanInfoMap.set(k.kodekaryawan.trim().toUpperCase(), k);
        }
      }

      // Outlet HR accumulation maps: Map<kode_outlet, { activeTR, activeTB, totalActive, deptCounts: Map<dept, count> }>
      const outletHRData = new Map<
        string,
        { activeTR: number; activeTB: number; totalActive: number; deptMap: Map<string, number> }
      >();

      for (const outlet of rawOutlets) {
        outletHRData.set(outlet.kode_outlet, {
          activeTR: 0,
          activeTB: 0,
          totalActive: 0,
          deptMap: new Map<string, number>(),
        });
      }

      for (const a of rawAbsen) {
        if (!outletHRData.has(a.kode_outlet)) continue;
        if (a.tanggal && a.tanggal !== localDateStr) continue;

        const hasIn = Boolean(a.fp_in);
        const hasOut = Boolean(a.fp_out);

        // If neither fingerprint scan exists, omit
        if (!hasIn && !hasOut) continue;

        // Option 1 Standard Shift Completion check:
        // If employee has clocked out and duration between in & out is >= 2 hours, they have gone home
        if (hasIn && hasOut) {
          const inTime = new Date(a.fp_in!).getTime();
          const outTime = new Date(a.fp_out!).getTime();
          const durationHours = (outTime - inTime) / (1000 * 60 * 60);
          if (durationHours >= 2) {
            continue; // Exclude: completed shift and went home
          }
        }

        // Active employee on-duty!
        const oHR = outletHRData.get(a.kode_outlet)!;
        const empCode = (a.kodekaryawan || '').trim().toUpperCase();
        const empInfo = karyawanInfoMap.get(empCode);
        const dept = (empInfo?.departemen || 'OTHER').trim().toUpperCase();

        oHR.totalActive++;
        oHR.deptMap.set(dept, (oHR.deptMap.get(dept) || 0) + 1);

        // "TR" = Foot Therapist, "TB" = Body Therapist
        if (dept === 'TR') {
          oHR.activeTR++;
        } else if (dept === 'TB') {
          oHR.activeTB++;
        }
      }

      // =========================================================================
      // 2. MASTER ROOMS MAP & INDEXING
      // =========================================================================
      // Map<kode_outlet, Map<room_id, MasterRoom>>
      const outletRoomsMap = new Map<string, Map<string, MasterRoom>>();
      for (const outlet of rawOutlets) {
        outletRoomsMap.set(outlet.kode_outlet, new Map());
      }
      for (const r of rawRooms) {
        const oRooms = outletRoomsMap.get(r.kode_outlet);
        if (oRooms && r.room_id) {
          oRooms.set(r.room_id.trim().toUpperCase(), r);
        }
      }

      // =========================================================================
      // 3. SINGLE-PASS LINEAR AGGREGATION: O(O + T + D + P + R)
      // =========================================================================

      // Initialize Outlet Metrics Map in O(O)
      const outletMap = new Map<string, OutletCardMetrics>();
      for (const outlet of rawOutlets) {
        outletMap.set(outlet.kode_outlet, {
          outlet,
          totalSales: 0,
          cashOnHand: 0,
          gcPayment: 0,
          gcPaymentCount: 0,
          activeGuests: 0,
          completedGuests: 0,
          rejectionCount: 0,
          categoryMix: createEmptyCategoryMix(),
          topItems: [],
          targetSales: DEFAULT_TARGET_SALES[outlet.kode_outlet] || 10000000,
          progressPercent: 0,
          hrMetrics: createEmptyHRMetrics(),
          roomMetrics: createEmptyRoomMetrics(),
          therapistMetrics: createEmptyTherapistMetrics(),
        });
      }

      // Global Accumulators
      let globalActiveCheckIns = 0;
      let globalCompletedTransactions = 0;
      let globalTotalSales = 0;
      let globalCashOnHand = 0;
      let globalGCPayment = 0;
      let globalGCPaymentCount = 0;
      let globalTotalDiscounts = 0;
      let globalTotalPromos = 0;
      let globalTotalRejections = 0;

      // Master typejasa lookup map for detail category resolution
      const masterTypeMap = new Map<string, string>();

      // Track active rooms and active therapists currently on-treatment (status_trans = STARTED)
      // Map<kode_outlet, Set<room_id>>
      const activeRoomsUsedMap = new Map<string, Set<string>>();
      // Map<kode_outlet, { activeRF: Set<kodekaryawan>, activeBM: Set<kodekaryawan> }>
      const activeTherapistsWorkingMap = new Map<string, { rf: Set<string>; bm: Set<string> }>();

      for (const outlet of rawOutlets) {
        activeRoomsUsedMap.set(outlet.kode_outlet, new Set());
        activeTherapistsWorkingMap.set(outlet.kode_outlet, { rf: new Set(), bm: new Set() });
      }

      // Process Trans Master in O(T)
      for (const m of rawMasters) {
        if (!outletMap.has(m.kode_outlet)) continue;
        if (m.tanggal && m.tanggal !== localDateStr) continue;

        const subtotal = Number(m.subtotal) || 0;
        if (subtotal < 0) continue;

        const rawTypeJasa = (m.typejasa || '').trim().toUpperCase();
        if (rawTypeJasa) {
          masterTypeMap.set(m.trans_id, rawTypeJasa);
        }

        const isTargetOutlet = selectedOutletCode === 'ALL' || m.kode_outlet === selectedOutletCode;
        const statusUpper = (m.status_trans || '').trim().toUpperCase();
        const isStarted = statusUpper === 'STARTED' && subtotal > 0;
        const isCompleted = statusUpper === 'PAID' || statusUpper === 'CHECKOUT' || statusUpper === 'FINISHED';

        if (isTargetOutlet) {
          if (isStarted) globalActiveCheckIns++;
          if (isCompleted && subtotal > 0) globalCompletedTransactions++;
        }

        const outletMetrics = outletMap.get(m.kode_outlet);
        if (outletMetrics) {
          if (isStarted) outletMetrics.activeGuests++;
          if (isCompleted && subtotal > 0) outletMetrics.completedGuests++;
        }

        // Room & Therapist live occupancy tracking for active transactions
        if (isStarted) {
          // Track room
          if (m.room_id && m.room_id.trim() !== '') {
            const cleanRoomId = m.room_id.trim().toUpperCase();
            activeRoomsUsedMap.get(m.kode_outlet)?.add(cleanRoomId);
          }
          // Track therapist: TR = RF (Reflexology/Foot), TB = BM (Body Massage)
          if (m.kodekaryawan && m.kodekaryawan.trim() !== '') {
            const cleanKaryawan = m.kodekaryawan.trim().toUpperCase();
            const isRF = rawTypeJasa.startsWith('RF') || rawTypeJasa.includes('REFLEX');
            const thMap = activeTherapistsWorkingMap.get(m.kode_outlet);
            if (isRF) {
              thMap?.rf.add(cleanKaryawan);
            } else {
              thMap?.bm.add(cleanKaryawan);
            }
          }
        }
      }

      // Process Trans Details in O(D)
      const globalCategoryMix = createEmptyCategoryMix();
      const globalItemCounts = new Map<string, number>();
      const outletItemMaps = new Map<string, Map<string, number>>();

      for (const d of rawDetails) {
        if (!outletMap.has(d.kode_outlet)) continue;
        if (d.tanggal && d.tanggal !== localDateStr) continue;

        const isTargetOutlet = selectedOutletCode === 'ALL' || d.kode_outlet === selectedOutletCode;
        const qty = Number(d.qty) || 1;
        const rawNama = d.produk_jasa_nama && d.produk_jasa_nama.trim() !== '' ? d.produk_jasa_nama.trim() : null;

        let catCode: 'BJ' | 'BA' | 'BP' | 'BG' = 'BJ';
        const rawType = (d.trans_type_id || '').trim().toUpperCase();

        if (rawType === 'BA') {
          catCode = 'BA'; // Additional
        } else if (rawType === 'BG') {
          catCode = 'BG'; // GC Sales
        } else if (rawType === 'BP' || rawType === 'PR') {
          catCode = 'BP'; // Product
        } else {
          catCode = 'BJ'; // Foot & Body
        }

        // Global metrics accumulation
        if (isTargetOutlet) {
          if (rawNama) {
            globalItemCounts.set(rawNama, (globalItemCounts.get(rawNama) || 0) + qty);
          }
          if (catCode === 'BJ') { globalCategoryMix.footAndBody += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'BA') { globalCategoryMix.additional += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'BP') { globalCategoryMix.product += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'BG') { globalCategoryMix.gcSales += qty; globalCategoryMix.total += qty; }
        }

        // Per-outlet metrics accumulation
        const outletMetrics = outletMap.get(d.kode_outlet);
        if (outletMetrics) {
          if (catCode === 'BJ') { outletMetrics.categoryMix.footAndBody += qty; outletMetrics.categoryMix.total += qty; }
          else if (catCode === 'BA') { outletMetrics.categoryMix.additional += qty; outletMetrics.categoryMix.total += qty; }
          else if (catCode === 'BP') { outletMetrics.categoryMix.product += qty; outletMetrics.categoryMix.total += qty; }
          else if (catCode === 'BG') { outletMetrics.categoryMix.gcSales += qty; outletMetrics.categoryMix.total += qty; }

          if (rawNama) {
            let oItemMap = outletItemMaps.get(d.kode_outlet);
            if (!oItemMap) {
              oItemMap = new Map();
              outletItemMaps.set(d.kode_outlet, oItemMap);
            }
            oItemMap.set(rawNama, (oItemMap.get(rawNama) || 0) + qty);
          }
        }
      }

      // Attach ALL sorted items to each outlet (No slice - complete ranking)
      for (const [outletCode, oMap] of outletItemMaps.entries()) {
        const oMetrics = outletMap.get(outletCode);
        if (oMetrics) {
          oMetrics.topItems = Array.from(oMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        }
      }

      // Top items for global summary (Complete ranking sorted by QTY descending - No slice limit)
      const globalTopItems: ItemRankItem[] = Array.from(globalItemCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Process Payments & Payment Merging in O(P)
      const paymentMethodMap = new Map<string, { total: number; count: number }>();
      const promoImpactMap = new Map<string, { totalDiscount: number; usageCount: number }>();

      for (const p of rawPayments) {
        if (!outletMap.has(p.kode_outlet)) continue;
        if (p.tanggal && p.tanggal !== localDateStr && !p.id_payment.includes(`.PAY.${yymmdd}`)) continue;

        const isTargetOutlet = selectedOutletCode === 'ALL' || p.kode_outlet === selectedOutletCode;
        const amountTotal = Number(p.total) || 0;
        const amountCash = Number(p.vcash) || 0;
        const amountDisc = Number(p.vdisc) || 0;
        const amountPromo = Number(p.vpromo) || 0;

        if (isTargetOutlet) {
          globalTotalSales += amountTotal;
          globalCashOnHand += amountCash;
          globalTotalDiscounts += amountDisc;
          globalTotalPromos += amountPromo;

          // Merge Payment Methods Logic
          if (amountCash > 0) {
            const entry = paymentMethodMap.get('CASH') || { total: 0, count: 0 };
            entry.total += amountCash;
            entry.count += 1;
            paymentMethodMap.set('CASH', entry);
          }

          const p1Amount = Number(p.vpayment1) || 0;
          if (p.payment1 && p1Amount > 0) {
            const label = `${p.payment1} ${p.bank1 ? `(${p.bank1})` : ''}`.trim().toUpperCase();
            const entry = paymentMethodMap.get(label) || { total: 0, count: 0 };
            entry.total += p1Amount;
            entry.count += 1;
            paymentMethodMap.set(label, entry);
          }

          const p2Amount = Number(p.vpayment2) || 0;
          if (p.payment2 && p2Amount > 0) {
            const label = `${p.payment2} ${p.bank2 ? `(${p.bank2})` : ''}`.trim().toUpperCase();
            const entry = paymentMethodMap.get(label) || { total: 0, count: 0 };
            entry.total += p2Amount;
            entry.count += 1;
            paymentMethodMap.set(label, entry);
          }

          const vGift = Number(p.vgift) || 0;
          if (vGift > 0) {
            globalGCPayment += vGift;
            globalGCPaymentCount += 1;

            const label = 'GC Payment';
            const entry = paymentMethodMap.get(label) || { total: 0, count: 0 };
            entry.total += vGift;
            entry.count += 1;
            paymentMethodMap.set(label, entry);
          }

          if (p.namapromo && p.namapromo.trim() !== '' && p.namapromo.toUpperCase() !== '(NONE)') {
            const promoKey = p.namapromo.trim();
            const pEntry = promoImpactMap.get(promoKey) || { totalDiscount: 0, usageCount: 0 };
            pEntry.totalDiscount += amountPromo > 0 ? amountPromo : amountDisc;
            pEntry.usageCount += 1;
            promoImpactMap.set(promoKey, pEntry);
          }
        }

        const outletMetrics = outletMap.get(p.kode_outlet);
        if (outletMetrics) {
          outletMetrics.totalSales += amountTotal;
          outletMetrics.cashOnHand += amountCash;
          const vGift = Number(p.vgift) || 0;
          if (vGift > 0) {
            outletMetrics.gcPayment += vGift;
            outletMetrics.gcPaymentCount += 1;
          }
        }
      }

      // Process Rejections in O(R)
      const rejectionReasonMap = new Map<string, { count: number; services: Set<string> }>();

      for (const r of rawRejects) {
        if (!outletMap.has(r.kode_outlet)) continue;
        const rDate = r.tanggal || (r.reject_date || '').slice(0, 10);
        if (rDate && rDate !== localDateStr) continue;

        const isTargetOutlet = selectedOutletCode === 'ALL' || r.kode_outlet === selectedOutletCode;
        if (isTargetOutlet) {
          globalTotalRejections++;
          const reasonLabel = (r.reason && r.reason.trim()) ? r.reason.trim() : 'Unspecified Reason';
          const rEntry = rejectionReasonMap.get(reasonLabel) || { count: 0, services: new Set() };
          rEntry.count++;
          if (r.jenis_jasa) rEntry.services.add(r.jenis_jasa);
          rejectionReasonMap.set(reasonLabel, rEntry);
        }

        const outletMetrics = outletMap.get(r.kode_outlet);
        if (outletMetrics) {
          outletMetrics.rejectionCount++;
        }
      }

      // =========================================================================
      // 4. ATTACH HR, ROOM & THERAPIST METRICS PER OUTLET & COMPUTE TOTALS
      // =========================================================================
      let globalActiveTR = 0;
      let globalActiveTB = 0;
      let globalTotalActiveStaff = 0;
      const globalDeptMap = new Map<string, number>();

      let globalTotalRooms = 0;
      let globalRoomsBM = 0;
      let globalRoomsRF = 0;
      let globalUsedRooms = 0;
      let globalUsedBM = 0;
      let globalUsedRF = 0;

      let globalOnTreatmentRF = 0;
      let globalOnTreatmentBM = 0;

      for (const outlet of rawOutlets) {
        const oMetrics = outletMap.get(outlet.kode_outlet)!;
        const oHR = outletHRData.get(outlet.kode_outlet) || {
          activeTR: 0,
          activeTB: 0,
          totalActive: 0,
          deptMap: new Map(),
        };

        // Format HR department staff list
        const departments: { departemen: string; label: string; count: number }[] = Array.from(
          oHR.deptMap.entries()
        )
          .map(([dept, count]) => ({
            departemen: dept,
            label: DEPT_LABELS[dept] || dept,
            count,
          }))
          .sort((a, b) => b.count - a.count);

        oMetrics.hrMetrics = {
          totalActiveStaff: oHR.totalActive,
          activeTR: oHR.activeTR,
          activeTB: oHR.activeTB,
          departments,
        };

        // Accumulate global HR metrics
        globalActiveTR += oHR.activeTR;
        globalActiveTB += oHR.activeTB;
        globalTotalActiveStaff += oHR.totalActive;
        for (const [dept, count] of oHR.deptMap.entries()) {
          globalDeptMap.set(dept, (globalDeptMap.get(dept) || 0) + count);
        }

        // Room Calculations for Outlet
        const oRoomsMap = outletRoomsMap.get(outlet.kode_outlet) || new Map();
        let totalRooms = oRoomsMap.size;
        let roomsBM = 0;
        let roomsRF = 0;

        for (const r of oRoomsMap.values()) {
          const type = (r.jenis_jasa || '').trim().toUpperCase();
          if (type === 'RF' || type.includes('REFLEX')) {
            roomsRF++;
          } else {
            roomsBM++;
          }
        }

        const usedRoomsSet = activeRoomsUsedMap.get(outlet.kode_outlet) || new Set();
        let usedBM = 0;
        let usedRF = 0;

        for (const roomId of usedRoomsSet) {
          const roomObj = oRoomsMap.get(roomId);
          if (roomObj) {
            const rType = (roomObj.jenis_jasa || '').trim().toUpperCase();
            if (rType === 'RF' || rType.includes('REFLEX')) usedRF++;
            else usedBM++;
          } else {
            // Fallback assumption: if room id not in master room, count as BM
            usedBM++;
          }
        }

        const usedRooms = usedRoomsSet.size;
        const availableRooms = Math.max(0, totalRooms - usedRooms);
        const availableBM = Math.max(0, roomsBM - usedBM);
        const availableRF = Math.max(0, roomsRF - usedRF);
        const occupancyPercent = totalRooms > 0 ? Math.round((usedRooms / totalRooms) * 100) : 0;
        const cumulativeTurnover =
          totalRooms > 0
            ? Math.round(((oMetrics.completedGuests + oMetrics.activeGuests) / totalRooms) * 10) / 10
            : 0;

        oMetrics.roomMetrics = {
          totalRooms,
          roomsBM,
          roomsRF,
          usedRooms,
          usedBM,
          usedRF,
          availableRooms,
          availableBM,
          availableRF,
          occupancyPercent,
          cumulativeTurnover,
        };

        // Accumulate global room counts
        globalTotalRooms += totalRooms;
        globalRoomsBM += roomsBM;
        globalRoomsRF += roomsRF;
        globalUsedRooms += usedRooms;
        globalUsedBM += usedBM;
        globalUsedRF += usedRF;

        // Therapist Calculations for Outlet
        const inChargeTR = oHR.activeTR; // Foot
        const inChargeTB = oHR.activeTB; // Body
        const totalInCharge = inChargeTR + inChargeTB;

        const thWorking = activeTherapistsWorkingMap.get(outlet.kode_outlet) || {
          rf: new Set(),
          bm: new Set(),
        };
        const onTreatmentRF = thWorking.rf.size;
        const onTreatmentBM = thWorking.bm.size;
        const totalOnTreatment = onTreatmentRF + onTreatmentBM;

        const availableTR = Math.max(0, inChargeTR - onTreatmentRF);
        const availableTB = Math.max(0, inChargeTB - onTreatmentBM);
        const totalAvailable = availableTR + availableTB;
        const utilizationPercent =
          totalInCharge > 0 ? Math.round((totalOnTreatment / totalInCharge) * 100) : 0;
        const cumulativeProductivity =
          totalInCharge > 0
            ? Math.round(((oMetrics.completedGuests + oMetrics.activeGuests) / totalInCharge) * 10) / 10
            : 0;

        oMetrics.therapistMetrics = {
          inChargeTR,
          inChargeTB,
          totalInCharge,
          onTreatmentRF,
          onTreatmentBM,
          totalOnTreatment,
          availableTR,
          availableTB,
          totalAvailable,
          utilizationPercent,
          cumulativeProductivity,
        };

        globalOnTreatmentRF += onTreatmentRF;
        globalOnTreatmentBM += onTreatmentBM;
      }

      // Calculate progress percentages
      const computedOutlets = Array.from(outletMap.values()).map((item) => {
        const target = item.targetSales || 10000000;
        const progress = Math.min(100, Math.round((item.totalSales / target) * 100));
        return {
          ...item,
          progressPercent: progress,
        };
      });

      // Format payment breakdown
      const paymentBreakdown: PaymentMethodItem[] = Array.from(paymentMethodMap.entries())
        .map(([method, val]) => ({
          method,
          total: val.total,
          count: val.count,
        }))
        .sort((a, b) => b.total - a.total);

      // Format promo impact
      const promoImpact: PromoImpactItem[] = Array.from(promoImpactMap.entries())
        .map(([promoName, val]) => ({
          promoName,
          totalDiscount: val.totalDiscount,
          usageCount: val.usageCount,
        }))
        .sort((a, b) => b.totalDiscount - a.totalDiscount);

      // Format rejection reasons
      const rejectionReasons: RejectionReasonItem[] = Array.from(rejectionReasonMap.entries())
        .map(([reason, val]) => ({
          reason,
          count: val.count,
          serviceTypes: Array.from(val.services),
        }))
        .sort((a, b) => b.count - a.count);

      // Global HR & Room & Therapist Summaries
      const targetOutletMetrics =
        selectedOutletCode === 'ALL' ? null : outletMap.get(selectedOutletCode);

      const summaryHRMetrics: OutletHRMetrics = targetOutletMetrics?.hrMetrics || {
        totalActiveStaff: globalTotalActiveStaff,
        activeTR: globalActiveTR,
        activeTB: globalActiveTB,
        departments: Array.from(globalDeptMap.entries())
          .map(([dept, count]) => ({
            departemen: dept,
            label: DEPT_LABELS[dept] || dept,
            count,
          }))
          .sort((a, b) => b.count - a.count),
      };

      const summaryRoomMetrics: OutletRoomMetrics = targetOutletMetrics?.roomMetrics || {
        totalRooms: globalTotalRooms,
        roomsBM: globalRoomsBM,
        roomsRF: globalRoomsRF,
        usedRooms: globalUsedRooms,
        usedBM: globalUsedBM,
        usedRF: globalUsedRF,
        availableRooms: Math.max(0, globalTotalRooms - globalUsedRooms),
        availableBM: Math.max(0, globalRoomsBM - globalUsedBM),
        availableRF: Math.max(0, globalRoomsRF - globalUsedRF),
        occupancyPercent: globalTotalRooms > 0 ? Math.round((globalUsedRooms / globalTotalRooms) * 100) : 0,
        cumulativeTurnover:
          globalTotalRooms > 0
            ? Math.round(((globalCompletedTransactions + globalActiveCheckIns) / globalTotalRooms) * 10) / 10
            : 0,
      };

      const globalTotalInCharge = globalActiveTR + globalActiveTB;
      const globalTotalOnTreatment = globalOnTreatmentRF + globalOnTreatmentBM;
      const summaryTherapistMetrics: OutletTherapistMetrics = targetOutletMetrics?.therapistMetrics || {
        inChargeTR: globalActiveTR,
        inChargeTB: globalActiveTB,
        totalInCharge: globalTotalInCharge,
        onTreatmentRF: globalOnTreatmentRF,
        onTreatmentBM: globalOnTreatmentBM,
        totalOnTreatment: globalTotalOnTreatment,
        availableTR: Math.max(0, globalActiveTR - globalOnTreatmentRF),
        availableTB: Math.max(0, globalActiveTB - globalOnTreatmentBM),
        totalAvailable: Math.max(0, globalTotalInCharge - globalTotalOnTreatment),
        utilizationPercent:
          globalTotalInCharge > 0 ? Math.round((globalTotalOnTreatment / globalTotalInCharge) * 100) : 0,
        cumulativeProductivity:
          globalTotalInCharge > 0
            ? Math.round(((globalCompletedTransactions + globalActiveCheckIns) / globalTotalInCharge) * 10) / 10
            : 0,
      };

      const summary: GlobalGardenSummary = {
        totalSales: globalTotalSales,
        cashOnHand: globalCashOnHand,
        gcPayment: globalGCPayment,
        gcPaymentCount: globalGCPaymentCount,
        activeCheckIns: globalActiveCheckIns,
        completedTransactions: globalCompletedTransactions,
        totalDiscounts: globalTotalDiscounts,
        totalPromos: globalTotalPromos,
        totalRejections: globalTotalRejections,
        categoryMix: globalCategoryMix,
        topItems: globalTopItems,
        hrMetrics: summaryHRMetrics,
        roomMetrics: summaryRoomMetrics,
        therapistMetrics: summaryTherapistMetrics,
      };

      setData({
        loading: false,
        error: null,
        lastUpdated: new Date(),
        summary,
        outlets: computedOutlets,
        paymentBreakdown,
        promoImpact,
        rejectionReasons,
        allActiveOutlets: rawOutlets,
      });
      setCountdown(30);
    } catch (err: any) {
      console.error('Failed to fetch Zen Dashboard data:', err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Unknown network error',
      }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [selectedOutletCode, activeDateStr]);


  // Initial Fetch & Active Window Timer
  useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  // Auto-refresh Interval with tab-visibility pause
  useEffect(() => {
    const timer = setInterval(() => {
      // Pause countdown if user switched tabs
      if (document.visibilityState !== 'visible') return;

      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardMetrics();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchDashboardMetrics]);

  return {
    ...data,
    countdown,
    refresh: fetchDashboardMetrics,
    selectedDate: activeDateStr,
    setSelectedDate: setUserDateOverride,
    isOvernightWindow,
    resetToAutoDate: () => setUserDateOverride(null),
    isCustomDate: userDateOverride !== null,
  };
}
