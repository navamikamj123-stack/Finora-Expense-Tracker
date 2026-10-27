
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api/expenses";

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const emptyForm = {
  title: "",
  amount: "",
  category: "Food",
  date: getToday(),
};

const categories = ["Food", "Travel", "Bills", "Shopping", "Other"];

function isValidDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // GET: Load expenses from the backend
  async function loadExpenses() {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Could not load expenses.");
      }

      const data = await response.json();
      setExpenses(data);

      return true;
    } catch {
      setError(
        "Unable to connect to the server. Please check that your backend is running."
      );

      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  // Calculate total spending
  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  // Format amounts in Indian Rupees
  function formatCurrency(amount) {
    return Number(amount).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Handle input changes
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  // POST: Add an expense
  // PUT: Update an existing expense
  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Please enter an expense title.");
      return;
    }

    if (
      form.amount === "" ||
      !Number.isFinite(Number(form.amount)) ||
      Number(form.amount) <= 0
    ) {
      setError("Amount must be a valid number greater than zero.");
      return;
    }

    if (!categories.includes(form.category)) {
      setError("Please select a valid category.");
      return;
    }

    if (!isValidDate(form.date)) {
      setError("Please select a valid date.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId ? `${API}/${editingId}` : API;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save expense.");
      }

      setForm({ ...emptyForm });
      setEditingId(null);
      setMessage(result.message || "Expense saved successfully.");

      // Refresh the list and update the total
      await loadExpenses();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // Fill the form with the selected expense
  function handleEdit(expense) {
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10),
    });

    setEditingId(expense._id);
    setMessage("");
    setError("");

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // Cancel editing
  function cancelEdit() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setMessage("");
    setError("");
  }

  // DELETE: Remove an expense
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete expense.");
      }

      if (editingId === id) {
        setForm({ ...emptyForm });
        setEditingId(null);
      }

      setMessage(result.message || "Expense deleted successfully.");

      // Refresh expenses and recalculate total
      await loadExpenses();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  return (
    <main className="page">
      {/* FINORA BRAND HEADER */}
      <header className="header">
        <div className="brand-label">
          YOUR MONEY, YOUR CONTROL
        </div>

        <h1 className="brand-title">
          Finora<span>.</span>
        </h1>

        <p>Make every rupee count.</p>
      </header>

      {/* TOTAL SPENDING SUMMARY */}
      <section className="total-card">
        <p>Total Amount Spent</p>

        <h2>{formatCurrency(total)}</h2>
      </section>

      {/* ADD OR EDIT EXPENSE */}
      <section className="card">
        <h2>{editingId ? "Edit Expense" : "Add an Expense"}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="title">Expense Title</label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Grocery shopping"
                value={form.title}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="amount">Amount (₹)</label>

              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter amount"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="date">Expense Date</label>

              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* SUCCESS MESSAGE */}
          {message && (
            <p className="message success" role="status">
              {message}
            </p>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <p className="message failure" role="alert">
              {error}
            </p>
          )}

          {/* FORM BUTTONS */}
          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Expense"
                  : "Add Expense"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-button"
                onClick={cancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* EXPENSE HISTORY */}
      <section className="card">
        <h2>Expense History</h2>

        {loading ? (
          <p className="empty">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="empty">
            No expenses recorded yet. Add your first expense above.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.title}</td>

                    <td>{formatCurrency(expense.amount)}</td>

                    <td>{expense.category}</td>

                    <td>
                      {new Date(expense.date).toLocaleDateString(
                        "en-GB",
                        { timeZone: "UTC" }
                      )}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEdit(expense)}
                          aria-label={`Edit ${expense.title}`}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => handleDelete(expense._id)}
                          aria-label={`Delete ${expense.title}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer>
        <strong>Finora.</strong>
        <p>Make every rupee count.</p>
      </footer>
    </main>
  );
}

export default App;
