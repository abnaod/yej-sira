import { createHash, createHmac } from "node:crypto";

import { getEnv } from "../env";

export type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
};

/** Returns a config object only when all required env vars are set. */
export function getS3Config(): S3Config | null {
  const env = getEnv();
  if (
    !env.S3_ENDPOINT ||
    !env.S3_BUCKET ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    return null;
  }
  return {
    endpoint: env.S3_ENDPOINT.replace(/\/$/, ""),
    bucket: env.S3_BUCKET,
    region: env.S3_REGION || "auto",
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: env.CDN_BASE_URL ?? undefined,
  };
}

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function awsDateStamp(d: Date): { dateStamp: string; amzDate: string } {
  const amzDate = d.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  return { dateStamp, amzDate };
}

function signingKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

/**
 * Upload an object to S3 (or an S3-compatible endpoint such as Cloudflare R2)
 * using path-style addressing: `${endpoint}/${bucket}/${key}`.
 * Returns the public URL (via CDN if configured, else endpoint URL).
 */
export async function putObject(
  cfg: S3Config,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const url = new URL(`${cfg.endpoint}/${cfg.bucket}/${key}`);
  const host = url.host;
  const now = new Date();
  const { dateStamp, amzDate } = awsDateStamp(now);
  const payloadHash = sha256Hex(body);
  const service = "s3";

  const headers: Record<string, string> = {
    host,
    "content-type": contentType,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedHeaderNames.map((h) => `${h}:${headers[h]}\n`).join("");
  const signedHeaders = sortedHeaderNames.join(";");

  const canonicalRequest = [
    "PUT",
    url.pathname,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${cfg.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const sig = hmac(
    signingKey(cfg.secretAccessKey, dateStamp, cfg.region, service),
    stringToSign,
  ).toString("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...headers, Authorization: authorization },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 upload failed: ${res.status} ${text.slice(0, 200)}`);
  }

  if (cfg.publicBaseUrl) {
    return `${cfg.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
  return url.toString();
}
