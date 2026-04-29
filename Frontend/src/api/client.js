    import axios from 'axios';

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const apiClient = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
        'Content-Type': 'application/json',
        },
    });

    // Request interceptor
    apiClient.interceptors.request.use(
    (config) => {
        console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
    );

    // Response interceptor
    apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
    );

    // API Functions
    export const api = {
    // Health check
    health: () => apiClient.get('/health'),

    // Student endpoints
    createStudent: (name, email) => apiClient.post('/students', { name, email }),
    getStudent: (studentId) => apiClient.get(`/students/${studentId}`),
    lookupStudent: (name) => {
        return apiClient.get(`/students/lookup?name=${encodeURIComponent(name)}`);
    },

    // Quiz endpoints
    submitAnswer: (submission) => apiClient.post('/quiz/submit', submission),
    generateQuestion: (topic, difficulty, previousQuestions = []) =>
        apiClient.post('/quiz/generate-question', { topic, difficulty, previous_questions: previousQuestions }),
    getSimilarQuestions: (questionId) => apiClient.get(`/quiz/similar-questions/${questionId}`),

    // Analytics endpoints
    getClassSummary: () => apiClient.get('/analytics/class-summary'),
    getTopicBreakdown: (topic = null) =>
        apiClient.get(`/analytics/topic-breakdown${topic ? `?topic=${topic}` : ''}`),
    getStrugglingStudents: (threshold = 0.6) =>
        apiClient.get(`/analytics/struggling-students?threshold=${threshold}`),
    getHardestTopics: (minAttempts = 10) =>
        apiClient.get(`/analytics/hardest-topics?min_attempts=${minAttempts}`),
    getStudentPerformance: (studentId) =>
        apiClient.get(`/analytics/student-performance/${studentId}`),
    getAllStudents: () =>
        apiClient.get('/analytics/all-students'),
    getQuizHistory: (studentId, topic = null) => {
        const params = new URLSearchParams();
        if (topic) params.append('topic', topic);
        return apiClient.get(`/analytics/quiz-history/${studentId}?${params.toString()}`);
    },
    };

    export default apiClient;