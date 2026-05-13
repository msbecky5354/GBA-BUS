import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態
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

  const [regionFilter, setRegionFilter] = useState('');
  const [pickupFilter, setPickupFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [dropoffFilter, setDropoffFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedWechatApp, setSelectedWechatApp] = useState('');
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. 數據抓取與精確對位 (13 欄位邏輯)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}&t=${new Date().getTime()}`);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        const result = lines.slice(1).map(line => {
          const v = line.split(',');
          // 對應：0:operator, 1:departure, 2:pickup, 3:dropoff, 4:schedule, 5:FT, 6:LT, 7:duration, 8:price, 9:currency, 10:remarks, 11:url, 12:wechat
          return {
            operator: (v[0] || '').trim(),
            departure_region: (v[1] || '').trim(),
            pickup_point: (v[2] || '').trim(),
            dropoff_point: (v[3] || '').trim(),
            schedule: (v[4] || '').trim(),
            estimated_duration: (v[7] || '').trim(),
            price: (v[8] || '').trim(),
            currency: (v[9] || '').trim(),
            booking_remarks: (v[10] || '').trim(),
            source_url: (v[11] || '').trim(),
            wechat_app: (v[12] || '').replace(/\r$/, '').trim()
          };
        }).filter(item => item.operator !== '');

        setBusData(result);
        setFilteredData(result);
        setLoading(false);
        setLastUpdated(new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }));
      } catch (error) {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. 搜尋過濾邏輯
  const departureRegions = useMemo(() => Array.from(new Set(busData.map(i => i.departure_region.substring(0, 2)))).filter(Boolean).sort(), [busData]);
  const destinationRegions = useMemo(() => Array.from(new Set(busData.map(i => i.dropoff_point.substring(0, 2)))).filter(Boolean).sort(), [busData]);
  const availablePickups = useMemo(() => Array.from(new Set(busData.filter(i => !regionFilter || i.departure_region.startsWith(regionFilter)).map(i => i.pickup_point))).filter(Boolean).sort(), [busData, regionFilter]);
  const availableDropoffs = useMemo(() => Array.from(new Set(busData.filter(i => !destFilter || i.dropoff_point.startsWith(destFilter)).map(i => i.dropoff_point))).filter(Boolean).sort(), [busData, destFilter]);

  useEffect(() => {
    setFilteredData(busData.filter(i => (
      (!regionFilter || i.departure_region.startsWith(regionFilter)) &&
      (!pickupFilter || i.pickup_point === pickupFilter) &&
      (!destFilter || i.dropoff_point.startsWith(destFilter)) &&
      (!dropoffFilter || i.dropoff_point === dropoffFilter)
    )));
  }, [regionFilter, pickupFilter, destFilter, dropoffFilter, busData]);

  // 共用的按鈕樣式
  const switchButtonStyle: React.CSSProperties = {
    width: '42px', 
    height: '42px', 
    borderRadius: '50%', 
    border: '1px solid #e2e8f0', 
    backgroundColor: 'white', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    color: '#B8860B',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease',
    flexShrink: 0
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ color: '#FFE600' }}>攻略</span></h1>
        <div style={{ fontSize: '11px' }}>最後更新: {lastUpdated}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        {/* 搜尋卡片區 */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* 地區切換 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>出發地區</span>
                <select style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                  <option value="">所有</option>
                  {departureRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button 
                onClick={() => {const t=regionFilter; setRegionFilter(destFilter); setDestFilter(t);}} 
                style={switchButtonStyle}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="對調地區"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="M8 21l-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>目的地區</span>
                <select style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} value={destFilter} onChange={e => setDestFilter(e.target.value)}>
                  <option value="">所有</option>
                  {destinationRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* 站點切換 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>上車站點</span>
                <select style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}>
                  <option value="">不限</option>
                  {availablePickups.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button 
                onClick={() => {const t=pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t);}} 
                style={switchButtonStyle}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="對調站點"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 3l4 4-4 4" />
                  <path d="M20 7H4" />
                  <path d="M8 21l-4-4 4-4" />
                  <path d="M4 17h16" />
                </svg>
              </button>
              <div style={{ flex: 1 }}>
                <span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>落車站點</span>
                <select style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}>
                  <option value="">不限</option>
                  {availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => {setRegionFilter(''); setPickupFilter(''); setDestFilter(''); setDropoffFilter('');}} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>一鍵還原所有搜尋條件</button>
          </div>
        </div>

        {/* 班次列表渲染 */}
        {loading ? <p style={{ textAlign: 'center' }}>🚌 資料同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '18px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '180px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start', marginBottom: '10px' }}>{item.operator}</span>
                
                {/* 右上角：固定開車時間 */}
                <div style={{ position: 'absolute', top: '18px', right: '18px', fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>
                  {item.schedule}
                </div>
                
                {/* 中間：路線資訊 */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', marginBottom: '4px', color: '#334155' }}>📍 <strong>{item.pickup_point}</strong></div>
                  <div style={{ fontSize: '14px', color: '#64748b' }}>🏁 {item.dropoff_point}</div>
                </div>

                {/* 右中位置：價錢 */}
                <div style={{ position: 'absolute', top: '50%', right: '18px', transform: 'translateY(-50%)', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ef4444' }}>{item.currency}{item.price}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>⏳ 約 {item.estimated_duration}</div>
                </div>

                {/* 底部：備註與按鈕 */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                  <div style={{ flex: 1, paddingRight: '10px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>訂票備註</div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{item.booking_remarks || '--'}</div>
                  </div>
                  <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{item.wechat_app ? '微信購票' : '立即購票'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 微信購票彈窗 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#64748b' }}>請複製名稱後到微信搜尋：</p>
            <h3 style={{ margin: '15px 0', color: '#22c55e' }}>{selectedWechatApp}</h3>
            <button onClick={() => {navigator.clipboard.writeText(selectedWechatApp); alert('已複製！');}} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '10px' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px' }}>暫時關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
