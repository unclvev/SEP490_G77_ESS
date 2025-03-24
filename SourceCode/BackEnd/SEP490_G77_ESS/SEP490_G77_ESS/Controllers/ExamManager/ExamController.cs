using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.ExamDTO;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.BankdDTO;

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

            var exam = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid && e.AccId == accId);
            if (exam == null)
                return NotFound(new { message = "Không tìm thấy bài kiểm tra hoặc bạn không có quyền chỉnh sửa." });

            exam.Examname = newName.NewName;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã cập nhật tên bài kiểm tra thành '{newName}'." });
        }

        //Testing
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

        //In process
        [HttpGet("/loadb")]
        //[Authorize]
        public async Task<IActionResult> GetBanksForEMatrix()
        {
            //var accId = await GetAccIdFromToken();

            var accId = 2;
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            // Lấy danh sách ngân hàng mà người dùng sở hữu
            var ownedBanks = await _context.Banks
                .Where(b => b.Accid == accId)
                .Include(b => b.Sections)
                .ToListAsync();

            // Lấy danh sách ngân hàng mà người dùng có quyền xem
            var accessibleBanks = await _context.BankAccesses
                .Where(ba => ba.Accid == accId && ba.Canview == true)
                .Select(ba => ba.Bank)
                .Include(b => b.Sections)
                .ToListAsync();

            // Gộp danh sách và loại bỏ trùng lặp
            var banks = ownedBanks
                .Concat(accessibleBanks)
                .DistinctBy(b => b.BankId) // Loại bỏ trùng lặp theo BankId
                .Select(b => new BankDto
                {
                    BankId = b.BankId,
                    BankName = b.Bankname,
                    Sections = b.Sections.Select(s => new SectionDto
                    {
                        Secid = s.Secid,
                        Secname = s.Secname
                    }).ToList()
                })
                .ToList();

            return Ok(banks);
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
    }
}
