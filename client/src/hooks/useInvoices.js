import { useState, useCallback } from "react";
import { invoiceAPI } from "../services/api";

const getInvoiceId = (invoiceOrId) => {
  if (typeof invoiceOrId === "string") return invoiceOrId;
  if (invoiceOrId == null) return "";
  return String(invoiceOrId._id || invoiceOrId.id || "").trim();
};

export const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoiceAPI.getAll(params);
      const normalized = (res.data.invoices || []).map((inv) => ({
        ...inv,
        _id: getInvoiceId(inv),
      }));
      setInvoices(normalized);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteInvoice = useCallback(async (id) => {
    await invoiceAPI.delete(id);
    setInvoices((prev) => prev.filter((inv) => getInvoiceId(inv) !== String(id)));
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    let previousStatus = null;

    setInvoices((prev) =>
      prev.map((inv) => {
        if (getInvoiceId(inv) !== String(id)) return inv;
        previousStatus = inv.status;
        return { ...inv, status };
      })
    );

    try {
      const res = await invoiceAPI.updateStatus(id, status);
      const updatedInvoice = res.data?.invoice;
      setInvoices((prev) =>
        prev.map((inv) => {
          if (getInvoiceId(inv) !== String(id)) return inv;
          return updatedInvoice ? { ...inv, ...updatedInvoice } : { ...inv, status };
        })
      );
      return updatedInvoice;
    } catch (err) {
      if (previousStatus) {
        setInvoices((prev) =>
          prev.map((inv) =>
            getInvoiceId(inv) === String(id) ? { ...inv, status: previousStatus } : inv
          )
        );
      }
      throw err;
    }
  }, []);

  return { invoices, pagination, loading, error, fetchInvoices, deleteInvoice, updateStatus };
};
