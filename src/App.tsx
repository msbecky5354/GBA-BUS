import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態 (加入 arrival_region)
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

  // 2. 數據抓取與專業 CSV 解析邏輯 (14 欄位精確對位)
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

          // 最新 14 欄對位：
          // 0:operator, 1:departure_region, 2:pickup_point, 3:arrival_region, 4:dropoff_point, 
          // 5:schedule, 6:FT, 7:LT, 8:estimated_duration, 9:price, 10:currency, 11:remarks, 12:url, 13:wechat
          return {
            operator: (v[0] || '').trim(),
            departure_region: (v[1] || '').trim(),
            pickup_point: (v[2] || '').trim(),
            arrival_region: (v[3] || '').trim(),  // 新增：落車地區
            dropoff_point: (v[4] || '').trim(),   // 向後移 1 格
            schedule: (v[5] || '').trim(),        // 向後移 1 格
            estimated_duration: (v[8] || '').trim(), // 向後移 1 格
            price: (v[9] || '').trim(),           // 向後移 1 格
            currency: (v[10] || '').trim(),       // 向後移 1 格
            booking_remarks: (v[11] || '').trim(),// 向後移 1 格
            source_url: (v[12] || '').trim(),     // 向後移 1 格
            wechat_app: v[13] ? v[13].replace(/\r$/, '').trim() : '' // 向後移 1 格
          };
        }).filter((item): item is BusItem => item !== null && item.operator !== '');

        result.sort((a, b) => a.departure_region.localeCompare(b.departure_region, 'zh-HK'));
        setBusData(result);
        setFilteredData(result);
        setLoading(false);
        setLastUpdated(new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' }));
      } catch (error) {
        console.error("Fetch Error:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 3. 搜尋過濾邏輯 (利用新欄位優化)
  // 而家可以直接用 departure_region 同 arrival_region，唔需要再截斷字串
  const departureRegions = useMemo(() => Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean).sort(), [busData]);
  const destinationRegions = useMemo(() => Array.from(new Set(busData.map(i => i.arrival_region))).filter(Boolean).sort(), [busData]);
  
  const availablePickups = useMemo(() => Array.from(new Set(busData.filter(i => !regionFilter || i.departure_region === regionFilter).map(i => i.pickup_point))).filter(Boolean).sort(), [busData, regionFilter]);
  const availableDropoffs = useMemo(() => Array.from(new Set(busData.filter(i => !destFilter || i.arrival_region === destFilter).map(i => i.dropoff_point))).filter(Boolean).sort(), [busData, destFilter]);

  useEffect(() => {
    setFilteredData(busData.filter(i => (
      (!regionFilter || i.departure_region === regionFilter) &&
      (!pickupFilter || i.pickup_point === pickupFilter) &&
      (!destFilter || i.arrival_region === destFilter) &&
      (!dropoffFilter || i.dropoff_point === dropoffFilter)
    )));
  }, [regionFilter, pickupFilter, destFilter, dropoffFilter, busData]);

  // SVG 圖標組件
  const SwapIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H4" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', paddingBottom: '60px', fontFamily: 'sans-serif' }}>
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>深中珠巴士通 <span style={{ color: '#FFE600' }}>攻略</span></h1>
        <div style={{ fontSize: '11px' }}>⏱️ {lastUpdated}</div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        {/* 搜尋卡片 */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>出發地區</span><select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' }} value={regionFilter} onChange={e => {setRegionFilter(e.target.value); setPickupFilter('');}}><option value="">所有</option>{departureRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <button onClick={() => {const t=regionFilter; setRegionFilter(destFilter); setDestFilter(t);}} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><SwapIcon /></button>
              <div style={{ flex: 1 }}><span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>目的地區</span><select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' }} value={destFilter} onChange={e => {setDestFilter(e.target.value); setDropoffFilter('');}}><option value="">所有</option>{destinationRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}><span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>上車站點</span><select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' }} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}><option value="">不限</option>{availablePickups.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              <button onClick={() => {const t=pickupFilter; setPickupFilter(dropoffFilter); setDropoffFilter(t);}} style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><SwapIcon /></button>
              <div style={{ flex: 1 }}><span style={{ backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>落車站點</span><select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white' }} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}><option value="">不限</option>{availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <button onClick={() => {setRegionFilter(''); setPickupFilter(''); setDestFilter(''); setDropoffFilter('');}} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>一鍵還原所有搜尋條件</button>
          </div>
        </div>

        {/* 班次列表 */}
        {loading ? <p style={{ textAlign: 'center' }}>🚌 資料同步中...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '180px' }}>
                <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start', marginBottom: '12px', fontWeight: 'bold' }}>{item.operator}</span>
                
                {/* 右上角：開車時間 (維持 14px 縮細版) */}
                <div style={{ position: 'absolute', top: '20px', right: '20px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                  {item.schedule}
                </div>
                
                {/* 中間：路線資訊 (優化對稱顯示) */}
                <div style={{ marginBottom: '10px', paddingRight: '70px' }}>
                  <div style={{ fontSize: '15px', marginBottom: '6px', color: '#334155', wordBreak: 'break-word' }}>
                    📍 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.departure_region}</span> <strong>{item.pickup_point}</strong>
                  </div>
                  <div style={{ fontSize: '14px', color: '#64748b', wordBreak: 'break-word' }}>
                    🏁 <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.arrival_region}</span> <strong>{item.dropoff_point}</strong>
                  </div>
                </div>

                {/* 右中位置：價錢與行車時間 */}
                <div style={{ position: 'absolute', top: '55%', right: '20px', transform: 'translateY(-50%)', textAlign: 'right' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ef4444' }}>{item.currency}{item.price}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.estimated_duration}</div>
                </div>

                {/* 底部：備註與按鈕 */}
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
