const { test, expect } = require("@playwright/test");

test("carrega a tela inicial e navega entre áreas principais", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Temporizadores" }),
  ).toBeVisible();
  await expect(page.locator("#stopwatch-display")).toHaveText("00:00:00");

  await page.getByRole("button", { name: /Tarefas/ }).click();
  await expect(page.getByRole("heading", { name: "Tarefas" })).toBeVisible();

  await page.getByRole("button", { name: /Dashboard/ }).click();
  await expect(page.locator("#dash-total")).toBeVisible();
});

test("cria uma tarefa básica", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Tarefas/ }).click();
  await page.getByRole("button", { name: "+ Nova Tarefa" }).click();
  await page.locator("#task-title-input").fill("Revisar matemática");
  await page.getByRole("button", { name: "Salvar" }).click();

  await expect(page.getByText("Revisar matemática")).toBeVisible();
});
