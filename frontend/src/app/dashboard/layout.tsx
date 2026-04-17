"use client";
import React, { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { currentOrg, setCurrentOrg, organizations, setOrganizations, user, setUser } = useWorkspace();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [globalSearchQuery, setGlobalSearchQuery] = useState("");

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false); // Close it!
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const token = Cookies.get("access_token");

        if (!token) {
            router.push("/login");
            return;
        }

        // 3. Parallel Fetching: Using Promise.all to wait for both responses at once
        Promise.all([
            api.get("/api/users/me"),
            api.get("/api/organizations")
        ])
        .then(([userRes, orgRes]) => {
            setUser(userRes.data);
            setOrganizations(orgRes.data);
            
            // Auto-select the first workspace if they have any
            if (orgRes.data.length > 0) {
                setCurrentOrg(orgRes.data[0]);
            }
        })
        .catch(() => {
            // If the token is expired or invalid, clear it and kick them out
            Cookies.remove("access_token");
            router.push("/login");
        })
        .finally(() => {
            // Turning off loading no matter what (success or error)
            setLoading(false);
        });
    }, [router]);

    // 4. Logout Handler
    const handleLogout = () => {
        Cookies.remove("access_token");
        router.push("/login");
    };

    // 5. The "Guard": This prevents the page from crashing while 'user' is null
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 font-semibold">
                Loading your workspace...
            </div>
        );
    }

    async function handleCreateOrg() {
        try {
            setIsCreating(true);
            const response = await api.post("/api/organizations", { name: newOrgName });
            setOrganizations([...organizations, response.data]);
            setCurrentOrg(response.data);
            setIsModalOpen(false);
            setNewOrgName("");
        } catch (error) {
            console.error("Failed to create organization", error);
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r shadow-sm flex flex-col">
                <div className="p-4 font-bold text-xl border-b text-blue-600">
                    JiraClone
                </div>
                
                <nav className="p-4 flex-1 space-y-4 flex flex-col">
                    {/* Organization Selector Area */}
                    <div className="relative">
                        {organizations.length > 0 ? (
                            <>
                                <button
                                    onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                                    className="w-full text-left text-gray-900 hover:bg-gray-50 p-2 rounded border flex items-center justify-between font-medium"
                                >
                                    {currentOrg?.name || "Select Organization"}
                                    <svg className={`w-4 h-4 transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isOrgDropdownOpen && (
                                    <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow-lg z-20 py-1">
                                        {/* 1. Map over existing workspaces */}
                                        {organizations.map((org) => (
                                            <button
                                                key={org.id}
                                                onClick={() => {
                                                    setCurrentOrg(org);
                                                    setIsOrgDropdownOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                {org.name}
                                            </button>
                                        ))}
                                        
                                        {/* 2. The Create button lives INSIDE the dropdown menu now! */}
                                        <hr className="my-1 border-gray-200" />
                                        <button
                                            onClick={() => {
                                                setIsOrgDropdownOpen(false);
                                                setIsModalOpen(true);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                                        >
                                            + Create new workspace
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* 3. The true "Empty State" button */
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full bg-blue-600 text-white p-2 rounded font-medium hover:bg-blue-700"
                            >
                                + Create Workspace
                            </button>
                        )}
                    </div>

                    <div className="space-y-1 flex flex-col">
                        <Link href="/dashboard/projects" className="text-gray-700 hover:bg-gray-50 p-2 rounded font-medium">Projects</Link>
                        <Link href="/dashboard/tickets" className="text-gray-700 hover:bg-gray-50 p-2 rounded font-medium">My Tickets</Link>
                        <Link href="/dashboard/team" className="text-gray-700 hover:bg-gray-50 p-2 rounded font-medium">Team</Link>
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col">
                {/* TOP NAVIGATION BAR */}
                <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm">
                    
                    {/* Left/Middle: Global Search Bar Placeholder */}
                    <div className="flex-1 max-w-2xl text-gray-900">
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                {/* Search Icon */}
                                <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search tickets across all projects..."
                                value={globalSearchQuery}
                                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && globalSearchQuery.trim()) {
                                        router.push(`/dashboard/search?q=${encodeURIComponent(globalSearchQuery)}`);
                                        setGlobalSearchQuery("");
                                    }
                                }}
                                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Right: User Profile (Pushed to the right by the search bar) */}
                    <div className="relative ml-6" ref={dropdownRef}>
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none"
                        >
                            <span className="text-gray-700 font-medium hidden sm:block">
                                {user?.full_name}
                            </span>
                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                                {user?.full_name?.charAt(0).toUpperCase() || "U"}
                            </div>
                        </button>

                        {/* The Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50">
                                {/* Mobile-only User Info */}
                                <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                
                                {/* App Navigation */}
                                <div className="py-1">
                                    <Link href="/dashboard/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        Profile Settings
                                    </Link>
                                    <Link href="/dashboard/team" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                        Workspace Members
                                    </Link>
                                </div>

                                <hr className="my-1 border-gray-100" />
                                
                                {/* Logout Action */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </header>
            
                <div className="p-6">
                    {children}
                </div>
            </main>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="font-semibold text-gray-900">Create Workspace</h2>
                        <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mt-4 text-gray-900"
                        />
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateOrg}
                                disabled={isCreating || newOrgName.trim() === ""}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
                            >
                                {isCreating ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}