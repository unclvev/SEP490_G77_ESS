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


        [HttpPost("GenerateExam")]
        public async Task<IActionResult> GenerateExam([FromBody] List<ExamSectionRequest> examSections)
        {
            if (examSections == null || examSections.Count == 0)
                return BadRequest("Invalid exam structure.");

            var selectedQuestions = new List<QuestionDTO>();

            foreach (var section in examSections)
            {
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
                        Type = q.Type?.TypeName ?? "Unknown",
                        ImageUrl = q.ImageUrl, // Gán đường dẫn ảnh nếu có
                        Answers = new List<AnswerDTO>()
                    };

                    if (!string.IsNullOrWhiteSpace(q.AnswerContent))
                    {
                        var answerList = q.AnswerContent
                            .Split(';')
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

            long? accId = await GetAccIdFromToken();

            
            var examDataFormat = new
            {
                ExamCodes = new List<object>
        {
            new
            {
                ExamCode = "", 
                Questions = selectedQuestions
            }
        }
            };

            var exam = new Exam
            {
                Examdata = JsonConvert.SerializeObject(examDataFormat),
                Examname = "Generated Exam",
                Createdate = DateTime.UtcNow,
                AccId = accId
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            return Ok(new { exam.ExamId, exam.Examdata });
        }


        [HttpPut("UpdateExamData")]
        public async Task<IActionResult> UpdateExamData([FromQuery] int examid, [FromBody] ExamUpdateDTO examUpdate)
        {
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (exam == null)
            {
                return NotFound(new { message = $"Exam với examId {examid} không tồn tại." });
            }

            // ✅ Cập nhật các cột rời từ examUpdate.Exam
            if (examUpdate.Exam != null)
            {
                exam.Examname = examUpdate.Exam.ExamName;
                exam.Grade = examUpdate.Exam.Grade;
                exam.Subject = examUpdate.Exam.Subject;
            }

            // ✅ Lưu phần examdata chỉ chứa ExamCodes
            var examData = new
            {
                ExamCodes = examUpdate.ExamCodes
            };

            exam.Examdata = JsonConvert.SerializeObject(examData);

            _context.Exams.Update(exam);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Exam data updated successfully!",
                exam.ExamId,
                exam.Examname,
                exam.Grade,
                exam.Subject,
                exam.Examdata
            });
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
