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
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

const App: React.FC = () => {
  const [busData, setBusData] = useState<BusItem[]>([]);
  const [filteredData, setFilteredData] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [destFilter, setDestFilter] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Modals 狀態控制
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  
  // 偵測是否為移動裝置
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // 偵測是否顯示返回頂部按鈕
  const [showBackTop, setShowBackTop] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackTop(true);
      } else {
        setShowBackTop(false);
      }
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
        const result = lines.slice(1).map(line => {
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
            source_url: values[9] || ''
          };
        }).filter(item => item.operator.trim() !== '');
        
        setBusData(result);
        setFilteredData(result);
        setLoading(false);
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString('zh-HK', { month: 'short', day: 'numeric' });
        setLastUpdated(`最後更新: ${dateString} ${timeString}`);

      } catch (error) {
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = busData.filter(item => {
      const matchRegion = regionFilter === '' || item.departure_region === regionFilter;
      const matchDest = destFilter === '' || item.dropoff_point.includes(destFilter);
      return matchRegion && matchDest;
    });
    setFilteredData(filtered);
  }, [regionFilter, destFilter, busData]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText('深巴出行');
    alert('已複製「深巴出行」，請前往微信搜尋！');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const regions = Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '60px'
  };

  const mainStyle: React.CSSProperties = {
    maxWidth: isMobile ? '500px' : '1200px',
    margin: '0 auto',
    padding: isMobile ? '16px' : '32px'
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  };

  return (
    <div style={containerStyle}>
      <header style={{ 
        backgroundColor: '#B8860B', 
        color: 'white', 
        padding: isMobile ? '12px 16px' : '16px 32px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/image_48c638.jpg" 
            alt="深中珠巴士通 - 攻略 Logo" 
            style={{ 
              height: isMobile ? '36px' : '44px', 
              borderRadius: '8px',
              backgroundColor: 'white' 
            }} 
          />
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            深中珠巴士通 
            <span style={{ fontWeight: 400, opacity: 0.9 }}> - </span>
            <span style={{ color: '#FFE600', fontWeight: 900, textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>攻略</span>
          </h1>
        </div>
        
        {lastUpdated && (
          <div style={{ 
            fontSize: isMobile ? '11px' : '13px', 
            backgroundColor: 'rgba(255,255,255,0.15)', 
            padding: '6px 10px', 
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '14px' }}>⏱️</span> 
            {!isMobile && "最後更新: "}
            {lastUpdated.replace('最後更新: ', '')}
          </div>
        )}
      </header>

      <main style={mainStyle}>
        
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : '220px' }}>
            <span style={{ 
              backgroundColor: '#FFE600', 
              color: '#333', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              padding: '4px 10px', 
              borderRadius: '6px 6px 0 0', 
              alignSelf: 'flex-start',
              boxShadow: '0 -2px 4px rgba(0,0,0,0.05)'
            }}>
              📍 出發
            </span>
            <select style={{ padding: '12px', borderRadius: '0 10px 10px 10px', border: '1px solid #e2e8f0', width: '100%', backgroundColor: 'white', outline: 'none' }} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="">所有出發地</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', width: isMobile ? '100%' : '220px' }}>
            <span style={{ 
              backgroundColor: '#FFE600', 
              color: '#333', 
              fontSize: '12px', 
              fontWeight: 'bold', 
              padding: '4px 10px', 
              borderRadius: '6px 6px 0 0', 
              alignSelf: 'flex-start',
              boxShadow: '0 -2px 4px rgba(0,0,0,0.05)'
            }}>
              🏁 目的地
            </span>
            <select style={{ padding: '12px', borderRadius: '0 10px 10px 10px', border: '1px solid #e2e8f0', width: '100%', backgroundColor: 'white', outline: 'none' }} onChange={(e) => setDestFilter(e.target.value)}>
              <option value="">所有目的地</option>
              <option value="中山">中山</option>
              <option value="深圳">深圳</option>
              <option value="珠海">珠海</option>
              <option value="香港">香港</option>
            </select>
          </div>
          
        </div>

        {loading ? <p style={{ textAlign: 'center', color: '#64748b' }}>🚌 正在即時同步班次...</p> : (
          <div style={gridStyle}>
            {filteredData.map((item, idx) => {
              const isSpecial = /T01[AB]/.test(item.operator);
              return (
                <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderTop: `6px solid ${isSpecial ? '#f97316' : '#3b82f6'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', backgroundColor: isSpecial ? '#ffedd5' : '#eff6ff', color: isSpecial ? '#9a3412' : '#1e40af' }}>
                        {item.operator}
                      </span>
                      <span style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.2rem' }}>{item.currency}{item.price}</span>
                    </div>
                    <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>📍</span> <strong>{item.pickup_point}</strong>
                    </div>
                    <div style={{ fontSize: '15px', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '8px' }}>🏁</span> <strong>{item.dropoff_point}</strong>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      <div style={{ marginBottom: '4px' }}>🕒 {item.schedule}</div>
                      <div>⏳ 約 {item.estimated_duration}</div>
                    </div>
                    <button 
                      onClick={() => item.booking_remarks.includes('小程序') ? setShowModal(true) : window.open(item.source_url, '_blank')}
                      style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)' }}
                    >
                      立即購票
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 微信預約彈窗 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', maxWidth: '340px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{ margin: '0 0 12px', color: '#1e293b' }}>微信預約提示</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>本服務需透過微信小程式預訂。請點擊下方按鈕複製名稱後，前往微信搜尋即可購票。</p>
            <button onClick={copyToClipboard} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 'bold', fontSize: '1rem', marginBottom: '16px', cursor: 'pointer' }}>
              一鍵複製「深巴出行」
            </button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>暫時關閉</button>
          </div>
        </div>
      )}

      {/* 隱私權政策與聲明彈窗 */}
      {showPrivacyModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'left' }}>
            <h2 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', fontSize: '1.25rem' }}>隱私權政策與免責聲明</h2>
            
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              <p style={{ fontWeight: 'bold', color: '#1e293b' }}>1. Google AdSense 與 Cookie 的使用</p>
              <p>本網站使用 Google AdSense 廣告服務。第三方供應商（包括 Google）會使用 Cookie 來放送廣告，這些廣告是根據使用者過往在我們網站或其他網站的瀏覽紀錄來放送。</p>
              <p>使用者可以前往 <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>Google 廣告設定</a> 停用個人化廣告。</p>
              
              <p style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '16px' }}>2. 網站分析與追蹤</p>
              <p>本網站使用 Google Analytics 等分析工具來收集匿名流量數據，以便了解使用者行為並改善網站體驗。</p>
              
              <p style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '16px' }}>3. 內容免責聲明</p>
              <p>本網站提供之巴士班次、路線、票價等資訊僅供參考，所有資料皆以各營運商官方最新公佈為準。本網站對因依賴本站資訊而引致的任何損失，概不負責。</p>
            </div>

            <button 
              onClick={() => setShowPrivacyModal(false)} 
              style={{ width: '100%', backgroundColor: '#B8860B', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', marginTop: '20px', cursor: 'pointer' }}
            >
              我明白了，關閉
            </button>
          </div>
        </div>
      )}

      {/* 返回頂部按鈕 */}
      {showBackTop && (
        <button 
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '40px',
            right: isMobile ? '20px' : 'max(20px, calc(50vw - 660px))', 
            backgroundColor: '#B8860B', 
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '22px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'right 0.3s ease'
          }}
          aria-label="返回頂部"
        >
          ⬆️
        </button>
      )}

      {/* ========================================
        更新：全新專業版頁尾設計
        ======================================== 
      */}
      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '32px 20px', fontSize: '13px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        
        {/* 資料來源 */}
        <div style={{ marginBottom: '16px', color: '#94a3b8', fontSize: '12px' }}>
          資料來源: 各大巴士營運商 · 官方售票平台 · 微信小程式公告
        </div>

        {/* 四個重要連結 */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('關於我們：\n我們是一群熱愛大灣區出行的開發者，致力於提供最準確、最方便的深中珠巴士整合資訊！'); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>關於我們</a>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); alert('聯絡我們：\n如有任何資料更新或合作建議，請聯絡開發團隊。'); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>聯絡我們</a>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>隱私權政策</a>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#3b82f6', textDecoration: 'none' }}>服務條款</a>
        </div>

        <div style={{ marginBottom: '16px' }}>
          深中珠巴士通 - 攻略 © 2026
        </div>
        
        {/* 互推連結 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <span>開發團隊 - </span>
          <a 
            href="https://zhongshan-food-map.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              textDecoration: 'none', 
              color: '#d97706',
              fontWeight: 'bold',
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7'
            }}
          >
            <img 
              src="/image.png" 
              alt="中山美食地圖 Logo" 
              style={{ height: '20px', width: '20px', borderRadius: '4px', objectFit: 'cover' }} 
            />
            中山美食地圖
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
