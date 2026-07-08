import api from "./api";

export const accountAPI = {

  getAll: () =>
    api.get("/accounts"),

  create: (data) =>
    api.post(
      "/accounts",
      data
    ),

  getStatement: (
    accountId
  ) =>
    api.get(
      `/ledger/statement/${accountId}`
    ),

   getStatementPage(accountId, params = {}) {
  return api.get(
    `/statements/${accountId}`,
    {
      params,
    }
  );
},downloadStatementPDF: (
  accountId,
  params
) =>
  api.get(
    `/statements/${accountId}/pdf`,
    {
      params,
      responseType: "blob",
    }
  ),
  manualTransaction: (
    data
  ) =>
    api.post(
      "/ledger/manual",
      data
    ),

  transfer: (data) =>
    api.post(
      "/ledger/transfer",
      data
    ),
    delete: (id) =>
 api.delete(
   `/accounts/${id}`
 ),
};