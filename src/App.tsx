const showNotice = (type: string) => {
    let content = null; let title = '';
    switch (type) {
      case 'about':
        title = '關於我們';
        content = (
          <>
            <p><strong>「深中珠巴士懶人包」</strong> 是一個由民間發起的資訊整合工具。我們的使命是打破跨市交通的資訊隔閡，讓旅客能一站式搜尋深圳、中山、珠海之間的交通方案。</p>
            <p style={{ marginTop: '10px', color: '#92400e', fontWeight: 'bold' }}>💡 背後故事：血汗數據庫</p>
            <p>本站背後的數據庫並非官方自動同步，而是由<strong>中山美食地圖團隊</strong>透過「人手人肉」方式，逐一從各大營運商官網、小程式蒐集零散時間表並進行校對輸入。這是一項極度耗費心力的工作，只為讓街坊出行更便利。請大家多多支持我們的團隊！</p>
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
        content = <p>本站為純資訊展示平台。我們使用 Google Analytics 及 AdSense 服務來分析流量。所有的購票交易均在第三方官方平台上進行，本站**不會收集、儲存或接觸**您的任何個人付款資訊或身分證明文件。</p>;
        break;
      case 'terms':
        title = '服務條款';
        content = (
          <>
            <p>使用本站服務即代表您知悉並同意以下條款：</p>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li><strong>人手輸入誤差：</strong>由於本站數據由人手錄入，雖致力準確，但仍可能存在延遲。購票前請務必點擊連結，以營運商官方最新資訊為準。</li>
              <li><strong>免責聲明：</strong>本站不承擔因資訊不準確而導致的任何行程延誤、損失或法律責任。</li>
              <li><strong>版權所有，嚴禁抓取：</strong>本站數據為團隊心血結晶。未經書面授權，<strong>嚴禁任何形式的自動化爬蟲抓取、商業轉載或二次開發。</strong>如有發現，本團隊保留一切法律追究權利。</li>
            </ul>
          </>
        );
        break;
    }
    if (content) setNoticeInfo({ title, content });
  };
