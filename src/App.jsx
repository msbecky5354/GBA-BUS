import React from 'react';
import './App.css';
import BusTable from './BusTable'; // We will create this next

function App() {
  return (
    <div className="App">
      <header style={{ backgroundColor: '#0052cc', color: 'white', padding: '1rem', textAlign: 'center' }}>
        <h1 style={{ margin: 0 }}>深中巴士攻略 SZBUS</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>深中通道．跨境巴士．實時時刻表</p>
      </header>
      
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <BusTable />
      </main>

      <footer style={{ marginTop: '40px', padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#666', borderTop: '1px solid #eee' }}>
        © 2024 深中巴士攻略 - 由 Google Sheets 即時更新
      </footer>
    </div>
  );
}

export default App;
