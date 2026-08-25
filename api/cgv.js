export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { eventNo, spmtlNo } = req.query;
  if (!eventNo || !spmtlNo) {
    return res.status(400).json({ error: "파라미터 누락" });
  }

  // 1. https 프로토콜 적용
  const CGV_ORIGIN_URL = `https://movielog.cgv.co.kr/event/spmtlInfoList?eventNo=${eventNo}&spmtlNo=${spmtlNo}`;

  try {
    // 2. 모바일 브라우저 헤더 보강
    const response = await fetch(CGV_ORIGIN_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://movielog.cgv.co.kr/",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9"
      }
    });

    const status = response.status;
    const text = await response.text();

    // 3. 응답이 JSON인지 HTML 에러 페이지인지 구분하여 처리
    try {
      const data = JSON.parse(text);
      return res.status(status).json(data);
    } catch (parseError) {
      return res.status(status).json({
        error: "CGV 비정상 응답 (JSON 파싱 실패)",
        httpStatus: status,
        preview: text.substring(0, 300)
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "CGV 서버 통신 실패", message: error.message });
  }
}
