import React, { useState, useEffect } from 'react';

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
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [destFilter, setDestFilter] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
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
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 300);
    };
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
            departure_region: values[1] || '',
            pickup_point: values[2] || '',
            dropoff_point: values[3] || '',
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

  useEffect(() => {
    const filtered = busData.filter(item => {
      const matchRegion = regionFilter === '' || item.departure_region.startsWith(regionFilter);
      const matchDest = destFilter === '' || item.dropoff_point.includes(destFilter);
      return matchRegion && matchDest;
    });
    setFilteredData(filtered);
  }, [regionFilter, destFilter, busData]);

  // 新增：切換出發地與目的地
  const handleSwap = () => {
    const temp = regionFilter;
    setRegionFilter(destFilter);
    setDestFilter(temp);
  };

  const copyToClipboard = () => {
    if (selectedWechatApp) {
      navigator.clipboard.writeText(selectedWechatApp);
      alert(`已複製「${selectedWechatApp}」，請前往微信搜尋！`);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const regions = Array.from(new Set(busData.map(i => {
    const region = i.departure_region || '';
    if (region.startsWith('深圳灣')) return region.substring(0, 5);
    return region.substring(0, 2);
  }))).filter(Boolean);

  const selectStyle: React.CSSProperties = {
    padding: '12px 36px 12px 12px',
    borderRadius: '0 10px 10px 10px',
    border: '1px solid #e2e8f0',
    width: '100%',
    backgroundColor: 'white',
    outline: 'none',
    fontSize: '15px',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px'
  };

  const swapButtonStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    zIndex: 2,
    marginTop: isMobile ? '-8px' : '20px',
    marginBottom: isMobile ? '-8px' : '0',
    fontSize: '18px',
    color: '#B8860B',
    transition: 'transform 0.2s'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', paddingBottom: '60px' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: isMobile ? '12px 16px' : '16px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/image_48c638.jpg" alt="深中珠巴士通 - 攻略 Logo" style={{ height: isMobile ? '36px' : '44px', borderRadius: '8px', backgroundColor: 'white' }} />
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ fontWeight: 400 }}> - </span><span style={{ color: '#FFE600' }}>攻略</span></h1>
        </div>
        <div style={{ fontSize: isMobile ? '11px' : '13px', backgroundColor: 'rgba(255,255,255,0.15)', padding: '6px 10px', borderRadius: '20px' }}>⏱️ {lastUpdated.replace('最後更新: ', '')}</div>
      </header>

      <main style={{ maxWidth: isMobile ? '500px' : '1200px', margin: '0 auto', padding: isMobile ? '16px' : '32px' }}>
        
        {/* 過濾器區塊：加入 Switch 功能 */}
        <div style={{ display: 'flex', gap: isMobile ? '0' : '16px', marginBottom: '32px', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : '240px' }}>
            <span style={{ backgroundColor: '#FFE600', color: '#333', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px 6px 0 0', alignSelf: 'flex-start' }}>出發</span>
            <select style={selectStyle} value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="">所有出發地</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button 
            onClick={handleSwap} 
            style={swapButtonStyle} 
            title="切換出發地與目的地"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
          >
            {isMobile ? '⇅' : '⇄'}
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : '240px' }}>
            <span style={{ backgroundColor: '#FFE600', color: '#333', fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px 6px 0 0', alignSelf: 'flex-start' }}>目的地</span>
            <select style={selectStyle} value={destFilter} onChange={(e) => setDestFilter(e.target.value)}>
              <option value="">所有目的地</option>
              <option value="中山">中山</option>
              <option value="深圳">深圳</option>
              <option value="珠海">珠海</option>
              <option value="香港">香港</option>
            </select>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center', color: '#64748b' }}>🚌 正在即時同步班次...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {filteredData.map((item, idx) => {
              const isSpecial = /T01[AB]/.test(item.operator);
              const hasWechatApp = item.wechat_app && item.wechat_app.length > 0;
              return (
                <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: `6px solid ${isSpecial ? '#f97316' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', backgroundColor: isSpecial ? '#ffedd5' : '#eff6ff', color: isSpecial ? '#9a3412' : '#1e40af' }}>{item.operator}</span>
                      <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.2rem' }}>{item.currency}{item.price}</span>
                    </div>
                    <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px' }}>📍 <strong>{item.pickup_point}</strong></div>
                    <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '16px' }}>🏁 <strong>{item.dropoff_point}</strong></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <div style={{ marginBottom: '4px' }}>🕒 {item.schedule}</div>
                      <div>⏳ 約 {item.estimated_duration}</div>
                    </div>
                    <button onClick={() => { if (hasWechatApp) { setSelectedWechatApp(item.wechat_app); setShowModal(true); } else { window.open(item.source_url, '_blank'); } }} style={{ backgroundColor: hasWechatApp ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                      {hasWechatApp ? '微信小程序' : '立即購票'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals & BackTop 按鈕 */}
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
        <button onClick={scrollToTop} style={{ position: 'fixed', bottom: '40px', right: isMobile ? '20px' : 'max(20px, calc(50vw - 660px))', backgroundColor: '#B8860B', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', fontSize: '22px', cursor: 'pointer', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⬆️</button>
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
