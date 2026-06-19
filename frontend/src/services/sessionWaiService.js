import apiClient from '../config/api';

function unwrapSessionWaiResponse(response) {
  const body = response?.data ?? response;
  return body?.data ?? body;
}

export async function submitSessionWai(conversationId, scores) {
  const cid = String(conversationId || '').trim();
  if (!/^[\da-f]{24}$/i.test(cid)) {
    throw new Error('Invalid conversation id');
  }
  const response = await apiClient.post(
    `/api/chat/conversations/${cid}/session-wai/submit`,
    { scores },
  );
  return unwrapSessionWaiResponse(response);
}

export async function skipSessionWai(conversationId) {
  const cid = String(conversationId || '').trim();
  if (!/^[\da-f]{24}$/i.test(cid)) {
    throw new Error('Invalid conversation id');
  }
  const response = await apiClient.post(`/api/chat/conversations/${cid}/session-wai/skip`);
  return unwrapSessionWaiResponse(response);
}
