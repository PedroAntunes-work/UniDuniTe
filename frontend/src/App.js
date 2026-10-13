import { useCallback, useEffect, useState } from "react";
import "./App.css";
import ParticipantPanel from "./components/ParticipantPanel";
import TeamsPanel from "./components/TeamsPanel";
import ThemeSwitch from "./components/ThemeSwitch";
import { participantsApi } from "./services/participantsApi";
import { advanceReveal, createRevealState, formatWhatsAppResult, visibleTeams } from "./utils/draw";

const DEFAULT_TEAM_SIZE = 2;

function secureRandomIndex(max) {
  const range = 0x1_0000_0000;
  const limit = range - (range % max);
  const value = new Uint32Array(1);
  do window.crypto.getRandomValues(value); while (value[0] >= limit);
  return value[0] % max;
}

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const otherIndex = secureRandomIndex(index + 1);
    [result[index], result[otherIndex]] = [result[otherIndex], result[index]];
  }
  return result;
}

export default function App() {
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [minimumTeamSize, setMinimumTeamSize] = useState(1);
  const [maximumTeamSize, setMaximumTeamSize] = useState(2);
  const [quantity, setQuantity] = useState(1);
  const [revealMode, setRevealMode] = useState("all");
  const [reveal, setReveal] = useState(createRevealState([], "all"));
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const loadParticipants = useCallback(async () => {
    try {
      const data = await participantsApi.list();
      setParticipants(data);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    if (participants.length > 0) {
      const minimum = Number(minimumTeamSize || DEFAULT_TEAM_SIZE);
      const maximum = Number(maximumTeamSize || participants.length);
      const minimumGroups = Math.ceil(participants.length / maximum);
      const maximumGroups = Math.floor(participants.length / minimum);
      setQuantity(minimumGroups <= maximumGroups ? Math.max(1, minimumGroups) : 0);
    }
  }, [participants.length, minimumTeamSize, maximumTeamSize]);

  function resetDraw(message) {
    setTeams([]);
    setReveal(createRevealState([], revealMode));
    setSpinning(false);
    setStatus(message);
  }

  function saveEditedTeams(nextTeams) {
    setTeams(nextTeams);
    setReveal(createRevealState(nextTeams, "all"));
    setReveal((current) => ({ ...current, revealed: current.total, complete: true }));
    setStatus("Grupos atualizados com sucesso.");
  }

  async function mutate(operation, successMessage) {
    setBusy(true);
    try {
      await operation();
      await loadParticipants();
      resetDraw(successMessage);
      return true;
    } catch (error) {
      setStatus(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function createParticipant(name) {
    return mutate(() => participantsApi.create(name), "Participante adicionado com sucesso.");
  }

  async function importParticipants(names) {
    if (names.length === 0) return false;
    setBusy(true);
    try {
      const result = await participantsApi.import(names);
      await loadParticipants();
      resetDraw(`${result.created.length} participantes importados${result.rejected.length ? `; ${result.rejected.length} ignorados.` : "."}`);
      return true;
    } catch (error) {
      const rejected = error.details?.rejected?.length;
      setStatus(rejected ? `${error.message} (${rejected} nomes ignorados.)` : error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function updateParticipant(id, name) {
    return mutate(() => participantsApi.update(id, name), "Participante atualizado com sucesso.");
  }

  async function deleteParticipant(participant) {
    if (!window.confirm(`Excluir ${participant.name}?`)) return;
    await mutate(() => participantsApi.remove(participant.id), "Participante excluído com sucesso.");
  }

  function drawTeams() {
    const groupMinimum = Number(minimumTeamSize);
    const groupMaximum = Number(maximumTeamSize);
    const groupQuantity = Number(quantity);
    if (participants.length === 0) return setStatus("Cadastre ao menos um participante antes do sorteio.");
    if (!Number.isInteger(groupMinimum) || groupMinimum < 1 || groupMinimum > participants.length) return setStatus(`Informe um mínimo de pessoas entre 1 e ${participants.length}.`);
    if (!Number.isInteger(groupMaximum) || groupMaximum < 1 || groupMaximum > participants.length) return setStatus(`Informe um máximo de pessoas entre 1 e ${participants.length}.`);
    if (groupMaximum < groupMinimum) return setStatus("O máximo de pessoas por grupo deve ser maior ou igual ao mínimo.");
    const minimumGroups = Math.ceil(participants.length / groupMaximum);
    const maximumGroups = Math.floor(participants.length / groupMinimum);
    if (minimumGroups > maximumGroups) return setStatus("Não é possível formar grupos respeitando o mínimo e o máximo informados.");
    const calculatedQuantity = Math.max(1, minimumGroups);
    if (groupQuantity !== calculatedQuantity) {
      setQuantity(calculatedQuantity);
      return setStatus(`A quantidade foi ajustada para ${calculatedQuantity} ${calculatedQuantity === 1 ? "grupo" : "grupos"}.`);
    }
    if (!Number.isInteger(groupQuantity) || groupQuantity < minimumGroups || groupQuantity > maximumGroups) return setStatus(`Informe uma quantidade de grupos entre ${minimumGroups} e ${maximumGroups}.`);
    if (!window.crypto?.getRandomValues) return setStatus("O gerador seguro de números aleatórios não está disponível.");
    const nextTeams = Array.from({ length: groupQuantity }, () => []);
    shuffle(participants).forEach((participant, index) => nextTeams[index % groupQuantity].push(participant));
    setTeams(nextTeams);
    setReveal(createRevealState(nextTeams, revealMode));
    setSpinning(false);
    const smallest = Math.floor(participants.length / groupQuantity);
    const largest = Math.ceil(participants.length / groupQuantity);
    setStatus(smallest === largest ? `Sorteio concluído: ${groupQuantity} ${groupQuantity === 1 ? "grupo formado" : "grupos formados"}.` : `Sorteio concluído: grupos com ${smallest} ou ${largest} pessoas.`);
  }

  function revealResult() {
    if (reveal.complete || spinning) return;
    setSpinning(true);
    window.setTimeout(() => {
      setReveal((current) => advanceReveal(current));
      setSpinning(false);
    }, reveal.mode === "one" ? 650 : 1100);
  }

  function skipAnimation() {
    setReveal((current) => ({ ...current, revealed: current.total, complete: true }));
    setSpinning(false);
  }

  function shareWhatsApp() {
    const text = formatWhatsAppResult(teams);
    if (encodeURIComponent(text).length > 6000) {
      setStatus("O resultado é grande para compartilhar pelo WhatsApp. Use Copiar resultado.");
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copyResult() {
    const text = formatWhatsAppResult(teams);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setStatus("Resultado copiado.");
  }

  const shownTeams = visibleTeams(teams, reveal);

  return (
    <>
      <ThemeSwitch />
      <main className="page">
        <header className="page-header"><p className="eyebrow">TREINAMENTO INTERNO</p><h1>UniDuniTê</h1><p className="intro">Uma forma simples e justa de dividir a turma em grupos.</p></header>
        <section className="draw-layout" aria-label="Sorteio de grupos">
          <ParticipantPanel participants={participants} loading={loading} busy={busy} onCreate={createParticipant} onImport={importParticipants} onUpdate={updateParticipant} onDelete={deleteParticipant} />
          <TeamsPanel teams={shownTeams} allTeams={teams} quantity={quantity} minimumTeamSize={minimumTeamSize} maximumTeamSize={maximumTeamSize} reveal={reveal} revealMode={revealMode} spinning={spinning} max={participants.length} loading={loading} busy={busy} onMinimumTeamSizeChange={(value) => { setMinimumTeamSize(value); resetDraw("Quantidade de grupos recalculada. Faça um novo sorteio."); }} onMaximumTeamSizeChange={(value) => { setMaximumTeamSize(value); resetDraw("Quantidade de grupos recalculada. Faça um novo sorteio."); }} onRevealModeChange={(mode) => { setRevealMode(mode); setReveal(createRevealState(teams, mode)); }} onDraw={drawTeams} onReveal={revealResult} onSkip={skipAnimation} onShare={shareWhatsApp} onCopy={copyResult} onClear={() => resetDraw("Resultado limpo. Você já pode fazer um novo sorteio.")} onSaveTeams={saveEditedTeams} />
        </section>
        <p className="status-message" role="status">{status}</p>
      </main>
    </>
  );
}
