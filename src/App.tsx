import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態
interface BusItem {
  operator: string;
  departure_region: string;
  departure_town: string;
  pickup_point: string;
  arrival_region: string;
  arrival_town: string;
  dropoff_point: string;
  schedule: string;
  estimated_duration: string;
  price: string;
  currency: string;
  booking_remarks: string;
  source_url: string;
  wechat_app: string;
  sort_dr: number;
  sort_ar: number;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// 核心修正：對接後端代理 API
const CSV_URL = '/api/data';

const GLOBAL_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang HK", "PingFang TC", "Hiragino Sans GB", "Microsoft JhengHei", "Noto Sans CJK TC", "Source Han Sans", sans-serif';

const SwapButtonIcon = () => (
  <img src="/image_bea913.png" alt="Swap" style={{ width: '32px', height: '32px', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
);

const App: React.FC = () => {
  const [busData, setBusData] = useState<BusItem[]>([]);
  const [filteredData, setFilteredData] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [depRegionFilter, setDepRegionFilter] = useState('');
  const [depTownFilter, setDepTownFilter] = useState('');
  const [pickupFilter, setPickupFilter] = useState('');
  const [arrRegionFilter, setArrRegionFilter] = useState('');
  const [arrTownFilter, setArrTownFilter] = useState('');
  const [dropoffFilter, setDropoffFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedWechatApp, setSelectedWechatApp] = useState('');
  const [noticeInfo, setNoticeInfo] = useState<{ title: string, content: React.ReactNode } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [detailItem, setDetailItem] = useState<BusItem | null>(null);
  const [showRouteOverview, setShowRouteOverview] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1000);
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    window.addEventListener('resize', handleResize);
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => { 
      window.removeEventListener('resize', handleResize); 
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}?t=${new Date().getTime()}`);
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const result = lines.slice(1).map(line => {
          const v: string[] = []; let curVal = '', inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') { curVal += '"'; i++; }
            else if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) { v.push(curVal.trim()); curVal = ''; }
            else { curVal += char; }
          }
          v.push(curVal.trim());
          if (v.length < 18) return null;
          return {
            operator: (v[0] || '').trim(),
            departure_region: (v[1] || '').trim(),
            departure_town: (v[2] || '').trim(),
            pickup_point: (v[3] || '').trim(),
            arrival_region: (v[4] || '').trim(),
            arrival_town: (v[5] || '').trim(),
            dropoff_point: (v[6] || '').trim(),
            schedule: (v[7] || '').trim(),
            estimated_duration: (v[10] || '').trim(),
            price: (v[11] || '').trim(),
            currency: (v[12] || '').trim(),
            booking_remarks: (v[13] || '').trim(),
            source_url: (v[14] || '').trim(),
            wechat_app: (v[15] || '').replace(/\r$/, '').trim(),
            sort_dr: parseInt((v[16] || '').trim(), 10) || 0,
            sort_ar: parseInt((v[17] || '').trim(), 10) || 0
          };
        }).filter((item): item is BusItem => item !== null && item.operator !== '');
        setBusData(result); setFilteredData(result); setLoading(false);
        const now = new Date();
        setLastUpdated(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`);
      } catch (error) { setLoading(false); }
    };
    fetchData();
  }, []);

  const depRegions = useMemo(() => Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean).sort(), [busData]);
  const arrRegions = useMemo(() => Array.from(new Set(busData.map(i => i.arrival_region))).filter(Boolean).sort(), [busData]);

  const depTowns = useMemo(() => {
    const townMap = new Map<string, number>();
    busData.forEach(i => { if (!depRegionFilter || i.departure_region === depRegionFilter) townMap.set(i.departure_town, Math.max(townMap.get(i.departure_town) || 0, i.sort_dr)); });
    return Array.from(townMap.entries()).filter(e => Boolean(e[0])).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  }, [busData, depRegionFilter]);

  const arrTowns = useMemo(() => {
    const townMap = new Map<string, number>();
    busData.forEach(i => { if (!arrRegionFilter || i.arrival_region === arrRegionFilter) townMap.set(i.arrival_town, Math.max(townMap.get(i.arrival_town) || 0, i.sort_ar)); });
    return Array.from(townMap.entries()).filter(e => Boolean(e[0])).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  }, [busData, arrRegionFilter]);

  const availablePickups = useMemo(() => Array.from(new Set(busData.filter(i => (!depRegionFilter || i.departure_region === depRegionFilter) && (!depTownFilter || i.departure_town === depTownFilter)).map(i => i.pickup_point))).filter(Boolean).sort(), [busData, depRegionFilter, depTownFilter]);
  const availableDropoffs = useMemo(() => Array.from(new Set(busData.filter(i => (!arrRegionFilter || i.arrival_region === arrRegionFilter) && (!arrTownFilter || i.arrival_town === arrTownFilter)).map(i => i.dropoff_point))).filter(Boolean).sort(), [busData, arrRegionFilter, arrTownFilter]);

  useEffect(() => {
    setFilteredData(busData.filter(i => (
      (!depRegionFilter || i.departure_region === depRegionFilter) && (!depTownFilter || i.departure_town === depTownFilter) && (!pickupFilter || i.pickup_point === pickupFilter) &&
      (!arrRegionFilter || i.arrival_region === arrRegionFilter) && (!arrTownFilter || i.arrival_town === arrTownFilter) && (!dropoffFilter || i.dropoff_point === dropoffFilter)
    )));
  }, [depRegionFilter, depTownFilter, pickupFilter, arrRegionFilter, arrTownFilter, dropoffFilter, busData]);

  const handleFullSwap = () => {
    const dR = depRegionFilter, dT = depTownFilter, dP = pickupFilter;
    const aR = arrRegionFilter, aT = arrTownFilter, aP = dropoffFilter;
    setDepRegionFilter(aR); setArrRegionFilter(dR); setDepTownFilter(aT); setArrTownFilter(dT); setPickupFilter(aP); setDropoffFilter(dP);
  };

  const handleReset = () => {
    setDepRegionFilter(''); setDepTownFilter(''); setPickupFilter('');
    setArrRegionFilter(''); setArrTownFilter(''); setDropoffFilter('');
  };

  const showNotice = (type: string) => {
    let content = null; let title = '';
    switch (type) {
      case 'about':
        title = '關於我們';
        content = <p>「深中珠巴士懶人包」由中山美食地圖團隊人手錄入數據，致力提供一站式交通資訊。</p>;
        break;
      case 'contact':
        title = '聯絡我們';
        content = <p>歡迎加入 FB 群組反饋：中山美食地圖群組</p>;
        break;
      case 'privacy':
        title = '隱私權政策';
        content = <p>本站使用 Google Analytics 及 AdSense。不接觸用戶任何交易資料。</p>;
        break;
      case 'terms':
        title = '服務條款';
        content = <ul style={{ paddingLeft: '20px' }}><li>數據為人手錄入，請以官方公告為準。</li></ul>;
        break;
    }
    if (content) setNoticeInfo({ title, content });
  };

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white', color: '#1e293b', fontFamily: GLOBAL_FONT };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' };
  const swapBtnStyle: React.CSSProperties = { width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '20px', fontFamily: GLOBAL_FONT, letterSpacing: '0.01em' }}>
      
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Logo" style={{ height: '48px' }} />
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>深中珠巴士<span style={{ color: '#FFE600' }}>懶人包</span></h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div onClick={() => setShowRouteOverview(true)} style={{ cursor: 'pointer', fontSize: '18px', width: '30px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗺️</div>
            <div onClick={() => setShowGuide(true)} style={{ cursor: 'pointer', fontSize: '18px', width: '30px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💡</div>
          </div>
          <div style={{ fontSize: '10px', textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新:</div>
            <div>{lastUpdated}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        
        <a href="https://zhongshan-food-map.vercel.app/" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', backgroundColor: '#ffffff', border: '2px solid #fef3c7', borderRadius: '16px', padding: '12px 16px', textDecoration: 'none', marginBottom: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img src="/image.png" alt="中山美食地圖" style={{ height: '40px', width: '40px', borderRadius: '10px', objectFit: 'contain' }} />
            <div>
              <div style={{ color: '#92400e', fontWeight: '900', fontSize: '15px' }}>中山美食地圖 免費Apps <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>推薦</span></div>
              <div style={{ color: '#d97706', fontSize: '12px', marginTop: '3px' }}>發掘隱世好店，中山搵食必備！</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#f97316', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>免安裝即用</div>
        </a>

        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <button onClick={handleReset} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>🔄 重置</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發地區</span><select style={selectStyle} value={depRegionFilter} onChange={e => {setDepRegionFilter(e.target.value); setDepTownFilter(''); setPickupFilter('');}}><option value="">所有</option>{depRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle}><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的地區</span><select style={selectStyle} value={arrRegionFilter} onChange={e => {setArrRegionFilter(e.target.value); setArrTownFilter(''); setDropoffFilter('');}}><option value="">所有</option>{arrRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發城鎮</span><select style={selectStyle} value={depTownFilter} onChange={e => {setDepTownFilter(e.target.value); setPickupFilter('');}}><option value="">所有</option>{depTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle}><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的城鎮</span><select style={selectStyle} value={arrTownFilter} onChange={e => {setArrTownFilter(e.target.value); setDropoffFilter('');}}><option value="">所有</option>{arrTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>上車站點</span><select style={selectStyle} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}><option value="">所有</option>{availablePickups.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div style={{ width: '32px' }} />
                <div style={{ flex: 1 }}><span style={labelStyle}>落車站點</span><select style={selectStyle} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}><option value="">所有</option>{availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
            </div>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center' }}>🚌 數據加載中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} onClick={() => setDetailItem(item)} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', backgroundColor: '#fff7ed', color: '#f97316', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{item.operator}</span>
                  <div style={{ fontSize: '14px', color: '#1e293b' }}>{item.schedule}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', color: '#2563eb', marginBottom: '8px' }}>📍 {item.departure_region} · {item.departure_town} {item.pickup_point}</div>
                    <div style={{ fontSize: '15px', color: '#2563eb' }}>🏁 {item.arrival_region} · {item.arrival_town} {item.dropoff_point}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', color: '#ef4444' }}><span style={{ fontSize: '14px' }}>{item.currency}</span><span style={{ fontSize: '24px' }}>{item.price}</span></div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{item.booking_remarks || '--'}</div>
                  <button onClick={(e) => { e.stopPropagation(); item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')}} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>購票</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '12px' }}>
        <p>© {new Date().getFullYear()} 深中珠巴士懶人包. 中山美食地圖團隊開發</p>
      </footer>

      {showRouteOverview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1100, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <button onClick={() => setShowRouteOverview(false)} style={{ alignSelf: 'flex-end', padding: '12px 24px', border: 'none', borderRadius: '12px', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>關閉 ✕</button>
          <h2 style={{ color: '#B8860B', borderBottom: '3px solid #B8860B', paddingBottom: '10px' }}>🚌 跨市及機場路線概覽</h2>
          <div style={{ fontSize: '20px', lineHeight: '2', marginTop: '20px' }}>
            ✅ 深圳 &harr; 中山<br />
            ✅ 深圳 &harr; 珠海<br />
            ✅ 中山 &harr; 珠海<br />
            ✅ 深圳市內 &harr; 深圳機場
          </div>
        </div>
      )}

      {showGuide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1200, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <button onClick={() => setShowGuide(false)} style={{ alignSelf: 'flex-end', padding: '12px 24px', border: 'none', borderRadius: '12px', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>關閉 ✕</button>
          <h2 style={{ color: '#0369a1' }}>💡 使用指南</h2>
          <div style={{ marginTop: '20px', fontSize: '18px', lineHeight: '1.8' }}>
            <h3>如何加入手機桌面？</h3>
            1. iPhone: Safari 點擊「分享」圖標 &rarr;「加入主畫面」。<br />
            2. Android: Chrome 點擊「三點」圖標 &rarr;「安裝應用程式」。
          </div>
        </div>
      )}

      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1050, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <button onClick={() => setDetailItem(null)} style={{ alignSelf: 'flex-end', padding: '12px 24px', border: 'none', borderRadius: '12px', backgroundColor: '#f1f5f9', fontWeight: 'bold' }}>關閉 ✕</button>
          <div style={{ borderBottom: '3px solid #3b82f6', paddingBottom: '15px', marginBottom: '25px' }}>
             <span style={{ fontSize: '36px', backgroundColor: '#fff7ed', color: '#f97316', padding: '8px 24px', borderRadius: '12px', fontWeight: 'bold' }}>{detailItem.operator}</span>
             <h2 style={{ fontSize: '36px', marginTop: '15px', color: '#1e293b' }}>{detailItem.schedule}</h2>
          </div>
          <div style={{ flex: 1, marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
             <div><div style={{ color: '#94a3b8' }}>📍 出發站點</div><div style={{ fontSize: '28px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.departure_region} · {detailItem.departure_town}</div><div style={{ fontSize: '32px', fontWeight: 900 }}>{detailItem.pickup_point}</div></div>
             <div><div style={{ color: '#94a3b8' }}>🏁 目的地點</div><div style={{ fontSize: '28px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.arrival_region} · {detailItem.arrival_town}</div><div style={{ fontSize: '32px', fontWeight: 900 }}>{detailItem.dropoff_point}</div></div>
             <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '20px' }}><div style={{ fontSize: '48px', color: '#ef4444', fontWeight: '900' }}>{detailItem.currency} {detailItem.price}</div><div style={{ fontSize: '22px' }}>預計耗時: {detailItem.estimated_duration}</div></div>
             <div><div style={{ color: '#EAB308', fontWeight: 'bold' }}>巴士資訊</div><div style={{ fontSize: '20px', lineHeight: '1.6' }}>{detailItem.booking_remarks || '--'}</div></div>
          </div>
          <button onClick={() => detailItem.wechat_app ? (setSelectedWechatApp(detailItem.
