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
            //accId = 10002;

            // Lấy bài thi từ database
            var exam = await _context.Exams
                .Where(e => e.ExamId == examId)
                .Select(e => new
                {
                    e.ExamId,
                    e.Examname,
                    e.Createdate,
                    e.Examdata,
                    e.AccId, // ID người tạo bài thi
                    e.Subject,
                    e.Grade,
                })
                .FirstOrDefaultAsync();

            if (exam == null)
                return NotFound(new { message = "Bài thi không tồn tại." });

            //// Kiểm tra quyền truy cập (nếu cần, có thể bổ sung kiểm tra AccId)
            //if (exam.AccId != accId)
            //    return Forbid(); // Hoặc có thể trả về Forbidden(403)

            return Ok(new
            {
                examid = exam.ExamId,
                examname = exam.Examname,
                createdate = exam.Createdate,
                examdata = exam.Examdata,
                subject = exam.Subject,
                grade = exam.Grade,
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

            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var examResponse = new ExamResponse
            {
                ExamId = new Random().Next(1, 1000), // Tạo ID ngẫu nhiên cho exam
                ExamName = request.Examname ?? "Generated Exam",
                Questions = new List<DTO.ExamDTO.QuestionEDto>()
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
                        var questionDto = new DTO.ExamDTO.QuestionEDto
                        {
                            QuestionId = question.Quesid,
                            Content = question.Quescontent ?? "No Content",
                            Type = question.Type?.TypeName ?? "Unknown",
                            Answers = new List<AnswerEDto>()
                        };

                        var correctAnswers = await _context.CorrectAnswers
                            .Where(a => a.Quesid == question.Quesid)
                            .ToListAsync();

                        int answerIndex = 1;
                        foreach (var answer in correctAnswers)
                        {
                            questionDto.Answers.Add(new AnswerEDto
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
                            questionDto.Answers.Add(new AnswerEDto
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

            // Kiểm tra quyền xóa
            //var authorizationResult = await _authorizationService.AuthorizeAsync(User, examid, "ExamDelete");
            //if (!authorizationResult.Succeeded)
            //    return Forbid();

            // Tìm exam
            var exam = await _context.Exams
                .FirstOrDefaultAsync(e => e.ExamId == examid && e.AccId == accId);
            if (exam == null)
                return NotFound(new { message = "Không tìm thấy bài kiểm tra hoặc bạn không có quyền xóa." });

            // Xóa tất cả student results liên quan
            var studentResults = await _context.StudentResults
                .Where(sr => sr.ExamId == examid)
                .ToListAsync();
            if (studentResults.Any())
            {
                _context.StudentResults.RemoveRange(studentResults);
            }

            // Xóa exam
            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa thành công bài kiểm tra và kết quả sinh viên." });
        }


        // Api Exam Matrix

        [HttpGet("loadbs")]
        public async Task<IActionResult> GetBankList()
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            // Danh sách BankId được share cho user
            var sharedBankIds = await _context.ResourceAccesses
                .Where(ra =>
                    ra.ResourceType == "Bank" &&
                    ra.Accid == accId.Value &&
                    ra.IsOwner == false)
                .Select(ra => ra.ResourceId!.Value)
                .Distinct()
                .ToListAsync();

            // Các nhóm
            var ownBanks = await _context.Banks
                .Where(b => b.Accid == accId.Value)
                .Select(b => new Bexs { BankId = b.BankId, BankName = b.Bankname })
                .ToListAsync();

            var sharedBanks = await _context.Banks
                .Where(b => sharedBankIds.Contains(b.BankId))
                .Select(b => new Bexs { BankId = b.BankId, BankName = b.Bankname })
                .ToListAsync();

            var systemBanks = await _context.Banks
                .Where(b => b.Accid == null)
                .Select(b => new Bexs { BankId = b.BankId, BankName = b.Bankname })
                .ToListAsync();

            return Ok(new
            {
                ownBanks,
                sharedBanks,
                systemBanks
            });
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

        [HttpGet("shared")]
        public async Task<ActionResult<IEnumerable<ExamDTO>>> GetSharedExams()
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            // 1. Lấy toàn bộ ResourceAccess ghi nhận share Exam cho user này (không phải owner)
            var sharedAccesses = await _context.ResourceAccesses
                .Where(ra =>
                    ra.ResourceType == "Exam" &&
                    ra.Accid == accId &&
                    ra.IsOwner == false)
                .ToListAsync();

            // 2. Tập hợp danh sách ExamId
            var examIds = sharedAccesses
                .Where(ra => ra.ResourceId.HasValue)
                .Select(ra => ra.ResourceId!.Value)
                .Distinct()
                .ToList();

            if (!examIds.Any())
                return Ok(new List<ExamDTO>()); // Trả về mảng rỗng nếu không có share

            // 3. Lấy chi tiết các Exam
            var sharedExams = await _context.Exams
                .Where(e => examIds.Contains(e.ExamId))
                .Select(e => new ExamDTO
                {
                    ExamId = e.ExamId,
                    Examname = e.Examname,
                    Createdate = e.Createdate,
                    AccId = e.AccId
                })
                .ToListAsync();

            return Ok(sharedExams);
        }

        // Cho phép sửa/ thêm câu hỏi vào exam
        [HttpGet("isModify/{examId}")]
        public async Task<ActionResult<bool>> AllowModifyExam(long examId)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var authorizationResult = await _authorizationService
                .AuthorizeAsync(User, examId, "ExamModify");
            if (!authorizationResult.Succeeded)
                return Forbid();

            return Ok(true);
        }

        // Cho phép xóa câu hỏi trong exam
        [HttpGet("isDelete/{examId}")]
        public async Task<ActionResult<bool>> AllowDeleteExam(long examId)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var authorizationResult = await _authorizationService
                .AuthorizeAsync(User, examId, "ExamDelete");
            if (!authorizationResult.Succeeded)
                return Forbid();

            return Ok(true);
        }

        // Cho phép xem phần phân tích kết quả exam
        [HttpGet("isAnalysis/{examId}")]
        public async Task<ActionResult<bool>> AllowAnalysisExam(long examId)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var authorizationResult = await _authorizationService
                .AuthorizeAsync(User, examId, "AnalysisRead");
            if (!authorizationResult.Succeeded)
                return Forbid();

            return Ok(true);
        }

        [HttpGet("isowner/{examId}")]
        public async Task<ActionResult<bool>> IsExamOwner(long examId)
        {
            // Lấy AccId từ token
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            // Kiểm tra trong DB xem có exam nào cùng examId và AccId khớp không
            var isOwner = await _context.Exams
                                .AnyAsync(e => e.ExamId == examId && e.AccId == accId.Value);

            return Ok(isOwner);
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
