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

const createEmptyCategoryMix = (): CategoryMix => ({
  footAndBody: 0,
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
      gcPayment: 0,
      gcPaymentCount: 0,
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
      const { localDateStr, yymmdd, startTimestamp, endTimestamp } = getOperationalBounds(activeDateStr);

      // Parallel Network Execution: Outlets, Master, Details, Payments, Rejections, GC Payments
      const [
        outletsRes,
        masterTransRes,
        detailsRes,
        paymentDetailsRes,
        rejectsRes,
        gcPaymentsRes
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
          .order('created_at', { ascending: false })
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
      // SINGLE-PASS LINEAR AGGREGATION: O(O + T + D + P + R)
      // =========================================================================

      // 1. Initialize Outlet Metrics Map in O(O)
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

      // 2. Process Trans Master in O(T)
      for (const m of rawMasters) {
        // Enforce active outlet membership
        if (!outletMap.has(m.kode_outlet)) continue;

        // Defensive date guard: ensure master belongs to operational date
        if (m.tanggal && m.tanggal !== localDateStr) continue;

        const subtotal = Number(m.subtotal) || 0;
        // Only exclude negative subtotal amounts (voided/refunded)
        if (subtotal < 0) continue;

        if (m.typejasa) {
          masterTypeMap.set(m.trans_id, m.typejasa.trim().toUpperCase());
        }

        const isTargetOutlet = selectedOutletCode === 'ALL' || m.kode_outlet === selectedOutletCode;
        const statusUpper = (m.status_trans || '').trim().toUpperCase();
        // Active In-Service: Only active in-service guests with status STARTED and subtotal > 0 (strictly excluding subtotal = 0)
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
      }

      // 3. Process Trans Details in O(D)
      // Standard categories per user specification:
      // "BA" : Additional
      // "BG" : GC Sales
      // "BJ" : Foot & Body (also maps legacy BM, RF)
      // "BP" : Product (also maps legacy PR)
      const globalCategoryMix = createEmptyCategoryMix();
      const globalItemCounts = new Map<string, number>();
      const outletItemMaps = new Map<string, Map<string, number>>();

      for (const d of rawDetails) {
        // Enforce active outlet membership
        if (!outletMap.has(d.kode_outlet)) continue;

        // Defensive date guard: ensure detail belongs to operational date
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
          // 'BJ', 'BM', 'RF', or any service
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
        // Enforce active outlet membership
        if (!outletMap.has(p.kode_outlet)) continue;

        // Defensive date guard: ensure payment belongs to operational date
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

          // D. Gift voucher (GC Payment)
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
          const vGift = Number(p.vgift) || 0;
          if (vGift > 0) {
            outletMetrics.gcPayment += vGift;
            outletMetrics.gcPaymentCount += 1;
          }
        }
      }

      // 5. Process Rejections in O(R)
      const rejectionReasonMap = new Map<string, { count: number; services: Set<string> }>();

      for (const r of rawRejects) {
        // Enforce active outlet membership
        if (!outletMap.has(r.kode_outlet)) continue;

        // Strict defensive date guard: ensure record's date strictly matches operational date
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
        gcPayment: globalGCPayment,
        gcPaymentCount: globalGCPaymentCount,
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
