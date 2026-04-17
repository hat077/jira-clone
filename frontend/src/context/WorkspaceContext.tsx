"use client";
import React, { createContext, useState } from "react";

interface WorkspaceContextType {
    currentOrg: any;
    setCurrentOrg: (org: any) => void;
    organizations: any[];
    setOrganizations: (orgs: any[]) => void;
    // 1. ADD USER TO THE INTERFACE
    user: any;
    setUser: (user: any) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children } : { children: React.ReactNode }) {
    const [currentOrg, setCurrentOrg] = useState<any>(null);
    const [organizations, setOrganizations] = useState<any[]>([]);
    // 2. ADD USER STATE HERE
    const [user, setUser] = useState<any>(null);

    return (
        // 3. ADD USER TO THE PROVIDER VALUE
        <WorkspaceContext.Provider value={{ currentOrg, setCurrentOrg, organizations, setOrganizations, user, setUser}}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = React.useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}