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

// 橫向廣告組件
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
        content = (
          <>
            <p><strong>「深中珠巴士懶人包」</strong> 是一個由民間發起的資訊整合工具。我們的使命是打破跨市交通的資訊隔閡，讓旅客能一站式搜尋深圳、中山、珠海之間的交通方案。</p>
            <p style={{ marginTop: '10px', color: '#92400e', fontWeight: 'bold' }}>💡 背後故事：</p>
            <p>本站背後的數據庫並非官方自動同步，而是由<strong>中山美食地圖團隊</strong>透過「人手人肉」方式，逐一從各大營運商官網、小程式蒐集零散時間表並進行校對輸入。這是一項極度耗費血汗時間與心力的工作，只為讓大家出行更便利。請大家多多支持我們的團隊！</p>
          </>
        );
        break;
      case 'contact':
        title = '聯絡我們';
        content = (
          <>
            <p>如您發現班次資訊有誤、有新路線建議，或希望提供支持，歡迎隨時聯絡我們：</p>
            <p style={{ marginTop: '10px' }}><strong>Facebook 群組：</strong> <a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold' }}>中山美食地圖群組</a></p>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>您的每一次反饋，都是對我們這份「血汗數據庫」最好的回報與鼓勵。</p>
          </>
        );
        break;
      case 'privacy':
        title = '隱私權政策';
        content = <p>本站為純資訊展示平台。我們使用 Google Analytics 及 AdSense 服務來分析流量及維持營運。所有的購票交易均在第三方官方平台上進行，本站不會接觸、收集或儲存您的任何付款資訊或身分證明文件。</p>;
        break;
      case 'terms':
        title = '服務條款';
        content = (
          <>
            <p>使用本站服務即代表您知悉並同意以下條款：</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li><strong>人手輸入誤差：</strong>由於本站數據由人手人肉錄入，雖致力準確，但仍可能存在延遲或誤差。購票前請務必點擊連結，以營運商官方最新資訊為準。</li>
              <li><strong>免責聲明：</strong>本站不承擔因資訊不準確而導致的任何行程延誤、金錢損失或法律責任。</li>
              <li><strong>禁止擅自抓取：</strong>本站數據為團隊心血結晶，未經書面授權，禁止任何形式的自動化抓取或商業轉載。</li>
            </ul>
          </>
        );
        break;
    }
    if (content) setNoticeInfo({ title, content });
  };

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white', color: '#1e293b', fontFamily: GLOBAL_FONT };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' };
  const swapBtnStyle: React.CSSProperties = { width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '20px', fontFamily: GLOBAL_FONT, letterSpacing: '0.01em' }}>
      
      {/* Header Banner - 包含 Logo 及 右側 Icons */}
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Logo" style={{ height: '48px' }} />
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>深中珠巴士<span style={{ color: '#FFE600' }}>懶人包</span></h1>
        </div>
        
        {/* 右側：Icons + 最後更新 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div 
              onClick={() => setShowRouteOverview(true)} 
              style={{ cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} 
              title="路線概覽"
            >🗺️</div>
            <div 
              onClick={() => setShowGuide(true)} 
              style={{ cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} 
              title="新手指南"
            >💡</div>
          </div>
          <div style={{ fontSize: '10px', textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新:</div>
            <div>{lastUpdated}</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        
        {/* 🔥 頂部廣告位：中山美食地圖 Web App 推廣 Banner */}
        <a 
          href="https://zhongshan-food-map.vercel.app/" 
          target="_blank" 
          rel="noreferrer" 
          style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '12px',
            backgroundColor: '#ffffff', 
            border: '2px solid #fef3c7', 
            borderRadius: '16px', 
            padding: '12px 16px',
            textDecoration: 'none', 
            marginBottom: '24px', 
            boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img src="/image.png" alt="中山美食地圖" style={{ height: '40px', width: '40px', borderRadius: '10px', objectFit: 'contain' }} />
            <div>
              <div style={{ color: '#92400e', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                中山美食地圖 Web App <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>推薦</span>
              </div>
              <div style={{ color: '#d97706', fontSize: '12px', marginTop: '3px', fontWeight: '500' }}>發掘隱世好店，中山搵食必備！</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#f97316', color: 'white', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
            免安裝即用
          </div>
        </a>

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

        {loading ? <p style={{ textAlign: 'center' }}>🚌 數據血汗加載中...</p> : filteredData.length === 0 ? (
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

      {/* 核心功能 1：全屏路線概覽放大版 */}
      {showRouteOverview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1100, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <button onClick={() => setShowRouteOverview(false)} style={{ alignSelf: 'flex-end', padding: '12px 24px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>關閉 ✕</button>
          <h2 style={{ color: '#B8860B', borderBottom: '3px solid #B8860B', paddingBottom: '10px', fontSize: '28px', fontWeight: 900 }}>🚌 跨市及機場路線概覽</h2>
          <div style={{ fontSize: '22px', color: '#b45309', lineHeight: '2.2', marginTop: '24px' }}>
            本站現已全面覆蓋 <strong>深圳、中山、珠海</strong> 三地之往返巴士資訊。主要路徑包含：<br /><br />
            ✅ <strong>深圳 ⇄ 中山</strong>（深中通道快線）<br />
            ✅ <strong>深圳 ⇄ 珠海</strong><br />
            ✅ <strong>中山 ⇄ 珠海</strong><br />
            ✅ <strong>深圳市內 ⇄ 深圳機場</strong><br /><br />
            一站式對比各大營運商時間表、票價與購票方式。
          </div>
          <div style={{ marginTop: '50px', paddingTop: '24px', borderTop: '2px dashed #fef3c7', fontSize: '16px', color: '#92400e', lineHeight: '1.8', backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px' }}>
            💡 <strong>編者的話：</strong><br />
            本站背後的數據庫並非官方接口同步，而是由團隊<strong>人手、人肉地蒐集</strong>各大營辦商的零散時間表，並逐一輸入更新。這項工作耗費了大量血汗時間與心力。<strong>請大家大力支持「中山美食地圖」團隊！</strong>
          </div>
        </div>
      )}

      {/* 核心功能 2：新手指南視窗 */}
      {showGuide && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1200, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <button onClick={() => setShowGuide(false)} style={{ alignSelf: 'flex-end', padding: '12px 24px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>關閉 ✕</button>
          <h2 style={{ color: '#0369a1', fontSize: '28px', fontWeight: 900, marginBottom: '24px', borderBottom: '3px solid #0369a1', paddingBottom: '10px' }}>💡 使用指南 &amp; 功能介紹</h2>
          
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#0ea5e9', fontSize: '22px', borderLeft: '6px solid #0ea5e9', paddingLeft: '12px' }}>1. 如何加入手機主畫面 (免安裝直接用)</h3>
            <div style={{ fontSize: '17px', lineHeight: '1.8', color: '#334155', marginTop: '12px', backgroundColor: '#f0f9ff', padding: '15px', borderRadius: '12px' }}>
              <strong>📱 iPhone (iOS):</strong><br />
              1. 使用 Safari 打開本站<br />
              2. 點擊底部的「分享」圖標 (向上箭頭)<br />
              3. 捲動並選擇<strong>「加入主畫面」</strong>。<br /><br />
              <strong>🤖 Android:</strong><br />
              1. 使用 Chrome 打開本站<br />
              2. 點擊右上角「三個點」菜單<br />
              3. 選擇<strong>「安裝應用程式」</strong>或「加入主畫面」。
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#0ea5e9', fontSize: '22px', borderLeft: '6px solid #0ea5e9', paddingLeft: '12px' }}>2. 核心功能簡介</h3>
            <ul style={{ fontSize: '17px', lineHeight: '2.2', color: '#334155', paddingLeft: '20px', marginTop: '12px' }}>
              <li><strong>三層精準搜索：</strong> 地區 -{'>'} 城鎮 -{'>'} 站點，精確定位。</li>
              <li><strong>高德地圖導航：</strong> 點擊站點旁圖標直接跳轉高德地圖。</li>
              <li><strong>一鍵微信購票：</strong> 點擊綠色按鈕自動複製小程式名稱。</li>
              <li><strong>全路徑對調：</strong> 點擊 🔄 鍵快速切換往返搜尋。</li>
              <li><strong>放大詳情模式：</strong> 點擊卡片任何地方即可放大查看超大字體。</li>
              <li><strong>血汗數據庫：</strong> 人手蒐集最新班次，保證資訊實用。</li>
            </ul>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '15px', textAlign: 'center', marginTop: '20px' }}>感謝支持中山美食地圖團隊！</p>
        </div>
      )}

      {/* 卡片詳情放大 */}
      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1050, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <button onClick={() => setDetailItem(null)} style={{ alignSelf: 'flex-end', padding: '12px 24px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>關閉 ✕</button>
          <div style={{ borderBottom: '3px solid #3b82f6', paddingBottom: '15px', marginBottom: '25px' }}>
            <span style={{ fontSize: '15px', backgroundColor: '#fff7ed', color: '#f97316', padding: '5px 15px', borderRadius: '8px', fontWeight: 'bold' }}>{detailItem.operator}</span>
            <h2 style={{ fontSize: '36px', marginTop: '15px', color: '#1e293b', fontWeight: 900 }}>{detailItem.schedule}</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div><div style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '8px' }}>📍 出發站點</div>
              <div style={{ fontSize: '28px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.departure_region} · {detailItem.departure_town}</div>
              <a href={`https://www.amap.com/search?query=${detailItem.departure_region}${detailItem.departure_town}${detailItem.pickup_point}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '32px', color: '#2563eb', textDecoration: 'none', marginTop: '10px', fontWeight: 900 }}>
                {detailItem.pickup_point} <img src="/amap.png" alt="Amap" style={{ height: '36px', marginLeft: '12px' }} />
              </a>
            </div>
            <div><div style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '8px' }}>🏁 目的地點</div>
              <div style={{ fontSize: '28px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.arrival_region} · {detailItem.arrival_town}</div>
              <div style={{ fontSize: '32px', color: '#2563eb', fontWeight: 900 }}>{detailItem.dropoff_point}</div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '20px' }}>
              <div style={{ color: '#94a3b8', fontSize: '18px', marginBottom: '12px' }}>💰 票價 / 車程</div>
              <div style={{ fontSize: '48px', color: '#ef4444', fontWeight: '900' }}>{detailItem.currency} {detailItem.price}</div>
              <div style={{ fontSize: '22px', color: '#64748b', marginTop: '8px' }}>預計耗時: {detailItem.estimated_duration}</div>
            </div>
            <div><div style={{ color: '#EAB308', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>巴士資訊</div>
              <div style={{ fontSize: '20px', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{detailItem.booking_remarks || '--'}</div>
            </div>
          </div>
          <div style={{ marginTop: '40px', paddingBottom: '50px' }}>
            <button onClick={() => detailItem.wechat_app ? (setSelectedWechatApp(detailItem.wechat_app), setShowModal(true)) : window.open(detailItem.source_url, '_blank')} 
                    style={{ width: '100%', backgroundColor: detailItem.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '22px', borderRadius: '20px', fontWeight: 'bold', fontSize: '24px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
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
