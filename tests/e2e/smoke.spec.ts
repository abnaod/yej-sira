import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home renders at /en", async ({ page }) => {
    const resp = await page.goto("/en");
    expect(resp, "navigation response").not.toBeNull();
    expect(resp!.status(), "home status").toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });

  test("robots.txt served by API", async ({ request }) => {
    const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3001";
    const res = await request.get(`${apiUrl}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-agent/i);
  });

  test("health endpoint responds", async ({ request }) => {
    const apiUrl = process.env.E2E_API_URL ?? "http://localhost:3001";
    const res = await request.get(`${apiUrl}/health`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });
});
