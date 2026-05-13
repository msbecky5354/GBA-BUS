import React, { useState, useEffect } from 'react';

const BusTable: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>(''); // 新增：搜尋關鍵字狀態
  
  const API_URL = 'https://script.google.com/macros/s/AKfycbxZbsC7Jz5hZ29WmG3lUHTPO4dhRX-vZxHF1Bz7TAf_jdwgOoLqW8Yhtmy95ie7pgzDDg/exec';

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  }, []);

  // 核心邏輯：過濾資料
  const filteredData = data.filter(row => {
    // 將整行資料轉為字串並檢查是否包含搜尋詞
    const rowString = Object.values(row).join(' ').toLowerCase();
    return rowString.includes(searchTerm.toLowerCase());
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
      🚌 正在獲取最新深中巴士班次...
    </div>
  );

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 搜尋欄容器 */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <input
          type="text"
          placeholder="輸入關鍵字 (例如：中山北、深圳灣、票價...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '15px 20px',
            fontSize: '1rem',
            borderRadius: '12px',
            border: '2px solid #0052cc',
            boxSizing: 'border-box',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(0,82,204,0.1)'
          }}
        />
        {searchTerm && (
          <span 
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: '15px', top: '15px', cursor: 'pointer', color: '#999' }}
          >
            ✕
          </span>
        )}
      </div>

      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
        找到 {filteredData.length} 個相關班次
      </div>

      {/* 表格容器 */}
      <div style={{ overflowX: 'auto', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#0052cc', color: 'white' }}>
              {headers.map(h => (
                <th key={h} style={{ padding: '15px', textAlign: 'left', fontSize: '0.9rem', fontWeight: '600' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row, i) => (
                <tr 
                  key={i} 
                  style={{ 
                    borderBottom: '1px solid #eee',
                    backgroundColor: i % 2 === 0 ? '#fff' : '#f9fbff' // 斑馬紋設計
                  }}
                >
                  {headers.map(h => (
                    <td key={h} style={{ padding: '15px', color: '#444', fontSize: '0.95rem' }}>
                      {String(row[h])}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  找不到符合「{searchTerm}」的資料，請換個詞試試。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusTable;
