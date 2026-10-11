const API_BASE_URL = "https://campus-helpdesk-fis9.onrender.com";

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = "An unexpected error occurred.";
      try {
        const errorJson = await response.json();
        if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map(d => d.msg || JSON.stringify(d)).join(", ");
        } else if (typeof errorJson.detail === 'object' && errorJson.detail !== null) {
          errorDetail = errorJson.detail.msg || errorJson.detail.message || JSON.stringify(errorJson.detail);
        } else if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (typeof errorJson.message === 'string') {
          errorDetail = errorJson.message;
        }
      } catch (e) {
        // Fallback for non-JSON errors
      }
      const error = new Error(errorDetail);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request("/health"),

  // Auth & Roles
  login: (email, password) => request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  studentLogin: (email, password) => request("/api/auth/student-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  adminLogin: (email, password) => request("/api/auth/admin-login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  studentRegister: (data) => request("/api/auth/student-register", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateProfile: (data) => request("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  }),
  switchDemoUser: (role) => request(`/api/auth/demo-switch/${role}`, {
    method: "POST",
  }),
  getMe: () => request("/api/auth/me"),

  // Chat (Student AI Assistant)
  sendMessage: (message, conversation_id = null, category_filter = null) => request("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message, conversation_id, category_filter }),
  }),
  getConversations: () => request("/api/chat/conversations"),
  getConversationHistory: (id) => request(`/api/chat/conversations/${id}`),
  deleteConversation: (id) => request(`/api/chat/conversations/${id}`, {
    method: "DELETE",
  }),
  clearAllConversations: () => request("/api/chat/conversations", {
    method: "DELETE",
  }),

  // Tickets
  createTicket: (data) => request("/api/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getTickets: () => request("/api/tickets"),
  getTicketById: (id) => request(`/api/tickets/${id}`),
  updateTicket: (id, data) => request(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteTicket: (id) => request(`/api/tickets/${id}`, {
    method: "DELETE",
  }),

  // Knowledge Base & Documents
  getFaqs: (category = "", search = "") => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (search) params.append("search", search);
    return request(`/api/knowledge/faqs?${params.toString()}`);
  },
  createFaq: (data) => request("/api/knowledge/faqs", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  deleteFaq: (id) => request(`/api/knowledge/faqs/${id}`, {
    method: "DELETE",
  }),
  getDocuments: () => request("/api/knowledge/documents"),
  uploadDocument: (formData) => request("/api/knowledge/upload-document", {
    method: "POST",
    body: formData,
  }),
  deleteDocument: (id) => request(`/api/knowledge/documents/${id}`, {
    method: "DELETE",
  }),
  replaceDocument: (id, formData) => request(`/api/knowledge/documents/${id}/replace`, {
    method: "PUT",
    body: formData,
  }),
  reprocessDocument: (id) => request(`/api/knowledge/documents/${id}/reprocess`, {
    method: "POST",
  }),
  getDocumentChunks: (id) => request(`/api/knowledge/documents/${id}/chunks`),

  // Contact Admin & Student Messages
  emailAdmin: (data) => request("/api/contact/email-admin", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  getStudentMessages: (statusFilter = "") => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "All") params.append("status_filter", statusFilter);
    return request(`/api/contact/messages?${params.toString()}`);
  },
  getMyMessages: () => request("/api/contact/my-messages"),
  getMessageDetail: (id) => request(`/api/contact/messages/${id}`),
  updateMessageStatus: (id, status) => request(`/api/contact/messages/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
  replyToStudentMessage: (id, reply) => request(`/api/contact/messages/${id}/reply`, {
    method: "POST",
    body: JSON.stringify({ reply }),
  }),
  deleteStudentMessage: (id) => request(`/api/contact/messages/${id}`, {
    method: "DELETE",
  }),
  retryMessageEmail: (id) => request(`/api/contact/messages/${id}/retry-email`, {
    method: "POST",
  }),

  // Calendar
  getCalendar: (category = "") => {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    return request(`/api/calendar?${params.toString()}`);
  },

  // Admin Portal Endpoints
  getAdminStats: () => request("/api/admin/stats"),
  getStaffMembers: () => request("/api/admin/staff-members"),
  getStudents: () => request("/api/admin/students"),
  createStudent: async (data) => {
    try {
      return await request("/api/admin/students", {
        method: "POST",
        body: JSON.stringify(data),
      });
    } catch (err) {
      if (err.status === 405) {
        // Fallback for live production server while new backend image finishes deployment
        const regRes = await request("/api/auth/student-register", {
          method: "POST",
          body: JSON.stringify({
            full_name: data.full_name,
            email: data.email,
            password: data.password,
            student_id: data.student_id || `CS-${Date.now().toString().slice(-4)}`,
            department: data.department || "Computer Science & Engineering",
            phone: data.phone || null,
          }),
        });

        const createdUser = regRes.user || regRes;

        if (data.is_active === false && createdUser.id) {
          try {
            await request(`/api/admin/students/${createdUser.id}`, {
              method: "PATCH",
              body: JSON.stringify({ is_active: false }),
            });
            createdUser.is_active = false;
          } catch (e) {
            console.warn("Could not set inactive:", e);
          }
        }

        return {
          id: createdUser.id,
          full_name: createdUser.full_name,
          email: createdUser.email,
          role: createdUser.role || "student",
          student_id: createdUser.student_id,
          department: createdUser.department,
          phone: createdUser.phone,
          is_active: createdUser.is_active ?? true,
          created_at: createdUser.created_at || new Date().toISOString(),
          ticket_count: 0,
        };
      }
      throw err;
    }
  },
  updateStudentStatus: (id, data) => request(`/api/admin/students/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  resetStudentPassword: (id, newPassword) => request(`/api/admin/students/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  }),
  deleteStudent: (id) => request(`/api/admin/students/${id}`, {
    method: "DELETE",
  }),

  // Evaluation & System Audit
  runEvaluationSuite: () => request("/api/evaluation/run-suite", {
    method: "POST",
  }),
  getLatestEvaluationResults: () => request("/api/evaluation/latest-results"),
};
