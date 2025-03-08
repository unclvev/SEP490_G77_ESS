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
    }
}
