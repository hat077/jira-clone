"use client";
import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import api from "@/lib/api";
import Link from "next/link";

export default function ProjectsPage() {
    const { currentOrg } = useWorkspace();
    
    // UI States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    // --- NEW: Data States ---
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- NEW: Fetch Projects when Organization changes ---
    useEffect(() => {
        if (currentOrg) {
            setLoading(true);
            // Notice we use query parameters here: ?organization_id=...
            api.get(`/api/projects/?organization_id=${currentOrg.id}`)
                .then((response) => {
                    setProjects(response.data);
                })
                .catch((error) => console.error("Failed to fetch projects", error))
                .finally(() => setLoading(false));
        }
    }, [currentOrg]);

    async function handleCreateProject() {
        try {
            setIsCreating(true);
            const response = await api.post("/api/projects/", {
                name: newProjectName,
                organization_id: currentOrg.id
            });
            
            // --- NEW: Immediately add the new project to the screen ---
            setProjects([...projects, response.data]);
            
            setIsModalOpen(false);
            setNewProjectName("");
        } catch (error) {
            console.error("Failed to create project", error);
        } finally {
            setIsCreating(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* HEADER AREA */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600">
                        Manage projects for: <span className="font-semibold text-blue-600">{currentOrg?.name}</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                >
                    + New Project
                </button>
            </div>

            {/* MAIN CONTENT AREA */}
            {loading ? (
                <div className="text-gray-500 font-medium py-12 text-center">Loading projects...</div>
            ) : projects.length > 0 ? (
                // --- NEW: The Projects Grid ---
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            href={`/dashboard/projects/${project.id}`}
                            key={project.id}
                            className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group block"
                        >
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {project.name.charAt(0).toUpperCase()}
                            </div>
                            <h3 className="font-semibold text-lg text-gray-900 truncate">{project.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">Software Project</p>
                        </Link>
                    ))}
                </div>
            ) : (
                // --- THE EMPTY STATE ---
                <div className="bg-white border rounded-lg p-12 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
                    <p className="text-gray-500 mt-1 max-w-sm">
                        Get started by creating a new project to track your issues and tasks.
                    </p>
                </div>
            )}

            {/* THE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="font-semibold text-gray-900">Create Project</h2>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mt-4 text-gray-900"
                            placeholder="e.g. Mobile App Redesign"
                        />
                        <div className="mt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={isCreating || newProjectName.trim() === ""}
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