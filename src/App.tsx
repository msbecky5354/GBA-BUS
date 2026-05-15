import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態 (對應 18 欄位結構)
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

// 擴展 Window 型別以支援 AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

const GLOBAL_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang HK", "PingFang TC", "Hiragino Sans GB", "Microsoft JhengHei", "Noto Sans CJK TC", "Source Han Sans", sans-serif';

// Google AdSense 組件
const AdBanner: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  useEffect(() => {
    try { if (window.adsbygoogle) window.adsbygoogle.push({}); } catch (err) {}
  }, []);
  return (
    <ins className="adsbygoogle"
         style={{ display: 'block', minHeight: '90px', ...style }}
         data-ad-client="ca-pub-8256903623772163"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
};

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

  useEffect(() => {
    setIsMobile(window.innerWidth < 1200);
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    window.addEventListener('resize', handleResize);
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('resize', handleResize); window.removeEventListener('scroll', handleScroll); };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}&t=${new Date().getTime()}`);
        const serverDateHeader = response.headers.get('Date');
        const updateDate = serverDateHeader ? new Date(serverDateHeader) : new Date();
        setLastUpdated(`${updateDate.getFullYear()}-${String(updateDate.getMonth() + 1).padStart(2, '0')}-${String(updateDate.getDate()).padStart(2, '0')} ${updateDate.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false })}`);
        
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
      } catch (error) { setLoading(false); }
    };
    fetchData();
  }, []);

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

  useEffect(() => {
    setFilteredData(busData.filter(i => (
      (!depRegionFilter || i.departure_region === depRegionFilter) && (!depTownFilter || i.departure_town === depTownFilter) && (!pickupFilter || i.pickup_point === pickupFilter) &&
      (!arrRegionFilter || i.arrival_region === arrRegionFilter) && (!arrTownFilter || i.arrival_town === arrTownFilter) && (!dropoffFilter || i.dropoff_point === dropoffFilter)
    )));
  }, [depRegionFilter, depTownFilter, pickupFilter, arrRegionFilter, arrTownFilter, dropoffFilter, busData]);

  const handleFullSwap = () => {
    const dR = depRegionFilter, dT = depTownFilter, dP = pickupFilter, aR = arrRegionFilter, aT = arrTownFilter, aP = dropoffFilter;
    setDepRegionFilter(aR); setArrRegionFilter(dR); setDepTownFilter(aT); setArrTownFilter(dT); setPickupFilter(aP); setDropoffFilter(dP);
  };

  const handleReset = () => {
    setDepRegionFilter(''); setDepTownFilter(''); setPickupFilter(''); setArrRegionFilter(''); setArrTownFilter(''); setDropoffFilter('');
  };

  const showNotice = (type: string) => {
    let content = null; let title = '';
    switch (type) {
      case 'about':
        title = '關於我們';
        content = (
          <>
            <p><strong>「深中珠巴士懶人包」</strong> 致力於提供最新跨市巴士路線、時間表及購票資訊。</p>
            <p>我們整合各大巴士營運商公開數據，讓旅客能透過一站式平台比較出行方案。</p>
            <p style={{ color: '#ef4444', fontWeight: 'bold' }}>請注意：本站為獨立平台，並非官方巴士營運商。</p>
          </>
        );
        break;
      case 'contact':
        title = '聯絡我們';
        content = <p>如有建議或合作意向，歡迎聯絡：<br/><strong>Facebook 群組：</strong> <a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold' }}>中山美食地圖群組</a></p>;
        break;
      case 'privacy':
        title = '隱私權政策';
        content = <p>本站使用 Google Analytics 及 AdSense。這些服務會使用 Cookies 收集匿名數據以優化廣告與分析流量。</p>;
        break;
      case 'terms':
        title = '服務條款';
        content = <p>本站資訊僅供參考，不保證絕對正確性。購票前請務必向官方核實。對於因依賴本站造成的延誤或損失，本站概不負責。</p>;
        break;
    }
    if (content) setNoticeInfo({ title, content });
  };

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white', color: '#1e293b', fontFamily: GLOBAL_FONT };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' };
  const swapBtnStyle: React.CSSProperties = { width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '20px', fontFamily: GLOBAL_FONT }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Logo" style={{ height: '28px' }} />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士<span style={{ color: '#FFE600' }}>懶人包</span></h1>
        </div>
        <div style={{ fontSize: '10px', textAlign: 'right' }}><div>最後更新: {lastUpdated}</div></div>
      </header>

      <main style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 16px' }}>
        
        {/* 搜尋過濾區：已移除左右廣告，僅保留搜尋框且置中 */}
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '16px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
            <button onClick={handleReset} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>重置</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發地區</span><select style={selectStyle} value={depRegionFilter} onChange={e => {setDepRegionFilter(e.target.value); setDepTownFilter(''); setPickupFilter('');}}><option value="">所有</option>{Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean).sort().map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle}><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的地區</span><select style={selectStyle} value={arrRegionFilter} onChange={e => {setArrRegionFilter(e.target.value); setArrTownFilter(''); setDropoffFilter('');}}><option value="">所有</option>{Array.from(new Set(busData.map(i => i.arrival_region))).filter(Boolean).sort().map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發城鎮</span><select style={selectStyle} value={depTownFilter} onChange={e => {setDepTownFilter(e.target.value); setPickupFilter('');}}><option value="">所有</option>{depTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle}><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的城鎮</span><select style={selectStyle} value={arrTownFilter} onChange={e => {setArrTownFilter(e.target.value); setDropoffFilter('');}}><option value="">所有</option>{arrTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>上車站點</span><select style={selectStyle} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}><option value="">所有</option>{Array.from(new Set(busData.filter(i => (!depRegionFilter || i.departure_region === depRegionFilter) && (!depTownFilter || i.departure_town === depTownFilter)).map(i => i.pickup_point))).filter(Boolean).sort().map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div style={{ width: '32px' }} />
                <div style={{ flex: 1 }}><span style={labelStyle}>落車站點</span><select style={selectStyle} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}><option value="">所有</option>{Array.from(new Set(busData.filter(i => (!arrRegionFilter || i.arrival_region === arrRegionFilter) && (!arrTownFilter || i.arrival_town === arrTownFilter)).map(i => i.dropoff_point))).filter(Boolean).sort().map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
            </div>
          </div>
        </div>

        {/* 結果區域：直接貼合過濾框 */}
        {loading ? <p style={{ textAlign: 'center', padding: '20px' }}>🚌 資料同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px', maxWidth: '1000px', margin: '0 auto', padding: '12px 0' }}>
            {filteredData.length === 0 ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>🔍 暫無相關巴士班次</div> : filteredData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', borderTop: '6px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', backgroundColor: '#fff7ed', color: '#f97316', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{item.operator}</span>
                  <div style={{ fontSize: '13px', color: '#1e293b' }}>{item.schedule}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', marginBottom: '8px', color: '#2563eb' }}>
                      <a href={`https://www.amap.com/search?query=${item.departure_region}${item.departure_town}${item.pickup_point}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
                        📍 <span style={{ color: '#9333ea', fontSize: '13px' }}>{item.departure_region}·{item.departure_town}</span> {item.pickup_point} <img src="/amap.png" alt="Amap" style={{ height: '16px', marginLeft: '4px' }} />
                      </a>
                    </div>
                    <div style={{ fontSize: '15px', color: '#2563eb' }}>🏁 <span style={{ color: '#9333ea', fontSize: '13px' }}>{item.arrival_region}·{item.arrival_town}</span> {item.dropoff_point}</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '85px' }}>
                    <div style={{ fontWeight: '900', color: '#ef4444' }}><span style={{ fontSize: '14px' }}>{item.currency}</span><span style={{ fontSize: '22px' }}>{item.price}</span></div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, fontSize: '11px', color: '#64748b' }}><div style={{ color: '#EAB308', fontWeight: 'bold', fontSize: '10px' }}>巴士資訊</div>{item.booking_remarks || '--'}</div>
                  <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>{item.wechat_app ? '微信購票' : '立即購票'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 電腦版：Footer 上方的廣告位 */}
      {!isMobile && (
        <div style={{ maxWidth: '1000px', margin: '20px auto', textAlign: 'center' }}>
          <AdBanner />
        </div>
      )}

      <footer style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
        <div style={{ marginBottom: '15px' }}><AdBanner /></div>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          <a onClick={() => showNotice('about')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>關於我們</a> |
          <a onClick={() => showNotice('contact')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>聯絡我們</a> |
          <a onClick={() => showNotice('privacy')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>隱私權政策</a> |
          <a onClick={() => showNotice('terms')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>服務條款</a>
        </div>
        <p>© {new Date().getFullYear()} 深中珠巴士懶人包. All rights reserved.</p>
        <div style={{ marginTop: '10px' }}>開發者: <img src="/image.png" alt="Dev" style={{ height: '14px', verticalAlign: 'middle' }} /> 中山美食地圖群組團隊</div>
      </footer>

      {showBackToTop && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#B8860B', color: 'white', border: 'none', cursor: 'pointer', zIndex: 100 }}>▲</button>}
      
      {noticeInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 200 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#B8860B', marginTop: 0 }}>{noticeInfo.title}</h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>{noticeInfo.content}</div>
            <button onClick={() => setNoticeInfo(null)} style={{ width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold' }}>關閉</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '20px', maxWidth: '320px', textAlign: 'center' }}>
            <p>請複製名稱後到微信搜尋：</p><h3 style={{ color: '#22c55e' }}>{selectedWechatApp}</h3>
            <button onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(selectedWechatApp); alert('已複製！'); } }} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', marginTop: '10px', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
