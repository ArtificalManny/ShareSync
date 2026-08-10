import client from './client';


// pilot-feedback-api-v1

export async function submitFeedback(payload) {
  const response =
    await client.post('/feedback', payload);

  return (
    response?.data?.data ||
    response?.data ||
    null
  );
}

export default submitFeedback;
