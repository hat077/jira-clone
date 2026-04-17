from fastapi import FastAPI
from app.api import users, organizations, projects, issues
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Jira Clone API")

origins = [
    "http://localhost:3000",
    "https://jira-clone-eight-blond.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["Organizations"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues"])