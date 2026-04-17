"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function TeamPage() {
    const { currentOrg, user } = useWorkspace();
    const [members, setMembers] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [inviteStatus, setInviteStatus] = useState("");
    const currentUserRole = members.find(m => m.id === user?.id)?.role || "member";
    const isAdmin = currentUserRole === "admin";

    // Fetch current members when the page loads
    useEffect(() => {
        if (currentOrg) {
            // Note: You might need to make a quick GET route for this in FastAPI!
            api.get(`/api/organizations/${currentOrg.id}/members`)
                .then(res => setMembers(res.data))
                .catch(err => console.error(err));
        }
    }, [currentOrg]);

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setInviteStatus("Inviting...");
        try {
            await api.post(`/api/organizations/${currentOrg.id}/invite`, {
                email: inviteEmail,
                role: inviteRole
            });
            setInviteStatus("User added successfully!");
            setInviteEmail("");
            // Refresh the member list here...
        } catch (error: any) {
            setInviteStatus(error.response?.data?.detail || "Failed to invite user.");
        }
    }

    async function handleRemoveMember(memberId: string, memberName: string) {
        if (!confirm(`Are you sure you want to remove ${memberName} from the workspace?`)) return;

        try {
            await api.delete(`/api/organizations/${currentOrg.id}/members/${memberId}`);
            // Filter them out of the UI instantly so we don't have to reload the page
            setMembers(members.filter(m => m.id !== memberId));
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to remove user.");
        }
    }

    if (!currentOrg) return <div className="p-8">Loading workspace...</div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Settings</h1>
                <p className="text-gray-600">Manage access for {currentOrg.name}</p>
            </div>

            {/* Invite Box */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-gray-900">Invite a Team Member</h2>
                <form onSubmit={handleInvite} className="flex gap-4">
                    <input
                        type="email"
                        required
                        placeholder="colleague@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
                    />
                    {/* --- ROLE DROPDOWN --- */}
                    <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-900"
                    >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                    </select>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700">
                        Invite
                    </button>
                </form>
                {inviteStatus && <p className="mt-2 text-sm text-blue-600 font-medium">{inviteStatus}</p>}
            </div>

            {/* Team List */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-800">Current Members</h2>
                </div>
                <ul className="divide-y divide-gray-200">
                    {members.map((member, i) => (
                        <li key={i} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                    {member.full_name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{member.full_name}</p>
                                        {/* Show a little badge for their role */}
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 uppercase tracking-wide">
                                            {member.role}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                            </div>

                            {/* Show the Remove button ONLY if I am an Admin, and this person is NOT me */}
                            {isAdmin && member.id !== user?.id && (
                                <button
                                    onClick={() => handleRemoveMember(member.id, member.full_name)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}