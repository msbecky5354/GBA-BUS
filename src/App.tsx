import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態
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
  sort_dr: number;
  sort_ar: number;
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

// --- 更新：使用你提供的 image_bea913.png 作為交換圖標 ---
const SwapButtonIcon = () => (
  <img 
    src="/image_bea913.png" 
    alt="Swap" 
    style={{ width: '32px', height: '32px', display: 'block' }} 
    onError={(e) => e.currentTarget.style.display = 'none'}
  />
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
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
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
            wechat_app: v[13] ? v[13].replace(/\r$/, '').trim() : '',
            sort_dr: parseInt((v[14] || '').trim(), 10) || -9999,
            sort_ar: parseInt((v[15] || '').trim(), 10) || -9999
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

  const depRegions = useMemo(() => Array.from(new Set(busData.map(i => i.departure_region.substring(0, 2)))).filter(Boolean).sort(), [busData]);
  const arrRegions = useMemo(() => Array.from(new Set(busData.map(i => i.arrival_region.substring(0, 2)))).filter(Boolean).sort(), [busData]);

  const depTowns = useMemo(() => {
    const townMap = new Map<string, number>();
    busData.forEach(i => {
      if (!depRegionFilter || i.departure_region.startsWith(depRegionFilter)) {
        townMap.set(i.departure_region, Math.max(townMap.get(i.departure_region) || -9999, i.sort_dr));
      }
    });
    return Array.from(townMap.entries()).filter(e => Boolean(e[0])).sort((a, b) => a[1] !== b[1] ? b[1] - a[1] : a[0].localeCompare(b[0], 'zh-HK')).map(e => e[0]);
  }, [busData, depRegionFilter]);

  const arrTowns = useMemo(() => {
    const townMap = new Map<string, number>();
    busData.forEach(i => {
      if (!arrRegionFilter || i.arrival_region.startsWith(arrRegionFilter)) {
        townMap.set(i.arrival_region, Math.max(townMap.get(i.arrival_region) || -9999, i.sort_ar));
      }
    });
    return Array.from(townMap.entries()).filter(e => Boolean(e[0])).sort((a, b) => a[1] !== b[1] ? b[1] - a[1] : a[0].localeCompare(b[0], 'zh-HK')).map(e => e[0]);
  }, [busData, arrRegionFilter]);
  
  const availablePickups = useMemo(() => Array.from(new Set(busData.filter(i => (!depRegionFilter || i.departure_region.startsWith(depRegionFilter)) && (!depTownFilter || i.departure_region === depTownFilter)).map(i => i.pickup_point))).filter(Boolean).sort(), [busData, depRegionFilter, depTownFilter]);
  const availableDropoffs = useMemo(() => Array.from(new Set(busData.filter(i => (!arrRegionFilter || i.arrival_region.startsWith(arrRegionFilter)) && (!arrTownFilter || i.arrival_region === arrTownFilter)).map(i => i.dropoff_point))).filter(Boolean).sort(), [busData, arrRegionFilter, arrTownFilter]);

  useEffect(() => {
    setFilteredData(busData.filter(i => (
      (!depRegionFilter || i.departure_region.startsWith(depRegionFilter)) && (!depTownFilter || i.departure_region === depTownFilter) && (!pickupFilter || i.pickup_point === pickupFilter) &&
      (!arrRegionFilter || i.arrival_region.startsWith(arrRegionFilter)) && (!arrTownFilter || i.arrival_region === arrTownFilter) && (!dropoffFilter || i.dropoff_point === dropoffFilter)
    )));
  }, [depRegionFilter, depTownFilter, pickupFilter, arrRegionFilter, arrTownFilter, dropoffFilter, busData]);

  const handleReset = () => {
    setDepRegionFilter(''); setDepTownFilter(''); setPickupFilter('');
    setArrRegionFilter(''); setArrTownFilter(''); setDropoffFilter('');
  };

  const showNotice = (type: string) => {
    let content = null;
    switch (type) {
      case 'about':
        content = (
          <>
            <p><strong>「深中珠巴士通攻略」</strong> 是一個專為往返深圳、中山、珠海及周邊地區旅客設計的資訊整合平台。</p>
            <p>我們致力於蒐集各大巴士營運商的最新數據，幫助您一站式搜尋跨市巴士路線、班次時間及購票方式，讓您的出行更加輕鬆便捷。</p>
            <p style={{ color: '#ef4444', fontWeight: 'bold' }}>請注意：本站為獨立運作的第三方攻略平台，並非官方巴士營運商。</p>
          </>
        );
        setNoticeInfo({ title: '關於我們', content }); break;
      case 'contact':
        content = (
          <>
            <p>如果您對本攻略有任何建議，或發現班次資訊需要更新，歡迎加入我們的社群討論：</p>
            <ul style={{ lineHeight: '2' }}>
              <li>
                <strong>Facebook 群組：</strong> 
                <a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                   中山美食地圖群組
                </a>
              </li>
            </ul>
            <p>感謝您的支持與協助，讓我們能持續完善這份巴士通攻略！</p>
          </>
        );
        setNoticeInfo({ title: '聯絡我們', content }); break;
      case 'privacy':
        content = (
          <>
            <p>本站極為重視您的隱私，特此說明我們的資訊處理方式：</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>數據收集：</strong>本站為純資訊展示平台，不會主動收集您的個人身份識別資料。</li>
              <li><strong>第三方分析與廣告：</strong>本站使用 Google Analytics 及 Google AdSense 服務。</li>
              <li><strong>外部連結：</strong>本站提供的購票連結均指向第三方平台。點擊後之隱私權保護將受該平台政策管轄。</li>
            </ul>
          </>
        );
        setNoticeInfo({ title: '隱私權政策', content }); break;
      case 'terms':
        content = (
          <>
            <p>使用「深中珠巴士通攻略」代表您同意以下條款：</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>內容僅供參考：</strong>本站所載資訊均蒐集自公開網絡，並不保證其 100% 準確性。</li>
              <li><strong>核實義務：</strong>強烈建議您在出發前，向巴士營運商官方核實最新資訊。</li>
              <li><strong>免責聲明：</strong>對於因依賴本站資訊而產生的任何延誤或損失，本站概不負責。</li>
            </ul>
          </>
        );
        setNoticeInfo({ title: '服務條款', content }); break;
    }
  };

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' };
  
  // 更新後的 Swap 按鈕背景樣式 (設為透明，因為圖片自帶背景顏色)
  const swapBtnStyle: React.CSSProperties = { 
    width: '32px', 
    height: '32px', 
    border: 'none', 
    backgroundColor: 'transparent', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0,
    padding: 0
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '20px', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.png" alt="Logo" style={{ height: '28px', width: 'auto' }} onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ color: '#FFE600' }}>攻略</span></h1>
        </div>
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新:</div>
          <div>{lastUpdated}</div>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        
        {/* 搜尋卡片 */}
        <div style={{ maxWidth: '1000px', margin: '0 auto 24px', position: 'relative' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            
            <button onClick={handleReset} style={{ position: 'absolute', top: '15px', right: '15px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🔄 重置
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              {[
                { label: '出發地區', val: depRegionFilter, set: setDepRegionFilter, options: depRegions, reset: () => {setDepTownFilter(''); setPickupFilter('');}, swap: () => {const t=depRegionFilter; setDepRegionFilter(arrRegionFilter); setArrRegionFilter(t); const t2=depTownFilter; setDepTownFilter(arrTownFilter); setArrTownFilter(t2); const t3=pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);}, label2: '目的地區', val2: arrRegionFilter, set2: setArrRegionFilter, options2: arrRegions, reset2: () => {setArrTownFilter(''); setDropoffFilter('');} },
                { label: '出發城鎮', val: depTownFilter, set: setDepTownFilter, options: depTowns, reset: () => setPickupFilter(''), swap: () => {const t2=depTownFilter; setDepTownFilter(arrTownFilter); setArrTownFilter(t2); const t3=pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);}, label2: '目的城鎮', val2: arrTownFilter, set2: setArrTownFilter, options2: arrTowns, reset2: () => setDropoffFilter('') },
                { label: '上車站點', val: pickupFilter, set: setPickupFilter, options: availablePickups, reset: () => {}, swap: () => {const t3=pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t3);}, label2: '落車站點', val2: dropoffFilter, set2: setDropoffFilter, options2: availableDropoffs, reset2: () => {} }
              ].map((row, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}><span style={labelStyle}>{row.label}</span>
                    <select style={selectStyle} value={row.val} onChange={e => {row.set(e.target.value); row.reset();}}>
                      <option value="">所有</option>{row.options.map(r => <option key={r} value={r}>{idx===1 && depRegionFilter ? r.substring(2) : r}</option>)}
                    </select>
                  </div>
                  {/* 使用新的圖片圖標按鈕 */}
                  <button onClick={row.swap} style={swapBtnStyle}><SwapButtonIcon /></button>
                  <div style={{ flex: 1 }}><span style={labelStyle}>{row.label2}</span>
                    <select style={selectStyle} value={row.val2} onChange={e => {row.set2(e.target.value); row.reset2();}}>
                      <option value="">所有</option>{row.options2.map(r => <option key={r} value={r}>{idx===1 && arrRegionFilter ? r.substring(2) : r}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 班次列表 */}
        {loading ? <p style={{ textAlign: 'center' }}>🚌 資料同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '180px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', marginBottom: '12px', fontWeight: 'bold' }}>{item.operator}</span>
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{item.schedule}</div>
                <div style={{ marginBottom: '10px', paddingRight: '110px' }}>
                  <div style={{ fontSize: '15px', marginBottom: '6px', color: '#334155' }}>📍 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.departure_region}</span> <strong>{item.pickup_point}</strong></div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>🏁 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.arrival_region}</span> <strong>{item.dropoff_point}</strong></div>
                </div>
                <div style={{ position: 'absolute', top: '55%', right: '20px', transform: 'translateY(-50%)', textAlign: 'right' }}>
                  <div style={{ fontWeight: '900', color: '#ef4444' }}><span style={{ fontSize: '14px', marginRight: '2px' }}>{item.currency}</span><span style={{ fontSize: '24px' }}>{item.price}</span></div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}><div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>巴士路線</div><div style={{ fontSize: '11px', color: '#64748b' }}>{item.booking_remarks || '--'}</div></div>
                  <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>{item.wechat_app ? '微信購票' : '立即購票'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ maxWidth: '1280px', margin: '30px auto 0', padding: '20px 16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '25px', overflow: 'hidden' }}><AdBanner /></div>
        
        <div style={{ margin: '15px 0', fontSize: '13px', fontWeight: 'bold' }}>
          <a onClick={() => showNotice('about')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>關於我們</a> |
          <a onClick={() => showNotice('contact')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>聯絡我們</a> |
          <a onClick={() => showNotice('privacy')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>隱私權政策</a> |
          <a onClick={() => showNotice('terms')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>服務條款</a>
        </div>

        <p>© {new Date().getFullYear()} 深中珠巴士通攻略. All rights reserved.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: '#94a3b8' }}>
          <span>開發者:</span><img src="/image.png" alt="Dev Logo" style={{ height: '16px' }} /><span>中山美食地圖群組團隊</span>
        </div>
      </footer>

      {/* 返回頂部按鈕 */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#B8860B', color: 'white', border: 'none', cursor: 'pointer', zIndex: 90, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg></button>
      )}

      {/* 聲明內容彈窗 */}
      {noticeInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 200 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#B8860B', marginBottom: '15px' }}>{noticeInfo.title}</h2>
            <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{noticeInfo.content}</div>
            <button onClick={() => setNoticeInfo(null)} style={{ width: '100%', backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '12px', fontWeight: 'bold', marginTop: '25px', cursor: 'pointer', border: 'none' }}>關閉</button>
          </div>
        </div>
      )}

      {/* 微信購票彈窗 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <p>請複製名稱後到微信搜尋：</p><h3 style={{ color: '#22c55e', margin: '15px 0' }}>{selectedWechatApp}</h3>
            <button onClick={() => {navigator.clipboard.writeText(selectedWechatApp); alert('已複製！');}} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', marginTop: '10px' }}>暫時關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
