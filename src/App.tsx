import React from 'react';
import BusTable from './BusTable';

const App: React.FC = () => {
  return (
    <div>
      <header style={{ backgroundColor: '#0052cc', color: 'white', padding: '1rem', textAlign: 'center' }}>
        <h1>深中巴士攻略 SZBUS</h1>
      </header>
      <main style={{ padding: '20px' }}>
        <BusTable />
      </main>
    </div>
  );
}

export default App;
