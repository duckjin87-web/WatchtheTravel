/**
 * 네이버 지역검색 프록시 (Vercel Serverless Function)
 * - 클라이언트에 Client Secret이 노출되지 않도록 서버에서만 호출한다.
 * - 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 * - 제약: display 최대 5건, 반경 검색 없음(키워드 검색) -> "성산 맛집"처럼 지역어를 붙여 검색하고
 *         반환된 좌표로 클라이언트에서 거리 필터링한다. 평점은 제공되지 않는다.
 * 호출: GET /api/naver-local?q=성산일출봉 맛집
 */
module.exports = async (req, res) => {
  const q = String((req.query && req.query.q) || '').trim();
  if (!q) return res.status(400).json({ error: 'q is required' });
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return res.status(500).json({ error: 'NAVER_* env is not set' });
  }
  try {
    const r = await fetch(
      'https://openapi.naver.com/v1/search/local.json?display=5&sort=comment&query=' + encodeURIComponent(q),
      { headers: {
          'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET } }
    );
    if (!r.ok) return res.status(r.status).json({ error: 'naver api error', status: r.status });
    const data = await r.json();
    const items = (data.items || []).map((it) => ({
      name: String(it.title || '').replace(/<[^>]+>/g, ''),
      category: it.category || '',
      address: it.roadAddress || it.address || '',
      // mapx/mapy: WGS84 경위도 x 1e7 (경도/위도)
      lng: Number(it.mapx) / 1e7,
      lat: Number(it.mapy) / 1e7,
      link: it.link || '',
      src: '네이버'
    }));
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed' });
  }
};
