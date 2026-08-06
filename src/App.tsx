import React, { useState, useEffect, useMemo } from 'react';

// 1. 定義資料型態
interface BusItem {
  operator: string;
  departure_region: string;
  departure_town: string;
  pickup_point: string;
  arrival_region: string;
  arrival_town: string;
  dropoff_point: string;
  schedule: string;
  estimated_duration: string;
  price: string;
  currency: string;
  booking_remarks: string;
  source_url: string;
  wechat_app: string;
  sort_dr: number;
  sort_ar: number;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// 核心修正：對接後端代理 API 隱藏原始連結
const CSV_URL = './encrypted-data.json';

const GLOBAL_FONT = '"Noto Sans HK", "Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang HK", "PingFang TC", sans-serif';

const SwapButtonIcon = () => (
  <img src="./image_bea913.png" alt="Swap" style={{ width: '32px', height: '32px', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
);

const App: React.FC = () => {
  const [busData, setBusData] = useState<BusItem[]>([]);
  const [filteredData, setFilteredData] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const [depRegionFilter, setDepRegionFilter] = useState('');
  const [depTownFilter, setDepTownFilter] = useState('');
  const [pickupFilter, setPickupFilter] = useState('');
  const [arrRegionFilter, setArrRegionFilter] = useState('');
  const [arrTownFilter, setArrTownFilter] = useState('');
  const [dropoffFilter, setDropoffFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedWechatApp, setSelectedWechatApp] = useState('');
  const [noticeInfo, setNoticeInfo] = useState<{ title: string, content: React.ReactNode } | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1000;
    }
    return true; 
  });

  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [detailItem, setDetailItem] = useState<BusItem | null>(null);
  
