// enterprise-sales-inquiry-frontend-v1
import api from './client';

export async function submitEnterpriseInquiry(payload) {
  const response = await api.post(
    '/sales/enterprise-inquiry',
    payload,
  );

  return response.data?.data || response.data;
}

export default {
  submitEnterpriseInquiry,
};
