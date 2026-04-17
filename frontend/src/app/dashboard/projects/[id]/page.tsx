"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function ProjectBoardPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [project, setProject] = useState<any>(null);
    const [issues, setIssues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [newIssueTitle, setNewIssueTitle] = useState("");
    const [newIssueDescription, setNewIssueDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newCommentText, setNewCommentText] = useState("");
    const [isCommenting, setIsCommenting] = useState(false);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
    const [projectMembers, setProjectMembers] = useState<any[]>([]);
    const { currentOrg, user } = useWorkspace();
    const currentUserRole = projectMembers.find(m => m.id === user?.id)?.role || "viewer";
    const isViewer = currentUserRole === "viewer";
    const isAdmin = currentUserRole === "admin";
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPriority, setFilterPriority] = useState("all");
    const [filterAssignee, setFilterAssignee] = useState("all");

    useEffect(() => {
        if (projectId) {
            setLoading(true);
            Promise.all([
                api.get(`/api/projects/${projectId}`),
                api.get(`/api/issues/?project_id=${projectId}`),
                api.get(`/api/projects/${projectId}/members`)
            ])
            .then(([projectRes, issuesRes, membersRes]) => {
                setProject(projectRes.data);
                setIssues(issuesRes.data);
                setProjectMembers(membersRes.data);
            })
            .catch((error) => console.error("Failed to fetch board data", error))
            .finally(() => setLoading(false));
        }
    }, [projectId]);

    useEffect(() => {
        if (selectedIssue) {
            Promise.all([
                api.get(`/api/issues/${selectedIssue.id}/comments`),
                api.get(`/api/issues/${selectedIssue.id}/activity`)
            ])
            .then(([commentsRes, logsRes]) => {
                setComments(commentsRes.data);
                setActivityLogs(logsRes.data);
            })
            .catch(err => console.error("Failed to fetch issue details", err));
        } else {
            setComments([]);
            setActivityLogs([]);
            setActiveTab('comments');
        }
    }, [selectedIssue]);

    async function refreshActivityLogs(issueId: string) {
        try {
            const res = await api.get(`/api/issues/${issueId}/activity`);
            setActivityLogs(res.data);
        } catch (error) {
            console.error("Failed to refresh logs", error);
        }
    }

    async function handleCreateIssue() {
        try {
            setIsCreating(true);
            const response = await api.post("/api/issues/", {
                title: newIssueTitle,
                description: newIssueDescription,
                project_id: projectId,
                status: "todo",
                priority: "medium"
            });
            setIssues([...issues, response.data]);
            setIsIssueModalOpen(false);
            setNewIssueTitle("");
            setNewIssueDescription("");
        } catch (error) {
            console.error("Failed to create issue", error);
        } finally {
            setIsCreating(false);
        }
    }

    async function handleStatusChange(newStatus: string, issueId: string) {
        try {
            setIsUpdating(true);
            // Optimistic UI Update: Change it on screen instantly
            setIssues(currentIssues => currentIssues.map(issue => 
                issue.id === issueId ? { ...issue, status: newStatus } : issue
            ));
            
            if (selectedIssue && selectedIssue.id === issueId) {
                setSelectedIssue({ ...selectedIssue, status: newStatus });
            }

            await api.patch(`/api/issues/${issueId}`, { status: newStatus });
            await refreshActivityLogs(issueId);
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleAssigneeChange(newAssigneeId: string | null, issueId: string) {
        try {
            setIsUpdating(true);
            setIssues(currentIssues => currentIssues.map(issue =>
                issue.id === issueId ? { ...issue, assignee_id: newAssigneeId } : issue
            ));
            
            if (selectedIssue && selectedIssue.id === issueId) {
                setSelectedIssue({ ...selectedIssue, assignee_id: newAssigneeId });
            }

            await api.patch(`/api/issues/${issueId}`, { assignee_id: newAssigneeId });
            await refreshActivityLogs(issueId);
        } catch (error) {
            console.error("Failed to update assignee", error);
        } finally {
            setIsUpdating(false);
        }
    }

    async function handlePriorityChange(newPriority: string, issueId: string) {
        try {
            setIsUpdating(true);
            // Optimistic UI Update
            setIssues(currentIssues => currentIssues.map(issue =>
                issue.id === issueId ? { ...issue, priority: newPriority } : issue
            ));
            
            if (selectedIssue && selectedIssue.id === issueId) {
                setSelectedIssue({ ...selectedIssue, priority: newPriority });
            }

            await api.patch(`/api/issues/${issueId}`, { priority: newPriority });
            await refreshActivityLogs(issueId);
        } catch (error) {
            console.error("Failed to update priority", error);
        } finally {
            setIsUpdating(false);
        }
    }

    async function handleAddComment() {
        if (!newCommentText.trim() || !selectedIssue) return;

        try {
            setIsCommenting(true);
            const response = await api.post(`/api/issues/${selectedIssue.id}/comments`, {
                content: newCommentText
            });

            setComments([...comments, response.data]);
            setNewCommentText("");
        } catch (error) {
            console.error("Failed to add comment", error);
        } finally {
            setIsCommenting(false);
        }
    }

    async function handleDeleteProject() {
        // Double-confirm because this is a destructive action
        if (!confirm(`Are you absolutely sure you want to delete "${project?.name}"? All tickets will be permanently lost.`)) return;
        
        try {
            await api.delete(`/api/projects/${projectId}`);
            // Force a redirect back to the main dashboard
            window.location.href = '/dashboard';
        } catch (error: any) {
            alert(error.response?.data?.detail || "Failed to delete project.");
        }
    }

    const onDragEnd = (result: DropResult) => {
        if (isViewer) return;

        const { destination, source, draggableId } = result;

        // If dropped outside a column, do nothing
        if (!destination) return;

        // If dropped in the exact same spot, do nothing
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // The droppableId is exactly our status ("todo", "in_progress", "done")
        const newStatus = destination.droppableId;
        
        // Fire our existing status change function!
        handleStatusChange(newStatus, draggableId);
    };

    if (loading) {
        return <div className="text-gray-500 py-12 text-center font-medium">Loading board...</div>;
    }

    const filteredIssues = issues.filter(issue => {
        // 1. Match Text Search
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        // 2. Match Priority
        const matchesPriority = filterPriority === "all" || issue.priority === filterPriority;
        
        // 3. Match Assignee
        const matchesAssignee = filterAssignee === "all" ||
            (filterAssignee === "me" && issue.assignee_id === user?.id) ||
            (filterAssignee === "unassigned" && !issue.assignee_id);

        return matchesSearch && matchesPriority && matchesAssignee;
    });

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">{project?.name || "Project Board"}</h1>
                    
                    {/* NEW: Admin-only Delete Button */}
                    {isAdmin && (
                        <button
                            onClick={handleDeleteProject}
                            className="text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition-colors"
                        >
                            Delete Project
                        </button>
                    )}
                </div>
                {!isViewer && (
                    <button
                        onClick={() => setIsIssueModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                    >
                        + Create Issue
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-3 rounded-lg border shadow-sm">
                {/* Search Input */}
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Filter tickets by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-gray-200 border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-900"
                    />
                </div>

                {/* Assignee Filter */}
                <select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="border-gray-200 border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-900"
                >
                    <option value="all">Everyone's Tickets</option>
                    <option value="me">Only My Tickets</option>
                    <option value="unassigned">Unassigned</option>
                </select>

                {/* Priority Filter */}
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="border-gray-200 border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-900"
                >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                </select>
                
                {/* Clear Filters Button */}
                {(searchQuery || filterPriority !== "all" || filterAssignee !== "all") && (
                    <button
                        onClick={() => { setSearchQuery(""); setFilterPriority("all"); setFilterAssignee("all"); }}
                        className="text-sm text-gray-500 hover:text-red-600 px-2 font-medium"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* THE DRAG DROP CONTEXT WRAPS THE COLUMNS */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
                    
                    {/* COLUMN: TO DO */}
                    <div className="bg-gray-200/70 border border-gray-300/50 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col">
                        <h3 className="font-semibold text-gray-700 mb-4 uppercase text-sm">To Do</h3>
                        <Droppable droppableId="todo">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-3 flex-1 overflow-y-auto min-h-[200px]"
                                >
                                    {filteredIssues.filter(i => i.status === "todo").map((issue, index) => (
                                        <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => setSelectedIssue(issue)}
                                                    className="bg-white p-4 rounded shadow-sm border border-gray-200 hover:border-blue-400 select-none"
                                                >
                                                    <h4 className="font-medium text-gray-900">{issue.title}</h4>
                                                    {issue.assignee_id === user?.id && (
                                                        <div className="mt-3 flex justify-end">
                                                            <div
                                                                className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold border border-blue-200" 
                                                                title={user?.full_name}
                                                            >
                                                                {user?.full_name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* COLUMN: IN PROGRESS */}
                    <div className="bg-gray-200/70 border border-gray-300/50 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col">
                        <h3 className="font-semibold text-gray-700 mb-4 uppercase text-sm">In Progress</h3>
                        <Droppable droppableId="in_progress">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-3 flex-1 overflow-y-auto min-h-[200px]"
                                >
                                    {filteredIssues.filter(i => i.status === "in_progress").map((issue, index) => (
                                        <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => setSelectedIssue(issue)}
                                                    className="bg-white p-4 rounded shadow-sm border border-gray-200 hover:border-blue-400 select-none"
                                                >
                                                    <h4 className="font-medium text-gray-900">{issue.title}</h4>
                                                    {issue.assignee_id === user?.id && (
                                                        <div className="mt-3 flex justify-end">
                                                            <div
                                                                className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold border border-blue-200" 
                                                                title={user?.full_name}
                                                            >
                                                                {user?.full_name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* COLUMN: DONE */}
                    <div className="bg-gray-200/70 border border-gray-300/50 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col">
                        <h3 className="font-semibold text-gray-700 mb-4 uppercase text-sm">Done</h3>
                        <Droppable droppableId="done">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-3 flex-1 overflow-y-auto min-h-[200px]"
                                >
                                    {filteredIssues.filter(i => i.status === "done").map((issue, index) => (
                                        <Draggable key={issue.id} draggableId={issue.id.toString()} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => setSelectedIssue(issue)}
                                                    className="bg-white p-4 rounded shadow-sm border border-gray-200 hover:border-blue-400 select-none"
                                                >
                                                    <h4 className="font-medium text-gray-900 line-through opacity-70">{issue.title}</h4>
                                                    {issue.assignee_id === user?.id && (
                                                        <div className="mt-3 flex justify-end">
                                                            <div
                                                                className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold border border-blue-200" 
                                                                title={user?.full_name}
                                                            >
                                                                {user?.full_name?.charAt(0).toUpperCase()}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>

                </div>
            </DragDropContext>

            {/* CREATE ISSUE MODAL (Unchanged) */}
            {isIssueModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="font-semibold text-gray-900">Create New Issue</h2>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newIssueTitle}
                                    onChange={(e) => setNewIssueTitle(e.target.value)}
                                    className="border rounded p-2 w-full text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={newIssueDescription}
                                    onChange={(e) => setNewIssueDescription(e.target.value)}
                                    className="border rounded p-2 w-full text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none h-24"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-2">
                            <button onClick={() => setIsIssueModalOpen(false)} className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium">Cancel</button>
                            <button onClick={handleCreateIssue} disabled={isCreating || newIssueTitle.trim() === ""} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50">
                                {isCreating ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ISSUE DETAILS MODAL */}
            {selectedIssue && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-900">{selectedIssue.title}</h2>
                            <button onClick={() => setSelectedIssue(null)} className="text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="flex gap-6 flex-1 overflow-y-auto">
                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                                    <div className="bg-gray-50 p-4 rounded border text-gray-800 min-h-[100px] whitespace-pre-wrap">
                                        {selectedIssue.description || "No description provided."}
                                    </div>
                                </div>
                                <div className="mt-8 border-t pt-6">
                                    <div className="flex space-x-4 mb-4 border-b">
                                        <button
                                            onClick={() => setActiveTab('comments')}
                                            className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'comments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Comments
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            History
                                        </button>
                                    </div>
                                    
                                    {activeTab === 'comments' ? (
                                        <>
                                            {/* The List of Comments */}
                                            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                                {comments.length === 0 ? (
                                                    <p className="text-gray-500 text-sm italic">No comments yet. Be the first to start the conversation!</p>
                                                ) : (
                                                    comments.map(comment => (
                                                        <div key={comment.id} className="bg-white p-3 rounded border shadow-sm text-sm">
                                                            <div className="font-semibold text-blue-600 mb-1">
                                                                {projectMembers.find(m => m.id === comment.user_id)?.full_name || "Unknown User"} 
                                                                {comment.user_id === user?.id ? " (Me)" : ""}
                                                            </div>
                                                            <div className="text-gray-800 whitespace-pre-wrap">{comment.content}</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* The Input Field */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCommentText}
                                                    onChange={(e) => setNewCommentText(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    className="flex-1 border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                    readOnly={isViewer}
                                                />
                                                <button
                                                    onClick={handleAddComment}
                                                    disabled={isCommenting || !newCommentText.trim() || isViewer}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {isCommenting ? "..." : "Send"}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        /* The History Audit Trail */
                                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                            {activityLogs.length === 0 ? (
                                                <p className="text-gray-500 text-sm italic">No activity recorded yet.</p>
                                            ) : (
                                                activityLogs.map(log => (
                                                    <div key={log.id} className="text-sm flex items-start gap-2 text-gray-600">
                                                        <span className="text-gray-400 mt-0.5">⚡</span>
                                                        <div>
                                                            <span className="font-semibold text-gray-900">System Record: </span>
                                                            {log.action} from <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                                                {projectMembers.find(m => m.id === log.old_value)?.full_name || log.old_value || "None"}
                                                            </span> to <span className="font-mono text-xs bg-gray-100 px-1 rounded">
                                                                {projectMembers.find(m => m.id === log.new_value)?.full_name || log.new_value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-64 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                                    <select
                                        value={selectedIssue.status}
                                        onChange={(e) => handleStatusChange(e.target.value, selectedIssue.id)}
                                        disabled={isUpdating || isViewer}
                                        className="w-full border rounded p-2 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assignee</label>
                                    <select
                                        value={selectedIssue.assignee_id || ""}
                                        onChange={(e) => handleAssigneeChange(e.target.value === "" ? null : e.target.value, selectedIssue.id)}
                                        disabled={isUpdating || isViewer}
                                        className="w-full border rounded p-2 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Unassigned</option>
                                        {projectMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.full_name} {member.id === user?.id ? "(Me)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={selectedIssue.priority || "medium"}
                                        onChange={(e) => handlePriorityChange(e.target.value, selectedIssue.id)}
                                        disabled={isUpdating || isViewer}
                                        className="w-full border rounded p-2 text-gray-900 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="low">🟢 Low</option>
                                        <option value="medium">🟡 Medium</option>
                                        <option value="high">🔴 High</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}