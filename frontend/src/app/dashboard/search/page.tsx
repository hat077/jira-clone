"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";
import Link from "next/link";

export default function SearchResultsPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q");
    const { currentOrg } = useWorkspace();
    
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query && currentOrg) {
            setLoading(true);
            api.get(`/api/issues/search?q=${query}&org_id=${currentOrg.id}`)
                .then(res => setResults(res.data))
                .catch(err => console.error("Search failed", err))
                .finally(() => setLoading(false));
        }
    }, [query, currentOrg]);

    if (loading) return <div className="p-6">Searching across workspace...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">
                Search Results for "{query}"
            </h1>

            {results.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-lg border shadow-sm text-gray-500">
                    No tickets found matching your search.
                </div>
            ) : (
                <ul className="space-y-3">
                    {results.map(issue => (
                        <li key={issue.id} className="bg-white p-4 rounded-lg border shadow-sm hover:border-blue-400 transition-colors">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-gray-900 text-lg">{issue.title}</h4>
                                    <div className="flex items-center gap-3 mt-2 text-sm">
                                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs uppercase tracking-wide font-medium">
                                            {issue.status.replace("_", " ")}
                                        </span>
                                        <span className="text-gray-500">• Priority: {issue.priority}</span>
                                    </div>
                                </div>
                                <Link
                                    href={`/dashboard/projects/${issue.project_id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                                >
                                    Go to Project &rarr;
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}