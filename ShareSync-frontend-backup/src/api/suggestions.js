
// src/api/suggestions.js

// ═══════════════════════════════════════════════════════════════════════════════

// API Client: Suggestions & Spectator Economy

// ✅ Includes comment endpoints

// ═══════════════════════════════════════════════════════════════════════════════

 

import api from './client';

 

function unwrap(response) {

  const payload = response?.data;

  if (!payload) return payload;

  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;

  return payload;

}

 

function normalizeError(err, fallback = "Request failed") {

  const msg =

    err?.response?.data?.message ||

    err?.response?.data?.error ||

    err?.message ||

    fallback;

  const enriched = new Error(msg);

  enriched.status = err?.response?.status;

  return enriched;

}

 

function normalizeId(item) {

  if (!item) return item;

  return { ...item, id: item._id || item.id };

}

 

export const getSuggestions = async (projectId) => {

  try {

    const response = await api.get(`/projects/${projectId}/suggestions`);

    const data = unwrap(response);

    return Array.isArray(data) ? data.map(normalizeId) : [];

  } catch (err) {

    throw normalizeError(err, "Failed to load suggestions");

  }

};

 

export const createSuggestion = async (projectId, suggestionData) => {

  try {

    const response = await api.post(`/projects/${projectId}/suggestions`, suggestionData);

    return normalizeId(unwrap(response));

  } catch (err) {

    throw normalizeError(err, "Failed to submit suggestion");

  }

};

 

export const updateSuggestion = async (projectId, suggestionId, updates) => {

  try {

    const response = await api.patch(`/projects/${projectId}/suggestions/${suggestionId}`, updates);

    return normalizeId(unwrap(response));

  } catch (err) {

    throw normalizeError(err, "Failed to update suggestion");

  }

};

 

export const deleteSuggestion = async (projectId, suggestionId) => {

  try {

    const response = await api.delete(`/projects/${projectId}/suggestions/${suggestionId}`);

    return unwrap(response);

  } catch (err) {

    throw normalizeError(err, "Failed to delete suggestion");

  }

};

 

// ═══════════════════════════════════════════════════════════════════════════════

// ✅ NEW: Comment endpoints

// ═══════════════════════════════════════════════════════════════════════════════

 

export const addSuggestionComment = async (projectId, suggestionId, content) => {

  try {

    const response = await api.post(

      `/projects/${projectId}/suggestions/${suggestionId}/comments`,

      { content }

    );

    return unwrap(response);

  } catch (err) {

    throw normalizeError(err, "Failed to add comment");

  }

};

 

export const getSuggestionComments = async (projectId, suggestionId) => {

  try {

    const response = await api.get(

      `/projects/${projectId}/suggestions/${suggestionId}/comments`

    );

    const data = unwrap(response);

    return Array.isArray(data) ? data : [];

  } catch (err) {

    throw normalizeError(err, "Failed to load comments");

  }

};


// ✅ Toggle upvote on a suggestion
export const upvoteSuggestion = async (projectId, suggestionId) => {
  try {
    const response = await api.post(
      `/projects/${projectId}/suggestions/${suggestionId}/upvote`
    );
    return unwrap(response);
  } catch (err) {
    throw normalizeError(err, "Failed to vote");
  }
};
