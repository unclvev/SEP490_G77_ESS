import Http from "./http";


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

export const googleLogin = (data) => Http.post('/AuthGoogle/GoogleLogin', data);

export const register = (data) => Http.post("/Register", data)

export const login = (data) => Http.post("/Login", data)

export const forgotPassword = (data) =>
    Http.get("/ForgotPassword/forgot-password", { params: data });

export const resetPassword = ({ token, newPassword }) => {
  return Http.post("/ForgotPassword/reset-password", { 
    token, 
    newPassword 
  });
};
  
//profile-api
export const getProfile = () => Http.get("/Profile/info");

export const updateProfile = (data) => Http.put("/Profile/update", data);
  
export const changePassword = (data) => Http.put("/Profile/changePassword", data);

//bank-api
export const loadGrade = () => Http.get("/Bank/grades");

export const loadSubject = () => Http.get("/Bank/subjects");

export const loadCurriculums = () => Http.get("/Bank/curriculums");

export const createBank = (accId, data) => Http.post(`/Bank/generate/${accId}`, data);

export const getBankInfo = (bankId) => Http.get(`/Bank/default/${bankId}`);

export const getBankSections = (bankId) => Http.get(`/Bank/default/${bankId}/sections`);

export const getQuestionsBySection = (sectionId) => Http.get(`/Bank/default/${sectionId}/questions`);

export const getQuestionTypes = () => Http.get(`/Question/types`);

export const getLevels = () => Http.get(`/Question/levels`);

export const getUserBanks = (accId, filters = {}) => Http.get(`/Bank/account/${accId}`, { params: filters });

export const getESSBanks = (filters = {}) => Http.get(`/Bank/default-banks`, { params: filters });

export const updateBankName = (bankId, data) => Http.put(`/Bank/${bankId}/name`, data);

export const deleteBank     = (bankId) => Http.delete(`/Bank/${bankId}`);

export const getBankInfoById = (bankId) => Http.get(`/Bank/${bankId}`);

export const getBankSectionsById = (bankId) => Http.get(`/Bank/${bankId}/sections`);

export const addMainSection = (bankId, data) => Http.post(`/Bank/${bankId}/add-section`, data);

export const addSubSection = (sectionId, data) => Http.post(`/Bank/${sectionId}/add-subsection`, data);

export const updateSection = (sectionId, data) => Http.put(`/Bank/section/${sectionId}`, data);

export const deleteSection = (sectionId) => Http.delete(`/Bank/section/${sectionId}`);

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


export const createQuestion = (data) => Http.post(`/Question/questions`, data);

export const updateQuestion = (quesid, data) => Http.put(`/Question/questions/${quesid}`, data);

export const deleteQuestion = (quesid) => Http.delete(`/Question/questions/${quesid}`);

export const exportQuestionsExcel = (sectionId) => Http.get(`/Question/${sectionId}/export-excel`, { responseType: 'blob' });

export const importQuestionsExcel = (sectionId, formData) =>
  Http.post(`/Question/${sectionId}/import-excel`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

export const uploadQuestionImage = (base64Image) =>
  Http.post(`/Question/upload-image-base64`, { base64Image });

// essay-api

export const getGrades = () => Http.get("/essay/grades");

export const getSubjects = () => Http.get("/essay/subjects");

export const getEssaysByAccount = (accId, params) => Http.get(`/essay/by-account/${accId}`, { params });

export const deleteEssay = (id) => Http.delete(`/essay/delete/${id}`);

export const createEssay = (accId, data) => Http.post(`/essay/create/${accId}`, data);

export const updateEssay = (id, data) => Http.put(`/essay/update/${id}`, data);

export const saveStudentList = (formData) => Http.post("/essay/savestudentlist", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

// bank-api

export const getBankGrades = () => Http.get("/Bank/grades");

export const getBankSubjects = () => Http.get("/Bank/subjects");

export const getBankCurriculums = () => Http.get("/Bank/curriculums");

export const generateBank = (accId, data) => Http.post(`/Bank/generate/${accId}`, data);

export const getDefaultBank = (bankId) => Http.get(`/Bank/default/${bankId}`);

export const getDefaultSections = (bankId) => Http.get(`/Bank/default/${bankId}/sections`);

export const getDefaultQuestions = (sectionId) => Http.get(`/Bank/default/${sectionId}/questions`);

// question-api

export const getBanksByAccount = (accid, params) => Http.get(`/Bank/account/${accid}`, { params });

export const getDefaultBanks = (params) => Http.get(`/Bank/default-banks`, { params });

// 📚 Question Bank Section APIs

export const getBankById = (bankId) => Http.get(`/Bank/${bankId}`);

export const getSectionsByBankId = (bankId) => Http.get(`/Bank/${bankId}/sections`);

export const editSection = (sectionId, data) => Http.put(`/Bank/section/${sectionId}`, data);

export const getQuestions = (sectionId) => Http.get(`/Question/questions`, { params: { sectionId } });

export const uploadImageBase64 = (base64Image) => Http.post(`/Question/upload-image-base64`, { base64Image });

export const importQuestionExcel = (sectionId, formData) => 
  Http.post(`/Question/${sectionId}/import-excel`, formData, { headers: { "Content-Type": "multipart/form-data" } });

export const exportQuestionExcel = (sectionId) => {
  window.location.href = `http://localhost:7052/api/Question/${sectionId}/export-excel`;
};
