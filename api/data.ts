
// /api/data.ts
export const config = {
  runtime: 'edge', // 使用 Edge Runtime 速度更快，且自帶 fetch
};

export default async function handler() {
  const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

  try {
    const response = await fetch(`${GOOGLE_SHEET_URL}&t=${new Date().getTime()}`, {
      method: 'GET',
      headers: {
        'content-type': 'text/csv;charset=UTF-8',
      },
    });

    if (!response.ok) throw new Error('Google Sheet Response Error');

    const data = await response.text();

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
        'Access-Control-Allow-Origin': '*', // 允許跨域
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
