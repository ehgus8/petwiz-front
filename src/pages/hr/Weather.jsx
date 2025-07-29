import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Weather.module.scss';

// 위경도 -> 격자 좌표 변환 스크립트
const lamcproj = {};
lamcproj.RE = 6371.00877; // 지구 반경(km)
lamcproj.GRID = 5.0; // 격자 간격(km)
lamcproj.SLAT1 = 30.0; // 투영 위도1(도)
lamcproj.SLAT2 = 60.0; // 투영 위도2(도)
lamcproj.OLON = 126.0; // 기준점 경도(도)
lamcproj.OLAT = 38.0; // 기준점 위도(도)
lamcproj.XO = 43; // 기준점 X좌표(격자)
lamcproj.YO = 136; // 기준점 Y좌표(격자)

function lamcproj_rs(lon, lat) {
  const DEGRAD = Math.PI / 180.0;

  const re = lamcproj.RE / lamcproj.GRID;
  const slat1 = lamcproj.SLAT1 * DEGRAD;
  const slat2 = lamcproj.SLAT2 * DEGRAD;
  const olon = lamcproj.OLON * DEGRAD;
  const olat = lamcproj.OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);
  const rs = {};

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;
  rs.x = Math.floor(ra * Math.sin(theta) + lamcproj.XO + 0.5);
  rs.y = Math.floor(ro - ra * Math.cos(theta) + lamcproj.YO + 0.5);

  return rs;
}
// 변환 스크립트 끝

const Weather = () => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationName, setLocationName] = useState('서울'); // 기본 위치명

  const KMA_API_KEY =
    'ZXtHl7IjyIssn%2BuPYkhLiyHlbIyxO1Zj89v0YwTWPGkSka2%2B%2Ft47TsClb%2F2z8sfd5pLYfRfGmyVC6aMM4UgrZg%3D%3D'; // 기상청 API 키

  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          () => {
            setError(
              '위치 정보를 가져올 수 없습니다. 기본 위치의 날씨를 표시합니다.',
            );
            fetchWeather(37.5665, 126.978); // Default to Seoul
          },
        );
      } else {
        setError('이 브라우저에서는 위치 정보가 지원되지 않습니다.');
        fetchWeather(37.5665, 126.978); // Default to Seoul
      }
    };

    const fetchWeather = async (lat, lon) => {
      setLoading(true);
      const rs = lamcproj_rs(lon, lat);
      const today = new Date();
      let base_date = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
      let base_time = `${today.getHours().toString().padStart(2, '0')}00`;

      // 기상청 API는 특정 시간에만 데이터를 제공하므로, 현재 시간 기준으로 가장 가까운 과거 시간으로 설정
      const available_times = [
        '0200',
        '0500',
        '0800',
        '1100',
        '1400',
        '1700',
        '2000',
        '2300',
      ];
      const current_hour = today.getHours();

      let closest_time = available_times
        .slice()
        .reverse()
        .find((time) => {
          return parseInt(time.substring(0, 2), 10) <= current_hour;
        });

      if (!closest_time) {
        // 자정 ~ 02시 사이
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        base_date = `${yesterday.getFullYear()}${(yesterday.getMonth() + 1).toString().padStart(2, '0')}${yesterday.getDate().toString().padStart(2, '0')}`;
        closest_time = '2300';
      }
      base_time = closest_time;

      try {
        const url = `/api/getVilageFcst?serviceKey=${KMA_API_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=${rs.x}&ny=${rs.y}`;
        const response = await axios.get(url);
        const items = response.data.response.body.items.item;

        const currentTemperature = items.find(
          (item) => item.category === 'TMP',
        )?.fcstValue;
        const skyStatus = items.find(
          (item) => item.category === 'SKY',
        )?.fcstValue;
        const rainStatus = items.find(
          (item) => item.category === 'PTY',
        )?.fcstValue;

        setWeather({
          temp: currentTemperature,
          sky: skyStatus,
          pty: rainStatus,
        });

        // 위치명은 별도 API가 필요하므로, 위경도 기반으로 간단히 표시하거나 고정값 사용
        // 여기서는 기본값 '현재위치'로 설정
        if (lat !== 37.5665) setLocationName('현재위치');

        setError(null);
      } catch (err) {
        setError('날씨 정보를 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getLocation();
  }, [KMA_API_KEY]);

  const getWeatherInfo = () => {
    if (!weather) return { description: '정보 없음', icon: '' };

    // PTY(강수형태) 코드: 0(없음), 1(비), 2(비/눈), 3(눈), 5(빗방울), 6(빗방울/눈날림), 7(눈날림)
    // SKY(하늘상태) 코드: 1(맑음), 3(구름많음), 4(흐림)

    if (weather.pty !== '0') {
      switch (weather.pty) {
        case '1':
          return { description: '비', icon: '🌧️' };
        case '2':
          return { description: '비/눈', icon: '🌨️' };
        case '3':
          return { description: '눈', icon: '❄️' };
        case '5':
          return { description: '빗방울', icon: '💧' };
        case '6':
          return { description: '진눈깨비', icon: '🌨️' };
        case '7':
          return { description: '눈날림', icon: '🌬️❄️' };
        default:
          return { description: '알 수 없음', icon: '❓' };
      }
    } else {
      switch (weather.sky) {
        case '1':
          return { description: '맑음', icon: '☀️' };
        case '3':
          return { description: '구름많음', icon: '☁️' };
        case '4':
          return { description: '흐림', icon: '🌥️' };
        default:
          return { description: '알 수 없음', icon: '❓' };
      }
    }
  };

  if (loading) {
    return <div className={styles.weatherWidget}>날씨 정보 로딩 중...</div>;
  }

  if (error) {
    return (
      <div className={`${styles.weatherWidget} ${styles.error}`}>{error}</div>
    );
  }

  if (!weather) {
    return null;
  }

  const { description, icon } = getWeatherInfo();

  return (
    <div className={styles.weatherWidget}>
      <div className={styles.header}>
        <h3>현재 날씨</h3>
        <p>{locationName}</p>
      </div>
      <div className={styles.content}>
        <div className={styles.weatherIcon} style={{ fontSize: '50px' }}>
          {icon}
        </div>
        <div className={styles.temperature}>{weather.temp}°C</div>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
};

export default Weather;
