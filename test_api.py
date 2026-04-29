import asyncio
import httpx

async def test_system():
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
    
        print("\n Testing health...")
        resp = await client.get(f"{base_url}/health")
        print(f"Health: {resp.json()}")
        
        # Create student
        print("\n Creating student...")
        resp = await client.post(
            f"{base_url}/students",
            json={"name": "Test Student", "email": "test@example.com"}
        )
        
        if resp.status_code == 200:
            student = resp.json()
            student_id = student['id']
            print(f"Student created: {student['name']} (ID: {student_id})")
        else:
            print("Could not create student, trying to list...")
            student_id = 1
        
        # Submit wrong answer
        print("\n Submitting answer...")
        resp = await client.post(
            f"{base_url}/quiz/submit",
            json={
                "student_id": student_id,
                "topic": "Python",
                "question": "What is 2**3?",
                "student_answer": "6",
                "correct_answer": "8",
                "time_taken_seconds": 10.5
            }
        )
        
        if resp.status_code == 200:
            result = resp.json()
            print(f"Result: {'✓ Correct' if result['is_correct'] else '✗ Incorrect'}")
            print(f"Feedback: {result['ai_feedback'][:150]}...")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
        
        print("\n Test complete!")

if __name__ == "__main__":
    asyncio.run(test_system())