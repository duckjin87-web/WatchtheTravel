/* 공개 가능한 설정만 둔다. 비밀키(네이버)는 절대 여기 넣지 말 것 -> api/ 서버리스에서 환경변수로 사용 */
window.CONFIG = {
  USE_MOCK: true,          // true: 도식 지도 + 샘플 데이터 / false: 카카오 연동(구현 예정)
  KAKAO_JS_KEY: '',        // 카카오 개발자 콘솔 > JavaScript 키 (도메인 제한 필수)
  API_BASE: ''             // 서버리스 API 주소. 같은 도메인이면 빈 문자열
};
