import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CastingPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageInputType, setImageInputType] = useState("url"); // 'url' or 'file'
  const [showRegistrations, setShowRegistrations] = useState(null); // ticket ID or null
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [ticketRegistrationCounts, setTicketRegistrationCounts] = useState({});
  const [editingTicket, setEditingTicket] = useState(null); // ticket being edited
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    date: "",
    image: null,
    imagePreview: null,
    images: [],
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const userId = user.id || user._id;
      if (!userId) {
        console.error("User ID not found in user object:", user);
        setLoading(false);
        return;
      }

      const userIdStr = String(userId);

      const response = await axios.get(
        "http://localhost:5001/api/casting?status=all"
      );

      const myTickets = response.data
        .filter((ticket) => {
          if (!ticket.createdBy) {
            return false;
          }

          let creatorId = null;
          if (
            ticket.createdBy &&
            typeof ticket.createdBy === "object" &&
            ticket.createdBy._id
          ) {
            creatorId = String(ticket.createdBy._id);
          } else if (typeof ticket.createdBy === "string") {
            creatorId = ticket.createdBy;
          } else if (ticket.createdBy && ticket.createdBy.toString) {
            creatorId = String(ticket.createdBy);
          } else {
            return false;
          }

          return creatorId === userIdStr;
        })
        .map((ticket) => ({
          ...ticket,
          registeredUsers: ticket.registeredUsers || [],
        }));

      setTickets(myTickets);

      // Fetch actual registration counts for each ticket
      const counts = {};
      await Promise.all(
        myTickets.map(async (ticket) => {
          try {
            const regResponse = await axios.get(
              `http://localhost:5001/api/casting/${ticket._id}/registrations`
            );
            counts[ticket._id] = Array.isArray(regResponse.data)
              ? regResponse.data.length
              : 0;
          } catch {
            counts[ticket._id] = ticket.registeredUsers?.length || 0;
          }
        })
      );
      setTicketRegistrationCounts(counts);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      alert(
        "Oops! We couldn't load your auditions right now. Give it another shot? 🔄"
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && (user.id || user._id)) {
      fetchTickets();
    } else if (!user) {
      setLoading(false);
    }
  }, [fetchTickets, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(
          "Whoa, that image is a bit big! 🖼️ Try one under 5MB, or paste a URL instead."
        );
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result,
          imagePreview: reader.result,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({
      ...formData,
      image: url || null,
      imagePreview: url || null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        date: formData.date,
        images: formData.image ? [formData.image] : formData.images || [],
      };

      if (editingTicket) {
        // Update existing ticket
        await axios.put(
          `http://localhost:5001/api/casting/${editingTicket._id}`,
          submitData
        );
        alert("✨ Audition updated successfully!");
      } else {
        // Create new ticket
        await axios.post("http://localhost:5001/api/casting", submitData);
        alert(
          " Your audition is submitted and waiting for admin approval. We'll get it live soon!"
        );
      }

      setShowForm(false);
      setEditingTicket(null);
      setFormData({
        title: "",
        description: "",
        category: "",
        location: "",
        date: "",
        image: null,
        imagePreview: null,
        images: [],
      });
      setImageInputType("url");
      fetchTickets();
    } catch (error) {
      console.error("Error saving audition:", error);
      alert(error.response?.data?.message || "Failed to save audition");
    }
  };

  const handleEdit = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title || "",
      description: ticket.description || "",
      category: ticket.category || "",
      location: ticket.location || "",
      date: ticket.date ? new Date(ticket.date).toISOString().slice(0, 16) : "",
      image: ticket.images?.[0] || ticket.image || null,
      imagePreview: ticket.images?.[0] || ticket.image || null,
      images: ticket.images || [],
    });
    setImageInputType(ticket.images?.[0]?.startsWith("data:") ? "file" : "url");
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingTicket(null);
    setFormData({
      title: "",
      description: "",
      category: "",
      location: "",
      date: "",
      image: null,
      imagePreview: null,
      images: [],
    });
    setImageInputType("url");
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to remove this audition? This can't be undone "
      )
    ) {
      try {
        await axios.delete(`http://localhost:5001/api/casting/${id}`);
        fetchTickets();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete ticket");
      }
    }
  };

  const handleViewRegistrations = async (ticketId) => {
    if (showRegistrations === ticketId) {
      setShowRegistrations(null);
      setRegistrations([]);
      return;
    }

    setShowRegistrations(ticketId);
    setLoadingRegistrations(true);
    try {
      const response = await axios.get(
        `http://localhost:5001/api/casting/${ticketId}/registrations`
      );
      const regs = Array.isArray(response.data) ? response.data : [];
      setRegistrations(regs);
      // Update the count for this ticket
      setTicketRegistrationCounts((prev) => ({
        ...prev,
        [ticketId]: regs.length,
      }));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch registrations");
      setShowRegistrations(null);
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleApproveRegistration = async (registrationId) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/casting/registrations/${registrationId}/approve`
      );
      alert("Great news! This talent has been approved. They'll be thrilled!");
      if (showRegistrations) {
        const response = await axios.get(
          `http://localhost:5001/api/casting/${showRegistrations}/registrations`
        );
        const regs = Array.isArray(response.data) ? response.data : [];
        setRegistrations(regs);
        setTicketRegistrationCounts((prev) => ({
          ...prev,
          [showRegistrations]: regs.length,
        }));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to approve registration");
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    if (
      !window.confirm(
        "Are you sure? This will let them know they weren't selected this time."
      )
    ) {
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5001/api/casting/registrations/${registrationId}/reject`
      );
      alert(
        "Done. The applicant has been notified. Sometimes it's just not the right fit! "
      );
      if (showRegistrations) {
        const response = await axios.get(
          `http://localhost:5001/api/casting/${showRegistrations}/registrations`
        );
        const regs = Array.isArray(response.data) ? response.data : [];
        setRegistrations(regs);
        setTicketRegistrationCounts((prev) => ({
          ...prev,
          [showRegistrations]: regs.length,
        }));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to reject registration");
    }
  };

  // Helper function to get registration count
  const getRegistrationCount = (ticketId) => {
    return ticketRegistrationCounts[ticketId] ?? 0;
  };

  // Stats calculation - use actual counts from API
  const totalRegistrations = Object.values(ticketRegistrationCounts).reduce(
    (sum, count) => sum + count,
    0
  );
  const approvedCount = tickets.filter((t) => t.status === "approved").length;
  const pendingCount = tickets.filter((t) => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Background */}
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/img.jpg)",
          minHeight: "100vh",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black"></div>

        {/* NAVBAR */}
        <nav className="bg-black/60 backdrop-blur shadow border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="text-2xl font-extrabold text-white tracking-wide">
                Star Cast
              </div>

              {/* TEXT LINKS */}
              <div className="flex gap-6 items-center text-sm font-semibold">
                <span
                  onClick={() => navigate("/")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Home
                </span>

                <span
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer text-gray-200 hover:text-red-500 hover:underline underline-offset-4 transition"
                >
                  Profile
                </span>

                <span
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="cursor-pointer text-gray-200 hover:text-red-600 hover:underline underline-offset-4 transition"
                >
                  Logout
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-2">
                  My Auditions
                </h1>
              </div>
              <button
                onClick={() => {
                  if (showForm) {
                    handleCancelForm();
                  } else {
                    setShowForm(true);
                  }
                }}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-red-700 px-8 py-3 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30"
              >
                <span className="relative flex items-center gap-2">
                  {showForm ? (
                    <>Cancel</>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Create Audition
                    </>
                  )}
                </span>
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-13deg)_translateX(100%)]">
                  <div className="relative h-full w-10 bg-white/20"></div>
                </div>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white/50 text-sm">Your Auditions</p>
                    <p className="text-2xl font-bold text-white">
                      {tickets.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white/50 text-sm">Live & Active</p>
                    <p className="text-2xl font-bold text-white">
                      {approvedCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white/50 text-sm">Awaiting Review</p>
                    <p className="text-2xl font-bold text-white">
                      {pendingCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white/50 text-sm">Talented Folks</p>
                    <p className="text-2xl font-bold text-white">
                      {totalRegistrations}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Create/Edit Audition Form */}
          {showForm && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 animate-fadeIn">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                {editingTicket
                  ? "Edit Your Audition "
                  : "Let's Create Something Amazing! "}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      What's it called?
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Give your audition a catchy title"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      What type of project?
                    </label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      <option value="" className="bg-gray-900">
                        choose a category
                      </option>
                      <option value="cinema" className="bg-gray-900">
                        Cinema / Film
                      </option>
                      <option value="serial" className="bg-gray-900">
                        TV Serial / Web Series
                      </option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Tell us more about the role *
                  </label>
                  <textarea
                    required
                    rows="3"
                    placeholder="What makes this role special? What are you looking for in the perfect candidate?"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Location of auditions
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City or venue where auditions will be held"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      When should talent show up?
                    </label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300 [color-scheme:dark]"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Add an eye-catching image
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputType("url");
                        setFormData({
                          ...formData,
                          image: null,
                          imagePreview: null,
                        });
                      }}
                      className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                        imageInputType === "url"
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageInputType("file");
                        setFormData({
                          ...formData,
                          image: null,
                          imagePreview: null,
                        });
                      }}
                      className={`px-4 py-2 text-sm rounded-lg transition-all duration-300 ${
                        imageInputType === "file"
                          ? "bg-red-600 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                    >
                      Upload
                    </button>
                  </div>
                  {imageInputType === "url" ? (
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-300"
                      value={formData.image || ""}
                      onChange={handleImageUrlChange}
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 border-dashed rounded-xl text-white/70 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:cursor-pointer hover:file:bg-red-700 transition-all duration-300"
                      onChange={handleImageChange}
                    />
                  )}
                  {formData.imagePreview && (
                    <div className="mt-4 relative inline-block">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="h-32 w-auto object-cover rounded-xl border border-white/20"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 font-medium"
                  >
                    {editingTicket ? "Save Changes" : "Launch Audition"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Auditions Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center gap-3 text-white/60">
                <svg
                  className="animate-spin h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-xl">
                  Hang tight! Fetching your auditions
                </span>
              </div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-12 max-w-lg mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Ready to Find Your Star?
                </h3>
                <p className="text-white/50 mb-6">
                  Your journey to discovering amazing talent starts here. Let's
                  create your first audition!
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Let's Get Started!
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/10"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {ticket.images && ticket.images.length > 0 ? (
                      <img
                        src={ticket.images[0]}
                        alt={ticket.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : ticket.image ? (
                      <img
                        src={ticket.image}
                        alt={ticket.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%23666' stroke-linecap='round' stroke-linejoin='round' stroke-width='1' d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <svg
                          className="w-16 h-16 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                          ticket.status === "approved"
                            ? "bg-green-500/80 text-white"
                            : ticket.status === "pending"
                            ? "bg-yellow-500/80 text-black"
                            : "bg-red-500/80 text-white"
                        }`}
                      >
                        {ticket.status?.charAt(0).toUpperCase() +
                          ticket.status?.slice(1)}
                      </span>
                    </div>

                    {/* Registrations Count */}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/50 backdrop-blur-sm text-white flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {getRegistrationCount(ticket._id)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-white mb-2 line-clamp-1">
                      {ticket.title}
                    </h2>
                    <p className="text-white/50 text-sm mb-4 line-clamp-2">
                      {ticket.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg
                          className="w-4 h-4 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        <span className="capitalize">{ticket.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg
                          className="w-4 h-4 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{ticket.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <svg
                          className="w-4 h-4 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>
                          {new Date(ticket.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleViewRegistrations(ticket._id)}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                          showRegistrations === ticket._id
                            ? "bg-blue-600 text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {showRegistrations === ticket._id
                          ? "Hide"
                          : "See who's interested"}{" "}
                        ({getRegistrationCount(ticket._id)}{" "}
                        {getRegistrationCount(ticket._id) === 1
                          ? "person"
                          : "people"}
                        )
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(ticket)}
                          className="flex-1 py-2.5 bg-blue-600/20 text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ticket._id)}
                          className="flex-1 py-2.5 bg-red-600/20 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Expanded Registrations Panel */}
                  {showRegistrations === ticket._id && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      {loadingRegistrations ? (
                        <div className="text-center py-6">
                          <div className="inline-flex items-center gap-2 text-white/50">
                            <svg
                              className="animate-spin h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Getting the list ready...
                          </div>
                        </div>
                      ) : registrations.length === 0 ? (
                        <div className="text-center py-6 text-white/40">
                          <svg
                            className="w-8 h-8 mx-auto mb-2 opacity-50"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <p>No takers yet — they're on their way! </p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                          {registrations.map((reg, index) => {
                            const profilePhoto =
                              reg.user?.profilePhoto || reg.profilePhoto;
                            const userName =
                              reg.user?.name || reg.name || "User";
                            const userLastName =
                              reg.user?.lastName || reg.lastName || "";
                            const userEmail = reg.user?.email || reg.email;
                            const phoneNumber = reg.phoneNumber;
                            const status = reg.status || "pending";
                            const photos = reg.photos || [];
                            const videos = reg.videos || [];

                            return (
                              <div
                                key={reg._id || index}
                                className="bg-white/5 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Avatar */}
                                  {profilePhoto ? (
                                    <img
                                      src={profilePhoto}
                                      alt={userName}
                                      className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                      <span className="text-white font-bold">
                                        {userName.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-white font-semibold truncate">
                                        {userName} {userLastName}
                                      </h4>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                          status === "approved"
                                            ? "bg-green-500/20 text-green-400"
                                            : status === "rejected"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-yellow-500/20 text-yellow-400"
                                        }`}
                                      >
                                        {status}
                                      </span>
                                    </div>
                                    <p className="text-white/50 text-xs truncate">
                                      {userEmail}
                                    </p>
                                    <p className="text-white/50 text-xs">
                                      {phoneNumber}
                                    </p>

                                    {/* Media badges */}
                                    {(photos.length > 0 ||
                                      videos.length > 0) && (
                                      <div className="flex items-center gap-2 mt-2">
                                        {photos.length > 0 && (
                                          <button
                                            onClick={() =>
                                              setSelectedMedia({
                                                type: "photos",
                                                data: photos,
                                                name: userName,
                                              })
                                            }
                                            className="text-xs bg-white/10 px-2 py-1 rounded-lg text-white/70 hover:bg-white/20 transition-all"
                                          >
                                            📷 {photos.length} Photos
                                          </button>
                                        )}
                                        {videos.length > 0 && (
                                          <button
                                            onClick={() =>
                                              setSelectedMedia({
                                                type: "videos",
                                                data: videos,
                                                name: userName,
                                              })
                                            }
                                            className="text-xs bg-white/10 px-2 py-1 rounded-lg text-white/70 hover:bg-white/20 transition-all"
                                          >
                                            {videos.length} Videos
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3">
                                  {status !== "approved" && (
                                    <button
                                      onClick={() =>
                                        handleApproveRegistration(reg._id)
                                      }
                                      className="flex-1 py-2 bg-green-600/20 text-green-400 rounded-lg text-xs font-semibold hover:bg-green-600 hover:text-white transition-all"
                                    >
                                      ✓ Approve
                                    </button>
                                  )}
                                  {status !== "rejected" && (
                                    <button
                                      onClick={() =>
                                        handleRejectRegistration(reg._id)
                                      }
                                      className="flex-1 py-2 bg-red-600/20 text-red-400 rounded-lg text-xs font-semibold hover:bg-red-600 hover:text-white transition-all"
                                    >
                                      ✕ Reject
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">
                {selectedMedia.type === "photos"
                  ? "Check out these shots"
                  : "Watch the showreel"}{" "}
                from {selectedMedia.name}
              </h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {selectedMedia.type === "photos" ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedMedia.data.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-48 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-all border border-white/10"
                      onClick={() => window.open(photo, "_blank")}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedMedia.data.map((video, index) => (
                    <div
                      key={index}
                      className="rounded-xl overflow-hidden bg-black border border-white/10"
                    >
                      <video src={video} controls className="w-full max-h-96" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CastingPage;
