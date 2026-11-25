
import { useCallback, useEffect, useState } from "react";
import {
    Search,
    Users,
    ShieldCheck,
    UserRound,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from "lucide-react";

import { Alert } from "../components/Alert";
import { adminService } from "../services/adminService";

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

    async function handleRoleChange(user) {
        const newRole =
            user.platform_role === "ADMIN" ? "USER" : "ADMIN";

        const action =
            newRole === "ADMIN" ? "promote" : "demote";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} ${user.email} ${newRole === "ADMIN"
                ? "to ADMIN"
                : "to USER"
            }?`
        );

        if (!confirmed) return;

        setUpdatingUserId(user.id);
        setError("");
        setNotice("");

        try {
            await adminService.updateUserRole(user.id, newRole);

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
                >
                    <RefreshCw size={16} />
                    Refresh
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
                                <th>Action</th>
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

                                    const isUpdating =
                                        updatingUserId === user.id;

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
                                                <button
                                                    className={`admin-user-action ${isAdmin
                                                            ? "admin-user-demote"
                                                            : "admin-user-promote"
                                                        }`}
                                                    onClick={() =>
                                                        handleRoleChange(user)
                                                    }
                                                    disabled={
                                                        Boolean(updatingUserId)
                                                    }
                                                >
                                                    {isUpdating
                                                        ? "Updating..."
                                                        : isAdmin
                                                            ? "Demote"
                                                            : "Promote"}
                                                </button>
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
                        >
                            <ChevronRight size={17} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AdminUsersPage;
