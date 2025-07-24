import React from 'react';
import './Dashboard.scss';

export default function Dashboard() {
  return (
    <div className='dashboard-root'>
      <section className='dash-top'>
        <div className='dash-card notice'>
          <div className='dash-title'>공지사항 &gt;</div>
          <div className='dash-notice-list'>
            <div className='dash-notice-item'>
              <span className='dash-notice-title'>제목</span>
            </div>
            {/* 여기에 실제 공지사항 목록 map으로 출력 */}
          </div>
        </div>
        <div className='dash-card events'>
          <div className='dash-title'>Upcoming events &gt;</div>
          <ul className='dash-event-list'>
            <li>
              <b>6/25 :</b> 쉬는날
            </li>
            <li>Feature 3</li>
            <li>Feature 4</li>
            <li>Feature 5</li>
            <li>Feature 6</li>
          </ul>
        </div>
      </section>

      <section className='dash-bottom'>
        <div className='dash-card news'>
          <div className='dash-title'>NEWS &gt;</div>
          <div className='dash-news-list'>
            <div className='dash-news-item'>
              <a
                href='https://www.economytalk.kr/news/articleView.html?idxno=408664'
                target='_blank'
                rel='noopener noreferrer'
              >
                https://www.economytalk.kr/news/articleView.html?idxno=408664
              </a>
            </div>
            {/* 실제 뉴스 목록 map 출력 */}
          </div>
        </div>
        <div className='dash-card link'>
          <div className='dash-title'>Link &gt;</div>
          <div className='dash-link-list'>
            <div className='dash-link-group'>
              <div className='dash-link-label'>펫프렌즈</div>
              <a
                href='https://m.pet-friends.co.kr/main/tab/2'
                target='_blank'
                rel='noopener noreferrer'
              >
                https://m.pet-friends.co.kr/main/tab/2
              </a>
            </div>
            <div className='dash-link-group'>
              <div className='dash-link-label'>펫도매</div>
              <a
                href='https://www.petdome.co.kr/'
                target='_blank'
                rel='noopener noreferrer'
              >
                https://www.petdome.co.kr/
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
