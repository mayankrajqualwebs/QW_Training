
import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Users,
    ShieldCheck,
    UserRound,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    UserPlus,
    Trash2,
    AlertTriangle,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { adminService } from "../services/adminService";
import { useAuth } from "../hooks/useAuth";
import { Modal } from "../components/Modal";

const PAGE_SIZE = 20;

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getErrorMessage(error) {
    return (
        error.response?.data?.detail ||
        error.message ||
        "Something went wrong. Please try again."
    );
}

export function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const { user: currentUser } = useAuth();

    const [selectedUser, setSelectedUser] = useState(null);

    // Create user modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        email: "",
        password: "",
        platform_role: "USER",
    });
    const [createFieldErrors, setCreateFieldErrors] = useState({});
    const [createModalError, setCreateModalError] = useState("");
    const [creatingUser, setCreatingUser] = useState(false);

    // Delete user modal state
    const [userToDelete, setUserToDelete] = useState(null);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [deleteModalError, setDeleteModalError] = useState("");

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await adminService.getUsers({
                search,
                platform_role: roleFilter,
                page,
                page_size: PAGE_SIZE,
            });

            setUsers(data.users);
            setTotal(data.total);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter, page]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    function handleSearchChange(value) {
        setSearch(value);
        setPage(1);
        setNotice("");
    }

    function handleRoleFilterChange(value) {
        setRoleFilter(value);
        setPage(1);
        setNotice("");
    }

    async function confirmRoleChange() {
        if (!selectedUser) return;

        const user = selectedUser;

        const newRole =
            user.platform_role === "ADMIN" ? "USER" : "ADMIN";

        setUpdatingUserId(user.id);
        setError("");
        setNotice("");

        try {
            await adminService.updateUserRole(user.id, newRole);

            setSelectedUser(null);

            setNotice(
                `${user.email} was successfully changed to ${newRole}.`
            );

            await loadUsers();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setUpdatingUserId(null);
        }
    }

    // -------------------------------------------------------------
    // Create User Handlers
    // -------------------------------------------------------------
    function handleOpenCreateModal() {
        setCreateForm({
            email: "",
            password: "",
            platform_role: "USER",
        });
        setCreateFieldErrors({});
        setCreateModalError("");
        setShowCreateModal(true);
    }

    function handleCloseCreateModal() {
        if (creatingUser) return;
        setShowCreateModal(false);
        setCreateFieldErrors({});
        setCreateModalError("");
    }

    function validateCreateForm() {
        const errors = {};
        const email = createForm.email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            errors.email = "Email address is required.";
        } else if (!emailRegex.test(email)) {
            errors.email = "Please enter a valid email address.";
        }

        if (!createForm.password) {
            errors.password = "Password is required.";
        } else if (createForm.password.length < 12) {
            errors.password = "Password must be at least 12 characters long.";
        } else if (createForm.password.length > 128) {
            errors.password = "Password cannot exceed 128 characters.";
        }

        return errors;
    }

    async function handleCreateUserSubmit(event) {
        event.preventDefault();
        if (creatingUser) return;

        const errors = validateCreateForm();
        setCreateFieldErrors(errors);
        setCreateModalError("");

        if (Object.keys(errors).length > 0) {
            return;
        }

        setCreatingUser(true);

        try {
            const newUser = await adminService.createUser({
                email: createForm.email.trim().toLowerCase(),
                password: createForm.password,
                platform_role: createForm.platform_role,
            });

            setShowCreateModal(false);
            setCreateForm({
                email: "",
                password: "",
                platform_role: "USER",
            });
            setNotice(`User "${newUser.email}" was created successfully.`);
            await loadUsers();
        } catch (err) {
            const msg = getErrorMessage(err);
            setCreateModalError(msg);
        } finally {
            setCreatingUser(false);
        }
    }

    // -------------------------------------------------------------
    // Delete User Handlers
    // -------------------------------------------------------------
    function handleOpenDeleteModal(user) {
        if (user.id === currentUser?.id) return;
        setUserToDelete(user);
        setDeleteModalError("");
    }

    function handleCloseDeleteModal() {
        if (deletingUserId) return;
        setUserToDelete(null);
        setDeleteModalError("");
    }

    async function confirmDeleteUser() {
        if (!userToDelete || deletingUserId) return;

        setDeletingUserId(userToDelete.id);
        setDeleteModalError("");

        try {
            await adminService.deleteUser(userToDelete.id);

            const deletedEmail = userToDelete.email;
            setUserToDelete(null);
            setNotice(`User "${deletedEmail}" was successfully deleted.`);
            await loadUsers();
        } catch (err) {
            setDeleteModalError(getErrorMessage(err));
        } finally {
            setDeletingUserId(null);
        }
    }

    return (
        <section className="admin-users">
            <div className="admin-users-toolbar">
                <div className="admin-users-search">
                    <Search size={18} />

                    <input
                        type="search"
                        placeholder="Search users by email..."
                        value={search}
                        onChange={(event) =>
                            handleSearchChange(event.target.value)
                        }
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={(event) =>
                        handleRoleFilterChange(event.target.value)
                    }
                    aria-label="Filter users by platform role"
                >
                    <option value="">All Roles</option>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                </select>

                <button
                    className="admin-users-refresh"
                    onClick={loadUsers}
                    disabled={loading}
                    title="Refresh users"
                    type="button"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>

                <button
                    className="admin-users-create-btn"
                    onClick={handleOpenCreateModal}
                    type="button"
                    title="Create a new user"
                >
                    <UserPlus size={16} />
                    Create User
                </button>
            </div>

            <Alert
                type="error"
                message={error}
                onDismiss={() => setError("")}
            />

            <Alert
                type="success"
                message={notice}
                onDismiss={() => setNotice("")}
            />

            <div className="admin-users-summary">
                <div className="admin-users-summary-icon">
                    <Users size={21} />
                </div>

                <div>
                    <strong>{total.toLocaleString()}</strong>
                    <span>Registered users</span>
                </div>
            </div>

            <div className="admin-users-table-card">
                <div className="admin-users-table-heading">
                    <div>
                        <h2>Platform Users</h2>
                        <p>
                            View and manage registered platform accounts.
                        </p>
                    </div>
                </div>

                <div className="admin-users-table-wrapper">
                    <table className="admin-users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Platform Role</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4">
                                        <div className="admin-users-empty">
                                            Loading users...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4">
                                        <div className="admin-users-empty">
                                            No users found.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => {
                                    const isAdmin =
                                        user.platform_role === "ADMIN";

                                    const isCurrentUser = user.id === currentUser?.id;
                                    const cannotDemoteSelf = isAdmin && isCurrentUser;

                                    const isUpdating =
                                        updatingUserId === user.id;

                                    const isDeleting =
                                        deletingUserId === user.id;

                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="admin-user-identity">
                                                    <div className="admin-user-avatar">
                                                        {user.email
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <span>{user.email}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <span
                                                    className={`admin-user-role ${isAdmin
                                                        ? "admin-role-admin"
                                                        : "admin-role-user"
                                                        }`}
                                                >
                                                    {isAdmin ? (
                                                        <ShieldCheck size={14} />
                                                    ) : (
                                                        <UserRound size={14} />
                                                    )}

                                                    {user.platform_role}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(user.created_at)}
                                            </td>

                                            <td>
                                                <div className="admin-user-actions-cell">
                                                    <button
                                                        className={`admin-user-action ${isAdmin
                                                            ? "admin-user-demote"
                                                            : "admin-user-promote"
                                                            }`}
                                                        onClick={() => setSelectedUser(user)}
                                                        disabled={Boolean(updatingUserId) || Boolean(deletingUserId) || cannotDemoteSelf}
                                                        title={
                                                            cannotDemoteSelf
                                                                ? "You cannot demote your own administrator account"
                                                                : undefined
                                                        }
                                                        type="button"
                                                    >
                                                        {isAdmin
                                                            ? cannotDemoteSelf
                                                                ? "Your Account"
                                                                : "Demote"
                                                            : "Promote"}
                                                    </button>

                                                    <button
                                                        className="admin-user-action admin-user-delete"
                                                        onClick={() => handleOpenDeleteModal(user)}
                                                        disabled={Boolean(updatingUserId) || Boolean(deletingUserId) || isCurrentUser}
                                                        title={
                                                            isCurrentUser
                                                                ? "You cannot delete your own administrator account"
                                                                : "Delete user"
                                                        }
                                                        type="button"
                                                    >
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-users-pagination">
                    <span>
                        {total === 0
                            ? "No users"
                            : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                page * PAGE_SIZE,
                                total
                            )} of ${total}`}
                    </span>

                    <div>
                        <button
                            onClick={() =>
                                setPage((current) => current - 1)
                            }
                            disabled={page <= 1 || loading}
                            aria-label="Previous page"
                            type="button"
                        >
                            <ChevronLeft size={17} />
                        </button>

                        <span>
                            Page {page} of {totalPages}
                        </span>

                        <button
                            onClick={() =>
                                setPage((current) => current + 1)
                            }
                            disabled={page >= totalPages || loading}
                            aria-label="Next page"
                            type="button"
                        >
                            <ChevronRight size={17} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Role Change Modal */}
            {selectedUser && (
                <Modal
                    title={
                        selectedUser.platform_role === "ADMIN"
                            ? "Demote Administrator"
                            : "Promote to Administrator"
                    }
                    onClose={() => setSelectedUser(null)}
                >
                    <div className="admin-role-modal">
                        <p>
                            You are about to change the platform role of:
                        </p>

                        <div className="admin-role-modal-user">
                            <div className="admin-user-avatar">
                                {selectedUser.email
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <div>
                                <strong>{selectedUser.email}</strong>
                                <span>
                                    Current role: {selectedUser.platform_role}
                                </span>
                            </div>
                        </div>

                        <div className="admin-role-modal-change">
                            <span>New role</span>

                            <strong>
                                {selectedUser.platform_role === "ADMIN"
                                    ? "USER"
                                    : "ADMIN"}
                            </strong>
                        </div>

                        <p className="admin-role-modal-warning">
                            {selectedUser.platform_role === "ADMIN"
                                ? "This user will lose access to the Admin Console."
                                : "This user will gain access to the Admin Console and platform-wide management features."}
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setSelectedUser(null)}
                                disabled={Boolean(updatingUserId)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={confirmRoleChange}
                                disabled={Boolean(updatingUserId)}
                            >
                                {updatingUserId
                                    ? "Updating..."
                                    : "Confirm Change"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <Modal
                    title="Create New User"
                    onClose={handleCloseCreateModal}
                >
                    <form
                        onSubmit={handleCreateUserSubmit}
                        className="admin-modal-form"
                        noValidate
                    >
                        {createModalError && (
                            <Alert
                                type="error"
                                message={createModalError}
                                onDismiss={() => setCreateModalError("")}
                            />
                        )}

                        <div className="admin-form-group">
                            <label htmlFor="create-user-email">
                                Email Address <span className="required">*</span>
                            </label>
                            <input
                                id="create-user-email"
                                type="email"
                                placeholder="name@example.com"
                                value={createForm.email}
                                onChange={(e) => {
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }));
                                    if (createFieldErrors.email) {
                                        setCreateFieldErrors((prev) => ({
                                            ...prev,
                                            email: "",
                                        }));
                                    }
                                }}
                                disabled={creatingUser}
                                autoFocus
                            />
                            {createFieldErrors.email && (
                                <span className="field-error">
                                    {createFieldErrors.email}
                                </span>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="create-user-password">
                                Password <span className="required">*</span>
                            </label>
                            <input
                                id="create-user-password"
                                type="password"
                                placeholder="At least 12 characters"
                                value={createForm.password}
                                onChange={(e) => {
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        password: e.target.value,
                                    }));
                                    if (createFieldErrors.password) {
                                        setCreateFieldErrors((prev) => ({
                                            ...prev,
                                            password: "",
                                        }));
                                    }
                                }}
                                disabled={creatingUser}
                            />
                            <span className="field-hint">
                                Must be between 12 and 128 characters.
                            </span>
                            {createFieldErrors.password && (
                                <span className="field-error">
                                    {createFieldErrors.password}
                                </span>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="create-user-role">Platform Role</label>
                            <select
                                id="create-user-role"
                                value={createForm.platform_role}
                                onChange={(e) =>
                                    setCreateForm((prev) => ({
                                        ...prev,
                                        platform_role: e.target.value,
                                    }))
                                }
                                disabled={creatingUser}
                            >
                                <option value="USER">User (Standard account)</option>
                                <option value="ADMIN">Admin (Administrative console access)</option>
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseCreateModal}
                                disabled={creatingUser}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn-primary admin-users-submit-btn"
                                disabled={creatingUser}
                            >
                                {creatingUser ? "Creating User..." : "Create User"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Delete User Modal */}
            {userToDelete && (
                <Modal
                    title="Delete User"
                    onClose={handleCloseDeleteModal}
                >
                    <div className="admin-delete-modal">
                        {deleteModalError && (
                            <Alert
                                type="error"
                                message={deleteModalError}
                                onDismiss={() => setDeleteModalError("")}
                            />
                        )}

                        <div className="admin-delete-warning">
                            <AlertTriangle size={18} className="admin-delete-warning-icon" />
                            <div>
                                <strong>Destructive Action</strong>
                                <p>
                                    Deleting this user is irreversible. Their account, organization memberships, and active authentication sessions will be permanently removed.
                                </p>
                            </div>
                        </div>

                        <p className="admin-delete-prompt">
                            Are you sure you want to permanently delete this user?
                        </p>

                        <div className="admin-role-modal-user">
                            <div className="admin-user-avatar">
                                {userToDelete.email.charAt(0).toUpperCase()}
                            </div>

                            <div>
                                <strong>{userToDelete.email}</strong>
                                <span>Platform role: {userToDelete.platform_role}</span>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleCloseDeleteModal}
                                disabled={Boolean(deletingUserId)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-danger admin-user-confirm-delete"
                                onClick={confirmDeleteUser}
                                disabled={Boolean(deletingUserId)}
                            >
                                {deletingUserId ? "Deleting..." : "Delete User"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    );
}

export default AdminUsersPage;
