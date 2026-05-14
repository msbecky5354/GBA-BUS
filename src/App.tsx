import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態 (14欄位)
interface BusItem {
  operator: string;
  departure_region: string;
  pickup_point: string;
  arrival_region: string;
  dropoff_point: string;
  schedule: string;
  estimated_duration: string;
  price: string;
  currency: string;
  booking_remarks: string;
  source_url: string;
  wechat_app: string;
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

// Google AdSense 展示組件
const AdBanner: React.FC = () => {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense Error:', err);
    }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: 'block', width: '100%', minHeight: '90px' }}
         data-ad-client="ca-pub-8256903623772163"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
};

const App: React.FC = () => {
  const [busData, setBusData] = useState<BusItem[]>([]);
  const [filteredData, setFilteredData] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 搜索狀態
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

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. 數據抓取
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}&t=${new Date().getTime()}`);
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        
        const result = lines.slice(1).map(line => {
          const v: string[] = [];
          let curVal = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' && line[i + 1] === '"') { curVal += '"'; i++; }
            else if (char === '"') { inQuotes = !inQuotes; }
            else if (char === ',' && !inQuotes) { v.push(curVal.trim()); curVal = ''; }
            else { curVal += char; }
          }
          v.push(curVal.trim());
          if (v.length < 10) return null;

          return {
            operator: (v[0] || '').trim(),
            departure_region: (v[1] || '').trim(),
            pickup_point: (v[2] || '').trim(),
            arrival_region: (v[3] || '').trim(),
            dropoff_point: (v[4] || '').trim(),
            schedule: (v[5] || '').trim(),
            estimated_duration: (v[8] || '').trim(),
            price: (v[9] || '').trim(),
            currency: (v[10] || '').trim(),
            booking_remarks: (v[11] || '').trim(),
            source_url: (v[12] || '').trim(),
            wechat_app: v[13] ? v[13].replace(/\r$/, '').trim() : ''
          };
        }).filter((item): item is BusItem => item !== null && item.operator !== '');

        result.sort((a, b) => a.departure_region.localeCompare(b.departure_region, 'zh-HK'));
        setBusData(result);
        setFilteredData(result);
        setLoading(false);
        const now = new Date();
        setLastUpdated(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. 過濾選單邏輯 (互斥排除)
  const depRegions = useMemo(() => {
    const regions = Array.from(new Set(busData.map(i => i.departure_region.substring(0, 2)))).filter(Boolean).sort();
    return arrRegionFilter ? regions.filter(r => r !== arrRegionFilter) : regions;
  }, [busData, arrRegionFilter]);

  const arrRegions = useMemo(() => {
    const regions = Array.from(new Set(busData.map(i => i.arrival_region.substring(0, 2)))).filter(Boolean).sort();
    return depRegionFilter ? regions.filter(r => r !== depRegionFilter) : regions;
  }, [busData, depRegionFilter]);

  const depTowns = useMemo(() => Array.from(new Set(busData.filter(i => !depRegionFilter || i.departure_region.startsWith(depRegionFilter)).map(i => i.departure_region))).filter(Boolean).sort(), [busData, depRegionFilter]);
  const arrTowns = useMemo(() => Array.from(new Set(busData.filter(i => !arrRegionFilter || i.arrival_region.startsWith(arrRegionFilter)).map(i => i.arrival_region))).filter(Boolean).sort(), [busData, arrRegionFilter]);
  
  const availablePickups = useMemo(() => Array.from(new Set(busData.filter(i => (!depRegionFilter || i.departure_region.startsWith(depRegionFilter)) && (!depTownFilter || i.departure_region === depTownFilter)).map(i => i.pickup_point))).filter(Boolean).sort(), [busData, depRegionFilter, depTownFilter]);
  const availableDropoffs = useMemo(() => Array.from(new Set(busData.filter(i => (!arrRegionFilter || i.arrival_region.startsWith(arrRegionFilter)) && (!arrTownFilter || i.arrival_region === arrTownFilter)).map(i => i.dropoff_point))).filter(Boolean).sort(), [busData, arrRegionFilter, arrTownFilter]);

  useEffect(() => {
    setFilteredData(busData.filter(i => (
      (!depRegionFilter || i.departure_region.startsWith(depRegionFilter)) &&
      (!depTownFilter || i.departure_region === depTownFilter) &&
      (!pickupFilter || i.pickup_point === pickupFilter) &&
      (!arrRegionFilter || i.arrival_region.startsWith(arrRegionFilter)) &&
      (!arrTownFilter || i.arrival_region === arrTownFilter) &&
      (!dropoffFilter || i.dropoff_point === dropoffFilter)
    )));
  }, [depRegionFilter, depTownFilter, pickupFilter, arrRegionFilter, arrTownFilter, dropoffFilter, busData]);

  // 4. 操作邏輯
  const handleSwapRegions = () => {
    const t1 = depRegionFilter; setDepRegionFilter(arrRegionFilter); setArrRegionFilter(t1);
    setDepTownFilter(''); setArrTownFilter(''); setPickupFilter(''); setDropoffFilter('');
  };
  const handleSwapTowns = () => {
    const t2 = depTownFilter; setDepTownFilter(arrTownFilter); setArrTownFilter(t2);
    setPickupFilter(''); setDropoffFilter('');
  };
  const handleSwapPoints = () => {
    const t3 = pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);
  };
  const handleReset = () => {
    setDepRegionFilter(''); setDepTownFilter(''); setPickupFilter('');
    setArrRegionFilter(''); setArrTownFilter(''); setDropoffFilter('');
  };

  const showNotice = (type: string) => {
    let content = null;
    switch (type) {
      case 'about':
        content = <><p>「深中珠巴士通」致力於提供最新、最齊全的跨市巴士路線、時間表及購票資訊。</p><p style={{color:'#ef4444'}}>請注意：本站為獨立整合平台，並非官方營運商。</p></>;
        setNoticeInfo({ title: '關於我們', content }); break;
      case 'contact':
        content = <><p>歡迎透過以下方式與我們聯絡：</p><ul><li><strong>Facebook 群組：</strong> <a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>中山美食地圖群組</a></li></ul></>;
        setNoticeInfo({ title: '聯絡我們', content }); break;
      case 'privacy':
        content = <><p>本站使用 Google Analytics 及 AdSense。這些服務會使用 Cookies 收集數據以提供廣告及分析流量。</p></>;
        setNoticeInfo({ title: '隱私權政策', content }); break;
      case 'terms':
        content = <><p>本站提供的資訊僅供參考，不保證絕對正確。對於依賴資訊造成的延誤或損失，本站概不負責。</p></>;
        setNoticeInfo({ title: '服務條款', content }); break;
    }
  };

  // 樣式
  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
  
  // 優化後的交換按鈕樣式
  const swapBtnStyle: React.CSSProperties = { 
    minWidth: '42px', minHeight: '42px', borderRadius: '50%', border: '1px solid #e2e8f0', 
    backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: 0 
  };

  // 清晰的金金色 SVG
  const SwapSVG = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M16 3L20 7L16 11" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 7H4" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 21L4 17L8 13" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 17H20" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '28px', width: 'auto' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ color: '#FFE600' }}>攻略</span></h1>
        </div>
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新:</div>
          <div>{lastUpdated}</div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><span style={labelStyle}>出發地區</span><select style={selectStyle} value={depRegionFilter} onChange={e => {setDepRegionFilter(e.target.value); setDepTownFilter(''); setPickupFilter('');}}><option value="">所有地區</option>{depRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <button onClick={handleSwapRegions} style={swapBtnStyle}><SwapSVG /></button>
              <div style={{ flex: 1 }}><span style={labelStyle}>目的地區</span><select style={selectStyle} value={arrRegionFilter} onChange={e => {setArrRegionFilter(e.target.value); setArrTownFilter(''); setDropoffFilter('');}}><option value="">所有地區</option>{arrRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><span style={labelStyle}>出發城鎮</span><select style={selectStyle} value={depTownFilter} onChange={e => {setDepTownFilter(e.target.value); setPickupFilter('');}}><option value="">所有城鎮</option>{depTowns.map(r => <option key={r} value={r}>{depRegionFilter ? r.substring(2) : r}</option>)}</select></div>
              <button onClick={handleSwapTowns} style={swapBtnStyle}><SwapSVG /></button>
              <div style={{ flex: 1 }}><span style={labelStyle}>目的城鎮</span><select style={selectStyle} value={arrTownFilter} onChange={e => {setArrTownFilter(e.target.value); setDropoffFilter('');}}><option value="">所有城鎮</option>{arrTowns.map(r => <option key={r} value={r}>{arrRegionFilter ? r.substring(2) : r}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><span style={labelStyle}>上車站點</span><select style={selectStyle} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}><option value="">所有站點</option>{availablePickups.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <button onClick={handleSwapPoints} style={swapBtnStyle}><SwapSVG /></button>
              <div style={{ flex: 1 }}><span style={labelStyle}>落車站點</span><select style={selectStyle} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}><option value="">所有站點</option>{availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <button onClick={handleReset} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>一鍵還原所有搜尋條件</button>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center' }}>🚌 資料同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '180px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', marginBottom: '12px', fontWeight: 'bold' }}>{item.operator}</span>
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '14px', fontWeight: 'bold' }}>{item.schedule}</div>
                <div style={{ marginBottom: '10px', paddingRight: '70px' }}>
                  <div style={{ fontSize: '15px', marginBottom: '6px' }}>📍 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.departure_region}</span> <strong>{item.pickup_point}</strong></div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>🏁 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.arrival_region}</span> <strong>{item.dropoff_point}</strong></div>
                </div>
                <div style={{ position: 'absolute', top: '55%', right: '20px', transform: 'translateY(-50%)', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ef4444' }}>{item.currency}{item.price}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>巴士路線</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.booking_remarks || '--'}</div>
                  </div>
                  <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>{item.wechat_app ? '微信購票' : '立即購票'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ maxWidth: '1000px', margin: '30px auto 0', padding: '20px 16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '25px', overflow: 'hidden' }}><AdBanner /></div>
        <div style={{ margin: '15px 0', fontSize: '13px', fontWeight: 'bold' }}>
          <a onClick={() => showNotice('about')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>關於我們</a> | 
          <a onClick={() => showNotice('contact')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>聯絡我們</a> | 
          <a onClick={() => showNotice('privacy')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>隱私權政策</a> | 
          <a onClick={() => showNotice('terms')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>服務條款</a>
        </div>
        <p>© {new Date().getFullYear()} 深中珠巴士通. All rights reserved.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: '#94a3b8' }}>
          <span>開發者:</span><img src="/logo.png" alt="Logo" style={{ height: '16px' }} /><span>中山美食地圖群組團隊</span>
        </div>
      </footer>

      {noticeInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 200 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#B8860B' }}>{noticeInfo.title}</h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6' }}>{noticeInfo.content}</div>
            <button onClick={() => setNoticeInfo(null)} style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '12px', cursor: 'pointer', backgroundColor: '#f1f5f9', border: 'none', fontWeight: 'bold' }}>關閉</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', textAlign: 'center' }}>
            <p>請複製名稱後到微信搜尋：</p><h3 style={{ color: '#22c55e' }}>{selectedWechatApp}</h3>
            <button onClick={() => {navigator.clipboard.writeText(selectedWechatApp); alert('已複製！');}} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', marginTop: '10px', color: '#94a3b8' }}>暫時關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
