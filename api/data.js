import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const referer = req.headers.referer || '';
  
  // 檢查來源：只准 localhost (你本地) 同埋 lazytoolsstation 讀取
  const isAllowed = referer.includes('localhost') || referer.includes('lazytoolsstation.vercel.app');

  if (!isAllowed) {
    // 來源不明，直接踢走
    return res.status(403).json({ error: '版權所有，嚴禁盜用數據！' });
  }

  // 檢查通過，讀取 JSON
  const filePath = path.join(process.cwd(), 'api', 'bus_data.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json(data);
}