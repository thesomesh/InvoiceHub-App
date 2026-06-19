import React, {
  useEffect,
  useState,
  useMemo,
} from "react";

import { Wallet } from "lucide-react";

import { accountAPI } from "../services/accountAPI";

import {
  Modal,
  Alert,
} from "../components/UI";

const formatCurrency = (
  value
) =>
  `₹${Number(
    value || 0
  ).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

const AccountsPage = () => {
  const [accounts, setAccounts] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  const [
    createModal,
    setCreateModal,
  ] = useState(false);

  const [
    statementModal,
    setStatementModal,
  ] = useState(false);

  const [
    depositModal,
    setDepositModal,
  ] = useState(false);

  const [
    withdrawModal,
    setWithdrawModal,
  ] = useState(false);

  const [
    transferModal,
    setTransferModal,
  ] = useState(false);

  const [
    selectedAccount,
    setSelectedAccount,
  ] = useState(null);

  const [statement, setStatement] =
    useState([]);
const [
  recentTransactions,
  setRecentTransactions
] = useState([]);
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] =
    useState({
      name: "",
      type: "Bank",
      openingBalance: "",
    });
const [depositForm, setDepositForm] = useState({
  accountId: "",
  amount: "",
  particulars: "",
  note: "",
});

const [withdrawForm, setWithdrawForm] = useState({
  accountId: "",
  amount: "",
  particulars: "",
  note: "",
});

const [transferForm, setTransferForm] = useState({
  fromAccountId: "",
  toAccountId: "",
  amount: "",
  note: "",
});
  const fetchAccounts =
    async () => {
      try {
        const res =
          await accountAPI.getAll();

        setAccounts(
          res.data || []
        );
        const tx =
  await accountAPI.getRecentTransactions();

setRecentTransactions(
  tx.data || []
);
      } catch (err) {
        console.log(err);
      }
    };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts =
    useMemo(() => {
      return accounts.filter(
        (acc) =>
          acc.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            ) &&
          (filter === "All" ||
            acc.type === filter)
      );
    }, [
      accounts,
      search,
      filter,
    ]);

  const totalFunds =
    accounts.reduce(
      (sum, a) =>
        sum +
        Number(
          a.currentBalance || 0
        ),
      0
    );

  const bankFunds =
    accounts
      .filter(
        (a) =>
          a.type === "Bank"
      )
      .reduce(
        (sum, a) =>
          sum +
          Number(
            a.currentBalance || 0
          ),
        0
      );

  const cashFunds =
    accounts
      .filter(
        (a) =>
          a.type === "Cash"
      )
      .reduce(
        (sum, a) =>
          sum +
          Number(
            a.currentBalance || 0
          ),
        0
      );

  const openStatement =
    async (account) => {
      try {
        setSelectedAccount(
          account
        );

        const res =
          await accountAPI.getStatement(
            account._id
          );

        setStatement(
          res.data || []
        );

        setStatementModal(
          true
        );
      } catch (err) {
        console.log(err);
      }
    };

  const createAccount =
    async (e) => {
      e.preventDefault();

      try {
        await accountAPI.create({
          ...form,
          openingBalance:
            Number(
              form.openingBalance
            ),
        });

        setCreateModal(false);

        setForm({
          name: "",
          type: "Bank",
          openingBalance: "",
        });

        fetchAccounts();
      } catch (err) {
        setError(
          err.response?.data
            ?.message
        );
      }
    };
const depositMoney = async (e) => {
  e.preventDefault();

  try {

    await accountAPI.manualTransaction({
      accountId: depositForm.accountId,
      amount: Number(depositForm.amount),
      type: "credit",
      particulars: depositForm.particulars,
      note: depositForm.note,
    });

    fetchAccounts();

    setDepositModal(false);

  } catch (err) {
    console.log(err);
  }
};

const withdrawMoney = async (e) => {
  e.preventDefault();
const selectedAccount =
  accounts.find(
    a =>
      a._id ===
      withdrawForm.accountId
  );

if (
  Number(withdrawForm.amount) >
  Number(
    selectedAccount?.currentBalance
  )
) {
  alert(
    `Insufficient balance.
Available: ₹${selectedAccount.currentBalance}`
  );

  return;
}
  try {

    await accountAPI.manualTransaction({
      accountId: withdrawForm.accountId,
      amount: Number(withdrawForm.amount),
      type: "debit",
      particulars: withdrawForm.particulars,
      note: withdrawForm.note,
    });

    fetchAccounts();

    setWithdrawModal(false);

  } catch (err) {
    console.log(err);
  }
};

const transferFunds = async (e) => {
  e.preventDefault();

const fromAccount =
  accounts.find(
    a =>
      a._id ===
      transferForm.fromAccountId
  );

if (
  Number(transferForm.amount) >
  Number(
    fromAccount?.currentBalance
  )
) {
  alert(
    `Insufficient balance.
