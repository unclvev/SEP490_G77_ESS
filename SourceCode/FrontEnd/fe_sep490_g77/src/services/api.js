import Http from "./http"

//auth-api

export const register = (data) => Http.post("/Register", data)

export const login = (data) => Http.post("/Login", data)

//exam-api

export const createExam = () => Http.get("/")

export const getExams = () => Http.get("/exam")

export const getExam = (examid) => Http.get(`/Exam/${examid}`)

export const delExam = (examid) => Http.delete(`/Exam/${examid}`);

export const updateExam = (examid, data) => Http.put(`/Exam/${examid}`, data)

export const loadbExams = () => Http.get(`/Exam/loadbs`);

export const loadbExam = (bankId) => Http.get(`/Exam/loadb/${bankId}`);

export const countQExam = (examid) => Http.get(`/Exam/${examid}/question-counts`);

//question-api

export const createQuestion = () => Http.get("/")

export const getQuestions = () => Http.get("/")

export const getQuestion = () => Http.get("/")

export const delQuestion = () => Http.delete("/")

export const updateQuestion = () => Http.put("/")

