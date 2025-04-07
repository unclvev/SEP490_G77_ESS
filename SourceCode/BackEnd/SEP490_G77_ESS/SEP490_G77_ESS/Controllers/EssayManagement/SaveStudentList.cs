using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Controllers.EssayManagement
{
    [Route("api/essay")]
    [ApiController]
    public class EssayExamController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public EssayExamController(EssDbV11Context context)
        {
            _context = context;
        }

        [HttpPost("savestudentlist")]
        public IActionResult UploadExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file hoặc file rỗng.");
            }

            return Ok("Import thành công!");
        }

        [HttpGet("by-account/{accId}")]
        public async Task<IActionResult> GetExamsByAccount(int accId, [FromQuery] string? grade, [FromQuery] string? subject, [FromQuery] string? classname)
        {
            var query = _context.Exams
                .Where(e => e.ExamType
                == "Essay" && e.AccId == accId);

            if (!string.IsNullOrEmpty(grade))
                query = query.Where(e => e.Grade == grade);

            if (!string.IsNullOrEmpty(subject))
                query = query.Where(e => e.Subject == subject);

            if (!string.IsNullOrEmpty(classname))
                query = query.Where(e => e.Classname == classname);

            var result = await query
                .OrderByDescending(e => e.Createdate)
                .Select(e => new
                {
                    id = e.ExamId,
                    title = e.Examname,
                    createdDate = e.Createdate,
                    grade = e.Grade,
                    subject = e.Subject,
                    nameClass = e.Classname
                })
                .ToListAsync();

            return Ok(result);
        }
        [HttpPost("create/{accId}")]
        public async Task<IActionResult> CreateExam(int accId, [FromBody] Exam exam)
        {
            exam.AccId = accId;
            exam.ExamType = "Essay";
            exam.Createdate = DateTime.Now;

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tạo đề thành công", examId = exam.ExamId });
        }


        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateExam(long id, [FromBody] Exam updatedExam)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null) return NotFound();

            exam.Examname = updatedExam.Examname;
            exam.Classname = updatedExam.Classname;
            exam.Grade = updatedExam.Grade;
            exam.Subject = updatedExam.Subject;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteExam(long id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null) return NotFound();

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xoá thành công" });
        }

        [HttpGet("grades")]
        public async Task<IActionResult> GetGrades()
        {
            var grades = await _context.Grades.Select(g => g.GradeLevel).ToListAsync();
            return Ok(grades);
        }

        [HttpGet("subjects")]
        public async Task<IActionResult> GetSubjects()
        {
            var subjects = await _context.Subjects.Select(s => s.SubjectName).ToListAsync();
            return Ok(subjects);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchExamsByAccount([FromQuery] int accId, [FromQuery] string keyword)
        {
            var result = await _context.Exams
                .Where(e => e.ExamType == "Essay"
                         && e.AccId == accId
                         && e.Examname.Contains(keyword))
                .OrderByDescending(e => e.Createdate)
                .Select(e => new
                {
                    id = e.ExamId,
                    title = e.Examname,
                    createdDate = e.Createdate,
                    grade = e.Grade,
                    subject = e.Subject,
                    nameClass = e.Classname
                })
                .ToListAsync();

            return Ok(result);
        }
    }
}
