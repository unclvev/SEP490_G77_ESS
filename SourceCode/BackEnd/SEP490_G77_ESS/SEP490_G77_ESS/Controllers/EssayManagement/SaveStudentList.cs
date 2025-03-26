using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Controllers.EssayManagement
{
    [Route("essay/savestudentlist")]
    [ApiController]
    public class SaveStudentList : ControllerBase
    {
        private readonly EssDbV11Context _context;
        public SaveStudentList(EssDbV11Context context)
        {
            _context = context;
        }
        [HttpPost]
        public IActionResult UploadExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file hoặc file rỗng.");
            }

            var studentList = new List<StudentResult>();

            using (var stream = new MemoryStream())
            {
                file.CopyTo(stream);
                using (var workbook = new ClosedXML.Excel.XLWorkbook(stream))
                {
                    var worksheet = workbook.Worksheet(1); // Sheet đầu tiên
                    var rows = worksheet.RangeUsed().RowsUsed().Skip(1); // Bỏ dòng tiêu đề

                    foreach (var row in rows)
                    {
                        var student = new StudentResult
                        {
                            StudentCode = row.Cell(2).GetValue<string>(), // Số báo danh
                            StudentName = row.Cell(3).GetValue<string>(), // Họ và tên
                            Gender = row.Cell(4).GetValue<string>().Trim().ToLower() == "nam", // Giới tính
                            StudentDob = DateTime.TryParse(row.Cell(5).GetValue<string>(), out var dob) ? dob : null,
                            CreateDate = DateTime.Now,
                            ExamId = 1, // Gán ExamId tạm thời hoặc lấy từ request
                            Rank = 0 // Tạm để 0, sẽ tính sau
                        };

                        studentList.Add(student);
                    }
                }
            }

            _context.StudentResults.AddRange(studentList);
            _context.SaveChanges();

            return Ok(new { message = "Import thành công!", count = studentList.Count });
        }

    }
}
