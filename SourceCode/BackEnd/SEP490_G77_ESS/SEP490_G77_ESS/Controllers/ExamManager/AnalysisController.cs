using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.AnalysisDTO;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnalysisController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public AnalysisController(EssDbV11Context context)
        {
            _context = context;
        }

        [HttpGet("{examId}")]
        public async Task<ActionResult<IEnumerable<StudentResultAnalysisDto>>> GetStudentResultsByExamId(long examId)
        {
            var results = await _context.StudentResults
                .Where(r => r.ExamId == examId)
                .Include(r => r.Exam)
                .ToListAsync(); // lấy dữ liệu trước

            var response = results.Select(r => new StudentResultAnalysisDto
            {
                StudentId = r.StudentCode,
                Name = r.StudentName,
                Class = r.Exam?.Classname,
                ExamCode = r.ExamCode,
                Time = r.CreateDate?.ToString("yyyy-MM-dd HH:mm:ss"),
                Score = r.Score,
                //Rank = r.Rank
                ExamName = r.Exam?.Examname,
                Subject = r.Exam?.Subject,
                ExamCreatedDate = r.Exam?.Createdate?.ToString("yyyy-MM-dd HH:mm:ss"),
            }).ToList();

            return Ok(response);
        }
    }
}
