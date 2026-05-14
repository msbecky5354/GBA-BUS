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
  
  // 顯示頁尾 4 個聲明內容的彈窗狀態
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
            if (char === '"' && line[i + 1] === '"') {
              curVal += '"';
              i++;
            } else if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              v.push(curVal.trim());
              curVal = '';
            } else {
              curVal += char;
            }
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
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const timeStr = now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
        setLastUpdated(`${dateStr} ${timeStr}`);

      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. 過濾邏輯
  const depRegions = useMemo(() => Array.from(new Set(busData.map(i => i.departure_region.substring(0, 2)))).filter(Boolean).sort(), [busData]);
  const arrRegions = useMemo(() => Array.from(new Set(busData.map(i => i.arrival_region.substring(0, 2)))).filter(Boolean).sort(), [busData]);

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
    const t2 = depTownFilter; setDepTownFilter(arrTownFilter); setArrTownFilter(t2);
    const t3 = pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);
  };
  const handleSwapTowns = () => {
    const t2 = depTownFilter; setDepTownFilter(arrTownFilter); setArrTownFilter(t2);
    const t3 = pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);
  };
  const handleSwapPoints = () => {
    const t3 = pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);
  };

  const handleReset = () => {
    setDepRegionFilter(''); setDepTownFilter(''); setPickupFilter('');
    setArrRegionFilter(''); setArrTownFilter(''); setDropoffFilter('');
  };

  // 5. 聲明內容定義 (已刪除電郵及微信，只保留 Facebook 群組連結)
  const showNotice = (type: string) => {
    let content = null;
    switch (type) {
      case 'about':
        content = (
          <>
            <p><strong>「深中珠巴士通」</strong>致力於為往返深圳、中山、珠海及周邊地區的旅客，提供最新、最齊全的跨市巴士路線、時間表及購票資訊。</p>
            <p>我們深知跨境及跨市交通的繁瑣，因此整合了各大巴士營運商的數據，讓您能一站式搜尋並比較最適合的出行方案。</p>
            <p style={{ color: '#ef4444', fontWeight: 'bold' }}>請注意：本站為獨立的交通資訊整合平台，並非官方巴士營運商。</p>
          </>
        );
        setNoticeInfo({ title: '關於我們', content });
        break;
      case 'contact':
        content = (
          <>
            <p>如果您對本網站有任何建議、發現班次資料需要更新，或者有商業合作意向，歡迎透過以下方式與我們聯絡：</p>
            <ul style={{ lineHeight: '2' }}>
              <li><strong>Facebook 群組：</strong> <a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>加入我們的 Facebook 討論群組</a></li>
            </ul>
            <p>我們會在收到訊息後盡快回覆您。感謝您協助我們完善這份攻略！</p>
          </>
        );
        setNoticeInfo({ title: '聯絡我們', content });
        break;
      case 'privacy':
        content = (
          <>
            <p>本隱私權政策旨在說明我們如何處理您的資訊：</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>資訊收集：</strong>本站主要為資訊展示平台，一般情況下不會主動要求使用者提供個人身分識別資訊。</li>
              <li><strong>第三方服務與 Cookies：</strong>本站使用了 Google Analytics（分析）及 Google AdSense（廣告）。這些服務可能會使用 Cookies 來收集您訪問本站的數據，以提供相關廣告及分析流量。</li>
              <li><strong>外部連結：</strong>本站包含前往微信小程序或第三方購票網站的連結。點擊這些連結後，您的隱私將受該第三方網站的政策管轄，本站不對其行為負責。</li>
            </ul>
          </>
        );
        setNoticeInfo({ title: '隱私權政策', content });
        break;
      case 'terms':
        content = (
          <>
            <p>歡迎使用「深中珠巴士通」。使用本站即代表您同意以下條款：</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>免責聲明：</strong>本站提供的所有巴士班次、票價、路線等資訊僅供參考。雖然我們致力確保資料準確，但不保證資訊的絕對正確性或時效性。購票或出行前請務必向官方核實。</li>
              <li><strong>責任限制：</strong>對於因依賴本站資訊而導致的任何延誤、損失或不便，本站概不負責。</li>
              <li><strong>版權聲明：</strong>本站的介面設計及資料整合方式受版權保護。未經許可，請勿擅自抓取或複製本站作商業用途。</li>
            </ul>
          </>
        );
        setNoticeInfo({ title: '服務條款', content });
        break;
    }
  };

  // 樣式常數
  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
  const swapBtnStyle: React.CSSProperties = { width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#B8860B' };
  
  const footerLinkStyle: React.CSSProperties = { color: '#3b82f6', textDecoration: 'none', margin: '0 8px', cursor: 'pointer' };
  const footerDividerStyle: React.CSSProperties = { color: '#cbd5e1' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '20px', fontFamily: 'sans-serif' }}>
      
      {/* 頂部 Header */}
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '28px', width: 'auto', display: 'block' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ color: '#FFE600' }}>攻略</span></h1>
        </div>
        <div style={{ fontSize: '10px', textAlign: 'right', lineHeight: '1.3' }}>
          <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新:</div>
          <div>{lastUpdated}</div>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        {/* 搜尋卡片 */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>出發地區</span>
                <select style={selectStyle} value={depRegionFilter} onChange={e => {setDepRegionFilter(e.target.value); setDepTownFilter(''); setPickupFilter('');}}>
                  <option value="">所有地區</option>
                  {depRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={handleSwapRegions} style={swapBtnStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" />
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>目的地區</span>
                <select style={selectStyle} value={arrRegionFilter} onChange={e => {setArrRegionFilter(e.target.value); setArrTownFilter(''); setDropoffFilter('');}}>
                  <option value="">所有地區</option>
                  {arrRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>出發城鎮</span>
                <select style={selectStyle} value={depTownFilter} onChange={e => {setDepTownFilter(e.target.value); setPickupFilter('');}}>
                  <option value="">所有城鎮</option>
                  {depTowns.map(r => <option key={r} value={r}>{depRegionFilter ? r.substring(2) : r}</option>)}
                </select>
              </div>
              <button onClick={handleSwapTowns} style={swapBtnStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" />
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>目的城鎮</span>
                <select style={selectStyle} value={arrTownFilter} onChange={e => {setArrTownFilter(e.target.value); setDropoffFilter('');}}>
                  <option value="">所有城鎮</option>
                  {arrTowns.map(r => <option key={r} value={r}>{arrRegionFilter ? r.substring(2) : r}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>上車站點</span>
                <select style={selectStyle} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}>
                  <option value="">所有站點</option>
                  {availablePickups.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button onClick={handleSwapPoints} style={swapBtnStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4" /><path d="M20 7H4" /><path d="M8 21l-4-4 4-4" /><path d="M4 17h16" />
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>落車站點</span>
                <select style={selectStyle} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}>
                  <option value="">所有站點</option>
                  {availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleReset} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>一鍵還原所有搜尋條件</button>
          </div>
        </div>

        {/* 班次列表 */}
        {loading ? <p style={{ textAlign: 'center' }}>🚌 資料同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '180px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', marginBottom: '12px', fontWeight: 'bold' }}>{item.operator}</span>
                
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                  {item.schedule}
                </div>
                
                <div style={{ marginBottom: '10px', paddingRight: '70px' }}>
                  <div style={{ fontSize: '15px', marginBottom: '6px', color: '#334155', wordBreak: 'break-word' }}>
                    📍 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.departure_region}</span> <strong>{item.pickup_point}</strong>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', wordBreak: 'break-word' }}>
                    🏁 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.arrival_region}</span> <strong>{item.dropoff_point}</strong>
                  </div>
                </div>

                <div style={{ position: 'absolute', top: '55%', right: '20px', transform: 'translateY(-50%)', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ef4444' }}>{item.currency}{item.price}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '2px' }}>巴士路線</div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{item.booking_remarks || '--'}</div>
                  </div>
                  <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {item.wechat_app ? '微信購票' : '立即購票'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 頁尾免責聲明及 Google Ads */}
      <footer style={{ maxWidth: '1000px', margin: '30px auto 0', padding: '20px 16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textAlign: 'center', lineHeight: '1.6' }}>
        
        {/* Google Ads 廣告展示區塊 */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '25px', overflow: 'hidden' }}>
          <AdBanner />
        </div>

        {/* 4 個聲明連結 (點擊彈出內容) */}
        <div style={{ margin: '15px 0', fontSize: '13px', fontWeight: 'bold' }}>
          <a onClick={(e) => { e.preventDefault(); showNotice('about'); }} style={footerLinkStyle}>關於我們</a>
          <span style={footerDividerStyle}>|</span>
          <a onClick={(e) => { e.preventDefault(); showNotice('contact'); }} style={footerLinkStyle}>聯絡我們</a>
          <span style={footerDividerStyle}>|</span>
          <a onClick={(e) => { e.preventDefault(); showNotice('privacy'); }} style={footerLinkStyle}>隱私權政策</a>
          <span style={footerDividerStyle}>|</span>
          <a onClick={(e) => { e.preventDefault(); showNotice('terms'); }} style={footerLinkStyle}>服務條款</a>
        </div>

        <p style={{ marginBottom: '8px' }}><strong>免責聲明：</strong>本網站提供的所有巴士班次、票價、路線及相關資訊僅供參考，不保證其絕對準確性或時效性。實際情況請以各巴士營運商之官方最新公佈為準。</p>
        <p>© {new Date().getFullYear()} 深中珠巴士通. All rights reserved.</p>
      </footer>

      {/* --- 聲明內容彈窗 --- */}
      {noticeInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 200 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%', textAlign: 'left', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#B8860B', fontSize: '1.5rem' }}>{noticeInfo.title}</h2>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
              {noticeInfo.content}
            </div>
            <button onClick={() => setNoticeInfo(null)} style={{ width: '100%', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', marginTop: '25px', cursor: 'pointer' }}>
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 微信購票彈窗 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#64748b' }}>請複製名稱後到微信搜尋：</p>
            <h3 style={{ margin: '15px 0', color: '#22c55e', fontSize: '1.4rem' }}>{selectedWechatApp}</h3>
            <button onClick={() => {navigator.clipboard.writeText(selectedWechatApp); alert('已複製！');}} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '10px' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', marginTop: '10px' }}>暫時關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
