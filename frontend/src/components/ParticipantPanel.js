import { useState } from "react";
import ImportParticipants from "./ImportParticipants";

export default function ParticipantPanel({ participants, loading, busy, onCreate, onImport, onUpdate, onDelete }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (await onCreate(name)) setName("");
  }

  function startEditing(participant) {
    setEditingId(participant.id);
    setEditingName(participant.name);
  }

  async function saveEdit(event) {
    event.preventDefault();
    if (await onUpdate(editingId, editingName)) setEditingId(null);
  }

  return (
    <section className="panel participants-panel" aria-labelledby="participants-title">
      <div className="panel-heading"><div><p className="section-label">A TURMA</p><h2 id="participants-title">Participantes</h2></div><span className="count-badge">{participants.length} {participants.length === 1 ? "pessoa" : "pessoas"}</span></div>
      <form className="participant-form" onSubmit={submit}>
        <label className="visually-hidden" htmlFor="participant-name">Nome do participante</label>
        <input id="participant-name" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do participante" disabled={busy} required />
        <button className="button button-primary compact" disabled={busy}>Adicionar</button>
      </form>
      <ImportParticipants participants={participants} busy={busy} onImport={onImport} />
      {loading ? <p className="list-state">Carregando participantes…</p> : participants.length === 0 ? <p className="list-state">Nenhum participante cadastrado.</p> : (
        <ol className="participant-list">
          {participants.map((participant) => (
            <li key={participant.id}>
              {editingId === participant.id ? (
                <form className="edit-form" onSubmit={saveEdit}>
                  <input aria-label={`Editar ${participant.name}`} maxLength="100" value={editingName} onChange={(event) => setEditingName(event.target.value)} autoFocus disabled={busy} required />
                  <button className="icon-action save" disabled={busy}>Salvar</button>
                  <button type="button" className="icon-action" onClick={() => setEditingId(null)} disabled={busy}>Cancelar</button>
                </form>
              ) : (
                <div className="participant-row"><span>{participant.name}</span><span className="row-actions"><button type="button" className="icon-action" onClick={() => startEditing(participant)} disabled={busy}>Editar</button><button type="button" className="icon-action danger" onClick={() => onDelete(participant)} disabled={busy}>Excluir</button></span></div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
