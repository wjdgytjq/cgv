import crypto from "crypto";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { eventNo, spmtlNo } = req.query;
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
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "Origin": "https://event.cgv.co.kr",
        "Referer": `https://event.cgv.co.kr/events/special/saprm/saprmEvtInfo.aspx?eventNo=${eventNo}`,
        "Sec-Ch-Ua": '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "X-TIMESTAMP": timestamp,
        "X-SIGNATURE": signatureBase64
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
