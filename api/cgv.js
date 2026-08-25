export default async function handler(req, res) {
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

  // CGV 무비로그 엔드포인트는 http로 호출해야 합니다.
  const CGV_ORIGIN_URL = `http://movielog.cgv.co.kr/event/spmtlInfoList?eventNo=${eventNo}&spmtlNo=${spmtlNo}`;

  try {
    const response = await fetch(CGV_ORIGIN_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "http://movielog.cgv.co.kr/",
        "Accept": "application/json, text/plain, */*"
      }
    });

    const status = response.status;
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      return res.status(status).json(data);
    } catch (parseError) {
      return res.status(status).json({
        error: "JSON 파싱 실패",
        httpStatus: status,
        preview: text.substring(0, 300)
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "CGV 서버 통신 실패",
      message: error.message,
      cause: error.cause ? String(error.cause) : null
    });
  }
}
