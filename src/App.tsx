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

  // 2. 數據抓取 - 加入防爆邏輯
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}&t=${new Date().getTime()}`);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        // 跳過標題行，並過濾掉內容不足的行
        const result = lines.slice(1).filter(line => line.trim().split(',').length > 5).map(line => {
          const v = line.split(',');
          // 根據截圖顯示的移位問題，我們精確對位：
          // 0:operator, 1:departure, 2:pickup, 3:dropoff, 4:schedule, 
          // 5:FT, 6:LT, 7:estimated_duration, 8:price, 9:currency, 10:remarks, 11:url, 12:wechat
          return {
            operator: (v[0] || '').trim(),
            departure_region: (v[1] || '').trim(),
            pickup_point: (v[2] || '').trim(),
            dropoff_point: (v[3] || '').trim(),
            schedule: (v[4] || '').trim(), // 右上角時間
            estimated_duration: (v[7] || '').trim(),
            price: (v[8] || '').trim(),    // 價錢
            currency: (v[9] || '').trim(), // 幣種
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
        console.error('Fetch error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. 過濾邏輯 (useMemo 優化)
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

  // 4. 樣式常數
  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' };
  const labelStyle: React.CSSProperties = { fontSize: '11px', fontWeight: 'bold', backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>深中珠巴士通 - 攻略</h1>
        <div style={{ fontSize: '12px' }}>⏱️ {lastUpdated}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        {/* 搜尋區塊 */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><span style={labelStyle}>出發地區</span><select style={selectStyle} value={regionFilter} onChange={e => {setRegionFilter(e.target.value); setPickupFilter('');}}><option value="">所有</option>{departureRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <button onClick={() => {const t=regionFilter; setRegionFilter(destFilter); setDestFilter(t);}} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', fontSize: '20px' }}>⇄</button>
              <div style={{ flex: 1 }}><span style={labelStyle}>目的地區</span><select style={selectStyle} value={destFilter} onChange={e => {setDestFilter(e.target.value); setDropoffFilter('');}}><option value="">所有</option>{destinationRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <button onClick={() => {setRegionFilter(''); setPickupFilter(''); setDestFilter(''); setDropoffFilter('');}} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>一鍵還原所有條件</button>
          </div>
        </div>

        {/* 列表渲染 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredData.map((item, idx) => (
            <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', minHeight: '180px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: '#1e40af', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', marginBottom: '12px' }}>{item.operator}</span>
              
              {/* 右上角：開車時間 (Index 4) */}
              <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '18px', fontWeight: 900, color: '#1e293b' }}>
                {item.schedule}
              </div>

              {/* 中間：地點 */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', marginBottom: '6px' }}>📍 <strong>{item.pickup_point}</strong></div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>🏁 {item.dropoff_point}</div>
              </div>

              {/* 右中位置：紅色價錢 (Index 8+9) */}
              <div style={{ position: 'absolute', top: '55%', right: '20px', transform: 'translateY(-50%)', textAlign: 'right' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ef4444' }}>{item.currency}{item.price}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>⏳ 約 {item.estimated_duration}</div>
              </div>

              {/* 底部：左備註，右按鈕 */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #eee', paddingTop: '12px' }}>
                <div style={{ flex: 1, paddingRight: '15px', fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>訂票備註</div>
                  {item.booking_remarks || '--'}
                </div>
                <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {item.wechat_app ? '微信購票' : '立即購票'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

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
