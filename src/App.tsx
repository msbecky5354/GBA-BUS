import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料結構
interface BusItem {
  operator: string;
  departure_region: string;
  pickup_point: string;
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

const App: React.FC = () => {
  const [busData, setBusData] = useState<BusItem[]>([]);
  const [filteredData, setFilteredData] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // 2. 搜索狀態
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [pickupFilter, setPickupFilter] = useState<string>('');
  const [destFilter, setDestFilter] = useState<string>('');
  const [dropoffFilter, setDropoffFilter] = useState<string>('');
  
  // 3. UI 狀態
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [selectedWechatApp, setSelectedWechatApp] = useState<string>('');
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showBackTop, setShowBackTop] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 4. 讀取數據
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        const result = lines.slice(1).map(line => {
          const values = line.split(',');
          const rawWechat = values[10] || '';
          return {
            operator: (values[0] || '').trim(),
            departure_region: (values[1] || '').trim(),
            pickup_point: (values[2] || '').trim(),
            dropoff_point: (values[3] || '').trim(),
            schedule: (values[4] || '').trim(),
            estimated_duration: (values[5] || '').trim(),
            price: (values[6] || '').trim(),
            currency: (values[7] || '').trim(),
            booking_remarks: (values[8] || '').trim(),
            source_url: (values[9] || '').trim(),
            wechat_app: rawWechat.replace(/\r$/, '').trim() 
          };
        }).filter(item => item.operator !== '');

        result.sort((a, b) => {
          const regComp = a.departure_region.localeCompare(b.departure_region, 'zh-HK');
          return regComp !== 0 ? regComp : a.pickup_point.localeCompare(b.pickup_point, 'zh-HK');
        });
        
        setBusData(result);
        setFilteredData(result);
        setLoading(false);
        
