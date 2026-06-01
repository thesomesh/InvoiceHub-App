import React, { useEffect, useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { expenseAPI } from "../services/expenseAPI";

const paymentModes = [
  "Cash",
  "UPI",
  "Bank Transfer",
  "Card",
];

const defaultCategories = ["General"];

const formatCurrency = (value) =>
  `₹${Number(value || 0).toFixed(2)}`;

const ExpensePage = () => {
  const [expenses, setExpenses] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const expensesPerPage = 10;
  const [filters, setFilters] = useState({
    category: "",
    paymentMode: "",
    fromDate: "",
    toDate: "",
  });

  const [form, setForm] = useState({
    title: "",
    category: "General",
    customCategory: "",
    paymentMode: "",
    amount: "",
    date: "",
    notes: "",
  });

  const categoryOptions = useMemo(() => {
    const dbCategories = expenses.map(
      (e) => e.category
    );

    return [
      ...new Set([
        ...defaultCategories,
        ...dbCategories,
      ]),
    ];
  }, [expenses]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await expenseAPI.getAll();
      setExpenses(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetFilters = () => {
    setFilters({
      category: "",
      paymentMode: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      category:
        form.category === "custom"
          ? form.customCategory
          : form.category,
    };

    await expenseAPI.create(payload);

    fetchExpenses();

    setForm({
      title: "",
      category: "General",
      customCategory: "",
      paymentMode: "",
      amount: "",
      date: "",
      notes: "",
    });
  };

  const handleDelete = async (id) => {
    await expenseAPI.delete(id);
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter(
    (expense) =>
      (!filters.category ||
        expense.category ===
          filters.category) &&
      (!filters.paymentMode ||
        expense.paymentMode ===
          filters.paymentMode) &&
      (!filters.fromDate ||
        new Date(expense.date) >=
          new Date(filters.fromDate)) &&
      (!filters.toDate ||
        new Date(expense.date) <=
          new Date(filters.toDate))
  );
const indexOfLastExpense =
  currentPage * expensesPerPage;

const indexOfFirstExpense =
  indexOfLastExpense - expensesPerPage;

const currentExpenses =
  filteredExpenses.slice(
    indexOfFirstExpense,
    indexOfLastExpense
  );

const totalPages =
  Math.ceil(
    filteredExpenses.length /
    expensesPerPage
  );
  const totalExpenses =
    filteredExpenses.reduce(
      (sum, e) =>
        sum + Number(e.amount),
      0
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ADD EXPENSE */}

      <div className="card p-6 mb-8 hover:shadow-[0_20px_60px_rgba(79,70,229,0.25)] hover:-translate-y-1 transition-all duration-300">
        <h2 className="text-2xl font-bold mb-6">
          Add New Expense
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div>
            <label className="label">
              Expense Title
            </label>
            <input
              type="text"
              name="title"
              className="input"
              placeholder="Enter expense title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">
              Expense Category
            </label>
            <select
              name="category"
              className="input"
              value={form.category}
              onChange={handleChange}
            >
              {categoryOptions.map(
                (cat) => (
                  <option
                    key={cat}
                    value={cat}
                  >
                    {cat}
                  </option>
                )
              )}

              <option value="custom">
                Custom
              </option>
            </select>

            {form.category ===
              "custom" && (
              <input
                type="text"
                name="customCategory"
                className="input mt-2"
                placeholder="Enter custom category"
                value={
                  form.customCategory
                }
                onChange={
                  handleChange
                }
              />
            )}
          </div>

          <div>
            <label className="label">
              Payment Mode
            </label>
            <select
              name="paymentMode"
              className="input"
              value={
                form.paymentMode
              }
              onChange={
                handleChange
              }
            >
              <option>
                Select Payment Mode
              </option>

              {paymentModes.map(
                (mode) => (
                  <option
                    key={mode}
                    value={mode}
                  >
                    {mode}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="label">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              className="input"
                required
              placeholder="Enter amount"
              value={form.amount}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label">
              Expense Date
            </label>
            <input
              type="date"
              name="date"
                required
              className="input"
              value={form.date}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label">
              Notes
            </label>
            <input
              type="text"
              name="notes"
              className="input"
              placeholder="Enter notes"
              value={form.notes}
              onChange={handleChange}
            />
          </div>

          <div className="lg:col-span-3 flex justify-center pt-4">
            <button
              type="submit"
              className="btn-primary"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>

      {/* FILTER */}

      <div className="card p-5 mb-6 hover:shadow-[0_20px_60px_rgba(79,70,229,0.25)] hover:-translate-y-1 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">
              Filter Category
            </label>

            <select
              className="input"
              value={
                filters.category
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  category:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Categories
              </option>

              {categoryOptions.map(
                (cat) => (
                  <option
                    key={cat}
                    value={cat}
                  >
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="label">
              Payment Mode
            </label>

            <select
              className="input"
              value={
                filters.paymentMode
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  paymentMode:
                    e.target.value,
                })
              }
            >
              <option value="">
                All Payment Modes
              </option>

              {paymentModes.map(
                (mode) => (
                  <option
                    key={mode}
                    value={mode}
                  >
                    {mode}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="label">
              From Date
            </label>

            <input
              type="date"
              className="input"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  fromDate:
                    e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="label">
              To Date
            </label>

            <input
              type="date"
              className="input"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  toDate:
                    e.target.value,
                })
              }
            />
          </div>

          
           <div className="flex items-end gap-2">
  <button
    onClick={() => setCurrentPage(1)}
    className="btn-primary w-full"
  >
    Apply Filters
  </button>

            <button
         onClick={() => {
  resetFilters();
  setCurrentPage(1);
}}
              className="btn-ghost"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}

     <div className="card overflow-hidden hover:shadow-[0_20px_60px_rgba(79,70,229,0.25)] transition-all duration-300">
        <div className="overflow-x-auto pb-2">
          <table className="min-w-full w-full">
            <thead>
              <tr>
                
                <th className="px-5 py-4 text-left">
                  Expense Title
                </th>
                <th className="px-5 py-4 text-left">
                  Category
                </th>
                <th className="px-5 py-4 text-left">
                  Payment Mode
                </th>
                <th className="px-5 py-4 text-left">
                  Amount
                </th>
                <th className="px-5 py-4 text-left">
                  Expense Date
                </th>
                <th className="px-5 py-4 text-left">
                  Notes
                </th>
                <th className="px-5 py-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
           {currentExpenses.map(
                (
                  expense,
                  index
                ) => (
                 <tr
  key={expense._id}
  className="border-b border-indigo-900/20 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer"
>
             
                    <td className="px-5 py-4">
                      {
                        expense.title
                      }
                    </td>

                    <td className="px-5 py-4">
                      {
                        expense.category
                      }
                    </td>

                    <td className="px-5 py-4">
                      {
                        expense.paymentMode
                      }
                    </td>

                    <td className="px-5 py-4">
                      {formatCurrency(
                        expense.amount
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {new Date(
                        expense.date
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      {
                        expense.notes
                      }
                    </td>

                   <td className="px-5 py-4 text-center">
                      <button
                        onClick={() =>
                          handleDelete(
                            expense._id
                          )
                        }
                      className="w-8 h-8 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 flex items-center justify-center transition-all duration-200 mx-auto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>

            {filters.fromDate &&
              filters.toDate && (
                <tfoot>
                  <tr className="border-t font-bold text-lg">
                    <td
                      colSpan="4"
                      className="px-5 py-4"
                    >
                      Total
                      Expenses
                    </td>

                    <td className="px-5 py-4">
                      {formatCurrency(
                        totalExpenses
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
          </table>
          <div className="flex justify-center items-center gap-4 py-6 border-t">

  <button
    disabled={currentPage === 1}
    onClick={() =>
      setCurrentPage(currentPage - 1)
    }
    className="px-4 py-2 rounded-xl border disabled:opacity-40"
  >
    Prev
  </button>

  <span className="font-medium text-gray-500 dark:text-gray-300">
    Page {currentPage} of {totalPages}
  </span>

  <button
    disabled={currentPage === totalPages}
    onClick={() =>
      setCurrentPage(currentPage + 1)
    }
    className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-40"
  >
    Next
  </button>

</div>
        </div>
      </div>
    </div>
  );
};

export default ExpensePage;