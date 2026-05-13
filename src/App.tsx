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

  const handleSwap = () => {
    const oldReg = regionFilter;
    const oldPick = pickupFilter;
    setRegionFilter(destFilter);
    setPickupFilter(dropoffFilter);
    setDestFilter(oldReg);
    setDropoffFilter(oldPick);
  };

  const copyToClipboard = () => {
    if (selectedWechatApp) {
      navigator.clipboard.writeText(selectedWechatApp);
      alert(`已複製「${selectedWechatApp}」，請前往微信搜尋！`);
    }
  };

  // 樣式常數
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: isMobile ? '12px 16px' : '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/image_48c638.jpg" alt="Logo" style={{ height: isMobile ? '36px' : '44px', borderRadius: '8px', backgroundColor: 'white' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ color: '#FFE600' }}>攻略</span></h1>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>⏱️ {lastUpdated}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        
        {/* 搜索卡片 */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', marginBottom: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '20px', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
            
            {/* 出發過濾 */}
            <div style={{ flex: 1, width: '100%' }}>
              <span style={tagStyle}>出發地區</span>
              <select style={selectStyle} value={regionFilter} onChange={(e) => {setRegionFilter(e.target.value); setPickupFilter('');}}>
                <option value="">所有出發地</option>
                {departureRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ marginTop: '12px' }}>
                <span style={tagStyle}>上車站點</span>
                <select style={selectStyle} value={pickupFilter} onChange={(e) => setPickupFilter(e.target.value)}>
                  <option value="">不限地點</option>
                  {availablePickups.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* 改良版切換按鈕 */}
            <button 
              onClick={handleSwap} 
              style={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '50%', 
                width: '44px', 
                height: '44px', 
                cursor: 'pointer', 
                color: '#B8860B', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                flexShrink: 0,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                marginTop: isMobile ? '-10px' : '20px',
                marginBottom: isMobile ? '-10px' : '0',
                zIndex: 2
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isMobile ? 'rotate(90deg)' : 'none' }}>
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </button>

            {/* 目的地過濾 */}
            <div style={{ flex: 1, width: '100%' }}>
              <span style={tagStyle}>目的地區</span>
              <select style={selectStyle} value={destFilter} onChange={(e) => {setDestFilter(e.target.value); setDropoffFilter('');}}>
                <option value="">所有目的地</option>
                {destinationRegions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ marginTop: '12px' }}>
                <span style={tagStyle}>落車站點</span>
                <select style={selectStyle} value={dropoffFilter} onChange={(e) => setDropoffFilter(e.target.value)}>
                  <option value="">不限地點</option>
                  {availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 列表 */}
        {loading ? <p style={{ textAlign: 'center', color: '#64748b' }}>🚌 班次同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => {
              const isSpecial = /T01[AB]/.test(item.operator);
              const hasWechat = item.wechat_app !== '';
              return (
                <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', borderLeft: `5px solid ${isSpecial ? '#f97316' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', backgroundColor: isSpecial ? '#ffedd5' : '#eff6ff', color: isSpecial ? '#9a3412' : '#1e40af' }}>{item.operator}</span>
                      <span style={{ color: '#ef4444', fontWeight: 900 }}>{item.currency}{item.price}</span>
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>📍 <span style={{ color: '#64748b' }}>{item.departure_region} - </span><strong>{item.pickup_point}</strong></div>
                    <div style={{ fontSize: '14px', marginBottom: '10px' }}>🏁 <span style={{ color: '#64748b' }}>目的地 - </span><strong>{item.dropoff_point}</strong></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>🕒 {item.schedule}<br/>⏳ 約 {item.estimated_duration}</div>
                    <button onClick={() => { if (hasWechat) { setSelectedWechatApp(item.wechat_app); setShowModal(true); } else { window.open(item.source_url, '_blank'); } }} style={{ backgroundColor: hasWechat ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                      {hasWechat ? '微信小程序' : '立即購票'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 彈窗部分 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>💬</div>
            <h3 style={{ margin: '0 0 10px' }}>微信預約</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>請複製小程序名稱後<br/>到微信搜尋購票。</p>
            <button onClick={copyToClipboard} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '10px', cursor: 'pointer' }}>一鍵複製「{selectedWechatApp}」</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>關閉</button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '450px', width: '100%', maxHeight: '70vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>隱私權政策</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>本站使用 Google Analytics 及 AdSense 服務。數據僅供參考。</p>
            <button onClick={() => setShowPrivacyModal(false)} style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '450px', width: '100%', maxHeight: '70vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>服務條款</h3>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>本站僅提供資訊整合，購票交易由第三方平台負責。</p>
            <button onClick={() => setShowTermsModal(false)} style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', marginTop: '10px', cursor: 'pointer' }}>關閉</button>
          </div>
        </div>
      )}

      {showBackTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '30px', right: isMobile ? '15px' : 'max(15px, calc(50vw - 520px))', backgroundColor: '#B8860B', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', zIndex: 40, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>⬆️</button>
      )}

      {/* Footer */}
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
