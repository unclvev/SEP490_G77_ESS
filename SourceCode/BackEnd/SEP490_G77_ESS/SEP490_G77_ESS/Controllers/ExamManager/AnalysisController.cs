using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using SEP490_G77_ESS.DTO.AnalysisDTO;
using SEP490_G77_ESS.Models;
using System.IO;

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

        // API xuất bảng điểm ra Excel
        [HttpGet("export/{examId}")]
        public async Task<IActionResult> ExportStudentResultsToExcel(long examId)
        {
            var results = await _context.StudentResults
                .Where(r => r.ExamId == examId)
                .Include(r => r.Exam)
                .ToListAsync();

            // Tính toán các thông tin cơ bản
            var scores = results.Select(r => r.Score).ToList();
            var total = scores.Count;
            var avg = total > 0 ? Math.Round((decimal)scores.Average(), 2).ToString() : "0";
            var max = total > 0 ? scores.Max().ToString() : "0";
            var min = total > 0 ? scores.Min().ToString() : "0";
            var over5 = total > 0 ? ((scores.Count(s => s > 5) / (float)total) * 100).ToString("F2") : "0";
            var over8 = total > 0 ? ((scores.Count(s => s > 8) / (float)total) * 100).ToString("F2") : "0";

            var excelPackage = new ExcelPackage();

            // Tạo sheet cho thông tin cơ bản
            var basicInfoSheet = excelPackage.Workbook.Worksheets.Add("Thông tin cơ bản");

            // Thêm thông tin cơ bản vào sheet
            basicInfoSheet.Cells[1, 1].Value = "Thông tin cơ bản";
            basicInfoSheet.Cells[2, 1].Value = "Tên bài thi:";
            basicInfoSheet.Cells[2, 2].Value = results.FirstOrDefault()?.Exam?.Examname;
            basicInfoSheet.Cells[3, 1].Value = "Điểm trung bình:";
            basicInfoSheet.Cells[3, 2].Value = avg;
            basicInfoSheet.Cells[4, 1].Value = "Cao nhất:";
            basicInfoSheet.Cells[4, 2].Value = max;
            basicInfoSheet.Cells[5, 1].Value = "Thấp nhất:";
            basicInfoSheet.Cells[5, 2].Value = min;
            basicInfoSheet.Cells[6, 1].Value = "Số bài làm:";
            basicInfoSheet.Cells[6, 2].Value = total;
            basicInfoSheet.Cells[7, 1].Value = "Tỉ lệ trên 5:";
            basicInfoSheet.Cells[7, 2].Value = over5 + "%";
            basicInfoSheet.Cells[8, 1].Value = "Tỉ lệ trên 8:";
            basicInfoSheet.Cells[8, 2].Value = over8 + "%";

            // Tạo sheet cho bảng điểm
            var worksheet = excelPackage.Workbook.Worksheets.Add("Bảng điểm");

            // Thêm tiêu đề cột cho bảng điểm
            worksheet.Cells[1, 1].Value = "STT";
            worksheet.Cells[1, 2].Value = "SBD";
            worksheet.Cells[1, 3].Value = "Họ và tên";
            worksheet.Cells[1, 4].Value = "Lớp học";
            worksheet.Cells[1, 5].Value = "Mã đề thi";
            worksheet.Cells[1, 6].Value = "Thời gian vào điểm";
            worksheet.Cells[1, 7].Value = "Điểm số";
            worksheet.Cells[1, 8].Value = "Xếp hạng";

            int row = 2;
            int rank = 1;  // Xếp hạng bắt đầu từ 1
            foreach (var student in results.OrderByDescending(r => r.Score))
            {
                worksheet.Cells[row, 1].Value = row - 1;  // STT
                worksheet.Cells[row, 2].Value = student.StudentCode;  // SBD
                worksheet.Cells[row, 3].Value = student.StudentName;  // Họ và tên
                worksheet.Cells[row, 4].Value = student.Exam?.Classname;  // Lớp học
                worksheet.Cells[row, 5].Value = student.ExamCode;  // Mã đề thi
                worksheet.Cells[row, 6].Value = student.CreateDate?.ToString("yyyy-MM-dd HH:mm:ss");  // Thời gian vào điểm
                worksheet.Cells[row, 7].Value = student.Score;  // Điểm số
                worksheet.Cells[row, 8].Value = rank;  // Xếp hạng (dùng biến rank)

                rank++;
                row++;
            }

            // Lưu file vào bộ nhớ
            var stream = new MemoryStream();
            excelPackage.SaveAs(stream);
            stream.Position = 0;

            // Trả về file Excel cho frontend
            return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "BangDiem.xlsx");
        }
    }
}
