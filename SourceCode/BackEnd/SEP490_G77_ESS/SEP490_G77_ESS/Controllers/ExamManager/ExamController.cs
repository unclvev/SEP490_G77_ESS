using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.ExamDTO;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public ExamController(EssDbV11Context context)
        {
            _context = context;
        }

        private async Task<long?> GetAccIdFromToken()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
            return account?.AccId;
        }

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

        [HttpPut("{examid}")]
        [Authorize]
        public async Task<IActionResult> UpdateExamName(int examid, [FromBody] string newName)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid && e.AccId == accId);
            if (exam == null)
                return NotFound(new { message = "Không tìm thấy bài kiểm tra hoặc bạn không có quyền chỉnh sửa." });

            exam.Examname = newName;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã cập nhật tên bài kiểm tra thành '{newName}'." });
        }

        [HttpDelete("{examid}")]
        [Authorize]
        public async Task<IActionResult> DeleteExamById(int examid)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

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
        public async Task<IActionResult> GetSubjectNameById(long subjectId)
        {
            var subject = await _context.Subjects.FindAsync(subjectId);
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
    }

}
