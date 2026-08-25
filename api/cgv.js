export default async function handler(req, res) {
  // CORS 헤더 설정 (블로그 도메인 호출 허용)
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

  const CGV_ORIGIN_URL = `http://movielog.cgv.co.kr/event/spmtlInfoList?eventNo=${eventNo}&spmtlNo=${spmtlNo}`;

  try {
    const response = await fetch(CGV_ORIGIN_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "http://movielog.cgv.co.kr/"
      }
    });

    if (!response.ok) throw new Error("CGV 응답 오류");

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "CGV 데이터 수신 실패", message: error.message });
  }
}
