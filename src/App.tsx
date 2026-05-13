import React, { useState, useEffect, useMemo } from 'react';

// 1. 資料結構定義
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
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 2. 讀取數據 (根據 13 欄位精確對位)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}&t=${new Date().getTime()}`);
        const csvText = await response.text();
        const lines = csvText.split('\n');
        
        const result = lines.slice(1).map(line => {
          const v = line.split(',');
          // 精確對位邏輯：
          // 0:operator, 1:departure, 2:pickup, 3:dropoff, 4:schedule, 
          // 5:FT (skip), 6:LT (skip), 7:estimated_duration, 8:price, 
          // 9:currency, 10:booking_remarks, 11:source_url, 12:wechat_app
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

  // 3. 搜尋連動邏輯
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>深中珠巴士通 攻略</h1>
        <div style={{ fontSize: '11px' }}>最後更新: {lastUpdated}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        {/* 搜尋卡片 */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#FFE600', padding: '2px 6px', borderRadius: '4px' }}>出發地區</label><select style={{ width: '100%', padding: '8px', marginTop: '5px' }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}><option value="">所有</option>{departureRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <button onClick={() => {const t=regionFilter; setRegionFilter(destFilter); setDestFilter(t);}} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #ddd' }}>⇄</button>
              <div style={{ flex: 1 }}><label style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#FFE600', padding: '2px 6px', borderRadius: '4px' }}>目的地區</label><select style={{ width: '100%', padding: '8px', marginTop: '5px' }} value={destFilter} onChange={e => setDestFilter(e.target.value)}><option value="">所有</option>{destinationRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <button onClick={() => {setRegionFilter(''); setPickupFilter(''); setDestFilter(''); setDropoffFilter('');}} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold' }}>一鍵還原所有條件</button>
          </div>
        </div>

        {/* 列表渲染 */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredData.map((item, idx) => (
            <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '18px', borderTop: '6px solid #3b82f6', position: 'relative', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', minHeight: '160px' }}>
              <span style={{ fontSize: '10px', color: '#64748b', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{item.operator}</span>
              
              {/* 右上角：開車時間 (values[4]) */}
              <div style={{ position: 'absolute', top: '18px', right: '18px', fontSize: '18px', fontWeight: '900', color: '#1e293b' }}>
                {item.schedule}
              </div>

              {/* 中間：起點終點 */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>📍 <strong>{item.pickup_point}</strong></div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>🏁 {item.dropoff_point}</div>
              </div>

              {/* 右中：價錢 (values[8] + values[9]) */}
              <div style={{ position: 'absolute', top: '55%', right: '18px', textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444' }}>{item.currency}{item.price}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>⏳ {item.estimated_duration}</div>
              </div>

              {/* 底部：左備註，右按鈕 */}
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', maxWidth: '60%' }}>{item.booking_remarks}</div>
                <button onClick={() => item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')} style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                  {item.wechat_app ? '微信購票' : '立即購票'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 微信 Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', maxWidth: '300px' }}>
            <p>請複製小程序名稱：</p>
            <h3 style={{ color: '#22c55e' }}>{selectedWechatApp}</h3>
            <button onClick={() => {navigator.clipboard.writeText(selectedWechatApp); alert('已複製！');}} style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '10px', marginTop: '10px' }}>一鍵複製</button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', marginTop: '15px', color: '#999' }}>關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
