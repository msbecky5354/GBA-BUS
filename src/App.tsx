import React, { useState, useEffect } from 'react';

// 隱私聲明：本程式碼不含任何 IP 收集或追蹤代碼
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

const App = () => {
  const [busData, setBusData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 篩選狀態
  const [regionFilter, setRegionFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');

  // Modal 狀態
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(CSV_URL);
      const csvText = await response.text();
      const lines = csvText.split('\n');
      const headers = lines[0].split(',');

      // 根據提示詞要求的英文 Header 對應資料
      const result = lines.slice(1).map(line => {
        const values = line.split(',');
        return {
          operator: values[0],
          departure_region: values[1],
          pickup_point: values[2],
          dropoff_point: values[3],
          schedule: values[4],
          estimated_duration: values[5],
          price: values[6],
          currency: values[7],
          booking_remarks: values[8],
          source_url: values[9]
        };
      }).filter(item => item.operator); // 過濾空行

      setBusData(result);
      setFilteredData(result);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  // 處理篩選邏輯
  useEffect(() => {
    let filtered = busData.filter(item => {
      const matchRegion = regionFilter === '' || item.departure_region === regionFilter;
      const matchDest = destFilter === '' || item.dropoff_point.includes(destFilter);
      return matchRegion && matchDest;
    });
    setFilteredData(filtered);
  }, [regionFilter, destFilter, busData]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('已複製小程序名稱，請前往微信搜尋！');
  };

  const handleBooking = (item) => {
    if (item.booking_remarks.includes('小程序')) {
      setModalContent('深巴出行'); // 這裡可根據資料動態調整
      setShowModal(true);
    } else if (item.source_url) {
      window.open(item.source_url, '_blank');
    }
  };

  // 取得不重複的區域與目的地列表供選單使用
  const regions = [...new Set(busData.map(i => i.departure_region))];
  const destinations = ["中山", "深圳", "香港"]; // 簡化搜尋，或動態從 dropoff_point 提取

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-12">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center">深中巴士通</h1>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* 篩選區塊 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <select 
            className="p-2 border rounded-lg bg-white shadow-sm"
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="">所有出發地區</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select 
            className="p-2 border rounded-lg bg-white shadow-sm"
            onChange={(e) => setDestFilter(e.target.value)}
          >
            <option value="">所有目的地</option>
            {destinations.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* AdSense 廣告區塊佔位 */}
        <div className="bg-gray-200 border-2 border-dashed border-gray-400 h-24 mb-6 flex items-center justify-center text-gray-500 rounded-lg">
          <ins className="adsbygoogle"
               style={{ display: 'block' }}
               data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
               data-ad-slot="XXXXXXXXXX"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <span className="text-xs">廣告贊助區塊</span>
        </div>

        {/* 巴士列表 */}
        {loading ? (
          <p className="text-center py-10">🚌 班次載入中...</p>
        ) : (
          <div className="space-y-4">
            {filteredData.map((item, index) => {
              // 優化專線顯示：T01A, T01B 系列加上特殊樣式
              const isSpecialLine = /T01[AB]/.test(item.operator);
              return (
                <div key={index} className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${isSpecialLine ? 'border-orange-500 bg-orange-50' : 'border-blue-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-bold px-2 py-1 rounded ${isSpecialLine ? 'bg-orange-200 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item.operator}
                    </span>
                    <span className="text-red-600 font-bold text-lg">{item.currency}{item.price}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-700 mb-1">
                    <span className="w-6 text-center">📍</span>
                    <span className="font-medium text-sm">{item.pickup_point}</span>
                  </div>
                  <div className="flex items-center text-gray-700 mb-3">
                    <span className="w-6 text-center">🏁</span>
                    <span className="font-medium text-sm">{item.dropoff_point}</span>
                  </div>

                  <div className="flex justify-between items-end border-t pt-3">
                    <div className="text-xs text-gray-500">
                      <p>🕒 {item.schedule}</p>
                      <p>⏳ 約 {item.estimated_duration}</p>
                    </div>
                    <button 
                      onClick={() => handleBooking(item)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold active:bg-blue-800 transition shadow"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
            <div className="text-green-600 text-4xl mb-4">💬</div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              本服務需於微信預約，請點擊下方按鈕複製小程序名稱並手動開啟微信搜尋。
            </p>
            <button 
              onClick={() => copyToClipboard(modalContent)}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-bold mb-3 active:bg-green-700"
            >
              一鍵複製「{modalContent}」
            </button>
            <button 
              onClick={() => setShowModal(false)}
              className="text-gray-400 text-sm"
            >
              稍後再說
            </button>
          </div>
        </div>
      )}

      {/* Footer & Privacy Link */}
      <footer className="text-center p-6 mt-10 border-t bg-gray-100">
        <p className="text-gray-400 text-xs mb-2">深中巴士通 © 2026</p>
        <a href="/privacy" className="text-blue-500 text-xs underline">隱私權政策</a>
      </footer>
    </div>
  );
};

export default App;
