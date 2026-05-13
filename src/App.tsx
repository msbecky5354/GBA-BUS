import React, { useState, useEffect } from 'react';

// 1. 定義資料結構，解決 TypeScript 報錯
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
  const [showModal, setShowModal] = useState<boolean>(false);

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

  const regions = Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>深中巴士通</h1>
      </header>

      <main style={{ maxWidth: '500px', margin: '0 auto', padding: '16px' }}>
        {/* 篩選器 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <select style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="">所有出發地</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }} onChange={(e) => setDestFilter(e.target.value)}>
            <option value="">目的地搜尋</option>
            <option value="中山">中山</option>
            <option value="深圳">深圳</option>
            <option value="香港">香港</option>
          </select>
        </div>

        {/* 廣告位 */}
        <div style={{ backgroundColor: '#e5e7eb', height: '90px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '12px', marginBottom: '24px', border: '1px dashed #9ca3af' }}>
          廣告贊助區塊 (Google AdSense)
        </div>

        {loading ? <p style={{ textAlign: 'center' }}>🚌 正在載入班次...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredData.map((item, idx) => {
              const isSpecial = /T01[AB]/.test(item.operator);
              return (
                <div key={idx} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${isSpecial ? '#f97316' : '#2563eb'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', backgroundColor: isSpecial ? '#ffedd5' : '#dbeafe', color: isSpecial ? '#9a3412' : '#1e40af' }}>
                      {item.operator}
                    </span>
                    <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{item.currency}{item.price}</span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>📍 {item.pickup_point}</div>
                  <div style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>🏁 {item.dropoff_point}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      <div>🕒 {item.schedule}</div>
                      <div>⏳ 約 {item.estimated_duration}</div>
                    </div>
                    <button 
                      onClick={() => item.booking_remarks.includes('小程序') ? setShowModal(true) : window.open(item.source_url, '_blank')}
                      style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
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

      {/* WeChat Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', maxWidth: '300px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>💬</div>
            <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '24px' }}>本服務需於微信預約，請點擊按鈕複製名稱並搜尋。</p>
            <button onClick={copyToClipboard} style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', marginBottom: '12px' }}>
              一鍵複製「深巴出行」
            </button>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '12px' }}>關閉</button>
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: '40px', fontSize: '12px', color: '#9ca3af' }}>
        深中巴士通 © 2026 | <a href="#" style={{ color: '#3b82f6' }}>隱私權政策</a>
      </footer>
    </div>
  );
};

export default App;
