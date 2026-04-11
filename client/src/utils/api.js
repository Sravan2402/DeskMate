// src/utils/api.js
const request = async (url, options = {}) => {
  const accessToken = localStorage.getItem("accessToken");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    const refreshRes = await fetch("/api/account/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      localStorage.clear();
      window.location.href = "/login";
      return;
    }

    const { accessToken: newToken } = await refreshRes.json();
    localStorage.setItem("accessToken", newToken);

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
  }
  return res;
};
export default request;
