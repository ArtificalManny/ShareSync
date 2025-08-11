import { logActivity } from '../utils/logActivity';

// after file successfully uploaded:
const payload = {
  type: 'file:upload',
  public: false,
  projectId,
  name: originalFileName,
  meta: { fileId, uploadedBy },
};
await logActivity(payload);
const io = req.app.get('io');
io?.emit('activity', payload);

// after approve/reject:
const payload2 = {
  type: 'file:approve',
  public: false,
  projectId,
  meta: { fileId, status: 'Approved' }, // or 'Rejected'
};
await logActivity(payload2);
io?.emit('activity', payload2);
