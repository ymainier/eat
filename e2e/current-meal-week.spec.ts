import { expect, test } from "./fixtures";

test("opening the app shows the current Meal Week", async ({ page, signIn }) => {
  await signIn();
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Sat 3 Oct – Fri 9 Oct" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Meals planned against the Meal Count"),
  ).toHaveText("0 / 14");
});
