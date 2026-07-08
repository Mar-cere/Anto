import { api, ENDPOINTS } from '../config/api';

export async function fetchSessionCommitments({ status = 'active', limit = 8 } = {}) {
  const res = await api.get(ENDPOINTS.SESSION_COMMITMENTS, {
    status,
    limit: String(limit),
  });
  const data = res?.data ?? res;
  return Array.isArray(data?.commitments) ? data.commitments : [];
}

export async function createSessionCommitment(payload) {
  const res = await api.post(ENDPOINTS.SESSION_COMMITMENTS, payload);
  const data = res?.data ?? res;
  return data?.commitment ?? null;
}

export async function updateSessionCommitment(id, patch) {
  const res = await api.patch(ENDPOINTS.SESSION_COMMITMENT_BY_ID(id), patch);
  const data = res?.data ?? res;
  return data?.commitment ?? null;
}

export async function renegotiateSessionCommitment(id, { label, followUpHours } = {}) {
  return updateSessionCommitment(id, { renegotiate: true, label, followUpHours });
}
