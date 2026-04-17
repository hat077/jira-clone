from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)

def test_register_user():
    email = f"test_{uuid.uuid4()}@example.com"
    response = client.post("/api/users/register", json={"email": email, "full_name": "Test User", "password": "testpassword"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Test User"

def test_login_user():
    email = f"test_{uuid.uuid4()}@example.com"
    password = "testpassword"
    client.post("/api/users/register", json={"email": email, "full_name": "Test User", "password": password})
    response = client.post("/api/users/login", data={"username": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data