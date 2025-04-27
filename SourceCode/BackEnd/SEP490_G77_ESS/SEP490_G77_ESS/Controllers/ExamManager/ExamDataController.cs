using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SEP490_G77_ESS.DTO.ExamDTO;
using SEP490_G77_ESS.Models;
using System.Security.Claims;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamDataController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public ExamDataController(EssDbV11Context context)
        {
            _context = context;
        }

        private async Task<long?> GetAccIdFromToken()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
            return account?.AccId;
        }

        [HttpGet]
        public async Task<IActionResult> GetExamData(int examid)
        {
            Exam edata = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (edata != null)
            {
                return Content(edata.Examdata, "application/json");
            }
            else
            {
                return NotFound();
            }
        }


        [HttpPost]
        public async Task<IActionResult> AddExamDataDemo([FromQuery] int examid, [FromBody] ExamDataDTO examData)
        {
            var edata = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (edata == null)
            {
                return NotFound();
            }

            // Chuyển examData thành chuỗi JSON để lưu vào ExamData
            string jsonData = JsonConvert.SerializeObject(examData);

            // Cập nhật ExamData
            edata.Examdata = jsonData;

            // Lưu vào database
            _context.Exams.Update(edata);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam data added successfully!" });
        }


        //Demo Data
        [HttpPost("AddExamDataDemo")]
        public async Task<IActionResult> AddExamDataDemo([FromQuery] int examid)
        {
            var edata = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (edata == null)
            {
                return NotFound();
            }

            // Tạo dữ liệu mẫu
            var examData = new ExamDataDTO
            {
                ExamId = examid,
                ExamName = "Sample Exam",
                Questions = new List<QuestionDTO>
            {
                new QuestionDTO
                {
                    QuestionId = 1,
                    Content = "What is 2 + 2?",
                    Type = "Multiple Choice",
                    Answers = new List<AnswerDTO>
                    {
                        new AnswerDTO { AnswerId = 1, Content = "3", IsCorrect = false },
                        new AnswerDTO { AnswerId = 2, Content = "4", IsCorrect = true },
                        new AnswerDTO { AnswerId = 3, Content = "5", IsCorrect = false }
                    }
                },
                new QuestionDTO
                {
                    QuestionId = 2,
                    Content = "What is the capital of France?",
                    Type = "Multiple Choice",
                    Answers = new List<AnswerDTO>
                    {
                        new AnswerDTO { AnswerId = 4, Content = "Berlin", IsCorrect = false },
                        new AnswerDTO { AnswerId = 5, Content = "Paris", IsCorrect = true },
                        new AnswerDTO { AnswerId = 6, Content = "Madrid", IsCorrect = false }
                    }
                }
            }
            };

            // Chuyển dữ liệu thành JSON string
            string jsonData = JsonConvert.SerializeObject(examData);

            // Cập nhật Examdata
            edata.Examdata = jsonData;

            // Lưu vào database
            _context.Exams.Update(edata);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam data added successfully!", data = examData });
        }

        //create exam from data
        //example data:
        /*Cấu trúc đề thi: [
            {
                "sectionId": "10004",
                "easy": 2,
                "medium": 0,
                "hard": 0
            },
            {
                "sectionId": "10002",
                "easy": 0,
                "medium": 0,
                "hard": 0
            }
        ]*/

        [HttpPost("GenerateExam")]
        public async Task<IActionResult> GenerateExam([FromBody] List<ExamSectionRequest> examSections)
        {
            if (examSections == null || examSections.Count == 0)
            {
                return BadRequest("Invalid exam structure.");
            }

            var selectedQuestions = new List<QuestionDTO>();

            foreach (var section in examSections)
            {
                // Lấy các câu hỏi theo section với điều kiện theo mức độ khó (Modeid)
                // và include các dữ liệu cần thiết như CorrectAnswers và Type.
                var questionsRaw = await _context.Questions
                    .Include(q => q.CorrectAnswers)
                    .Include(q => q.Type)
                    .Where(q => q.Secid == section.SectionId && q.TypeId == 1 &&
                                ((q.Modeid == 1 && section.Easy > 0) ||
                                 (q.Modeid == 2 && section.Medium > 0) ||
                                 (q.Modeid == 3 && section.Hard > 0)))
                    .OrderBy(r => Guid.NewGuid())
                    .Take(section.Easy + section.Medium + section.Hard)
                    .ToListAsync();

                foreach (var q in questionsRaw)
                {
                    var questionDTO = new QuestionDTO
                    {
                        QuestionId = q.Quesid,
                        Content = q.Quescontent,
                        Type = q.Type != null ? q.Type.TypeName : "Unknown",
                        Answers = new List<AnswerDTO>()
                    };

                    // Nếu có dữ liệu trong AnswerContent thì tách các đáp án
                    if (!string.IsNullOrWhiteSpace(q.AnswerContent))
                    {
                        var answerList = q.AnswerContent
                            .Split(',')
                            .Select(ans => ans.Trim())
                            .Where(ans => !string.IsNullOrEmpty(ans))
                            .ToList();

                        int answerIdCounter = 1;
                        foreach (var answer in answerList)
                        {
                            bool isCorrect = q.CorrectAnswers
                                .Any(ca => string.Equals(ca.Content?.Trim(), answer, StringComparison.OrdinalIgnoreCase));

                            questionDTO.Answers.Add(new AnswerDTO
                            {
                                AnswerId = answerIdCounter++,
                                Content = answer,
                                IsCorrect = isCorrect
                            });
                        }
                    }

                    selectedQuestions.Add(questionDTO);
                }
            }

            // long? accId = await GetAccIdFromToken();
            long? accId = 15;

            var examData = new ExamDataDTO
            {
                ExamId = 0,
                ExamName = "Generated Exam",
                Questions = selectedQuestions
            };

            var exam = new Exam
            {
                Examdata = JsonConvert.SerializeObject(examData),
                Examname = "Generated Exam",
                Createdate = DateTime.UtcNow,
                AccId = accId
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            examData.ExamId = exam.ExamId;
            exam.Examdata = JsonConvert.SerializeObject(examData);
            _context.Exams.Update(exam);
            await _context.SaveChangesAsync();

            return Ok(new { exam.ExamId, exam.Examdata });
        }

        //update exam data in exam preview
        [HttpPut("UpdateExamData")]
        public async Task<IActionResult> UpdateExamData([FromQuery] int examid, [FromBody] ExamUpdateDTO examUpdate)
        {
            // Tìm kiếm exam theo examid
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (exam == null)
            {
                return NotFound(new { message = $"Exam với examId {examid} không tồn tại." });
            }

            // Cập nhật tên đề thi từ phần Exam của DTO
            if (examUpdate.Exam != null)
            {
                exam.Examname = examUpdate.Exam.ExamName;
            }

            // Tạo đối tượng chứa toàn bộ dữ liệu: exam info và examdata (Questions)
            var fullExamData = new
            {
                exam = examUpdate.Exam,       // chứa ExamName, Grade, Subject
                examdata = examUpdate.Examdata  // chứa danh sách câu hỏi
            };

            // Serialize đối tượng fullExamData thành chuỗi JSON
            string jsonData = JsonConvert.SerializeObject(fullExamData);
            exam.Examdata = jsonData;

            // Cập nhật vào database
            _context.Exams.Update(exam);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam data updated successfully!", exam.ExamId, exam.Examdata });
        }

        [HttpPost("GenerateExamByCriteria")]
        public async Task<IActionResult> GenerateExamByCriteria([FromBody] List<ExamSection3TDTO> examSections)
        {
            if (examSections == null || examSections.Count == 0)
            {
                return BadRequest("Cấu trúc đề thi không hợp lệ.");
            }

            // Danh sách lưu trữ tất cả câu hỏi được chọn từ các section
            var selectedQuestions = new List<QuestionDTO>();

            // Lặp qua từng mục examSectionCriteria được gửi từ client.
            // Với mỗi mục, API sẽ thực hiện 3 bước:
            // 1 - Chọn ngẫu nhiên các câu hỏi Easy (Modeid = 1) có TypeId = examSection.Qtype
            // 2 - Chọn ngẫu nhiên các câu hỏi Medium (Modeid = 2) có TypeId = examSection.Qtype
            // 3 - Chọn ngẫu nhiên các câu hỏi Hard (Modeid = 3) có TypeId = examSection.Qtype
            foreach (var section in examSections)
            {
                // --- Bước 1: Lấy các câu hỏi Easy (Modeid = 1) ---
                if (section.Counts.Easy > 0)
                {
                    var easyQuestions = await _context.Questions
                        .Where(q => q.Secid == section.SectionId
                                    && q.Modeid == 1
                                    && q.TypeId == section.TypeId)
                        .OrderBy(q => Guid.NewGuid()) // Sắp xếp ngẫu nhiên
                        .Take(section.Counts.Easy)
                        .Select(q => new QuestionDTO
                        {
                            QuestionId = q.Quesid,
                            Content = q.Quescontent,
                            Type = q.Type.TypeName,
                            Answers = _context.CorrectAnswers
                                      .Where(a => a.Quesid == q.Quesid)
                                      .Select(a => new AnswerDTO
                                      {
                                          AnswerId = a.AnsId,
                                          Content = a.Content,
                                          IsCorrect = true
                                      })
                                      .ToList()
                        })
                        .ToListAsync();

                    selectedQuestions.AddRange(easyQuestions);
                }

                // --- Bước 2: Lấy các câu hỏi Medium (Modeid = 2) ---
                if (section.Counts.Medium > 0)
                {
                    var mediumQuestions = await _context.Questions
                        .Where(q => q.Secid == section.SectionId
                                    && q.Modeid == 2
                                    && q.TypeId == section.TypeId)
                        .OrderBy(q => Guid.NewGuid())
                        .Take(section.Counts.Medium)
                        .Select(q => new QuestionDTO
                        {
                            QuestionId = q.Quesid,
                            Content = q.Quescontent,
                            Type = q.Type.TypeName,
                            Answers = _context.CorrectAnswers
                                      .Where(a => a.Quesid == q.Quesid)
                                      .Select(a => new AnswerDTO
                                      {
                                          AnswerId = a.AnsId,
                                          Content = a.Content,
                                          IsCorrect = true
                                      })
                                      .ToList()
                        })
                        .ToListAsync();

                    selectedQuestions.AddRange(mediumQuestions);
                }

                // --- Bước 3: Lấy các câu hỏi Hard (Modeid = 3) ---
                if (section.Counts.Hard > 0)
                {
                    var hardQuestions = await _context.Questions
                        .Where(q => q.Secid == section.SectionId
                                    && q.Modeid == 3
                                    && q.TypeId == section.TypeId)
                        .OrderBy(q => Guid.NewGuid())
                        .Take(section.Counts.Hard)
                        .Select(q => new QuestionDTO
                        {
                            QuestionId = q.Quesid,
                            Content = q.Quescontent,
                            Type = q.Type.TypeName,
                            Answers = _context.CorrectAnswers
                                      .Where(a => a.Quesid == q.Quesid)
                                      .Select(a => new AnswerDTO
                                      {
                                          AnswerId = a.AnsId,
                                          Content = a.Content,
                                          IsCorrect = true
                                      })
                                      .ToList()
                        })
                        .ToListAsync();

                    selectedQuestions.AddRange(hardQuestions);
                }
            }

            // Sau khi lấy đủ các câu hỏi (từ cả 3 nhóm: TypeId = 1, 2 và 3),
            // ta xây dựng examData bằng cách gộp tất cả các câu hỏi lại.
            var examData = new ExamDataDTO
            {
                ExamId = 0,
                ExamName = "Generated Exam",
                Questions = selectedQuestions
            };

            // Ví dụ sử dụng accId cố định (15). Ở thực tế, có thể lấy từ token hoặc theo logic nghiệp vụ khác.
            long? accId = 15;
            var exam = new Exam
            {
                Examdata = JsonConvert.SerializeObject(examData),
                Examname = "Generated Exam",
                Createdate = DateTime.UtcNow,
                AccId = accId
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            // Cập nhật ExamData.ExamId với Exam.ExamId mới tạo, lưu lại vào trường Examdata của Exam
            examData.ExamId = exam.ExamId;
            exam.Examdata = JsonConvert.SerializeObject(examData);
            _context.Exams.Update(exam);
            await _context.SaveChangesAsync();

            // Trả về dữ liệu JSON của exam, đồng thời Examdata đã lưu được cập nhật với danh sách câu hỏi
            return Ok(new { exam.ExamId, exam.Examdata });
        }







        //generate muti-examcode 


    }
}
