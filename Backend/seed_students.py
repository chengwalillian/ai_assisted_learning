import asyncio
from sqlalchemy import select
from app.database import Student, engine, AsyncSessionLocal

async def seed_students():
    async with AsyncSessionLocal() as db:
        # Check existing students
        result = await db.execute(select(Student))
        existing = result.scalars().all()
        print(f"Found {len(existing)} existing students")
        
        # Add test students
        test_students = [
            Student(name="Alice Johnson", email="alice@school.com"),
            Student(name="Bob Smith", email="bob@school.com"),
            Student(name="Charlie Brown", email="charlie@school.com"),
            Student(name="Diana Prince", email="diana@school.com"),
            Student(name="Eve Wilson", email="eve@school.com"),
        ]
        
        for s in test_students:
            db.add(s)
        
        await db.commit()
        print("Added 5 test students")
        
        # Verify
        result = await db.execute(select(Student))
        all_students = result.scalars().all()
        print(f"Total students now: {len(all_students)}")
        for s in all_students:
            print(f"  - {s.name} ({s.email})")

if __name__ == "__main__":
    asyncio.run(seed_students())