import { useState } from "react";

export default function TeamsPanel({ teams, allTeams, quantity, minimumTeamSize, maximumTeamSize, reveal, revealMode, spinning, max, loading, busy, onMinimumTeamSizeChange, onMaximumTeamSizeChange, onRevealModeChange, onDraw, onReveal, onSkip, onShare, onCopy, onClear, onSaveTeams }) {
  const [editing, setEditing] = useState(false);
  const [draftTeams, setDraftTeams] = useState([]);
  const [editError, setEditError] = useState("");

  function startEditing() {
    setDraftTeams(allTeams.map((group) => [...group]));
    setEditError("");
    setEditing(true);
  }

  function moveParticipant(participantId, fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    setDraftTeams((current) => {
      const next = current.map((group) => [...group]);
      const source = next[fromIndex];
      const memberIndex = source.findIndex((member) => member.id === participantId);
      if (memberIndex === -1) return current;
      const [member] = source.splice(memberIndex, 1);
      next[toIndex].push(member);
      return next;
    });
  }

  function saveEditing() {
    const invalid = draftTeams.some((group) => group.length < Number(minimumTeamSize) || group.length > Number(maximumTeamSize));
    if (invalid) {
      setEditError(`Cada grupo deve ter entre ${minimumTeamSize} e ${maximumTeamSize} pessoas.`);
      return;
    }
    onSaveTeams(draftTeams);
    setEditing(false);
  }

  const displayedTeams = editing ? draftTeams : teams;

  return (
    <section className="panel teams-panel" aria-labelledby="teams-title">
      
      <div className="panel-heading">
        <div>
          <p className="section-label">RESULTADO</p><h2 id="teams-title">Grupos sorteados</h2>
        </div>
        
        <span className="count-badge">{quantity} {quantity === 1 ? "grupo" : "grupos"}</span>
      </div>

      <div className="group-controls stacked">
        <label htmlFor="minimum-team-size">Mínimo de pessoas por grupo</label>
        <input id="minimum-team-size" type="number" min="1" max={Math.max(max, 1)} value={minimumTeamSize} onChange={(event) => onMinimumTeamSizeChange(event.target.value)} />
      </div>

      <div className="group-controls stacked">
        <label htmlFor="maximum-team-size">Máximo de pessoas por grupo</label>
        <input id="maximum-team-size" type="number" min="1" max={Math.max(max, 1)} value={maximumTeamSize} onChange={(event) => onMaximumTeamSizeChange(event.target.value)} />
      </div>

      <div className="group-controls readonly">
        <span>Quantidade de grupos</span>
        <strong>{quantity}</strong>
      </div>

      <div className="reveal-controls">
        <label htmlFor="reveal-mode">Revelar</label>
        <select id="reveal-mode" value={revealMode} onChange={(event) => onRevealModeChange(event.target.value)} disabled={allTeams.length === 0 || spinning}>
          <option value="all">Todos de uma vez</option>
          <option value="one">Um grupo por vez</option>
        </select>
        {revealMode === "one" && allTeams.length > 0 && <span>{Math.min(reveal.revealed, reveal.total)} de {reveal.total}</span>}
      </div>

      <div className="draw-actions">
        <button className="button button-primary" type="button" onClick={onDraw} disabled={loading || busy || max === 0}>
          <span aria-hidden="true">🎲</span>Sortear  </button>
        <button className="button button-secondary" type="button" onClick={onClear} disabled={allTeams.length === 0}>Limpar</button>
      </div>

      {allTeams.length > 0 && !reveal.complete && <div className="reveal-actions">
        <button className="button button-primary compact" type="button" onClick={onReveal} disabled={spinning}>{revealMode === "one" ? "Próximo" : "Revelar resultado"}
        </button>
        <button className="button button-secondary compact" type="button" onClick={onSkip} disabled={spinning}>Pular animação</button>
      </div>}

      {allTeams.length > 0 && reveal.complete && <div className="share-actions">
        <button type="button" className="button button-secondary compact" onClick={onShare}>Compartilhar no WhatsApp</button>
        <button type="button" className="button button-secondary compact" onClick={onCopy}>Copiar resultado</button>
        <button type="button" className="button button-secondary compact" onClick={startEditing} disabled={editing}>Editar grupos</button>
      </div>}

      {editing && <div className="edit-group-actions">
        <span>Use os seletores para mover participantes.</span>
        <button type="button" className="button button-primary compact" onClick={saveEditing}>Salvar grupos</button>
        <button type="button" className="button button-secondary compact" onClick={() => setEditing(false)}>Cancelar</button>
        {editError && <p className="edit-error" role="alert">{editError}</p>}
      </div>}

      <div className={`teams-list ${spinning ? "is-spinning" : ""}`} aria-live="polite" aria-atomic="true">
        {displayedTeams.length === 0 ? <p className="empty-state">Os grupos aparecerão aqui quando você fizer o sorteio.</p> : displayedTeams.map((members, index) => (
          
          <article className="team-card" key={index}><span className="team-name">Grupo {String(index + 1).padStart(2, "0")}</span>

            <div className="team-members">{members.map((member) => <span className="team-member" key={member.id}>{member.name}{editing && <select aria-label={`Mover ${member.name}`} value={index} onChange={(event) => moveParticipant(member.id, index, Number(event.target.value))}>
              <option value={index}>Grupo atual</option>{allTeams.map((_group, targetIndex) => targetIndex !== index && <option key={targetIndex} value={targetIndex}>Grupo {targetIndex + 1}</option>)}</select>}</span>)}
            </div>

          </article>
        ))}
      </div>
    </section>
  );
}
