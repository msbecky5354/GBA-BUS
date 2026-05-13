import React, { useState, useEffect } from 'react';

const BusTable: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
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

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>🚌 正在同步數據...</div>;
  if (!data || data.length === 0) return <div style={{ textAlign: 'center', padding: '40px' }}>目前沒有資料。</div>;

  const headers = Object.keys(data[0]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '12px', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              {headers.map(h => (
                <td key={h} style={{ padding: '12px' }}>{String(row[h])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BusTable;
