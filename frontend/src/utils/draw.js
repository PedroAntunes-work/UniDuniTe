export function createRevealState(teams, mode) {
  return {
    mode,
    total: mode === "one" ? teams.length : teams.length > 0 ? 1 : 0,
    revealed: 0,
    complete: teams.length === 0,
  };
}

export function advanceReveal(state) {
  const revealed = Math.min(state.total, state.revealed + 1);
  return { ...state, revealed, complete: revealed >= state.total };
}

export function visibleTeams(teams, state) {
  if (state.mode === "all") return state.revealed > 0 ? teams : [];
  return teams.slice(0, state.revealed);
}

export function formatWhatsAppResult(teams) {
  return [
    "> Sorteio de grupos",
    "",
    ...teams.map((members, index) => `*Grupo ${index + 1}*: ${members.map((member) => member.name).join(", ")}`),
  ].join("\n");
}
