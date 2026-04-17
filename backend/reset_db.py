from app.core.database import engine, Base
# We must import your models so SQLAlchemy knows what tables exist
from app import models

print("Dropping all existing tables...")
Base.metadata.drop_all(bind=engine)

print("Creating fresh, empty tables...")
Base.metadata.create_all(bind=engine)

print("Database reset complete! You can now start Uvicorn.")