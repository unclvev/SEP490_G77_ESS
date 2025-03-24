import Http from "./http"

//auth-api

export const register = (data) => Http.post("/Register", data)

export const login = (data) => Http.post("/Login", data)

//exam-api

export const createExam = () => Http.get("/")

export const getExams = () => Http.get("/exam")

//export const getExam = () => Http.get("/exam")

export const delExam = (examid) => Http.delete(`/Exam/${examid}`);

export const updateExam = (examid, data) => Http.put(`/Exam/${examid}`, data)

export const getSubjectNameById = (subjectId) => Http.get(`/Exam/subject-name/${subjectId}`)

//exam-analysis-api
export const getExamResults = (examid) => Http.get(`/Analysis/${examid}`)

//question-api

export const createQuestion = () => Http.get("/")

export const getQuestions = () => Http.get("/")

export const getQuestion = () => Http.get("/")

export const delQuestion = () => Http.delete("/")

export const updateQuestion = () => Http.put("/")

