import { useMemo, useState } from "react";
import { createImportPreview, normalizeImportedNames, parseParticipantFile } from "../utils/participants";

const REASONS = {
  ALREADY_REGISTERED: "já cadastrado",
  DUPLICATE_IN_IMPORT: "duplicado na lista",
  EMPTY_NAME: "nome vazio",
  NAME_TOO_LONG: "mais de 100 caracteres",
};

export default function ImportParticipants({ participants, busy, onImport }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const names = useMemo(() => normalizeImportedNames(text), [text]);
  const preview = useMemo(() => createImportPreview(names, participants.map(({ name }) => name)), [names, participants]);

  async function loadFile(event) {
    const file = event.target.files[0];
    if (file) setText(await parseParticipantFile(file));
  }

  async function confirm() {
    if (await onImport(preview.valid)) {
      setText("");
      setOpen(false);
    }
  }

  if (!open) return <button type="button" className="button button-secondary compact" onClick={() => setOpen(true)}>Importar lista</button>;

  return (
    <div className="import-box">
      <label htmlFor="import-text">Cole os nomes</label>
      <textarea id="import-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Um nome por linha, vírgula ou ponto e vírgula" disabled={busy} />
      <label className="file-action">Selecionar .txt ou .csv<input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={loadFile} disabled={busy} /></label>
      <div className="import-preview"><strong>{preview.valid.length} para adicionar</strong><span>{preview.rejected.length} ignorados</span></div>
      {preview.rejected.length > 0 && <ul className="rejected-list">{preview.rejected.map((item, index) => <li key={`${item.name}-${index}`}>{item.name || "(vazio)"}: {REASONS[item.code]}</li>)}</ul>}
      <div className="import-actions"><button type="button" className="button button-primary compact" onClick={confirm} disabled={busy || preview.valid.length === 0}>Confirmar importação</button><button type="button" className="button button-secondary compact" onClick={() => setOpen(false)} disabled={busy}>Cancelar</button></div>
    </div>
  );
}
