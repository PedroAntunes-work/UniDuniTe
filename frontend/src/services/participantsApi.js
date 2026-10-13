const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error?.message || "Não foi possível concluir a operação.");
    error.details = data?.error;
    throw error;
  }
  return data;
}

export const participantsApi = {
  list: () => request("/participants"),
  create: (name) => request("/participants", { method: "POST", body: JSON.stringify({ name }) }),
  import: (names) => request("/participants/import", { method: "POST", body: JSON.stringify({ names }) }),
  update: (id, name) => request(`/participants/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  remove: (id) => request(`/participants/${id}`, { method: "DELETE" }),
};
