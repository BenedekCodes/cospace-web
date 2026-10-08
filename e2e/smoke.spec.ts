import { expect, test } from "@playwright/test";

test("home page shows the booking search box", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("searchbox", { name: "Search bookings" })).toBeVisible();
});
