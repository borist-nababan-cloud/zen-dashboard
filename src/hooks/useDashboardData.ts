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
} from '../types/dashboard';

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

const createEmptyCategoryMix = (): CategoryMix => ({
  bodyMassage: 0,
  footReflexology: 0,
  additional: 0,
  product: 0,
  gcSales: 0,
  total: 0,
});

export function useDashboardData(selectedOutletCode: string = 'ALL') {
  const [data, setData] = useState<DashboardDataState>({
    loading: true,
    error: null,
    lastUpdated: null,
    summary: {
      totalSales: 0,
      cashOnHand: 0,
      activeCheckIns: 0,
      completedTransactions: 0,
      totalDiscounts: 0,
      totalPromos: 0,
      totalRejections: 0,
      categoryMix: createEmptyCategoryMix(),
      topItems: [],
    },
    outlets: [],
    paymentBreakdown: [],
    promoImpact: [],
    rejectionReasons: [],
    allActiveOutlets: [],
  });

  const [countdown, setCountdown] = useState<number>(30);
  const isFetchingRef = useRef(false);

  // Timezone-aware date calculations (Local Browser Timezone -> UTC Bounds)
  const getTodayBounds = () => {
    const now = new Date();
    
    // Local YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    const yearShort = String(year).slice(-2);
    const yymmdd = `${yearShort}${month}${day}`;

    // Start of Day in Local Timezone
    const startLocal = new Date(year, now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // End of Day in Local Timezone
    const endLocal = new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return {
      localDateStr,
      yymmdd,
      startUTCISO: startLocal.toISOString(),
      endUTCISO: endLocal.toISOString(),
    };
  };

  const fetchDashboardMetrics = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setData((prev) => ({ ...prev, loading: prev.lastUpdated === null }));
      const { localDateStr, yymmdd, startUTCISO, endUTCISO } = getTodayBounds();

      // Parallel Network Execution: Exactly 5 queries (O(1) roundtrip)
      const [
        outletsRes,
        masterTransRes,
        detailsRes,
        paymentDetailsRes,
        rejectsRes
      ] = await Promise.all([
        // 1. Master Outlets (Active Only)
        supabase
          .from('master_outlet')
          .select('kode_outlet, name_outlet, alamat, no_telp, city, province, active')
          .eq('active', true)
          .order('kode_outlet', { ascending: true }),

        // 2. POS Trans Master for Today (filtered by local date)
        supabase
          .from('ot_pos_trans_master')
          .select('trans_id, kode_outlet, tanggal, start_time, end_time, status_trans, nama_customer, room_id, subtotal, kodekaryawan, byrequest, typejasa, rcpt, id_payment, user_uid')
          .eq('tanggal', localDateStr),

        // 3. POS Trans Detail for Today (products, treatments, additional, GC)
        supabase
          .from('ot_pos_trans_detail')
          .select('trans_id, kode_outlet, tanggal, trans_type_id, produk_jasa_id, produk_jasa_nama, qty, price, subtotal')
          .eq('tanggal', localDateStr),

        // 4. POS Trans Payment Details (Filtered by business payment code YYMMDD, e.g. %.PAY.261016%)
        supabase
          .from('ot_pos_trans_payment_details')
          .select('id_payment, kode_outlet, namapromo, refpromo, vpromo, refdisc, vdisc, total, vredeem, refgift, vgift, vcash, payment1, bank1, refpayment1, vpayment1, payment2, bank2, refpayment2, vpayment2, rcpt, created_at')
          .like('id_payment', `%.PAY.${yymmdd}%`),

        // 5. POS Trans Rejection / Walk-in cancellations (Today's rejects)
        supabase
          .from('ot_pos_trans_reject')
          .select('local_autonum, kode_outlet, jenis_jasa, reason, reject_date, lasteditdate')
          .gte('reject_date', startUTCISO)
          .lte('reject_date', endUTCISO)
      ]);

      if (outletsRes.error) throw new Error(`Outlets Error: ${outletsRes.error.message}`);
      if (masterTransRes.error) throw new Error(`Trans Master Error: ${masterTransRes.error.message}`);
      if (detailsRes.error) throw new Error(`Trans Detail Error: ${detailsRes.error.message}`);
      if (paymentDetailsRes.error) throw new Error(`Payment Details Error: ${paymentDetailsRes.error.message}`);
      if (rejectsRes.error) throw new Error(`Rejections Error: ${rejectsRes.error.message}`);

      const rawOutlets: MasterOutlet[] = (outletsRes.data as MasterOutlet[]) || [];
      const rawMasters: PosTransMaster[] = (masterTransRes.data as PosTransMaster[]) || [];
      const rawDetails: PosTransDetail[] = (detailsRes.data as PosTransDetail[]) || [];
      let rawPayments: PosPaymentDetails[] = (paymentDetailsRes.data as PosPaymentDetails[]) || [];
      const rawRejects: PosTransReject[] = (rejectsRes.data as PosTransReject[]) || [];

      // Combine with any additional linked payments from today's master transactions
      const existingPayIds = new Set(rawPayments.map((p) => p.id_payment));
      const masterPayIds = Array.from(
        new Set(rawMasters.map((m) => m.id_payment).filter((id): id is string => Boolean(id) && !existingPayIds.has(id)))
      );

      if (masterPayIds.length > 0) {
        const { data: extraPayments } = await supabase
          .from('ot_pos_trans_payment_details')
          .select('id_payment, kode_outlet, namapromo, refpromo, vpromo, refdisc, vdisc, total, vredeem, refgift, vgift, vcash, payment1, bank1, refpayment1, vpayment1, payment2, bank2, refpayment2, vpayment2, rcpt, created_at')
          .in('id_payment', masterPayIds);
        if (extraPayments && extraPayments.length > 0) {
          rawPayments = [...rawPayments, ...(extraPayments as PosPaymentDetails[])];
        }
      }

      // =========================================================================
      // SINGLE-PASS LINEAR AGGREGATION: O(O + T + D + P + R)
      // =========================================================================

      // 1. Initialize Outlet Metrics Map in O(O)
      const outletMap = new Map<string, OutletCardMetrics>();
      for (const outlet of rawOutlets) {
        outletMap.set(outlet.kode_outlet, {
          outlet,
          totalSales: 0,
          cashOnHand: 0,
          activeGuests: 0,
          completedGuests: 0,
          rejectionCount: 0,
          categoryMix: createEmptyCategoryMix(),
          topItems: [],
          targetSales: DEFAULT_TARGET_SALES[outlet.kode_outlet] || 10000000,
          progressPercent: 0,
        });
      }

      // Global Accumulators
      let globalActiveCheckIns = 0;
      let globalCompletedTransactions = 0;
      let globalTotalSales = 0;
      let globalCashOnHand = 0;
      let globalTotalDiscounts = 0;
      let globalTotalPromos = 0;
      let globalTotalRejections = 0;

      // Master typejasa lookup map for detail category resolution
      const masterTypeMap = new Map<string, string>();

      // 2. Process Trans Master in O(T)
      for (const m of rawMasters) {
        if (m.typejasa) {
          masterTypeMap.set(m.trans_id, m.typejasa.trim().toUpperCase());
        }

        const isTargetOutlet = selectedOutletCode === 'ALL' || m.kode_outlet === selectedOutletCode;
        const statusUpper = (m.status_trans || '').toUpperCase();
        const isStarted = statusUpper === 'STARTED' || statusUpper === 'CHECKIN' || statusUpper === 'IN_PROGRESS';
        const isCompleted = statusUpper === 'PAID' || statusUpper === 'CHECKOUT' || statusUpper === 'FINISHED';

        if (isTargetOutlet) {
          if (isStarted) globalActiveCheckIns++;
          if (isCompleted) globalCompletedTransactions++;
        }

        const outletMetrics = outletMap.get(m.kode_outlet);
        if (outletMetrics) {
          if (isStarted) outletMetrics.activeGuests++;
          if (isCompleted) outletMetrics.completedGuests++;
        }
      }

      // 3. Process Trans Details in O(D)
      // Map categories:
      // "BM" : "Body Massage"
      // "RF" : "Foot Reflexology"
      // "BA" : "Additional"
      // "PR" / "BP" : "Product"
      // "BG" : "GC Sales"
      const globalCategoryMix = createEmptyCategoryMix();
      const globalItemCounts = new Map<string, number>();
      const outletItemMaps = new Map<string, Map<string, number>>();

      for (const d of rawDetails) {
        const isTargetOutlet = selectedOutletCode === 'ALL' || d.kode_outlet === selectedOutletCode;
        const qty = Number(d.qty) || 1;
        const rawNama = d.produk_jasa_nama && d.produk_jasa_nama.trim() !== '' ? d.produk_jasa_nama.trim() : null;

        let catCode: 'BM' | 'RF' | 'BA' | 'PR' | 'BG' | null = null;
        const rawType = (d.trans_type_id || '').trim().toUpperCase();

        if (rawType === 'BA') {
          catCode = 'BA'; // Additional
        } else if (rawType === 'BP' || rawType === 'PR') {
          catCode = 'PR'; // Product
        } else if (rawType === 'BG') {
          catCode = 'BG'; // GC Sales
        } else if (rawType === 'BM') {
          catCode = 'BM'; // Body Massage
        } else if (rawType === 'RF') {
          catCode = 'RF'; // Foot Reflexology
        } else if (rawType === 'BJ') {
          // Jasa / Service: resolve via master transaction typejasa or heuristics
          const mType = masterTypeMap.get(d.trans_id);
          if (mType === 'BM' || mType === 'RF') {
            catCode = mType;
          } else if (rawNama) {
            const upperNama = rawNama.toUpperCase();
            if (upperNama.includes('FOOT') || upperNama.includes('REFLEX') || upperNama.includes('RF')) {
              catCode = 'RF';
            } else {
              catCode = 'BM';
            }
          } else {
            catCode = 'BM';
          }
        }

        // Global metrics accumulation
        if (isTargetOutlet) {
          if (rawNama) {
            globalItemCounts.set(rawNama, (globalItemCounts.get(rawNama) || 0) + qty);
          }
          if (catCode === 'BM') { globalCategoryMix.bodyMassage += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'RF') { globalCategoryMix.footReflexology += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'BA') { globalCategoryMix.additional += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'PR') { globalCategoryMix.product += qty; globalCategoryMix.total += qty; }
          else if (catCode === 'BG') { globalCategoryMix.gcSales += qty; globalCategoryMix.total += qty; }
        }

        // Per-outlet metrics accumulation
        const outletMetrics = outletMap.get(d.kode_outlet);
        if (outletMetrics) {
          if (catCode === 'BM') { outletMetrics.categoryMix.bodyMassage += qty; outletMetrics.categoryMix.total += qty; }
          else if (catCode === 'RF') { outletMetrics.categoryMix.footReflexology += qty; outletMetrics.categoryMix.total += qty; }
          else if (catCode === 'BA') { outletMetrics.categoryMix.additional += qty; outletMetrics.categoryMix.total += qty; }
          else if (catCode === 'PR') { outletMetrics.categoryMix.product += qty; outletMetrics.categoryMix.total += qty; }
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

      // Attach top items to each outlet
      for (const [outletCode, oMap] of outletItemMaps.entries()) {
        const oMetrics = outletMap.get(outletCode);
        if (oMetrics) {
          oMetrics.topItems = Array.from(oMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        }
      }

      // Top items for global summary
      const globalTopItems: ItemRankItem[] = Array.from(globalItemCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // 4. Process Payments & Payment Merging in O(P)
      const paymentMethodMap = new Map<string, { total: number; count: number }>();
      const promoImpactMap = new Map<string, { totalDiscount: number; usageCount: number }>();

      for (const p of rawPayments) {
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

          // Merge Payment Methods Logic (Payment1 + Payment2 + Cash + Gift)
          // A. Cash
          if (amountCash > 0) {
            const entry = paymentMethodMap.get('CASH') || { total: 0, count: 0 };
            entry.total += amountCash;
            entry.count += 1;
            paymentMethodMap.set('CASH', entry);
          }

          // B. Payment 1 (EDC / QRIS / Transfer)
          const p1Amount = Number(p.vpayment1) || 0;
          if (p.payment1 && p1Amount > 0) {
            const label = `${p.payment1} ${p.bank1 ? `(${p.bank1})` : ''}`.trim().toUpperCase();
            const entry = paymentMethodMap.get(label) || { total: 0, count: 0 };
            entry.total += p1Amount;
            entry.count += 1;
            paymentMethodMap.set(label, entry);
          }

          // C. Payment 2 (Split bill tender)
          const p2Amount = Number(p.vpayment2) || 0;
          if (p.payment2 && p2Amount > 0) {
            const label = `${p.payment2} ${p.bank2 ? `(${p.bank2})` : ''}`.trim().toUpperCase();
            const entry = paymentMethodMap.get(label) || { total: 0, count: 0 };
            entry.total += p2Amount;
            entry.count += 1;
            paymentMethodMap.set(label, entry);
          }

          // D. Gift voucher
          const vGift = Number(p.vgift) || 0;
          if (vGift > 0) {
            const label = 'GIFT CERTIFICATE / VOUCHER';
            const entry = paymentMethodMap.get(label) || { total: 0, count: 0 };
            entry.total += vGift;
            entry.count += 1;
            paymentMethodMap.set(label, entry);
          }

          // Promo tracking
          if (p.namapromo && p.namapromo.trim() !== '' && p.namapromo.toUpperCase() !== '(NONE)') {
            const promoKey = p.namapromo.trim();
            const pEntry = promoImpactMap.get(promoKey) || { totalDiscount: 0, usageCount: 0 };
            pEntry.totalDiscount += amountPromo > 0 ? amountPromo : amountDisc;
            pEntry.usageCount += 1;
            promoImpactMap.set(promoKey, pEntry);
          }
        }

        // Per-outlet financial tracking
        const outletMetrics = outletMap.get(p.kode_outlet);
        if (outletMetrics) {
          outletMetrics.totalSales += amountTotal;
          outletMetrics.cashOnHand += amountCash;
        }
      }

      // 5. Process Rejections in O(R)
      const rejectionReasonMap = new Map<string, { count: number; services: Set<string> }>();

      for (const r of rawRejects) {
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

      const summary: GlobalGardenSummary = {
        totalSales: globalTotalSales,
        cashOnHand: globalCashOnHand,
        activeCheckIns: globalActiveCheckIns,
        completedTransactions: globalCompletedTransactions,
        totalDiscounts: globalTotalDiscounts,
        totalPromos: globalTotalPromos,
        totalRejections: globalTotalRejections,
        categoryMix: globalCategoryMix,
        topItems: globalTopItems,
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
  }, [selectedOutletCode]);

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
  };
}
