import Http from "./http"
//manager-api

export const searchUserToInvite = (query) =>
  Http.get("/Manager/SearchUserToInvite", { params: { search: query } })
    .then((response) => response.data);


export const inviteUser = async (payload) => Http.post("/Manager/InviteUser", payload)
  .then((response) => response.data)
  .catch((error) => {
    throw new Error(error.response?.data?.message || "Invite user failed");
  });
  
  export const getMembers = (bankId, resourceType) =>
    Http.get(`/Manager/Member/${bankId}/${resourceType}`)
      .then((response) => response.data)
      .catch((error) => {
        throw new Error(error.response?.data?.message || "Get members failed");
      });
  export const removeUser = (bankId, accId) =>
    Http.delete(`/Manager/remove/${bankId}/${accId}`)
      .then((response) => response.data)
      .catch((error) => {
          throw new Error(error.response?.data?.message || "Remove user failed");
      });
      export const updateRole = (bankId, accId, data) =>
        Http.put(`/Manager/UpdateRole/${bankId}/${accId}`, data, {
          headers: {
            "Content-Type": "application/json"
          }
        })
          .then((response) => response.data)
          .catch((error) => {
            throw new Error(error.response?.data?.message || "Update role failed");
          });
      


//auth-api

export const register = (data) => Http.post("/Register", data)

export const login = (data) => Http.post("/Login", data)

export const refreshToken = (data) => Http.post("/Login/refresh", data)

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

export const createExam = (data) => Http.post("/ExamData/GenerateExam", data)

export const createExam3T = (data) => Http.post("/ExamData/GenerateExamByCriteria", data)

export const getExams = () => Http.get("/exam")

export const getExam = (examid) => Http.get(`/Exam/${examid}`)

export const delExam = (examid) => Http.delete(`/Exam/${examid}`);

export const updateExam = (examid, data) => Http.put(`/Exam/${examid}`, data)

export const loadbExams = () => Http.get(`/Exam/loadbs`);

export const loadbExam = (examid) => Http.get(`/Exam/loadb/${examid}`);

export const countQExam = (examid, qtype) => Http.get(`/Exam/${examid}/question-counts`, { params: { qtype } });


export const getSubjectNameById = (subjectId) => Http.get(`/Exam/subject-name/${subjectId}`);

export const updateExamData = (examid, data) => Http.put(`/ExamData/UpdateExamData?examid=${examid}`, data);


//exam-analysis-api

export const getExamResults = (examid) => Http.get(`/Analysis/${examid}`)

export const exportExcel = (examid) => Http.get(`/Analysis/export/${examid}`, { responseType: 'blob' })

//question-api

export const createQuestion = () => Http.get("/")

export const getQuestions = () => Http.get("/")

export const getQuestion = () => Http.get("/")

export const delQuestion = () => Http.delete("/")

export const updateQuestion = () => Http.put("/")

