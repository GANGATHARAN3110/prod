import React, { useEffect, useState } from "react";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ name: "", type: "trip" });
  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token"); // assuming JWT stored in localStorage

  // Fetch groups from backend
  const fetchGroups = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/group", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setGroups(data);
      else setMessage(data.message || "Failed to fetch groups");
    } catch (err) {
      console.error(err);
      setMessage("Error connecting to server");
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle form change
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Handle add/edit group
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editId
        ? `http://localhost:5000/api/group/${editId}`
        : "http://localhost:5000/api/group";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok || res.status === 201) {
        setMessage(editId ? "Group updated successfully" : "Group added successfully");
        setForm({ name: "", type: "trip" });
        setEditId(null);
        fetchGroups();
      } else {
        setMessage(data.message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error connecting to server");
    }
  };

  // Edit group
  const handleEdit = (group) => {
    setForm({ name: group.name, type: group.type });
    setEditId(group.id);
  };

  // Delete group
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/group/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage("Group deleted successfully");
        fetchGroups();
      } else {
        const data = await res.json();
        setMessage(data.message || "Failed to delete group");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error connecting to server");
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Groups</h2>

      {message && <div className="alert alert-info">{message}</div>}

      {/* Add/Edit Group Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              name="name"
              placeholder="Group Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-4">
            <select
              name="type"
              className="form-select"
              value={form.type}
              onChange={handleChange}
            >
              <option value="trip">Trip</option>
              <option value="home">Home</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">
              {editId ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </form>

      {/* Groups List */}
      <table className="table table-bordered">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <tr key={group.id || group._id}>
                <td>{index + 1}</td>
                <td>{group.name}</td>
                <td>{group.type}</td>
                <td>
                  <button
                    className="btn btn-sm btn-info me-2"
                    onClick={() => handleEdit(group)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(group.id || group._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center">
                No groups found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
