/**
 * 카카오모빌리티 자동차 길찾기 프록시 (Vercel Serverless Function)
 * - REST API 키가 클라이언트에 노출되지 않도록 서버에서만 호출한다.
 * - 환경변수: KAKAO_REST_KEY (카카오 개발자 콘솔 > 앱 키 > REST API 키)
 * 호출: GET /api/kakao-directions?origin=126.4929,33.507&destination=126.6697,33.5434   (경도,위도)
 * 응답: { sec: 소요시간(초), m: 거리(m), path: [[경도,위도], ...] }  도로 좌표는 최대 약 300개로 줄인다.
 */
const LL = /^(-?\d{1,3}(\.\d+)?),(-?\d{1,2}(\.\d+)?)$/;
const inKorea = (s) => { const m = LL.exec(s); return m && +m[1] > 124 && +m[1] < 132 && +m[3] > 33 && +m[3] < 39; };

module.exports = async (req, res) => {
  const o = String((req.query && req.query.origin) || ''), d = String((req.query && req.query.destination) || '');
  if (!inKorea(o) || !inKorea(d)) return res.status(400).json({ error: 'origin, destination = 경도,위도 (국내 좌표)' });
  if (!process.env.KAKAO_REST_KEY) return res.status(500).json({ error: 'KAKAO_REST_KEY env is not set' });
  try {
    const r = await fetch(
      'https://apis-navi.kakaomobility.com/v1/directions?priority=RECOMMEND&origin=' + o + '&destination=' + d,
      { headers: { Authorization: 'KakaoAK ' + process.env.KAKAO_REST_KEY } }
    );
    if (!r.ok) return res.status(r.status).json({ error: 'kakao mobility api error', status: r.status });
    const j = await r.json(), rt = j.routes && j.routes[0];
    // result_code 0 이 아니면 경로 없음 (예: 104 출발지와 도착지가 너무 가까움) -> 클라이언트는 직선 추정으로 대신한다
    if (!rt || rt.result_code !== 0) return res.status(404).json({ error: 'no route', code: rt && rt.result_code });
    const v = [];
    rt.sections.forEach((s) => s.roads.forEach((rd) => { for (let i = 0; i < rd.vertexes.length; i += 2) v.push([rd.vertexes[i], rd.vertexes[i + 1]]); }));
    const step = Math.max(1, Math.ceil(v.length / 300));
    const path = v.filter((_, i) => i % step === 0 || i === v.length - 1);
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ sec: rt.summary.duration, m: rt.summary.distance, path });
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed' });
  }
};
