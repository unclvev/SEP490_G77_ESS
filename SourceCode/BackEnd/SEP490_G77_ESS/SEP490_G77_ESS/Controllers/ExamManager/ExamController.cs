using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.ExamDTO;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.BankdDTO;
using Microsoft.Identity.Client;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ExamController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly IAuthorizationService _authorizationService;
        public ExamController(EssDbV11Context context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        private async Task<long?> GetAccIdFromToken()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
            return account?.AccId;
        }

        [HttpGet("{examId}")]
        public async Task<IActionResult> GetExamById(int examId)
        {
            //var accId = await GetAccIdFromToken();
            //if (accId == null)
            //    return Unauthorized(new { message = "Không thể xác định tài khoản." });
            var accId = 15;

            // Lấy bài thi từ database
            var exam = await _context.Exams
                .Where(e => e.ExamId == examId)
                .Select(e => new
                {
                    e.ExamId,
                    e.Examname,
                    e.Createdate,
                    e.Examdata,
                    e.AccId // ID người tạo bài thi
                })
                .FirstOrDefaultAsync();

            if (exam == null)
                return NotFound(new { message = "Bài thi không tồn tại." });

            // Kiểm tra quyền truy cập (nếu cần, có thể bổ sung kiểm tra AccId)
            if (exam.AccId != accId)
                return Forbid(); // Hoặc có thể trả về Forbidden(403)

            return Ok(new
            {
                examid = exam.ExamId,
                examname = exam.Examname,
                createdate = exam.Createdate,
                examdata = exam.Examdata
            });
        }


        // Api Exam Manager

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateExam([FromBody] ExamDTO newExam)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var exam = new Exam
            {
                Examname = newExam.Examname,
                Createdate = DateTime.UtcNow,
                AccId = accId.Value
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã tạo bài kiểm tra '{exam.Examname}' thành công." });
        }

        [HttpPost("generate")]
        //[Authorize]
        public async Task<IActionResult> GenerateExam([FromBody] ExamRequest request)
        {
            if (request?.GenerateData?.Topics == null || !request.GenerateData.Topics.Any())
                return BadRequest("Dữ liệu đầu vào không hợp lệ.");

            var examResponse = new ExamResponse
            {
                ExamId = new Random().Next(1, 1000), // Tạo ID ngẫu nhiên cho exam
                ExamName = request.Examname ?? "Generated Exam",
                Questions = new List<DTO.ExamDTO.QuestionDto>()
            };

            foreach (var topic in request.GenerateData.Topics)
            {
                foreach (var level in topic.Levels)
                {
                    var levelCode = level.Key; // "RL", "U", "A"
                    var code = -1;
                    if (levelCode == "RL")
                    {
                        code = 1;
                    }
                    if (levelCode == "U")
                    {
                        code = 2;
                    }
                    if (levelCode == "A")
                    {
                        code = 3;
                    }
                    var count = level.Value;

                    var questions = await _context.Questions
                        .Where(q => q.Secid == topic.SectionId && q.Mode!.LevelId == code)
                        .OrderBy(r => Guid.NewGuid()) // Random câu hỏi
                        .Take(count)
                        .ToListAsync();

                    foreach (var question in questions)
                    {
                        var questionDto = new DTO.ExamDTO.QuestionDto
                        {
                            QuestionId = question.Quesid,
                            Content = question.Quescontent ?? "No Content",
                            Type = question.Type?.TypeName ?? "Unknown",
                            Answers = new List<AnswerDto>()
                        };

                        var correctAnswers = await _context.CorrectAnswers
                            .Where(a => a.Quesid == question.Quesid)
                            .ToListAsync();

                        int answerIndex = 1;
                        foreach (var answer in correctAnswers)
                        {
                            questionDto.Answers.Add(new AnswerDto
                            {
                                AnswerId = answer.AnsId,
                                Content = answer.Content ?? "No Answer",
                                IsCorrect = true
                            });
                            answerIndex++;
                        }

                        // Thêm các câu sai (giả định)
                        while (questionDto.Answers.Count < 3) // Đảm bảo có ít nhất 3 đáp án
                        {
                            questionDto.Answers.Add(new AnswerDto
                            {
                                AnswerId = new Random().Next(1000, 9999),
                                Content = "Wrong Answer " + answerIndex,
                                IsCorrect = false
                            });
                            answerIndex++;
                        }

                        examResponse.Questions.Add(questionDto);
                    }
                }
            }

            return Ok(examResponse);
        }


        //Testingdotnet ef dbcontext scaffold "Server=DESKTOP-N81N3JT\SA;Database=ess_db_v11;uid=sa;pwd=123;" Microsoft.EntityFrameworkCore.SqlServer --output-dir Models -f
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<ExamDTO>>> GetExamByUser()
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var userExams = await _context.Exams
                .Where(e => e.AccId == accId)
                .Select(e => new ExamDTO
                {
                    ExamId = e.ExamId,
                    Examname = e.Examname,
                    Createdate = e.Createdate,
                    AccId = e.AccId
                })
                .ToListAsync();

            return Ok(userExams);
        }

        //Testing
        [HttpPut("{examid}")]
        [Authorize]
        public async Task<IActionResult> UpdateExamName(int examid, [FromBody] ExamName newName)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });
            var authorizationResult = await _authorizationService.AuthorizeAsync(User, examid, "ExamModify");
            if (!authorizationResult.Succeeded)
                return Forbid();
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid && e.AccId == accId);
            if (exam == null)
                return NotFound(new { message = "Không tìm thấy bài kiểm tra hoặc bạn không có quyền chỉnh sửa." });

            exam.Examname = newName.NewName;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã cập nhật tên bài kiểm tra thành '{newName}'." });
        }

        //Testing
        [HttpDelete("{examid}")]
        public async Task<IActionResult> DeleteExamById(int examid)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });
            var authorizationResult = await _authorizationService.AuthorizeAsync(User, examid, "ExamDelete");
            if (!authorizationResult.Succeeded)
                return Forbid();
            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid && e.AccId == accId);
            if (exam == null)
                return NotFound(new { message = "Không tìm thấy bài kiểm tra hoặc bạn không có quyền xóa." });

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa thành công bài kiểm tra." });
        }

        // Api Exam Matrix

        [HttpGet("loadbs")]
        public async Task<IActionResult> GetBankList()
        {
            var banks = await _context.Banks
                .Select(b => new Bexs
                {
                    BankId = b.BankId,
                    BankName = b.Bankname
                })
                .ToListAsync();

            return Ok(banks);
        }

        //In process
        [HttpGet("loadb/{bankId}")]
        public async Task<IActionResult> GetBankById(long bankId)
        {
            var bank = await _context.Banks
                .Where(b => b.BankId == bankId)
                .Include(b => b.Sections)
                    .ThenInclude(s => s.SectionHierarchyAncestors)
                .Include(b => b.Sections)
                    .ThenInclude(s => s.SectionHierarchyDescendants)
                .FirstOrDefaultAsync();

            if (bank == null) return NotFound("Ngân hàng không tồn tại.");

            var bankDetails = new BexDTO
            {
                BankId = bank.BankId,
                BankName = bank.Bankname,
                Sections = bank.Sections.Select(s => new BexSectionDTO
                {
                    SecId = s.Secid,
                    SecName = s.Secname,
                    BankId = s.BankId,
                    Ancestors = s.SectionHierarchyAncestors
                        .Select(a => new BexSectionHierarchyDTO
                        {
                            SectionHierarchyId = a.SectionHierarchyId,
                            AncestorId = a.AncestorId,
                            DescendantId = a.DescendantId,
                            Depth = a.Depth
                        }).ToList(),
                    Descendants = s.SectionHierarchyDescendants
                        .Select(d => new BexSectionHierarchyDTO
                        {
                            SectionHierarchyId = d.SectionHierarchyId,
                            AncestorId = d.AncestorId,
                            DescendantId = d.DescendantId,
                            Depth = d.Depth
                        }).ToList()
                }).ToList()
            };

            return Ok(bankDetails);
        }

        [HttpGet("{secid}/question-counts")]
        public async Task<IActionResult> GetQuestionCounts(long secid, [FromQuery] int qtype)
        {
            // Lấy danh sách Level từ database
            var levels = await _context.Levels.ToListAsync();

            // Load section theo secid, bao gồm Questions với quan hệ với Mode và Type
            var section = await _context.Sections
                .Include(s => s.Questions)
                    .ThenInclude(q => q.Mode)
                .Include(s => s.Questions)
                    .ThenInclude(q => q.Type)
                .FirstOrDefaultAsync(s => s.Secid == secid);

            if (section == null)
            {
                return NotFound(new { message = "Section not found" });
            }

            // Đếm các câu hỏi cho từng Level dựa theo:
            // - Mode của câu hỏi không null và Level của Mode khớp với level hiện tại
            // - Type của câu hỏi không null và TypeId khớp với tham số qtype truyền vào
            var questionCounts = levels.Select(level => new
            {
                Level = level.Levelname,
                Count = section.Questions.Count(q =>
                    q.Mode != null && q.Mode.LevelId == level.LevelId &&
                    q.Type != null && q.Type.TypeId == qtype)
            }).ToList();

            return Ok(questionCounts);
        }



        [HttpGet("subject-name/{subjectId}")]
        public async Task<IActionResult> GetSubjectNameById(string subjectId)
        {
            var subject = await _context.Subjects.Where(s => s.SubjectName == subjectId).FirstOrDefaultAsync();
            if (subject == null)
            {
                return NotFound(new { message = "Không tìm thấy môn học với ID đã cho." });
            }
            return Ok(new
            {
                subjectName = subject.SubjectName
            });
        }
        //get all exam
        [HttpGet("allexam")]
        public async Task<IActionResult> GetAllExam()
        {
            var results = await _context.Exams
                .ToListAsync();

            return Ok(results);
        }

        //get exams by accid
        [HttpGet("accid/{accId}")]
        public async Task<IActionResult> GetAllExamFromAccId(long accId)
        {
            var results = await _context.Exams
                .Where(b => b.AccId == accId)
                .ToListAsync();

            return Ok(results);
        }

        ////get mcq exams by accid
        //[HttpGet("mcq/accid/{accId}")]
        //public async Task<IActionResult> GetAllMCQExamFromAccId(long accId)
        //{
        //    var results = await _context.Exams
        //        .Where(b => b.AccId == accId)
        //        .ToListAsync();

        //    return Ok(results);
        //}

        ////get essay exams by accid
        //[HttpGet("essay/accid/{accId}")]
        //public async Task<IActionResult> GetAllEssayExamFromAccId(long accId)
        //{
        //    var results = await _context.Exams
        //        .Where(b => b.AccId == accId)
        //        .ToListAsync();

        //    return Ok(results);
        //}
    }

}
