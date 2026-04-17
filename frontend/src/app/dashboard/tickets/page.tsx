"use client";
import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useWorkspace } from "@/context/WorkspaceContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function MyTicketsPage() {
    const [issues, setIssues] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { currentOrg } = useWorkspace();

    useEffect(() => {
        if (!currentOrg) return;

        setLoading(true);
        Promise.all([
            api.get("/api/issues/me"),
            api.get(`/api/projects/?organization_id=${currentOrg.id}`)
        ])
        .then(([issuesRes, projectsRes]) => {
            setIssues(issuesRes.data);
            setProjects(projectsRes.data);
        })
        .catch(err => console.error("Failed to fetch dashboard data", err))
        .finally(() => setLoading(false));
    }, [currentOrg]);

    if (loading) {
        return <div className="p-8 text-gray-500 font-medium">Gathering your tasks...</div>;
    }

    // --- DATA AGGREGATION FOR CHARTS ---
    
    // 1. Data for the Donut Chart (Status)
    const statusData = [
        { name: 'To Do', value: issues.filter(i => i.status === 'todo').length, color: '#9CA3AF' }, // Gray
        { name: 'In Progress', value: issues.filter(i => i.status === 'in_progress').length, color: '#3B82F6' }, // Blue
        { name: 'Done', value: issues.filter(i => i.status === 'done').length, color: '#10B981' } // Green
    ].filter(d => d.value > 0); // Hide empty slices

    // 2. Data for the Bar Chart (Priority)
    const priorityData = [
        { name: 'High', count: issues.filter(i => i.priority === 'high').length, fill: '#EF4444' }, // Red
        { name: 'Medium', count: issues.filter(i => i.priority === 'medium').length, fill: '#F59E0B' }, // Yellow
        { name: 'Low', count: issues.filter(i => i.priority === 'low').length, fill: '#10B981' } // Green
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
                <p className="text-gray-600">Your personal productivity and assigned tasks.</p>
            </div>

            {/* --- ANALYTICS WIDGETS --- */}
            {issues.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Widget 1: Task Completion Donut */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center">
                        <h3 className="font-semibold text-gray-800 mb-4 w-full text-left">Task Completion</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex gap-4 mt-2 text-sm font-medium text-gray-600">
                            {statusData.map(d => (
                                <div key={d.name} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                    {d.name} ({d.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Widget 2: Workload by Priority Bar Chart */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
                        <h3 className="font-semibold text-gray-800 mb-4">Workload by Priority</h3>
                        <div className="h-64 w-full mt-auto">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TASK LIST --- */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-4 border-b bg-gray-50/50">
                    <h2 className="font-semibold text-gray-800">Active Tasks ({issues.length})</h2>
                </div>
                
                {issues.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">No assigned tickets</h3>
                        <p className="text-gray-500">You are all caught up! Enjoy your free time.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {issues.map(issue => (
                            <li key={issue.id} className="p-6 hover:bg-gray-50 transition-colors group">
                                <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                            {issue.title}
                                        </h4>
                                        <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            {projects.find(p => p.id === issue.project_id)?.name || "Loading project..."}
                                        </p>
                                        
                                        <div className="flex items-center gap-3 mt-3 text-sm font-medium">
                                            <span className={`px-2.5 py-1 rounded-md text-xs uppercase tracking-wider ${
                                                issue.status === 'done' ? 'bg-green-100 text-green-800' :
                                                issue.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {issue.status.replace("_", " ")}
                                            </span>
                                            
                                            <span className="text-gray-300">•</span>
                                            <span className="text-gray-500 flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    issue.priority === 'high' ? 'bg-red-500' :
                                                    issue.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}></div>
                                                {issue.priority}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <Link
                                        href={`/dashboard/projects/${issue.project_id}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all bg-white"
                                    >
                                        Go to Board &rarr;
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}