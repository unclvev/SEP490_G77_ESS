import Http from "./http"

//auth-api

export const register = (data) => Http.post("/Register", data)

export const login = (data) => Http.post("/Login", data)

export const forgotPassword = (data) =>
    Http.get("/ForgotPassword/forgot-password", { params: data });
export const resetPassword = (params) => {
    return Http.post("/ForgotPassword/reset-password", null, { params });
  };
  
  
  //profile-api
  export const getProfile = () => Http.get("/Profile/info");

  export const updateProfile = (data) => Http.put("/Profile/update", data);
  
  export const changePassword = (data) => Http.put("/Profile/changePassword", data);

//exam-api

export const createExam = () => Http.get("/")

export const getExams = () => Http.get("/exam")

//export const getExam = () => Http.get("/exam")

export const delExam = (examid) => Http.delete(`/Exam/${examid}`)

export const updateExam = (examid, data) => Http.put(`/Exam/${examid}`, data)

//question-api

export const createQuestion = () => Http.get("/")

export const getQuestions = () => Http.get("/")

export const getQuestion = () => Http.get("/")

export const delQuestion = () => Http.delete("/")

export const updateQuestion = () => Http.put("/")

