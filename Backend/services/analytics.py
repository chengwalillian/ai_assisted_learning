from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text, cast, Float, case
from sqlalchemy.sql import expression
from app.database import Student, QuizResult, PerformanceHistory
from typing import List, Dict, Any

class AnalyticsService:
    
    @staticmethod
    async def find_struggling_students(db: AsyncSession, threshold: float = 0.6) -> List[Dict]:
        query = (
            select(
                Student.id,
                Student.name,
                (func.avg(case((QuizResult.is_correct == True, 1), else_=0)) * 100).label('avg_score'),
                func.count(QuizResult.id).label('total_attempts')
            )
            .join(QuizResult, Student.id == QuizResult.student_id)
            .group_by(Student.id, Student.name)
            .having(func.avg(case((QuizResult.is_correct == True, 1), else_=0)) < threshold)
            .order_by(func.avg(case((QuizResult.is_correct == True, 1), else_=0)))
        )
        
        result = await db.execute(query)
        rows = result.fetchall()
        return [
            {
                "student_id": row[0],
                "student_name": row[1],
                "average_score": round(float(row[2]), 2) if row[2] else 0,
                "total_attempts": row[3] or 0
            }
            for row in rows
        ]
    
    @staticmethod
    async def find_hardest_topics(db: AsyncSession, min_attempts: int = 10) -> List[Dict]:
        query = (
            select(
                QuizResult.topic,
                (func.avg(case((QuizResult.is_correct == True, 1), else_=0)) * 100).label('avg_score'),
                func.count(QuizResult.id).label('total_attempts')
            )
            .group_by(QuizResult.topic)
            .having(func.count(QuizResult.id) >= min_attempts)
            .order_by(func.avg(case((QuizResult.is_correct == True, 1), else_=0)))
        )
        
        result = await db.execute(query)
        rows = result.fetchall()
        return [
            {
                "topic": row[0],
                "average_score": round(float(row[1]), 2) if row[1] else 0,
                "total_attempts": row[2] or 0
            }
            for row in rows
        ]
    
    @staticmethod
    async def get_student_performance(db: AsyncSession, student_id: int) -> Dict:
        query = (
            select(
                PerformanceHistory.topic,
                PerformanceHistory.average_score,
                PerformanceHistory.total_attempts,
                PerformanceHistory.correct_attempts,
                PerformanceHistory.average_time_seconds
            )
            .where(PerformanceHistory.student_id == student_id)
            .order_by(PerformanceHistory.average_score)
        )
        
        result = await db.execute(query)
        rows = result.fetchall()
        topic_performances = [
            {
                "topic": row[0],
                "average_score": round(float(row[1]), 2) if row[1] else 0.0,
                "total_attempts": row[2] or 0,
                "correct_attempts": row[3] or 0,
                "average_time_seconds": round(float(row[4]), 2) if row[4] else 0.0
            }
            for row in rows
        ]
        
        student_result = await db.execute(select(Student).where(Student.id == student_id))
        student = student_result.scalar_one_or_none()
        
        stats_query = text("""
            SELECT 
                AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as avg_score,
                COUNT(*) as total_count,
                AVG(time_taken_seconds) as avg_time
            FROM quiz_results
            WHERE student_id = :student_id
        """)
        
        overall = await db.execute(stats_query, {"student_id": student_id})
        overall_row = overall.fetchone()
        
        return {
            "student_id": student_id,
            "student_name": student.name if student else "Unknown",
            "topic_performances": topic_performances,
            "overall_average": round(float(overall_row[0]), 2) if overall_row[0] else 0.0,
            "total_questions": overall_row[1] or 0,
            "average_time_seconds": round(float(overall_row[2]), 2) if overall_row[2] else 0.0
        }
    
    @staticmethod
    async def update_performance_history(db: AsyncSession, student_id: int, topic: str):
    
        update_query = text("""
            INSERT INTO performance_history (student_id, topic, average_score, total_attempts, correct_attempts, average_time_seconds, last_updated)
            SELECT 
                :stud_id,
                :top,
                COALESCE(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 0),
                COUNT(*),
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END),
                COALESCE(AVG(time_taken_seconds), 0),
                CURRENT_TIMESTAMP
            FROM quiz_results
            WHERE student_id = :stud_id2 AND topic = :top2
            ON CONFLICT (student_id, topic) 
            DO UPDATE SET
                average_score = EXCLUDED.average_score,
                total_attempts = EXCLUDED.total_attempts,
                correct_attempts = EXCLUDED.correct_attempts,
                average_time_seconds = EXCLUDED.average_time_seconds,
                last_updated = CURRENT_TIMESTAMP
        """)
        
        await db.execute(update_query, {"stud_id": student_id, "top": topic, "stud_id2": student_id, "top2": topic})
        await db.commit()
    
    @staticmethod
    async def get_class_summary(db: AsyncSession) -> Dict:
        query = text("""
            WITH student_averages AS (
                SELECT 
                    student_id,
                    AVG(CASE WHEN is_correct THEN 100 ELSE 0 END) as student_avg,
                    COUNT(*) as question_count
                FROM quiz_results
                GROUP BY student_id
                HAVING COUNT(*) >= 1
            )
            SELECT 
                COALESCE(COUNT(DISTINCT student_id), 0) as total_students,
                COALESCE(AVG(student_avg), 0) as class_average,
                COALESCE(MIN(student_avg), 0) as lowest_score,
                COALESCE(MAX(student_avg), 0) as highest_score,
                COUNT(CASE WHEN student_avg < 60 THEN 1 END) as struggling_count,
                COUNT(CASE WHEN student_avg >= 80 THEN 1 END) as excelling_count,
                (SELECT COUNT(*) FROM quiz_results) as total_questions,
                COALESCE((SELECT AVG(time_taken_seconds) FROM quiz_results), 0) as average_time_seconds
            FROM student_averages
        """)
        
        result = await db.execute(query)
        summary = result.fetchone()
        
        return {
            "total_students": summary[0] or 0,
            "class_average": round(float(summary[1]), 2) if summary[1] else 0.0,
            "lowest_score": round(float(summary[2]), 2) if summary[2] else 0.0,
            "highest_score": round(float(summary[3]), 2) if summary[3] else 0.0,
            "struggling_count": summary[4] or 0,
            "excelling_count": summary[5] or 0,
            "total_questions": summary[6] or 0,
            "average_time_seconds": round(float(summary[7]), 2) if summary[7] else 0.0
        }