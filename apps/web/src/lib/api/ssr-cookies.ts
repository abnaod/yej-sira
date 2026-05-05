import { getRequestHeaders } from "@tanstack/react-start/server";

export async function getServerRequestCookie(): Promise<string | null> {
  try {
    const cookie = getRequestHeaders().get("cookie");
    return cookie;
  } catch {
    return null;
  }
}

export async function getServerRequestHost(): Promise<string | null> {
  try {
    const headers = getRequestHeaders();
    return headers.get("x-forwarded-host") ?? headers.get("host");
  } catch {
    return null;
  }
}

export async function getServerRequestShopParam(): Promise<string | null> {
  try {
    const { getRequestUrl } = await import("@tanstack/react-start/server");
    return getRequestUrl({ xForwardedHost: true }).searchParams.get("shop");
  } catch {
    return null;
  }
}

export async function setServerResponseStatus(status: number): Promise<void> {
  try {
    const { setResponseStatus } = await import("@tanstack/react-start/server");
    setResponseStatus(status);
  } catch {
    /* Browser render: no response status to set. */
  }
}
