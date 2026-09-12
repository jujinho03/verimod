import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section className="band" data-tone="dark">
      <div className="frame inset missing">
        <p className="mono faint">404</p>
        <h1 className="title-l">페이지를 찾지 못했습니다</h1>
        <p className="lead">주소가 바뀌었거나 없는 페이지입니다. 검색(Ctrl+K)으로 페이지나 영수증을 찾을 수 있습니다.</p>
        <div className="btn-row">
          <Link to="/" className="btn btn--blue">
            홈으로
          </Link>
          <Link to="/receipts" className="btn btn--outline">
            내 영수증
          </Link>
        </div>
      </div>
    </section>
  )
}
