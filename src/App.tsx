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

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvkmCc9ail_gNrq8s8KnMLKW6p1Dr5IHC6GVdljit8L1T9kXjYKXEFDygfGsXeFHoGqHBhINcESxC_/pub?gid=0&single=true&output=csv';

const GLOBAL_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang HK", "PingFang TC", "Hiragino Sans GB", "Microsoft JhengHei", "Noto Sans CJK TC", "Source Han Sans", sans-serif';

// 橫向廣告組件
const AdBanner: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  useEffect(() => {
    try { if (window.adsbygoogle) window.adsbygoogle.push({}); } catch (err) {}
  }, []);
  return (
    <ins className="adsbygoogle"
         style={{ display: 'block', minHeight: '90px', ...style }}
         data-ad-client="ca-pub-8256903623772163"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
};

const SwapButtonIcon = () => (
  <img src="/image_bea913.png" alt="Swap" style={{ width: '32px', height: '32px', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
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
  const [isMobile, setIsMobile] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const [detailItem, setDetailItem] = useState<BusItem | null>(null);
  const [showRouteOverview, setShowRouteOverview] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1000);
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    window.addEventListener('resize', handleResize);
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('resize', handle
