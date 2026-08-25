import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { test, eventNo, spmtlNo } = req.query;

  // [테스트 1] Vercel 서울 서버의 실제 외부 통신 IP 확인
  if (test === "ip") {
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      return res.status(200).json({
        region: process.env.VERCEL_REGION || "local",
        outboundIp: ipData.ip,
        note: "이 IP로 CGV 서버에 접속을 시도합니다."
      });
    } catch (e) {
      return res.status(500).json({ error: "IP 확인 실패", message: e.message });
    }
  }

  // [테스트 2] CGV 메인 도메인 기본 접속 여부 확인 (홈페이지 Ping)
  if (test === "ping") {
    try {
      const pingRes = await fetch("https://event.cgv.co.kr", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
        }
      });
      return res.status(200).json({
        target: "https://event.cgv.co.kr",
        httpStatus: pingRes.status,
        statusText: pingRes.statusText,
        isBlocked: pingRes.status === 403 || pingRes.status === 401
      });
    } catch (e) {
      return res.status(500).json({ error: "CGV 기본 도메인 접속 불가", message: e.message });
    }
  }

  // [실제 API 요청 처리]
  if (!eventNo || !spmtlNo) {
    return res.status(400).json({ error: "eventNo와 spmtlNo가 필요합니다." });
  }

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

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Host": "event.cgv.co.kr",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Origin": "https://event.cgv.co.kr",
        "Referer": `https://event.cgv.co.kr/events/special/saprm/saprmEvtInfo.aspx?eventNo=${eventNo}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "X-TIMESTAMP": timestamp,
        "X-SIGNATURE": signatureBase64
      }
    });

    const status = response.status;
    const rawText = await response.text();

    // 403 에러가 발생해도 중단하지 않고 CGV가 보낸 응답 원문을 그대로 반환
    return res.status(status).json({
      httpStatus: status,
      headers: Object.fromEntries(response.headers.entries()),
      bodyPreview: rawText.substring(0, 500)
    });

  } catch (error) {
    return res.status(500).json({ error: "네트워크 통신 실패", message: error.message });
  }
}
