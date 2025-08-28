import api from "./client";

export const getActivity = async (params) => {
  const { data } = await api.get("/activities", { params });
  return data;
};

export const exportActivity = async (params) => {
  const resp = await api.get("/activities/export.csv", {
    params,
    responseType: "blob",
  });
  const url = URL.createObjectURL(resp.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "activity_export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};