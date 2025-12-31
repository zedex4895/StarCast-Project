import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets"); // 'tickets', 'users', 'casting'
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, ticketsRes] = await Promise.all([
        axios.get("http://localhost:5001/api/users"),
        axios.get("http://localhost:5001/api/casting?status=all"),
      ]);
      setUsers(usersRes.data);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.patch(`http://localhost:5001/api/casting/${id}/approve`);
      alert("Ticket approved successfully!");
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to approve Audition");
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this Audition?")) {
      try {
        await axios.patch(`http://localhost:5001/api/casting/${id}/reject`);
        alert("Ticket rejected successfully!");
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to reject Audition");
      }
    }
  };

  const handleDeleteTicket = async (id) => {
    if (window.confirm("Are you sure you want to delete this Audition?")) {
      try {
        await axios.delete(`http://localhost:5001/api/casting/${id}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete ticket");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(`http://localhost:5001/api/users/${userId}`);
        alert("User deleted successfully");
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (
      window.confirm(
        `Are you sure you want to change this user's role to ${newRole}?`
      )
    ) {
      try {
        await axios.put(`http://localhost:5001/api/users/${userId}`, {
          role: newRole,
        });
        alert("User role updated successfully");
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to update user role");
      }
    }
  };

  const regularUsers = users.filter((u) => u.role === "user");
  const castingDirectors = users.filter((u) => u.role === "casting");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/*  BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b0b0b] to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.35),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_50%)]" />

      <div className="relative">
        {/*  NAVBAR */}
        <nav className="bg-black/70 backdrop-blur border-b border-white/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-bold text-white tracking-wide">
                Star Cast
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 text-gray-200 hover:text-red-400 transition"
                >
                  Home
                </button>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="px-4 py-2 text-gray-200 hover:text-red-500 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
          <h1 className="text-4xl font-extrabold mb-8">
            Admin Panel
            <div className="h-[3px] w-20 bg-red-500 mt-2 rounded-full" />
          </h1>

          {/*  TABS */}
          <div className="mb-6 border-b border-white/20">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("tickets")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "tickets"
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Manage Auditions ({tickets.length})
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "users"
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Manage Users ({regularUsers.length})
              </button>

              <button
                onClick={() => setActiveTab("casting")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "casting"
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500"
                }`}
              >
                Manage Casting Directors ({castingDirectors.length})
              </button>
            </nav>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="text-center py-12 text-gray-300">
              <div className="text-xl">Loading…</div>
            </div>
          ) : (
            <>
              {/*  Audition TAB */}
              {activeTab === "tickets" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-white">
                    All Casting Auditions ({tickets.length})
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket._id}
                        className="bg-white/95 rounded-2xl shadow-xl p-6 border border-red-200/40 hover:shadow-red-200/50 transition"
                      >
                        {(ticket.images && ticket.images.length > 0) ||
                        ticket.image ? (
                          <img
                            src={
                              ticket.images && ticket.images.length > 0
                                ? ticket.images[0]
                                : ticket.image
                            }
                            alt={ticket.title}
                            className="w-full h-48 object-cover rounded mb-4"
                          />
                        ) : null}

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {ticket.title}
                        </h3>

                        <p className="text-gray-600 mb-4 text-sm">
                          {ticket.description}
                        </p>

                        <div className="space-y-1 mb-4 text-sm text-gray-700">
                          <div>
                            <span className="font-medium">Category:</span>{" "}
                            {ticket.category}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span>{" "}
                            {ticket.location}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {new Date(ticket.date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Created by:</span>{" "}
                            {ticket.createdBy?.name || "Unknown"}
                          </div>
                          <div>
                            <span className="font-medium">Registered:</span>{" "}
                            {ticket.registeredUsers?.length || 0}
                          </div>

                          <div className="mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                ticket.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {ticket.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(ticket._id)}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Approve
                              </button>

                              <button
                                onClick={() => handleReject(ticket._id)}
                                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleDeleteTicket(ticket._id)}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/*  USERS TAB */}
              {activeTab === "users" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    All Users ({regularUsers.length})
                  </h2>

                  <div className="bg-white/95 rounded-xl shadow-xl overflow-hidden text-gray-900">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Name",
                            "Email",
                            "Phone",
                            "Age",
                            "Role",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">
                        {regularUsers.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                {user.profilePhoto ? (
                                  <img
                                    src={user.profilePhoto}
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                                {user.name} {user.lastName || ""}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.phoneNumber || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.age || "N/A"}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {user.role}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() =>
                                  handleChangeRole(user._id, "casting")
                                }
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Make Casting
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/*  CASTING TAB */}
              {activeTab === "casting" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    Casting Directors ({castingDirectors.length})
                  </h2>

                  <div className="bg-white/95 rounded-xl shadow-xl overflow-hidden text-gray-900">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {[
                            "Name",
                            "Email",
                            "Phone",
                            "Age",
                            "Role",
                            "Actions",
                          ].map((h) => (
                            <th
                              key={h}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-200">
                        {castingDirectors.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                {user.profilePhoto ? (
                                  <img
                                    src={user.profilePhoto}
                                    className="w-8 h-8 rounded-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    {user.name?.charAt(0)?.toUpperCase()}
                                  </div>
                                )}
                                {user.name} {user.lastName || ""}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.phoneNumber || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {user.age || "N/A"}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {user.role}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() =>
                                  handleChangeRole(user._id, "user")
                                }
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Make User
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