Available: ₹${fromAccount.currentBalance}`
  );

  return;
}



if (
  transferForm.fromAccountId ===
  transferForm.toAccountId
) {
  alert(
    "From Account and To Account cannot be the same"
  );

  return;
}
  try {

    await accountAPI.transfer({
      fromAccountId:
        transferForm.fromAccountId,

      toAccountId:
        transferForm.toAccountId,

      amount:
        Number(transferForm.amount),

      note:
        transferForm.note,
    });

    fetchAccounts();

    setTransferModal(false);

  } catch (err) {
    console.log(err);
  }
};


const deleteAccount =
async (id) => {

 if(
  !window.confirm(
   "Delete Account?"
  )
 ) return;

 try {

  await accountAPI.delete(id);

  fetchAccounts();

 } catch(err) {

  console.log(err);

 }

};






  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-3xl font-bold">
            Accounts
          </h1>

          <p className="text-gray-500">
            Manage all bank &
            cash accounts
          </p>
        </div>

      <div className="flex gap-2">
 

</div>
      </div>

<div className="card p-6 mb-8">

  <h2 className="text-xl font-bold mb-4">
    Quick Actions
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

    <button className="btn-primary" 
    onClick={() =>
      setCreateModal(true)
    }>
      Add Account
    </button>

   <button
  className="btn-secondary"
  onClick={() =>
    setTransferModal(true)
  }
>
  Transfer Funds
</button>

<button
  className="btn-secondary"
  onClick={() =>
    setDepositModal(true)
  }
>
  Deposit
</button>

<button
  className="btn-secondary"
  onClick={() =>
    setWithdrawModal(true)
  }
>
  Withdraw
</button>

  </div>

</div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

        <div className="card p-4">
          <p>Total Funds</p>

          <h2 className="text-2xl font-bold">
            {formatCurrency(
              totalFunds
            )}
          </h2>
        </div>

        <div className="card p-4">
          <p>Bank Balance</p>

          <h2 className="text-2xl font-bold">
            {formatCurrency(
              bankFunds
            )}
          </h2>
        </div>

        <div className="card p-4">
          <p>Cash Balance</p>

          <h2 className="text-2xl font-bold">
            {formatCurrency(
              cashFunds
            )}
          </h2>
        </div>

        <div className="card p-4">
          <p>Accounts</p>

          <h2 className="text-2xl font-bold">
            {accounts.length}
          </h2>
        </div>

      </div>


  
      {/* ACCOUNT LIST */}

      <div className="grid md:grid-cols-2 gap-6">

        {filteredAccounts.map(
          (account) => (
            <div
              key={
                account._id
              }
              className="card p-6 hover:shadow-[0_20px_60px_rgba(79,70,229,0.25)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300"
            >

              <div className="flex justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    {account.name}
                  </h2>

                  <p>
                    Type :
                    {" "}
                    {
                      account.type
                    }
                  </p>

                </div>

                <Wallet />

              </div>

              <div className="mt-4 space-y-2">

              

                <p className="font-bold">

                  Current :
                  {" "}
                  {formatCurrency(
                    account.currentBalance
                  )}

                </p>

              </div>

              <div className="flex flex-wrap gap-2 mt-5">

                <button
                  className="btn-primary"
                  onClick={() =>
                    openStatement(
                      account
                    )
                  }
                >
                  Statement
                </button>
<button
 className="btn-danger"
 onClick={() =>
  deleteAccount(
   account._id
  )
 }
>
 Delete
</button>


              </div>

            </div>
          )
        )}

      </div>

      {/* CREATE ACCOUNT */}

      <Modal
        open={createModal}
        onClose={() =>
          setCreateModal(
            false
          )
        }
        title="Create Account"
      >

        <form
          onSubmit={
            createAccount
          }
          className="space-y-4"
        >

          <input
            className="input"
            placeholder="Account Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name:
                  e.target
                    .value,
              })
            }
          />

          <select
            className="input"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type:
                  e.target
                    .value,
              })
            }
          >
            <option>
              Bank
            </option>

            <option>
              Cash
            </option>
          </select>

          <input
            className="input"
            type="number"
            placeholder="Opening Balance"
            value={
              form.openingBalance
            }
            onChange={(e) =>
              setForm({
                ...form,
                openingBalance:
                  e.target
                    .value,
              })
            }
          />

          <button
            className="btn-primary w-full"
          >
            Create Account
          </button>

        </form>

      </Modal>

      {/* STATEMENT */}

      <Modal
        open={statementModal}
        onClose={() =>
          setStatementModal(
            false
          )
        }
        title={
          selectedAccount?.name
        }
      >

        <div className="max-h-[500px] overflow-auto">

          <table className="w-full text-sm">

            <thead>

              <tr>

                <th>Date</th>

                <th>Particulars</th>

                <th>Cr</th>

                <th>Dr</th>

                <th>Balance</th>

              </tr>

            </thead>

            <tbody>

              {statement.map(
                (tx) => (
                  <tr
                    key={
                      tx._id
                    }
                  >

                    <td>
                      {new Date(
                        tx.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {
                        tx.particulars
                      }
                    </td>

                    <td>
                      {
                        tx.credit
                      }
                    </td>

                    <td>
                      {
                        tx.debit
                      }
                    </td>

                    <td>
                      {
                        tx.balanceAfter
                      }
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </Modal>
<Modal
 open={depositModal}
 onClose={() =>
  setDepositModal(false)
 }
 title="Deposit Money"
>

 <form
  onSubmit={depositMoney}
  className="space-y-4"
 >

  <select
   className="input"
   value={depositForm.accountId}
   onChange={(e)=>
    setDepositForm({
      ...depositForm,
      accountId:e.target.value
    })
   }
  >
   <option value="">
    Select Account
   </option>

   {accounts.map(acc=>(
    <option
      key={acc._id}
      value={acc._id}
    >
      {acc.name}
    </option>
   ))}
  </select>

  <input
   className="input"
   type="number"
   placeholder="Amount"
    required
   value={depositForm.amount}
   onChange={(e)=>
    setDepositForm({
      ...depositForm,
      amount:e.target.value
    })
   }
  />

  <input
   className="input"
   placeholder="Particulars"
    required
   value={depositForm.particulars}
   onChange={(e)=>
    setDepositForm({
      ...depositForm,
      particulars:e.target.value
    })
   }
  />

  <textarea
   className="input"
   placeholder="Note"
   value={depositForm.note}
   onChange={(e)=>
    setDepositForm({
      ...depositForm,
      note:e.target.value
    })
   }
  />

  <button
   className="btn-primary w-full"
  >
   Deposit
  </button>

 </form>

</Modal>

<Modal
  open={withdrawModal}
  onClose={() =>
    setWithdrawModal(false)
  }
  title="Withdraw Money"
>

  <form
    onSubmit={withdrawMoney}
    className="space-y-4"
  >

    <select
      className="input"
      value={withdrawForm.accountId}
      onChange={(e) =>
        setWithdrawForm({
          ...withdrawForm,
          accountId: e.target.value,
        })
      }
    >
      <option value="">
        Select Account
      </option>

      {accounts.map((acc) => (
        <option
          key={acc._id}
          value={acc._id}
        >
          {acc.name}
        </option>
      ))}
    </select>

    <input
      className="input"
      type="number"
      placeholder="Amount"
       required
      value={withdrawForm.amount}
      onChange={(e) =>
        setWithdrawForm({
          ...withdrawForm,
          amount: e.target.value,
        })
      }
    />

    <input
      className="input"
      placeholder="Particulars"
       required
      value={withdrawForm.particulars}
      onChange={(e) =>
        setWithdrawForm({
          ...withdrawForm,
          particulars: e.target.value,
        })
      }
    />

    <textarea
      className="input"
      placeholder="Note"
      value={withdrawForm.note}
      onChange={(e) =>
        setWithdrawForm({
          ...withdrawForm,
          note: e.target.value,
        })
      }
    />

    <button
      className="btn-primary w-full"
    >
      Withdraw
    </button>

  </form>

</Modal>















<Modal
 open={transferModal}
 onClose={() =>
  setTransferModal(false)
 }
 title="Transfer Funds"
>

 <form
  onSubmit={transferFunds}
  className="space-y-4"
 >

  <select
   className="input"
   value={
    transferForm.fromAccountId
   }
   onChange={(e)=>
    setTransferForm({
      ...transferForm,
      fromAccountId:
      e.target.value
    })
   }
  >
   <option value="">
    From Account
   </option>

   {accounts.map(acc=>(
    <option
      key={acc._id}
      value={acc._id}
    >
      {acc.name}
    </option>
   ))}
  </select>

  <select
   className="input"
   value={
    transferForm.toAccountId
   }
   onChange={(e)=>
    setTransferForm({
      ...transferForm,
      toAccountId:
      e.target.value
    })
   }
  >
   <option value="">
    To Account
   </option>

   {accounts.map(acc=>(
    <option
      key={acc._id}
      value={acc._id}
    >
      {acc.name}
    </option>
   ))}
  </select>

  <input
   className="input"
   type="number"
   placeholder="Amount"
   value={transferForm.amount}
   onChange={(e)=>
    setTransferForm({
      ...transferForm,
      amount:e.target.value
    })
   }
  />

  <textarea
   className="input"
   placeholder="Note"
   value={transferForm.note}
   onChange={(e)=>
    setTransferForm({
      ...transferForm,
      note:e.target.value
    })
   }
  />

  <button
   className="btn-primary w-full"
  >
   Transfer
  </button>

 </form>

</Modal>
    </div>
  );
};

export default AccountsPage;