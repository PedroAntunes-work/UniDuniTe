import { advanceReveal, createRevealState, formatWhatsAppResult, visibleTeams } from "./draw";

const teams = [[{ name: "Ana" }], [{ name: "Bia" }]];

test("reveals one group at a time without changing the result", () => {
  let state = createRevealState(teams, "one");
  state = advanceReveal(state);
  expect(visibleTeams(teams, state)).toEqual([teams[0]]);
  expect(teams).toHaveLength(2);
});

test("formats a WhatsApp result", () => {
  expect(formatWhatsAppResult(teams)).toContain("Grupo 1: Ana");
  expect(formatWhatsAppResult(teams)).toContain("Grupo 2: Bia");
});
