"use client";
import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import api from "@/lib/api";

export default function ProfilePage() {
    const { user, currentOrg } = useWorkspace();
    const [currentRole, setCurrentRole] = useState<string>("Loading...");

    // Fetch the user's role for the currently selected workspace
    useEffect(() => {
        if (user && currentOrg) {
            api.get(`/api/organizations/${currentOrg.id}/members`)
                .then(res => {
                    const myMembership = res.data.find((m: any) => m.id === user.id);
                    setCurrentRole(myMembership ? myMembership.role : "Unknown");
                })
                .catch(err => {
                    console.error("Failed to fetch role", err);
                    setCurrentRole("Unavailable");
                });
        }
    }, [user, currentOrg]);

    if (!user) return <div className="p-6">Loading profile...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600">Manage your account details and preferences.</p>
            </div>

            <div className="bg-white p-8 rounded-lg border shadow-sm">
                <div className="flex items-center gap-6 mb-8 border-b pb-8">
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-md">
                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                                Active Account
                            </span>
                            {/* Visual Badge for the Role */}
                            {currentRole !== "Loading..." && (
                                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium uppercase tracking-wide border border-gray-200">
                                    {currentRole}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            disabled
                            value={user.full_name}
                            className="w-full border-gray-200 border rounded p-2 text-gray-500 bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            disabled
                            value={user.email}
                            className="w-full border-gray-200 border rounded p-2 text-gray-500 bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Workspace Role <span className="text-gray-400 font-normal">(in {currentOrg?.name})</span>
                        </label>
                        <input
                            type="text"
                            disabled
                            value={currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                            className="w-full border-gray-200 border rounded p-2 text-gray-500 bg-gray-50 font-medium"
                        />
                    </div>
                    
                    <p className="text-xs text-gray-400 italic pt-4">
                        Note: Password resets and email changes must be requested through a workspace administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}