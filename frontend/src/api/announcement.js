import api from './client';

export const getAnnouncements = (firmId, params) => api.get(`/announcements/firm/${firmId}`, { params });
export const createAnnouncement = (data) => api.post('/announcements', data, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const likeAnnouncement = (announcementId) => api.post(`/announcements/${announcementId}/like`);
export const commentAnnouncement = (announcementId, text, parentId = null) => {
  const payload = { text };
  if (parentId) payload.parentId = parentId;
  return api.post(`/announcements/${announcementId}/comments`, payload);
};
export const getComments = (announcementId) => api.get(`/announcements/${announcementId}/comments`);
export const deleteAnnouncement = (announcementId) => api.delete(`/announcements/${announcementId}`);
export const updateAnnouncement = (announcementId, data) => api.put(`/announcements/${announcementId}`, data);
