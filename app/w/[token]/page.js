import Widget from '../../Widget';

// 노션 앱 임베드용 페이지: URL의 토큰으로 쿠키 없이 위젯을 띄움
export default function TokenWidget({ params }) {
  const { token } = params;
  return <Widget widgetToken={token} />;
}
