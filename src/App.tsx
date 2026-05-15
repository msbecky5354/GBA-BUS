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

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

const GLOBAL_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang HK", "PingFang TC", "Hiragino Sans GB", "Microsoft JhengHei", "Noto Sans CJK TC", "Source Han Sans", sans-serif';

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
  const [detailItem, setDetailItem] = useState<BusItem | null>(null);
  const [showRouteOverview, setShowRouteOverview] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1000);
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
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

  const depRegions = useMemo(() => {
    const all = Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean).sort();
    return (arrRegionFilter && arrRegionFilter !== '深圳') ? all.filter(r => r !== arrRegionFilter) : all;
  }, [busData, arrRegionFilter]);

  const arrRegions = useMemo(() => {
    const all = Array.from(new Set(busData.map(i => i.arrival_region))).filter(Boolean).sort();
    return (depRegionFilter && depRegionFilter !== '深圳') ? all.filter(r => r !== depRegionFilter) : all;
  }, [busData, depRegionFilter]);

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
        content = <><p><strong>「深中珠巴士懶人包」</strong> 提供一站式跨市巴士資訊。本站由民間自發運作，非官方巴士運營商。</p></>;
        break;
      case 'contact':
        title = '聯絡我們';
        content = <p>歡迎加入 FB 群組反饋：<a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold' }}>中山美食地圖群組</a></p>;
        break;
      case 'privacy':
        title = '隱私權政策';
        content = <p>本站使用 Google Analytics 及 AdSense。所有個人交易由第三方連結負責，本站不接觸任何交易資訊。</p>;
        break;
      case 'terms':
        title = '服務條款';
        content = <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}><li>資訊僅供參考，強烈建議透過購票連結再次確認。</li><li>因資訊誤差導致的損失本站概不負責。</li><li>版權所有，未經書面授權請勿轉載。</li></ul>;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Logo" style={{ height: '28px' }} />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士<span style={{ color: '#FFE600' }}>懶人包</span></h1>
        </div>
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新:</div>
          <div>{lastUpdated}</div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        
        {/* 頂部按鈕：摺疊式路線通告 + 團隊感言 */}
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => setShowRouteOverview(!showRouteOverview)}
            style={{ 
              width: '100%', 
              backgroundColor: '#fffbeb', 
              border: '1px solid #fef3c7', 
              borderRadius: '12px', 
              padding: '12px 20px', 
              textAlign: 'left', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <span style={{ color: '#92400e', fontWeight: 'bold', fontSize: '14px' }}>🗺️ 點擊查看：跨市及機場路線概覽</span>
            <span style={{ color: '#b45309', transform: showRouteOverview ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}>▼</span>
          </button>

          {showRouteOverview && (
            <div style={{ 
              backgroundColor: 'white', 
              border: '1px solid #fef3c7', 
              borderTop: 'none',
              borderRadius: '0 0 12px 12px', 
              padding: '20px', 
              marginTop: '-5px'
            }}>
              <div style={{ fontSize: '13px', color: '#b45309', lineHeight: '1.8' }}>
                本站現已全面覆蓋 <strong>深圳、中山、珠海</strong> 三地之往返巴士資訊。主要路徑包含：<br />
                ✅ <strong>深圳 ⇄ 中山</strong>（經深中通道快線） | ✅ <strong>深圳 ⇄ 珠海</strong><br />
                ✅ <strong>中山 ⇄ 珠海</strong> | ✅ <strong>深圳市內 ⇄ 深圳機場</strong><br />
                一站式對比各大營運商時間表、票價與購票方式。
              </div>
              
              {/* 團隊感言區 */}
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #fef3c7', fontSize: '12px', color: '#92400e', fontStyle: 'italic', lineHeight: '1.5' }}>
                💡 <strong>編者的話：</strong><br />
                本站背後的數據庫並非官方接口同步，而是由團隊<strong>人手、人肉地蒐集</strong>各大營辦商的零散時間表，並逐一輸入更新。這項工作耗費了大量血汗時間與心力，只為大家出行更便利。<strong>請大家大力支持「中山美食地圖」團隊！</strong>
              </div>
            </div>
          )}
        </div>

        {/* 搜尋區域 */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <button onClick={handleReset} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>🔄 重置</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發地區</span><select style={selectStyle} value={depRegionFilter} onChange={e => {setDepRegionFilter(e.target.value); setDepTownFilter(''); setPickupFilter('');}}><option value="">所有</option>{depRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle} title="對調出發與目的地"><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的地區</span><select style={selectStyle} value={arrRegionFilter} onChange={e => {setArrRegionFilter(e.target.value); setArrTownFilter(''); setDropoffFilter('');}}><option value="">所有</option>{arrRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發城鎮</span><select style={selectStyle} value={depTownFilter} onChange={e => {setDepTownFilter(e.target.value); setPickupFilter('');}}><option value="">所有</option>{depTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle} title="對調出發與目的地"><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的城鎮</span><select style={selectStyle} value={arrTownFilter} onChange={e => {setArrTownFilter(e.target.value); setDropoffFilter('');}}><option value="">所有</option>{arrTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>上車站點</span><select style={selectStyle} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}><option value="">所有</option>{availablePickups.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div style={{ width: '32px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}><span style={labelStyle}>落車站點</span><select style={selectStyle} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}><option value="">所有</option>{availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
            </div>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center' }}>🚌 資料同步中...</p> : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>🔍 暫無相關巴士班次</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} 
                   onClick={() => setDetailItem(item)}
                   style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '210px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', backgroundColor: '#fff7ed', color: '#f97316', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{item.operator}</span>
                  <div style={{ fontSize: '14px', color: '#1e293b', textAlign: 'right' }}>{item.schedule}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1, marginBottom: '15px' }}>
                  <div style={{ flex: 1, paddingRight: '10px' }}>
                    <div style={{ fontSize: '15px', marginBottom: '8px', color: '#2563eb', lineHeight: '1.4', fontWeight: 'normal' }}>
                      <a onClick={(e) => e.stopPropagation()} href={`https://www.amap.com/search?query=${item.departure_region}${item.departure_town}${item.pickup_point}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
                        📍 <span style={{ color: '#9333ea', fontSize: '13px' }}>{item.departure_region} · {item.departure_town}</span> {item.pickup_point} 
                        <img src="/amap.png" alt="Amap" style={{ height: '18px', marginLeft: '6px' }} />
                      </a>
                    </div>
                    <div style={{ fontSize: '15px', color: '#2563eb', lineHeight: '1.4', fontWeight: 'normal' }}>
                      🏁 <span style={{ color: '#9333ea', fontSize: '13px' }}>{item.arrival_region} · {item.arrival_town}</span> {item.dropoff_point}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '90px' }}>
                    <div style={{ fontWeight: '900', color: '#ef4444' }}><span style={{ fontSize: '14px', marginRight: '2px' }}>{item.currency}</span><span style={{ fontSize: '24px' }}>{item.price}</span></div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                  </div>
                </div>
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <div style={{ fontSize: '10px', color: '#EAB308', fontWeight: 'bold' }}>巴士資訊</div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{item.booking_remarks || '--'}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')}} 
                          style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                    {item.wechat_app ? '微信購票' : '立即購票'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {!isMobile && <div style={{ maxWidth: '1000px', margin: '30px auto', textAlign: 'center' }}><AdBanner /></div>}

      <footer style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '25px', overflow: 'hidden' }}><AdBanner /></div>
        <div style={{ margin: '15px 0', fontSize: '13px', fontWeight: 'bold' }}>
          <a onClick={() => showNotice('about')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>關於我們</a> |
          <a onClick={() => showNotice('contact')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>聯絡我們</a> |
          <a onClick={() => showNotice('privacy')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>隱私權政策</a> |
          <a onClick={() => showNotice('terms')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>服務條款</a>
        </div>
        <p>© {new Date().getFullYear()} 深中珠巴士懶人包. All rights reserved.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: '#94a3b8' }}>
          <span>開發者:</span><img src="/image.png" alt="Dev Logo" style={{ height: '16px', width: 'auto' }} /><span>中山美食地圖群組團隊</span>
        </div>
      </footer>

      {showBackToTop && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#B8860B', color: 'white', border: 'none', cursor: 'pointer', zIndex: 90, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>}

      {/* 詳情放大視窗 */}
      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
          <button onClick={() => setDetailItem(null)} style={{ alignSelf: 'flex-end', padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>關閉 ✕</button>
          
          <div style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '15px', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px', backgroundColor: '#fff7ed', color: '#f97316', padding: '4px 12px', borderRadius: '8px', fontWeight: 'bold' }}>{detailItem.operator}</span>
            <h2 style={{ fontSize: '32px', marginTop: '15px', color: '#1e293b' }}>{detailItem.schedule}</h2>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '5px' }}>📍 出發站點</div>
              <div style={{ fontSize: '24px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.departure_region} · {detailItem.departure_town}</div>
              <a href={`https://www.amap.com/search?query=${detailItem.departure_region}${detailItem.departure_town}${detailItem.pickup_point}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '28px', color: '#2563eb', textDecoration: 'none', marginTop: '5px', fontWeight: 'bold' }}>
                {detailItem.pickup_point} <img src="/amap.png" alt="Amap" style={{ height: '32px', marginLeft: '10px' }} />
              </a>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '5px' }}>🏁 目的地點</div>
              <div style={{ fontSize: '24px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.arrival_region} · {detailItem.arrival_town}</div>
              <div style={{ fontSize: '28px', color: '#2563eb', fontWeight: 'bold' }}>{detailItem.dropoff_point}</div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
              <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '10px' }}>💰 票價 / 車程</div>
              <div style={{ fontSize: '40px', color: '#ef4444', fontWeight: '900' }}>{detailItem.currency} {detailItem.price}</div>
              <div style={{ fontSize: '20px', color: '#64748b', marginTop: '5px' }}>預計耗時: {detailItem.estimated_duration}</div>
            </div>
            <div>
              <div style={{ color: '#EAB308', fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>巴士資訊</div>
              <div style={{ fontSize: '20px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{detailItem.booking_remarks || '--'}</div>
            </div>
          </div>

          <div style={{ marginTop: '30px', paddingBottom: '40px' }}>
            <button onClick={() => detailItem.wechat_app ? (setSelectedWechatApp(detailItem.wechat_app), setShowModal(true)) : window.open(detailItem.source_url, '_blank')} 
                    style={{ width: '100%', backgroundColor: detailItem.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '18px', borderRadius: '16px', fontWeight: 'bold', fontSize: '22px' }}>
              {detailItem.wechat_app ? '前往微信購票' : '立即線上購票'}
            </button>
          </div>
        </div>
      )}

      {noticeInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#B8860B', marginBottom: '15px' }}>{noticeInfo.title}</h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>{noticeInfo.content}</div>
            <button onClick={() => setNoticeInfo(null)} style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '12px', cursor: 'pointer', border: 'none', fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>關閉</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <p>請複製名稱後到微信搜尋：</p><h3 style={{ color: '#22c55e', margin: '15px 0' }}>{selectedWechatApp}</h3>
            <button onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(selectedWechatApp); alert('已複製！'); } }} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', marginTop: '10px' }}>暫時關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
