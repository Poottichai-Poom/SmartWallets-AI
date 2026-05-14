// Mock data for SmartWallets AI prototype.
// Stored on window for cross-script JSX access.

window.MOCK = (function () {
  // categories with TH/EN labels, type (needs/wants), monthly amount in THB, icon glyph (emoji-free placeholder svg path id)
  const categories = [
    { id: 'rent',     th: 'ที่อยู่อาศัย',  en: 'Housing',         type: 'needs', amt: 12000, txns: 1,  trend: +0.0 },
    { id: 'food',     th: 'อาหาร',         en: 'Groceries',       type: 'needs', amt:  6800, txns: 24, trend: +5.2 },
    { id: 'commute',  th: 'การเดินทาง',    en: 'Transport',       type: 'needs', amt:  3200, txns: 41, trend: -2.1 },
    { id: 'utility',  th: 'สาธารณูปโภค',  en: 'Utilities',       type: 'needs', amt:  1850, txns: 4,  trend: +1.0 },
    { id: 'health',   th: 'สุขภาพ',        en: 'Health',          type: 'needs', amt:  2460, txns: 3,  trend: 0 },
    { id: 'dining',   th: 'ร้านอาหาร',     en: 'Dining out',      type: 'wants', amt:  4800, txns: 31, trend: +18.4 },
    { id: 'shopping', th: 'ช้อปปิ้ง',      en: 'Shopping',        type: 'wants', amt:  5420, txns: 12, trend: +24.7 },
    { id: 'fun',      th: 'บันเทิง',       en: 'Entertainment',   type: 'wants', amt:  3100, txns:  8, trend: +9.3 },
    { id: 'subs',     th: 'สมัครสมาชิก',   en: 'Subscriptions',   type: 'wants', amt:  1950, txns: 11, trend: +6.0 },
    { id: 'misc',     th: 'อื่นๆ',         en: 'Misc',            type: 'wants', amt:  1000, txns:  6, trend: 0 },
  ];

  // 30-day daily spending series (THB). Loosely matches monthly total ~42,580
  const daily = [
    1280, 320, 980, 1520,  410, 2480, 3200,
    1100, 540, 720, 1860,  390, 2940, 1840,
     680, 1220, 410, 1740, 2280,  990, 3680,
    1180, 460, 720, 1380, 2110, 1980, 2620,
     880, 1990,
  ];

  // top financial "leaks"
  const leaks = [
    {
      id: 'grabfood',
      th: 'Grab Food สั่งบ่อยเกิน',
      en: 'Frequent food-delivery orders',
      detail: 'สั่ง 23 ครั้งในเดือนนี้ — เฉลี่ย ฿182/ครั้ง',
      detailEn: '23 orders this month · avg ฿182',
      amt: 4186,
      over: 1400,
      severity: 'high',
      cat: 'dining',
    },
    {
      id: 'subs',
      th: 'สมัครสมาชิกซ้ำซ้อน',
      en: 'Overlapping subscriptions',
      detail: 'Netflix, Disney+, YouTube Premium, Spotify, Apple TV+',
      detailEn: '5 streaming services active',
      amt: 1190,
      over: 690,
      severity: 'high',
      cat: 'subs',
    },
    {
      id: 'latenight',
      th: 'ช้อปดึก Shopee / Lazada',
      en: 'Late-night marketplace orders',
      detail: '7 ครั้งหลัง 23:00 น. — รวม ฿2,340',
      detailEn: '7 orders after 23:00',
      amt: 2340,
      over: 1100,
      severity: 'medium',
      cat: 'shopping',
    },
    {
      id: 'sevens',
      th: '7-Eleven แวะบ่อย',
      en: 'Convenience-store stops',
      detail: '38 ครั้งในเดือนนี้ — ของไม่จำเป็น ~฿890',
      detailEn: '38 visits · impulse buys ~฿890',
      amt: 1240,
      over:  890,
      severity: 'medium',
      cat: 'food',
    },
    {
      id: 'atmfee',
      th: 'ค่าธรรมเนียม ATM ต่างธนาคาร',
      en: 'Out-of-network ATM fees',
      detail: '9 ครั้ง × ฿20',
      detailEn: '9 withdrawals',
      amt:  180,
      over:  180,
      severity: 'low',
      cat: 'misc',
    },
  ];

  // recent transactions for parsing animation
  const recentTxns = [
    { date: '14 พ.ค.', merchant: 'Grab Food',         note: 'GRABFOOD*BKK',     amt:   189, cat: 'dining',   type: 'wants' },
    { date: '14 พ.ค.', merchant: 'BTS Skytrain',      note: 'BTS RABBIT',       amt:    47, cat: 'commute',  type: 'needs' },
    { date: '13 พ.ค.', merchant: 'Tesco Lotus',       note: 'LOTUSS*RAMA9',     amt:   842, cat: 'food',     type: 'needs' },
    { date: '13 พ.ค.', merchant: 'Netflix',           note: 'NETFLIX.COM',      amt:   419, cat: 'subs',     type: 'wants' },
    { date: '12 พ.ค.', merchant: 'Shopee',            note: 'SHOPEE TH',        amt:  1240, cat: 'shopping', type: 'wants' },
    { date: '12 พ.ค.', merchant: 'Café Amazon',       note: 'CAFE AMAZON',      amt:    65, cat: 'dining',   type: 'wants' },
    { date: '11 พ.ค.', merchant: 'PEA Electricity',   note: 'PEA-BILL',         amt:  1240, cat: 'utility',  type: 'needs' },
    { date: '11 พ.ค.', merchant: 'Grab',              note: 'GRAB*RIDE',        amt:   178, cat: 'commute',  type: 'needs' },
    { date: '10 พ.ค.', merchant: 'AIS Mobile',        note: 'AIS-POSTPAID',     amt:   599, cat: 'utility',  type: 'needs' },
    { date: '10 พ.ค.', merchant: '7-Eleven',          note: 'CPALL*7-11',       amt:    87, cat: 'food',     type: 'needs' },
    { date: '09 พ.ค.', merchant: 'Spotify',           note: 'SPOTIFY P1M',      amt:   159, cat: 'subs',     type: 'wants' },
    { date: '09 พ.ค.', merchant: 'Foodland',          note: 'FOODLAND*EKK',     amt:   612, cat: 'food',     type: 'needs' },
  ];

  // life goals
  const goals = [
    { id: 'japan',  th: 'เที่ยวญี่ปุ่น 2026',     en: 'Japan trip 2026',     target: 80000,  saved: 18400, byMonths: 10, priority: 'medium' },
    { id: 'emerg',  th: 'เงินสำรองฉุกเฉิน 6 เดือน', en: 'Emergency fund · 6mo', target: 180000, saved: 42000, byMonths: 18, priority: 'high' },
    { id: 'cc',     th: 'ปลดหนี้บัตรเครดิต',     en: 'Pay off credit card', target: 35000,  saved: 12800, byMonths: 6,  priority: 'high' },
  ];

  // personas — change income & multiplier on categories
  const personas = {
    student: {
      th: 'นักศึกษา', en: 'Student',
      income: 18000, mult: 0.42,
    },
    pro: {
      th: 'พนักงานบริษัท', en: 'Young professional',
      income: 65000, mult: 1.0,
    },
    family: {
      th: 'ครอบครัว', en: 'Family',
      income: 120000, mult: 1.85,
    },
  };

  // default income sources per persona — editable by user
  const incomeSources = {
    student: [
      { id: 'i1', th: 'ทุนการศึกษา',       en: 'Stipend',         amount: 15000, type: 'salary',     day: 1  },
      { id: 'i2', th: 'งานพาร์ทไทม์',      en: 'Part-time work',  amount:  3000, type: 'side',       day: 28 },
    ],
    pro: [
      { id: 'i1', th: 'เงินเดือน',         en: 'Salary',          amount: 55000, type: 'salary',     day: 25 },
      { id: 'i2', th: 'งานฟรีแลนซ์',       en: 'Freelance',       amount: 10000, type: 'side',       day: 15 },
    ],
    family: [
      { id: 'i1', th: 'เงินเดือนหลัก',     en: 'Primary salary',  amount: 80000, type: 'salary',     day: 25 },
      { id: 'i2', th: 'เงินเดือนคู่สมรส',  en: 'Spouse salary',   amount: 40000, type: 'salary',     day: 28 },
    ],
  };

  // income type metadata
  const incomeTypes = {
    salary:     { th: 'เงินเดือน',   en: 'Salary',         icon: 'bank',    color: '#34D399' },
    side:       { th: 'รายได้เสริม', en: 'Side income',    icon: 'sparkle', color: '#60A5FA' },
    investment: { th: 'การลงทุน',    en: 'Investment',     icon: 'chart',   color: '#A78BFA' },
    bonus:      { th: 'โบนัส',       en: 'Bonus',          icon: 'flame',   color: '#FB923C' },
    other:      { th: 'อื่นๆ',       en: 'Other',          icon: 'coins',   color: '#94A3B8' },
  };

  // merchant pools per category for seed-txn generation
  const merchants = {
    rent:     ['Property Co.', 'เจ้าของห้อง', 'Apartment Co.'],
    food:     ['Tesco Lotus', 'Foodland', 'Big C', 'Tops Daily', 'Villa Market', '7-Eleven', 'Family Mart', 'CJ Express', 'Makro'],
    commute:  ['BTS Skytrain', 'MRT', 'Grab', 'Bolt', 'PTT Petrol', 'Shell', 'Bangchak', 'Taxi'],
    utility:  ['PEA Electric', 'MEA Water', 'AIS Mobile', 'True Internet', 'DTAC', '3BB'],
    health:   ['Bumrungrad', 'Watsons', 'Boots', 'Fascino', 'Pharmacy'],
    dining:   ['Grab Food', 'LineMan', 'Foodpanda', 'After You', 'Café Amazon', 'Starbucks', 'Sukishi', 'Bonchon', 'KFC', 'MK Restaurants', 'Yayoi'],
    shopping: ['Shopee', 'Lazada', 'IKEA', 'Uniqlo', 'Zara', 'H&M', 'Central', 'Robinson', 'Daiso', 'Tops Market'],
    fun:      ['Major Cineplex', 'SF Cinemas', 'Steam', 'Nintendo eShop', 'PlayStation Store', 'Concert Tix', 'Asiatique'],
    subs:     ['Netflix', 'Disney+', 'Spotify', 'YouTube Premium', 'Apple TV+', 'iCloud', 'Adobe CC', 'Notion', 'Canva Pro'],
    misc:     ['ATM Fee', 'Bank Charge', 'ค่าธรรมเนียม', 'Misc', 'Gift'],
  };

  // deterministic LCG for stable seed-txn generation
  function makeRand(seed) {
    let s = seed | 0;
    return () => { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; };
  }

  function generateSeedTxns(personaMult, seedNum = 4242) {
    const rand = makeRand(seedNum);
    const out = [];
    let id = 0;
    for (const c of categories) {
      const total = Math.round(c.amt * personaMult);
      // cap visible txns per category for usability
      const n = Math.min(c.txns, 8);
      if (n === 0) continue;
      const avg = total / n;
      let acc = 0;
      for (let i = 0; i < n; i++) {
        const isLast = i === n - 1;
        const amt = isLast
          ? Math.max(1, total - acc)
          : Math.max(1, Math.round(avg * (0.5 + rand() * 1.0)));
        acc += amt;
        const day = 1 + Math.floor(rand() * 14);
        const pool = merchants[c.id] || ['Vendor'];
        const merchant = pool[Math.floor(rand() * pool.length)];
        out.push({
          id: 's' + (id++),
          date: `2026-05-${String(day).padStart(2, '0')}`,
          merchant,
          amount: amt,
          catId: c.id,
          type: c.type,
          manual: false,
        });
      }
    }
    return out.sort((a, b) => b.date.localeCompare(a.date));
  }

  // helpers
  function fmt(n) {
    return '฿' + Math.round(n).toLocaleString('en-US');
  }
  function fmtK(n) {
    if (n >= 1000) return '฿' + (n / 1000).toFixed(1) + 'k';
    return '฿' + Math.round(n);
  }

  return { categories, daily, leaks, recentTxns, goals, personas, fmt, fmtK, generateSeedTxns, merchants, incomeSources, incomeTypes };
})();