  const [showRouteOverview, setShowRouteOverview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : 'https://lazytoolsstation.vercel.app';

  // 🌤️ 天氣相關 State
  const [weatherMsg, setWeatherMsg] = useState<string>('');
  const [specialMsg, setSpecialMsg] = useState<string>('');
  const [specialTheme, setSpecialTheme] = useState<{ bg: string; text: string }>({ bg: '#dc2626', text: '#ffffff' });
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    window.addEventListener('resize', handleResize);
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);

    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes flashWarning {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .flash-warning-box {
        animation: flashWarning 1.5s infinite ease-in-out;
      }
      @keyframes weatherScroll {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
      .animate-weather-scroll {
        display: inline-block;
        white-space: nowrap;
        animation: weatherScroll 18s linear infinite;
      }
      @media (max-width: 999px) {
        .bus-card-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => { 
      window.removeEventListener('resize', handleResize); 
      window.removeEventListener('scroll', handleScroll); 
    };
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://msbecky5354.github.io/JSON/data/zs_weather.json?v=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          let msg = data.zs_message || data.hk_message || data.message || '';
          if (msg && msg.trim() !== '') {
            msg = msg.replace(/\n/g, ' | ').replace(/\*(.*?)\*/g, '$1');
            setWeatherMsg(msg);
          }
        }
      } catch (e) {
        console.error('Routine weather fetch failed:', e);
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    const fetchSpecial = async () => {
      try {
        const res = await fetch(`https://msbecky5354.github.io/JSON/data/zs_special_weather.json?v=${Date.now()}`);
        if (res.ok) {
          const textData = await res.text();
          if (!textData || textData.trim() === '') {
            setSpecialMsg('');
            return;
          }

          const data = JSON.parse(textData);
          const msg = data.zs_message || data.hk_message || data.special_message || data.message || '';

          if (msg && msg.trim() !== '') {
            setSpecialMsg(msg);

            let bg = '#dc2626';
            let text = '#ffffff';
            if (msg.includes('一號')) { bg = '#fca5a5'; text = '#1e293b'; }
            else if (msg.includes('三號') || msg.includes('橙')) { bg = '#f97316'; }
            else if (msg.includes('八號')) { bg = '#b91c1c'; }
            else if (msg.includes('九號') || msg.includes('十號')) { bg = '#450a0a'; }
            else if (msg.includes('黃色')) { bg = '#d97706'; }
            else if (msg.includes('黑色')) { bg = '#09090b'; }
            else if (msg.includes('白')) { bg = '#ffffff'; text = '#1e293b'; }
            else if (msg.includes('藍') || msg.includes('蓝')) { bg = '#2563eb'; }
            else if (msg.includes('黃') || msg.includes('黄')) { bg = '#eab308'; text = '#1e293b'; }

            setSpecialTheme({ bg, text });
          } else {
            setSpecialMsg('');
          }
        }
      } catch (e) {
        console.error('Special weather fetch failed:', e);
        setSpecialMsg('');
      }
    };
    fetchSpecial();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${CSV_URL}?t=${new Date().getTime()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP 錯誤！狀態碼: ${response.status}`);
        }

        const text = await response.text();
        if (text.trim().startsWith('<')) {
          throw new Error('伺服器返回 HTML 頁面（非 JSON）');
        }

        let result;
        try {
          result = JSON.parse(atob(text));
        } catch {
          result = JSON.parse(text);
        }
        
        setBusData(result); 
        setFilteredData(result); 
        setLoading(false);
        
        const now = new Date();
        setLastUpdated(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
      } catch (error) { 
        console.error("Fetch error:", error);
        setLoading(false); 
      }
    };
    fetchData();
  }, []);

  const depRegions = useMemo(() => {
    const all = Array.from(new Set(busData.map(i => i.departure_region))).filter(Boolean).sort();
    return (arrRegionFilter && arrRegionFilter !== '深圳') ? all.filter(r => r !== arrRegionFilter) : all;
  }, [busData, arrRegionFilter]);

  const arrRegions = useMemo(() => {
    const all = Array.from(new Set(busData.map(i => i.arrival_region))).filter(Boolean).sort();
    return (depRegionFilter && depRegionFilter !== '深圳') ? all.filter(r => r !== depRegionFilter) : all;
  }, [busData, depRegionFilter]);

  // 1. 拆分並收集所有出發城鎮（支援 "/" 拆分）
  const depTowns = useMemo(() => {
    const townMap = new Map<string, number>();
    busData.forEach(i => {
      if (!depRegionFilter || i.departure_region === depRegionFilter) {
        if (i.departure_town) {
          i.departure_town.split('/').forEach(t => {
            const cleanT = t.trim();
            if (cleanT) townMap.set(cleanT, Math.max(townMap.get(cleanT) || 0, i.sort_dr));
          });
        }
      }
    });
    return Array.from(townMap.entries()).filter(e => Boolean(e[0])).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  }, [busData, depRegionFilter]);

  // 2. 拆分並收集所有目的城鎮（支援 "/" 拆分）
  const arrTowns = useMemo(() => {
    const townMap = new Map<string, number>();
    busData.forEach(i => {
      if (!arrRegionFilter || i.arrival_region === arrRegionFilter) {
        if (i.arrival_town) {
          i.arrival_town.split('/').forEach(t => {
            const cleanT = t.trim();
            if (cleanT) townMap.set(cleanT, Math.max(townMap.get(cleanT) || 0, i.sort_ar));
          });
        }
      }
    });
    return Array.from(townMap.entries()).filter(e => Boolean(e[0])).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  }, [busData, arrRegionFilter]);

  // 3. 收集上車站點
  const availablePickups = useMemo(() => {
    return Array.from(new Set(
      busData
        .filter(i => (!depRegionFilter || i.departure_region === depRegionFilter) && (!depTownFilter || (i.departure_town && i.departure_town.includes(depTownFilter))))
        .map(i => i.pickup_point)
    )).filter(Boolean).sort();
  }, [busData, depRegionFilter, depTownFilter]);

  // 4. 收集落車站點
  const availableDropoffs = useMemo(() => {
    return Array.from(new Set(
      busData
        .filter(i => (!arrRegionFilter || i.arrival_region === arrRegionFilter) && (!arrTownFilter || (i.arrival_town && i.arrival_town.includes(arrTownFilter))))
        .map(i => i.dropoff_point)
    )).filter(Boolean).sort();
  }, [busData, arrRegionFilter, arrTownFilter]);

  // 5. 簡繁體與斜線容錯匹配過濾器
  useEffect(() => {
    setFilteredData(busData.filter(i => {
      const matchDepRegion = !depRegionFilter || i.departure_region === depRegionFilter;
      const matchArrRegion = !arrRegionFilter || i.arrival_region === arrRegionFilter;
      
      const checkMatch = (fieldVal: string, filterVal: string) => {
        if (!filterVal) return true;
        if (!fieldVal) return false;
        
        // 核心容錯：將常見繁簡字眼統一轉換或直接進行包含比對
        const cleanField = fieldVal.trim();
        const cleanFilter = filterVal.trim();

        if (cleanField.includes(cleanFilter)) return true;

        // 經斜線拆分後比對
        const parts = cleanField.split('/').map(p => p.trim());
        if (parts.some(p => p.includes(cleanFilter) || cleanFilter.includes(p))) return true;

        // 針對「鐵」與「铁」等常見簡繁差異的特別映射容錯
        const tradToSimp = cleanFilter.replace(/鐵/g, '铁');
        const simpToTrad = cleanFilter.replace(/铁/g, '鐵');
        if (cleanField.includes(tradToSimp) || cleanField.includes(simpToTrad)) return true;

        return false;
      };

      const matchDepTown = checkMatch(i.departure_town, depTownFilter);
      const matchArrTown = checkMatch(i.arrival_town, arrTownFilter);
      const matchPickup = checkMatch(i.pickup_point, pickupFilter);
      const matchDropoff = checkMatch(i.dropoff_point, dropoffFilter);

      return matchDepRegion && matchArrRegion && matchDepTown && matchArrTown && matchPickup && matchDropoff;
    }));
  }, [depRegionFilter, depTownFilter, pickupFilter, arrRegionFilter, arrTownFilter, dropoffFilter, busData]);

  // 補回先前遺失的 handleFullSwap 函數，防止點擊對調按鈕時報錯
  const handleFullSwap = () => {
    const dR = depRegionFilter, dT = depTownFilter, dP = pickupFilter;
    const aR = arrRegionFilter, aT = arrTownFilter, aP = dropoffFilter;
    setDepRegionFilter(aR); setArrRegionFilter(dR); setDepTownFilter(aT); setArrTownFilter(dT); setPickupFilter(aP); setDropoffFilter(dP);
  };

  const handleReset = () => {
    setDepRegionFilter(''); setDepTownFilter(''); setPickupFilter('');
    setArrRegionFilter(''); setArrTownFilter(''); setDropoffFilter('');
  };

  const copyShareLink = async (url: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('🔗 連結已複製到剪貼簿！');
        setShowShareModal(false);
      }
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const nativeShare = (title: string, text: string, url: string) => {
    if (navigator.share) {
      navigator.share({ title, text, url }).catch(err => console.log('Share cancelled', err));
      setShowShareModal(false);
    } else {
      copyShareLink(url);
    }
  };

  const showNotice = (type: string) => {
    let content = null; let title = '';
    switch (type) {
      case 'about':
        title = '關於我們';
        content = (
          <>
            <p><strong>「深中珠巴士懶人包」</strong> 是一個由民間發起的資訊整合工具。我們的使命是打破跨市交通的資訊隔閡，讓旅客能一站式搜尋深圳、中山、珠海之間的交通方案。</p>
            <p style={{ marginTop: '10px', color: '#92400e', fontWeight: 'bold' }}>💡 背後故事：血汗數據庫</p>
            <p>本站背後的數據庫並非官方自動同步，而是由<a href="https://lazytoolsstation.vercel.app" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'underline' }}>懶人工具駅</a>透過「人手人肉」方式，逐一從各大營運商官網、小程式蒐集零散時間表並進行校對輸入。這是一項極度耗費心力的工作，只為讓街坊出行更便利。請大家多多支持我們的團隊！</p>
          </>
        );
        break;
      case 'contact':
        title = '聯絡我們';
        content = (
          <>
            <p>如您發現班次資訊有誤、有新路線建議，歡迎隨時聯絡我們：</p>
            <p style={{ marginTop: '10px' }}><strong>Facebook 群組：</strong> <a href="https://www.facebook.com/groups/998954119219884" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 'bold' }}>中山美食地圖群組</a></p>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>您的每一次反饋，都是對我們這份「血汗數據庫」最好的支持。</p>
          </>
        );
        break;
      case 'privacy':
        title = '隱私權政策';
        content = <p>本站為純資訊展示平台。我們使用 Google Analytics 服務來分析流量。所有的購票交易均在第三方官方平台上進行，本站<strong>不會收集、儲存或接觸</strong>您的任何個人付款資訊或身分證明文件。</p>;
        break;
      case 'terms':
        title = '服務條款';
        content = (
          <>
            <p>使用本站服務即代表您知悉並同意以下條款：</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li><strong>人手輸入誤差：</strong>由於本站數據由人手錄入，雖致力準確，但仍可能存在延遲。購票前請務必點擊連結，以營運商官方最新資訊為準。</li>
              <li><strong>免責聲明：</strong>本站不承擔因資訊不準確而導致的任何行程延誤、損失或法律責任。</li>
              <li><strong style={{ color: '#ef4444' }}>版權所有，嚴禁抓取：</strong>本站數據為團隊心血結晶。未經書面授權，<strong>嚴禁任何形式的自動化爬蟲抓取、商業轉載或二次開發。</strong>如有發現，本團隊保留一切法律追究權利。</li>
            </ul>
          </>
        );
        break;
    }
    if (content) setNoticeInfo({ title, content });
  };

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px', fontSize: '14px', backgroundColor: 'white', color: '#1e293b', fontFamily: GLOBAL_FONT };
  const labelStyle: React.CSSProperties = { backgroundColor: '#FFE600', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', color: '#1e293b' };
  const swapBtnStyle: React.CSSProperties = { width: '32px', height: '32px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 };

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()} 
      onCopy={(e) => e.preventDefault()} 
      style={{ 
        WebkitUserSelect: 'none', 
        MozUserSelect: 'none', 
        msUserSelect: 'none', 
        userSelect: 'none', 
        minHeight: '100vh', 
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden', 
        backgroundColor: '#f8fafc', 
        paddingBottom: '20px', 
        fontFamily: GLOBAL_FONT, 
        letterSpacing: '0.01em',
        boxSizing: 'border-box'
      }}
    >
      
      {/* 啡色 Header */}
      <header style={{ backgroundColor: '#B8860B', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="./logo.png" alt="Logo" style={{ height: '52px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, lineHeight: '1.2' }}>深中珠巴士</h1>
            <span style={{ color: '#FFE600', fontSize: '1.2rem', fontWeight: 900, lineHeight: '1.2' }}>懶人包</span>
          </div>
        </div>
        
        {specialMsg && (
          <div
            className="flash-warning-box"
            onClick={() => setShowWeatherModal(true)}
            style={{
              backgroundColor: specialTheme.bg,
              color: specialTheme.text,
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isMobile ? '110px' : '260px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              margin: '0 8px',
              flexShrink: 1
            }}
            title={specialMsg}
          >
            ⚠️ {specialMsg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div onClick={() => setShowRouteOverview(true)} style={{ cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} title="路線及指南">📖</div>
            <div onClick={() => setShowShareModal(true)} style={{ cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%' }} title="分享應用程式">🔗</div>
          </div>
          <div style={{ fontSize: '10px', textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: '#FFE600' }}>最後更新</div>
            <div>{lastUpdated.split(' ')[0]}</div>
          </div>
        </div>
      </header>

      {weatherMsg && (
        <div 
          style={{
            backgroundColor: '#f0f9ff',
            borderBottom: '1px solid #e0f2fe',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            fontSize: '12px',
            color: '#0369a1',
            padding: '0 16px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
            <div className="animate-weather-scroll" style={{ fontWeight: 600 }}>
              🌤️ 中山天氣：{weatherMsg}
            </div>
          </div>
        </div>
      )}

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px', boxSizing: 'border-box', width: '100%' }}>
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            
            <button 
              onClick={handleReset} 
              style={{ 
                position: 'absolute', top: '15px', right: '15px', 
                backgroundColor: '#fef2f2', border: '1px solid #fecaca', 
                borderRadius: '50%', width: '32px', height: '32px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)' 
              }} 
              title="重置搜尋"
            >
              <img src="./reset.png" alt="Reset" style={{ width: '16px', height: '16px' }} />
            </button>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發地區</span><select style={selectStyle} value={depRegionFilter} onChange={e => {setDepRegionFilter(e.target.value); setDepTownFilter(''); setPickupFilter('');}}><option value="">所有</option>{depRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle} title="對調出發與目的地"><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的地區</span><select style={selectStyle} value={arrRegionFilter} onChange={e => {setArrRegionFilter(e.target.value); setArrTownFilter(''); setDropoffFilter('');}}><option value="">所有</option>{arrRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>出發城鎮</span><select style={selectStyle} value={depTownFilter} onChange={e => {setDepTownFilter(e.target.value); setPickupFilter('');}}><option value="">所有</option>{depTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <button onClick={handleFullSwap} style={swapBtnStyle} title="對調出發與目的地"><SwapButtonIcon /></button>
                <div style={{ flex: 1 }}><span style={labelStyle}>目的城鎮</span><select style={selectStyle} value={arrTownFilter} onChange={e => {setArrTownFilter(e.target.value); setDropoffFilter('');}}><option value="">所有</option>{arrTowns.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><span style={labelStyle}>上車站點</span><select style={selectStyle} value={pickupFilter} onChange={e => setPickupFilter(e.target.value)}><option value="">所有</option>{availablePickups.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div style={{ width: '32px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}><span style={labelStyle}>落車站點</span><select style={selectStyle} value={dropoffFilter} onChange={e => setDropoffFilter(e.target.value)}><option value="">所有</option>{availableDropoffs.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
              </div>
            </div>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center' }}>🚌 數據血汗加載中...</p> : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>🔍 暫無相關巴士班次</div>
        ) : (
          <div className="bus-card-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
            {filteredData.map((item, idx) => (
              <div key={idx} onClick={() => setDetailItem(item)} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', borderTop: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative', minHeight: '210px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', backgroundColor: '#fff7ed', color: '#f97316', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{item.operator}</span>
                  <div style={{ fontSize: '14px', color: '#1e293b', textAlign: 'right' }}>{item.schedule}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flex: 1, marginBottom: '15px' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontSize: '15px', marginBottom: '8px', color: '#2563eb', lineHeight: '1.4' }}>
                      <a onClick={(e) => e.stopPropagation()} href={`https://www.amap.com/search?query=${item.departure_region}${item.departure_town}${item.pickup_point}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
                        📍 <span style={{ color: '#9333ea', fontSize: '13px' }}>{item.departure_region} · {item.departure_town}</span> {item.pickup_point} 
                        <img src="./amap.png" alt="Amap" style={{ height: '18px', marginLeft: '6px' }} />
                      </a>
                    </div>
                    <div style={{ fontSize: '15px', color: '#2563eb', lineHeight: '1.4' }}>
                      🏁 <span style={{ color: '#9333ea', fontSize: '13px' }}>{item.arrival_region} · {item.arrival_town}</span> {item.dropoff_point}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', minWidth: '90px', maxWidth: '120px', flexShrink: 0 }}>
                    <div style={{ fontWeight: 900, color: '#ef4444' }}>
                      <span style={{ fontSize: '14px', marginRight: '2px' }}>{item.currency}</span>
                      <span style={{ fontSize: '24px' }}>{item.price}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {item.estimated_duration}
                    </div>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, paddingRight: '15px' }}>
                    <div style={{ fontSize: '10px', color: '#EAB308', fontWeight: 'bold' }}>巴士資訊</div>
                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>{item.booking_remarks || '--'}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); item.wechat_app ? (setSelectedWechatApp(item.wechat_app), setShowModal(true)) : window.open(item.source_url, '_blank')}} 
                          style={{ backgroundColor: item.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '10px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {item.wechat_app ? `微信: ${item.wechat_app}` : '官網連結'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px 16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', textAlign: 'center' }}>
        <div style={{ margin: '15px 0', fontSize: '13px', fontWeight: 'bold' }}>
          <a onClick={() => showNotice('about')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>關於我們</a> |
          <a onClick={() => showNotice('contact')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>聯絡我們</a> |
          <a onClick={() => showNotice('privacy')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>隱私權政策</a> |
          <a onClick={() => showNotice('terms')} style={{ color: '#3b82f6', cursor: 'pointer', margin: '0 8px' }}>服務條款</a>
        </div>
        <p>© {new Date().getFullYear()} 深中珠巴士懶人包. All rights reserved.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: '#94a3b8' }}>
          <span>開發者:</span>
          <a 
            href="https://lazytoolsstation.vercel.app" 
            target="_blank" 
            rel="noreferrer" 
            style={{ color: '#64748b', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
          >
            <img src="./image.png" alt="Dev Logo" style={{ height: '16px', width: 'auto' }} />
            <span style={{ textDecoration: 'underline' }}>懶人工具駅</span>
          </a>
        </div>
      </footer>

      {showBackToTop && <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#B8860B', color: 'white', border: 'none', cursor: 'pointer', zIndex: 90, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>}

      {showWeatherModal && (
        <div 
          onClick={() => setShowWeatherModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 20000, WebkitTransform: 'translateZ(0)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '380px', width: '100%', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ backgroundColor: specialTheme.bg, color: specialTheme.text, padding: '24px', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>極端天氣預警</h3>
              <button 
                onClick={() => setShowWeatherModal(false)}
                style={{ position: 'absolute', top: '12px', right: '12px', border: 'none', background: 'rgba(0,0,0,0.1)', color: specialTheme.text, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', maxHeight: '50vh', overflowY: 'auto', fontSize: '14px', lineHeight: '1.6', color: '#1e293b', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>
              {specialMsg.split('\n').map((line, idx) => (
                <p key={idx} style={{ margin: '0 0 8px 0', color: '#1e293b' }}>{line}</p>
              ))}
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
              <button 
                onClick={() => setShowWeatherModal(false)}
                style={{ width: '100%', backgroundColor: specialTheme.bg, color: specialTheme.text, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                我明白咗
              </button>
            </div>
          </div>
        </div>
      )}

      {showRouteOverview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1100, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto', WebkitTransform: 'translateZ(0)' }}>
          <button onClick={() => setShowRouteOverview(false)} style={{ alignSelf: 'flex-end', padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>關閉 ✕</button>
          
          <h2 style={{ color: '#B8860B', borderBottom: '3px solid #B8860B', paddingBottom: '10px', fontSize: '28px', fontWeight: 900 }}>📖 路線概覽 & 使用指南</h2>
          
          <div style={{ fontSize: '20px', color: '#b45309', lineHeight: '2.2', marginTop: '24px' }}>
            ✅ 深圳 &rarr; 中山（經深中通道快線）<br />
            ✅ 深圳 &rarr; 珠海<br />
            ✅ 中山 &rarr; 珠海<br />
            ✅ 深圳市內 &rarr; 深圳機場<br />
          </div>

          <div style={{ marginTop: '40px', marginBottom: '32px' }}>
            <h3 style={{ color: '#0ea5e9', fontSize: '22px', marginBottom: '12px' }}>1. 如何加入手機 免費Apps (免安裝直接用)</h3>
            <p style={{ fontSize: '17px', lineHeight: '1.8', color: '#1e293b' }}>iPhone: Safari 點擊「分享」&rarr;「加入主畫面」。<br />Android: Chrome 點擊「三個點」&rarr;「安裝應用程式」。</p>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ color: '#0ea5e9', fontSize: '22px', marginBottom: '12px' }}>2. 核心功能</h3>
            <ul style={{ fontSize: '17px', lineHeight: '2.2', color: '#1e293b', paddingLeft: '20px', margin: 0 }}>
              <li><strong>三層精準搜索：</strong> 地區 &rarr; 城鎮 &rarr; 站點。</li>
              <li><strong>全路徑對調：</strong> 點擊 <img src="./image_bea913.png" alt="Swap" style={{ width: '18px', height: '18px', verticalAlign: 'middle', margin: '0 4px', display: 'inline-block' }} /> 鍵快速切換往返搜尋。</li>
              <li><strong>一鍵重置：</strong> 點擊 <img src="./reset.png" alt="Reset" style={{ width: '18px', height: '18px', verticalAlign: 'middle', margin: '0 4px', display: 'inline-block' }} /> 鍵清除所有過濾條件。</li>
              <li><strong>高德地圖導航：</strong> 點擊站點旁圖標直接跳轉高德地圖。</li>
              <li><strong>一鍵複製微信：</strong> 點擊綠色按鈕自動複製小程式名稱。</li>
              <li><strong>放大詳情模式：</strong> 點擊卡片任何地方即可放大查看超大字體。</li>
            </ul>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '24px', borderTop: '2px dashed #fef3c7', fontSize: '16px', color: '#92400e', lineHeight: '1.8', backgroundColor: '#fffbeb', padding: '20px', borderRadius: '12px' }}>
            💡 <strong>編者的話：</strong><br />本站數據由團隊人手蒐集，耗費大量血汗時間。請大家支持「中山美食地圖」團隊！
          </div>
        </div>
      )}

      {showShareModal && (
        <div 
          onClick={() => setShowShareModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 20000, WebkitTransform: 'translateZ(0)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '24px', maxWidth: '340px', width: '100%', padding: '24px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}
          >
            <button onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
            
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', textAlign: 'center', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ color: '#B8860B' }}>🔗</span> 分享應用程式
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>一站式搜尋深中珠交通方案！</p>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '16px', display: 'flex', justifyContent: 'center', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`} alt="QR Code" style={{ width: '180px', height: '180px', borderRadius: '8px' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => copyShareLink(currentUrl)}
                style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#334155', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                📋 複製
              </button>
              <button 
                onClick={() => nativeShare('深中珠巴士懶人包', '一站式搜尋深圳、中山、珠海之間的交通方案！', currentUrl)}
                style={{ flex: 1, backgroundColor: '#B8860B', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                🚀 傳送
              </button>
            </div>
          </div>
        </div>
      )}

      {detailItem && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'white', zIndex: 1050, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto', WebkitTransform: 'translateZ(0)' }}>
          <button onClick={() => setDetailItem(null)} style={{ alignSelf: 'flex-end', padding: '12px 24px', backgroundColor: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>關閉 ✕</button>
          <div style={{ borderBottom: '3px solid #3b82f6', paddingBottom: '15px', marginBottom: '25px' }}>
            <span style={{ fontSize: '36px', backgroundColor: '#fff7ed', color: '#f97316', padding: '8px 24px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block' }}>{detailItem.operator}</span>
            <h2 style={{ fontSize: '36px', marginTop: '15px', color: '#1e293b', fontWeight: 900 }}>{detailItem.schedule}</h2>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '18px' }}>📍 出發站點</div>
              <div style={{ fontSize: '28px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.departure_region} · {detailItem.departure_town}</div>
              <a href={`https://www.amap.com/search?query=${detailItem.departure_region}${detailItem.departure_town}${detailItem.pickup_point}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', fontSize: '32px', color: '#2563eb', textDecoration: 'none', marginTop: '10px', fontWeight: 900 }}>
                {detailItem.pickup_point} <img src="./amap.png" alt="Amap" style={{ height: '36px', marginLeft: '12px' }} />
              </a>
            </div>
            <div><div style={{ color: '#94a3b8', fontSize: '18px' }}>🏁 目的地點</div><div style={{ fontSize: '28px', color: '#9333ea', fontWeight: 'bold' }}>{detailItem.arrival_region} · {detailItem.arrival_town}</div><div style={{ fontSize: '32px', color: '#2563eb', fontWeight: 900 }}>{detailItem.dropoff_point}</div></div>
            <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '20px' }}><div style={{ fontSize: '48px', color: '#ef4444', fontWeight: 900 }}>{detailItem.currency} {detailItem.price}</div><div style={{ fontSize: '22px', color: '#64748b' }}>預計耗時: {detailItem.estimated_duration}</div></div>
            <div><div style={{ color: '#EAB308', fontSize: '18px', fontWeight: 'bold' }}>巴士資訊</div><div style={{ fontSize: '20px', color: '#475569', lineHeight: '1.6' }}>{detailItem.booking_remarks || '--'}</div></div>
          </div>
          
          <button onClick={() => detailItem.wechat_app ? (setSelectedWechatApp(detailItem.wechat_app), setShowModal(true)) : window.open(detailItem.source_url, '_blank')} 
                  style={{ width: '100%', backgroundColor: detailItem.wechat_app ? '#22c55e' : '#2563eb', color: 'white', border: 'none', padding: '22px', borderRadius: '20px', fontWeight: 'bold', fontSize: '20px', marginTop: '40px', cursor: 'pointer' }}>
            {detailItem.wechat_app ? `🔍 點擊複製小程序：${detailItem.wechat_app}` : '🌐 前往官網查看'}
          </button>
        </div>
      )}

      {noticeInfo && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 2000, WebkitTransform: 'translateZ(0)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: '#B8860B', marginBottom: '15px' }}>{noticeInfo.title}</h2>
            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>{noticeInfo.content}</div>
            <button onClick={() => setNoticeInfo(null)} style={{ width: '100%', marginTop: '25px', padding: '12px', borderRadius: '12px', border: 'none', fontWeight: 'bold', backgroundColor: '#f1f5f9', color: '#334155' }}>關閉</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, WebkitTransform: 'translateZ(0)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <p style={{ color: '#334155' }}>請複製名稱後到微信搜尋：</p><h3 style={{ color: '#22c55e', margin: '15px 0' }}>{selectedWechatApp}</h3>
            <button 
              onCopy={(e) => e.stopPropagation()} 
              onClick={() => { if (navigator.clipboard) { navigator.clipboard.writeText(selectedWechatApp); alert('已複製！'); } }} 
              style={{ width: '100%', backgroundColor: '#22c55e', color: 'white', padding: '14px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              一鍵複製
            </button>
            <button onClick={() => setShowModal(false)} style={{ color: '#94a3b8', background: 'none', border: 'none', marginTop: '10px', cursor: 'pointer' }}>暫時關閉</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
