import client from './client';

export const getProjectVault = async (projectId) => {
  const response = await client.get(`/vault/project/${projectId}`);
  return response.data?.data;
};

export const createFolder = async (projectId, name, isPrivate) => {
  const response = await client.post('/vault/folders', {
    projectId,
    name,
    accessLevel: isPrivate ? 'private' : 'public'
  });
  return response.data?.data;
};

export const uploadVaultFile = async (projectId, folderId, file) => {
  const formData = new FormData();
  formData.append('projectId', projectId);
  if (folderId) formData.append('folderId', folderId);
  formData.append('file', file);

  const response = await client.post('/vault/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data?.data;
};

export default { getProjectVault, createFolder, uploadVaultFile };
