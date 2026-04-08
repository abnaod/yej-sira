import { getRequestHeaders } from "@tanstack/react-start/server";

export async function getServerRequestCookie(): Promise<string | null> {
  try {
    const cookie = getRequestHeaders().get("cookie");
    return cookie;
  } catch {
    return null;
  }
}
