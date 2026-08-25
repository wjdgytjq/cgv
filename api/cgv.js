import crypto from "crypto";

export default async function handler(req, res) {
  // 1. CORS 설정 (블로그에서 호출 허용)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 2. 파라미터 확인
  const { eventNo, spmtlNo } = req.query;
  if (!eventNo || !spmtlNo) {
    return res.status(400).json({ error: "eventNo와 spmtlNo가 필요합니다." });
  }

  // 3. CGV API 설정 및 HMAC SHA256 서명 생성
  const baseUrl = "https://event.cgv.co.kr";
  const path = "/evt/saprm/saprm/searchSaprmEvtTgtsiteList";
  const targetUrl = `${baseUrl}${path}?coCd=A420&saprmEvntNo=${eventNo}&spmtlNo=${spmtlNo}`;

  const secret = "ydqXY0ocnFLmJGHr_zNzFcpjwAsXq_8JcBNURAkRscg";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${timestamp}|${path}|`;

  const signatureBase64 = crypto
    .createHmac("sha256", secret)
    .update(message)
    .digest("base64");

  // 4. CGV 서버로 서울 리전 IP를 통해 요청
  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-TIMESTAMP": timestamp,
        "X-SIGNATURE": signatureBase64,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`CGV 응답 코드 오류: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "서버 에러 발생", message: error.message });
  }
}
