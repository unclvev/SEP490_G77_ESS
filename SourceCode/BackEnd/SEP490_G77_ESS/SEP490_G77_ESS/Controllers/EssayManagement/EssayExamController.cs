using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Models;
using System.IO;
using System.Threading.Tasks;
using NPOI.XSSF.UserModel;
using NPOI.SS.UserModel;


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
        public async Task<IActionResult> UploadExcel([FromForm] IFormFile file, [FromForm] long examId)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "Không có file hoặc file rỗng." });


                var examExists = await _context.Exams.AnyAsync(e => e.ExamId == examId);
                if (!examExists)
                    return BadRequest(new { message = $"Kỳ thi với ID {examId} không tồn tại." });


                var studentResults = new List<StudentResult>();


                using (var stream = file.OpenReadStream())
                {
                    var workbook = new XSSFWorkbook(stream);
                    var sheet = workbook.GetSheetAt(0);


                    for (int row = 1; row <= sheet.LastRowNum; row++)
                    {
                        var currentRow = sheet.GetRow(row);
                        if (currentRow == null) continue;


                        var studentCode = currentRow.GetCell(1)?.ToString()?.Trim();
                        if (string.IsNullOrEmpty(studentCode)) continue;


                        DateTime? dob = null;
                        try
                        {
                            var dobCell = currentRow.GetCell(4);
                            if (dobCell != null)
                            {
                                switch (dobCell.CellType)
                                {
                                    case NPOI.SS.UserModel.CellType.Numeric:
                                        if (DateUtil.IsCellDateFormatted(dobCell))
                                            dob = dobCell.DateCellValue;
                                        else
                                            dob = DateTime.FromOADate(dobCell.NumericCellValue);
                                        break;
                                    case NPOI.SS.UserModel.CellType.String:
                                        var rawText = dobCell.StringCellValue?.Trim();
                                        string[] formats = { "M/d/yyyy", "MM/dd/yyyy", "d/M/yyyy", "dd/MM/yyyy" };
                                        if (DateTime.TryParseExact(rawText, formats,
                                                System.Globalization.CultureInfo.InvariantCulture,
                                                System.Globalization.DateTimeStyles.None,
                                                out var parsedDate))
                                            dob = parsedDate;
                                        else if (DateTime.TryParse(rawText, out var fallbackDate))
                                            dob = fallbackDate;
                                        break;
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error parsing date at row {row}: {ex.Message}");
                        }


                        double? score = null;
                        try
                        {
                            var scoreCell = currentRow.GetCell(5);
                            if (scoreCell != null)
                            {
                                if (scoreCell.CellType == NPOI.SS.UserModel.CellType.Numeric)
                                    score = scoreCell.NumericCellValue;
                                else if (double.TryParse(scoreCell.ToString(), out var parsedScore))
                                    score = parsedScore;
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"⚠️ Không thể đọc điểm ở dòng {row}: {ex.Message}");
                        }


                        var student = new StudentResult
                        {
                            ExamId = examId,
                            StudentCode = studentCode,
                            StudentName = currentRow.GetCell(2)?.ToString()?.Trim(),
                            Gender = currentRow.GetCell(3)?.ToString()?.ToLower() == "nam",
                            StudentDob = dob,
                            Score = score,
                            CreateDate = DateTime.Now
                        };


                        studentResults.Add(student);
                    }
                }


                var studentsToRemove = _context.StudentResults.Where(s => s.ExamId == examId);
                _context.StudentResults.RemoveRange(studentsToRemove);
                _context.StudentResults.AddRange(studentResults);
                await _context.SaveChangesAsync();


                return Ok(studentResults);
            }
            catch (Exception ex)
            {
                var errorMessage = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = "Lỗi xử lý file: " + errorMessage });
            }
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
            if (accId <= 0)
            {
                return BadRequest("Invalid accountId: must be greater than 0");
            }

            if (!await _context.Accounts.AnyAsync(a => a.AccId == accId))
            {
                return BadRequest("Account not found");
            }

            if (string.IsNullOrWhiteSpace(exam.Examname))
            {
                return BadRequest("Exam name is required");
            }

            if (string.IsNullOrWhiteSpace(exam.Classname))
            {
                return BadRequest("Classname is required");
            }

            if (!exam.Classname.Any(char.IsLetter) || !exam.Classname.Any(char.IsDigit))
            {
                return BadRequest("Classname must contain both letters and numbers");
            }

            if (string.IsNullOrWhiteSpace(exam.Grade))
            {
                return BadRequest("Grade is required");
            }

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
            if (id <= 0)
            {
                return NotFound("Invalid examId: must be greater than 0");
            }

            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
            {
                return NotFound("Exam not found");
            }

            if (string.IsNullOrWhiteSpace(updatedExam.Examname))
            {
                return BadRequest("Exam name is required");
            }

            if (string.IsNullOrWhiteSpace(updatedExam.Classname))
            {
                return BadRequest("Classname is required");
            }

            if (!updatedExam.Classname.Any(char.IsLetter) || !updatedExam.Classname.Any(char.IsDigit))
            {
                return BadRequest("Classname must contain both letters and numbers");
            }

            if (string.IsNullOrWhiteSpace(updatedExam.Grade))
            {
                return BadRequest("Grade is required");
            }

            // ✅ Cập nhật dữ liệu
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
            if (accId <= 0)
            {
                return Ok(new List<object>());
            }

            if (!await _context.Accounts.AnyAsync(a => a.AccId == accId))
            {
                return Ok(new List<object>());
            }

            if (string.IsNullOrWhiteSpace(keyword))
            {
                return Ok(new List<object>());
            }
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
