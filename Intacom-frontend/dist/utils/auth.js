export const getUserToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('userToken='))?.split('=')[1] || null;
};
export const clearUserToken = () => {
    document.cookie = 'userToken=; Max-Age=0; path=/';
};