        const now = new Date();
        setLastUpdated(`${now.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (error) {
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 5. 選單邏輯
  const departureRegions = useMemo(() => Array.from(new Set(busData.map(i => {
    const reg = i.departure_region || '';
    if (reg.startsWith('深圳灣')) return reg.substring(0, 5);
    return reg.substring(0, 2);
  }))).filter(Boolean).sort(), [busData]);

  const destinationRegions = useMemo(() => Array.from(new Set(busData.map(i => {
    const drop = i.dropoff_point || '';
    if (drop.startsWith('深圳灣')) return drop.substring(0, 5);
    return drop.substring(0, 2);
  }))).filter(Boolean).sort(), [busData]);

  const availablePickups = useMemo(() => {
    const subset = regionFilter ? busData.filter(i => i.departure_region.startsWith(regionFilter)) : busData;
    return Array.from(new Set(subset.map(i => i.pickup_point))).filter(Boolean).sort();
  }, [busData, regionFilter]);

  const availableDropoffs = useMemo(() => {
    const subset = destFilter ? busData.filter(i => i.dropoff_point.startsWith(destFilter)) : busData;
    return Array.from(new Set(subset.map(i => i.dropoff_point))).filter(Boolean).sort();
  }, [busData, destFilter]);

  useEffect(() => {
    const filtered = busData.filter(item => {
      const matchReg = regionFilter === '' || item.departure_region.startsWith(regionFilter);
      const matchPick = pickupFilter === '' || item.pickup_point === pickupFilter;
      const matchDest = destFilter === '' || item.dropoff_point.startsWith(destFilter);
      const matchDrop = dropoffFilter === '' || item.dropoff_point === dropoffFilter;
      return matchReg && matchPick && matchDest && matchDrop;
    });
    setFilteredData(filtered);
  }, [regionFilter, pickupFilter, destFilter, dropoffFilter, busData]);

  // 6. 功能函數
  const handleSwapRegions = () => {
    const temp = regionFilter;
    setRegionFilter(destFilter);
    setDestFilter(temp);
  };

  const handleSwapLocations = () => {
    const temp = pickupFilter;
    setPickupFilter(dropoffFilter);
    setDropoffFilter(temp);
  };

  const handleReset = () => {
    setRegionFilter('');
    setPickupFilter('');
    setDestFilter('');
    setDropoffFilter('');
  };

  // 7. 樣式常數
  const selectStyle: React.CSSProperties = {
    padding: '10px 32px 10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    width: '100%',
    backgroundColor: 'white',
    fontSize: '14px',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '14px',
    cursor: 'pointer'
  };

  const tagStyle: React.CSSProperties = {
    backgroundColor: '#FFE600',
    color: '#333',
    fontSize: '11px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '4px',
    marginBottom: '4px',
    display: 'inline-block'
  };

  // 交換圖標組件 (加強顏色同粗細)
  const SwapIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3L21 8L16 13M21 8H3M8 21L3 16L8 11M3 16H21" />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: isMobile ? '12px 16px' : '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/image_48c638.jpg" alt="Logo" style={{ height: isMobile ? '36px' : '44px', borderRadius: '8px', backgroundColor: 'white' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 800 }}>深中珠巴士通 - 攻略</h1>
        </div>
        <div style={{ fontSize: '11px', opacity: 0.9 }}>⏱️ {lastUpdated}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        
        {/* 搜索卡片 */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 地區切換列 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={tagStyle}>出發地區</span>
                <select style={selectStyle} value={regionFilter} onChange={(e) => {setRegionFilter(e.target.value); setPickupFilter('');}}>
                  <option value="">所有出發地</option>
                  {departureRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <button 
                onClick={handleSwapRegions} 
                style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                title="切換地區"
              >
                <SwapIcon />
              </button>

              <div style={{ flex: 1 }}>
                <span style={tagStyle}>目的地區</span>
                <select style={selectStyle} value={destFilter} onChange={(e) => {setDestFilter(e.target.value); setDropoffFilter('');}}>
                  <option value="">所有目的地</option>
                  {destinationRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* 站點切換列 */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={tagStyle}>出發站點</span>
                <select style={selectStyle} value={pickupFilter} onChange={(e) => setPickupFilter(e.target.value)}>
                  <option value="">不限地點</option>
                  {availablePickups.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <button 
                onClick={handleSwapLocations} 
                style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                title="切換站點"
              >
                <SwapIcon />
              </button>

              <div style={{ flex: 1 }}>
                <span style={tagStyle}>落車站點</span>
                <select style={selectStyle} value={dropoffFilter} onChange={(e) => setDropoffFilter(e.target.value)}>
                  <option value="">不限地點</option>
                  {availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* 紅色重設按鈕 */}
            <button 
              onClick={handleReset} 
              style={{ 
                backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', 
                fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', width: '100%', marginTop: '8px', 
                boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' 
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              一鍵重設所有搜尋條件
            </button>

          </div>
        </div>

        {/* 班次列表 */}
        {loading ? <p style={{ textAlign: 'center' }}>🚌 班次同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => {
              const isSpecial = /T01[AB]/.test(item.operator);
              const hasWechat = item.wechat_app !== '';
              return (
                <div key={idx} style={{ 
                  backgroundColor: 'white', borderRadius: '16px', padding: '18px', 
                  borderTop: `6px solid ${isSpecial ? '#f97316' : '#3b82f6'}`, 
                  display: 'flex', flexDirection: 'column', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', backgroundColor: isSpecial ? '#ffedd5' : '#eff6ff', color: isSpecial ? '#9a3412' : '#1e40af' }}>{item.operator}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>開車時間</div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>{item.schedule}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '6px', color: '#334155' }}>📍 <span style={{ color: '#94a3b8', fontSize: '12px' }}>{item.departure_region} </span><strong>{item.pickup_point}</strong></div>
                      <div style={{ fontSize: '14px', color: '#334155' }}>🏁 <span style={{ color: '#94a3b8', fontSize: '12px' }}>目的地 </span><strong>{item.dropoff_point}</strong></div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '10px' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444' }}>{item.currency}{item.price}</span>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>⏳ 約 {item.estimated_duration}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                    <div style={{ flex: 1, paddingRight: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px', fontWeight: 'bold' }}>訂票備註</div>
                      <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>{item.booking_remarks || '--'}</div>
                    </div>
                    <button 
                      onClick={() => { if (hasWechat) { setSelectedWechatApp(item.wechat_app); setShowModal(true); } else { window.open(item.source_url, '_blank'); } }} 
                      style={{ backgroundColor: hasWechat ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {hasWechat ? '微信小程序' : '立即購票'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 彈窗部分 (與之前邏輯相同) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
            <h3>微信預約</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>請複製小程序名稱後<br/>到微信搜尋購票。</p>
            <button onClick={() => { navigator.clipboard.writeText(selectedWechatApp); alert('已複製！'); }} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '10px' }}>一鍵複製「{selectedWechatApp}」</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '450px', width: '100%', maxHeight: '70vh', overflowY: 'auto' }}>
            <h3>隱私權政策</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6 }}>本站使用 Google Analytics 及 AdSense 服務。數據僅供參考。</p>
            <button onClick={() => setShowPrivacyModal(false)} style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>關閉</button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '450px', width: '100%', maxHeight: '70vh', overflowY: 'auto' }}>
            <h3>服務條款</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6 }}>本站僅提供資訊整合，購票交易由第三方平台負責。</p>
            <button onClick={() => setShowTermsModal(false)} style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>關閉</button>
          </div>
        </div>
      )}

      {showBackTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '30px', right: isMobile ? '15px' : 'max(15px, calc(50vw - 520px))', backgroundColor: '#B8860B', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', zIndex: 40 }}>⬆️</button>
      )}

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '40px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: 'white' }}>
        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '15px' }}>資料來源: 各大巴士營運商 · 官方售票平台</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px', fontSize: '13px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('深中珠巴士通開發團隊致力於提供便捷資訊！'); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>關於我們</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>隱私權政策</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>服務條款</a>
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '15px' }}>深中珠巴士通 - 攻略 © 2026</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>開發團隊 - </span>
          <a href="https://zhongshan-food-map.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#d97706', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', fontSize: '12px' }}>
            <img src="/image.png" alt="Food Map" style={{ height: '18px', width: '18px', borderRadius: '4px' }} /> 中山美食地圖
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
