import React, { useState, useEffect, useMemo } from 'react';

// 定義資料結構
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

  // 搜索狀態
  const [regionFilter, setRegionFilter] = useState<string>('');    // 出發大區
  const [pickupFilter, setPickupFilter] = useState<string>('');    // 出發地點 (細分)
  const [destFilter, setDestFilter] = useState<string>('');        // 目的地大區
  const [dropoffFilter, setDropoffFilter] = useState<string>('');  // 目的地點 (細分)
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        let result = lines.slice(1).map(line => {
          const values = line.split(',');
          return {
            operator: values[0] || '',
            departure_region: (values[1] || '').trim(),
            pickup_point: (values[2] || '').trim(),
            dropoff_point: (values[3] || '').trim(),
            schedule: values[4] || '',
            estimated_duration: values[5] || '',
            price: values[6] || '',
            currency: values[7] || '',
            booking_remarks: values[8] || '',
            source_url: values[9] || '',
            wechat_app: (values[10] || '').replace(/\r$/, '').trim() 
          };
        }).filter(item => item.operator.trim() !== '');

        result.sort((a, b) => {
          const regionCompare = a.departure_region.localeCompare(b.departure_region, 'zh-HK');
          if (regionCompare !== 0) return regionCompare; 
          return a.pickup_point.localeCompare(b.pickup_point, 'zh-HK');
        });
        
        setBusData(result);
        setFilteredData(result);
        setLoading(false);
        
        const now = new Date();
        setLastUpdated(`最後更新: ${now.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' })}`);
      } catch (error) {
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 計算選單內容
  const regions = useMemo(() => Array.from(new Set(busData.map(i => {
    if (i.departure_region.startsWith('深圳灣'))) return i.departure_region.substring(0, 5);
    return i.departure_region.substring(0, 2);
  }))).filter(Boolean), [busData]);

  const destRegions = useMemo(() => Array.from(new Set(busData.map(i => {
    if (i.dropoff_point.startsWith('深圳灣'))) return i.dropoff_point.substring(0, 5);
    return i.dropoff_point.substring(0, 2);
  }))).filter(Boolean), [busData]);

  const availablePickups = useMemo(() => {
    const data = regionFilter ? busData.filter(i => i.departure_region.startsWith(regionFilter)) : busData;
    return Array.from(new Set(data.map(i => i.pickup_point))).sort();
  }, [busData, regionFilter]);

  const availableDropoffs = useMemo(() => {
    const data = destFilter ? busData.filter(i => i.dropoff_point.startsWith(destFilter)) : busData;
    return Array.from(new Set(data.map(i => i.dropoff_point))).sort();
  }, [busData, destFilter]);

  // 過濾邏輯
  useEffect(() => {
    const filtered = busData.filter(item => {
      const matchRegion = regionFilter === '' || item.departure_region.startsWith(regionFilter);
      const matchPickup = pickupFilter === '' || item.pickup_point === pickupFilter;
      const matchDestRegion = destFilter === '' || item.dropoff_point.startsWith(destFilter);
      const matchDropoff = dropoffFilter === '' || item.dropoff_point === dropoffFilter;
      return matchRegion && matchPickup && matchDestRegion && matchDropoff;
    });
    setFilteredData(filtered);
  }, [regionFilter, pickupFilter, destFilter, dropoffFilter, busData]);

  const handleSwap = () => {
    const tempRegion = regionFilter;
    const tempPoint = pickupFilter;
    setRegionFilter(destFilter);
    setPickupFilter(dropoffFilter);
    setDestFilter(tempRegion);
    setDropoffFilter(tempPoint);
  };

  const copyToClipboard = () => {
    if (selectedWechatApp) {
      navigator.clipboard.writeText(selectedWechatApp);
      alert(`已複製「${selectedWechatApp}」，請前往微信搜尋！`);
    }
  };

  const selectStyle: React.CSSProperties = {
    padding: '10px 32px 10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    width: '100%',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    backgroundSize: '14px'
  };

  const labelStyle: React.CSSProperties = {
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '60px' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: isMobile ? '12px 16px' : '16px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/image_48c638.jpg" alt="Logo" style={{ height: isMobile ? '36px' : '44px', borderRadius: '8px', backgroundColor: 'white' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ fontWeight: 400 }}> - </span><span style={{ color: '#FFE600' }}>攻略</span></h1>
        </div>
        <div style={{ fontSize: isMobile ? '11px' : '13px', opacity: 0.9 }}>⏱️ {lastUpdated.replace('最後更新: ', '')}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        
        {/* 搜索過濾區塊 */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
            
            {/* 出發組 */}
            <div style={{ flex: 1, width: '100%' }}>
              <div>
                <span style={labelStyle}>出發地區</span>
                <select style={selectStyle} value={regionFilter} onChange={(e) => {setRegionFilter(e.target.value); setPickupFilter('');}}>
                  <option value="">所有出發地</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={labelStyle}>出發地點 (細分)</span>
                <select style={selectStyle} value={pickupFilter} onChange={(e) => setPickupFilter(e.target.value)}>
                  <option value="">不限地點</option>
                  {availablePickups.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* 中間切換掣 */}
            <button 
              onClick={handleSwap} 
              style={{ backgroundColor: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', color: '#B8860B', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              {isMobile ? '⇅' : '⇄'}
            </button>

            {/* 目的地組 */}
            <div style={{ flex: 1, width: '100%' }}>
              <div>
                <span style={labelStyle}>目的地大區</span>
                <select style={selectStyle} value={destFilter} onChange={(e) => {setDestFilter(e.target.value); setDropoffFilter('');}}>
                  <option value="">所有目的地</option>
                  {destRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={labelStyle}>目的地點 (細分)</span>
                <select style={selectStyle} value={dropoffFilter} onChange={(e) => setDropoffFilter(e.target.value)}>
                  <option value="">不限地點</option>
                  {availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 班次列表 */}
        {loading ? <p style={{ textAlign: 'center', color: '#64748b' }}>🚌 正在即時同步班次...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => {
              const isSpecial = /T01[AB]/.test(item.operator);
              const hasWechatApp = item.wechat_app && item.wechat_app.length > 0;
              return (
                <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `5px solid ${isSpecial ? '#f97316' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', backgroundColor: isSpecial ? '#ffedd5' : '#eff6ff', color: isSpecial ? '#9a3412' : '#1e40af' }}>{item.operator}</span>
                      <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.1rem' }}>{item.currency}{item.price}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>📍 <span style={{ color: '#64748b' }}>{item.departure_region} - </span><strong>{item.pickup_point}</strong></div>
                    <div style={{ fontSize: '14px', color: '#1e293b', marginBottom: '12px' }}>🏁 <span style={{ color: '#64748b' }}>目的地 - </span><strong>{item.dropoff_point}</strong></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <div style={{ marginBottom: '2px' }}>🕒 {item.schedule}</div>
                      <div>⏳ 約 {item.estimated_duration}</div>
                    </div>
                    <button onClick={() => { if (hasWechatApp) { setSelectedWechatApp(item.wechat_app); setShowModal(true); } else { window.open(item.source_url, '_blank'); } }} style={{ backgroundColor: hasWechatApp ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                      {hasWechatApp ? '微信小程序' : '立即購票'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals & BackTop & Footer (保持之前邏輯) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', maxWidth: '340px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3>微信預約提示</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>請點擊下方按鈕複製名稱後，前往微信搜尋即可購票。</p>
            <button onClick={copyToClipboard} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 'bold', marginBottom: '16px' }}>一鍵複製「{selectedWechatApp}」</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px' }}>暫時關閉</button>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem' }}>隱私權政策 (Privacy Policy)</h2>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>本網站使用 Google AdSense 及 Analytics 服務。</div>
            <button onClick={() => setShowPrivacyModal(false)} style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', marginTop: '20px' }}>關閉</button>
          </div>
        </div>
      )}

      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem' }}>服務條款 (Terms)</h2>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>本網站僅整合資訊。購票交易由第三方售票平台負責。</div>
            <button onClick={() => setShowTermsModal(false)} style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', marginTop: '20px' }}>關閉</button>
          </div>
        </div>
      )}

      {showBackTop && (
        <button onClick={scrollToTop} style={{ position: 'fixed', bottom: '40px', right: isMobile ? '20px' : 'max(20px, calc(50vw - 520px))', backgroundColor: '#B8860B', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', fontSize: '20px', cursor: 'pointer', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬆️</button>
      )}

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '32px 20px', fontSize: '13px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <div style={{ marginBottom: '16px' }}>資料來源: 各大巴士營運商 · 官方售票平台</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('致力於提供最準確的巴士整合資訊！'); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>關於我們</a>
          <span>|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>隱私權政策</a>
          <span>|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>服務條款</a>
        </div>
        <div style={{ marginBottom: '16px' }}>深中珠巴士通 - 攻略 © 2026</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>開發團隊 - </span>
          <a href="https://zhongshan-food-map.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#d97706', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7' }}>
            <img src="/image.png" alt="Logo" style={{ height: '20px', width: '20px', borderRadius: '4px' }} />中山美食地圖
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
