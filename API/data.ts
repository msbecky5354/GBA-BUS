// /api/data.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 這是你原始的 Google Sheet 連結
  const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

  try {
    const response = await fetch(`${GOOGLE_SHEET_URL}&t=${new Date().getTime()}`);
    const data = await response.text();

    // 設置安全標頭，只允許你的網域存取 (選填)
    // res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.vercel.app');
    
    // 快取 1 分鐘，減少 Google Sheet 負擔
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    return res.status(200).send(data);
  } catch (error) {
    return res.status(500).json({ error: '獲取數據失敗' });
  }
}
