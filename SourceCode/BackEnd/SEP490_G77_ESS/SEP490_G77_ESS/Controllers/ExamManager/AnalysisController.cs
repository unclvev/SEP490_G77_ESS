using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using SEP490_G77_ESS.DTO.AnalysisDTO;
using SEP490_G77_ESS.Models;
using System.IO;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;

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
            if (examId <= 0)
            {
                Console.WriteLine("GetStudentResultsByExamId failed - examId is invalid");
                return BadRequest(new { message = "ExamId không hợp lệ" });
            }
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

        [HttpGet("export/{examId}")]
        public async Task<IActionResult> ExportStudentResultsToExcel(long examId)
        {
            try
            {
                var exam = await _context.Exams.FindAsync(examId);
                var results = await _context.StudentResults
                    .Where(r => r.ExamId == examId)
                    .Include(r => r.Exam)
                    .ToListAsync();

                if (exam == null || results.Count == 0)
                    return BadRequest(new { message = "Không có dữ liệu để xuất Excel." });

                var workbook = new XSSFWorkbook();

                // Sheet: Thông tin cơ bản
                var infoSheet = workbook.CreateSheet("Thông tin cơ bản");
                var scoredResults = results.Where(r => r.Score != null).ToList();
                var scores = scoredResults.Select(r => r.Score!.Value).ToList();
                int total = scores.Count;
                string avg = total > 0 ? Math.Round(scores.Average(), 2).ToString() : "0";
                string max = total > 0 ? scores.Max().ToString() : "0";
                string min = total > 0 ? scores.Min().ToString() : "0";
                string over5 = total > 0 ? ((scores.Count(s => s > 5) / (float)total) * 100).ToString("F2") + "%" : "0%";
                string over8 = total > 0 ? ((scores.Count(s => s > 8) / (float)total) * 100).ToString("F2") + "%" : "0%";

                var infoRows = new List<(string Label, string Value)>
                {
                    ("Tên bài thi:", exam.Examname ?? ""),
                    ("Điểm trung bình:", avg),
                    ("Cao nhất:", max),
                    ("Thấp nhất:", min),
                    ("Số bài làm:", total.ToString()),
                    ("Tỉ lệ trên 5:", over5),
                    ("Tỉ lệ trên 8:", over8),
                };

                for (int i = 0; i < infoRows.Count; i++)
                {
                    var row = infoSheet.CreateRow(i);
                    row.CreateCell(0).SetCellValue(infoRows[i].Label);
                    row.CreateCell(1).SetCellValue(infoRows[i].Value);
                }

                // Sheet: Bảng điểm
                var sheet = workbook.CreateSheet("Bảng điểm");
                var headers = new[] { "STT", "SBD", "Họ và tên", "Lớp học", "Mã đề thi", "Thời gian vào điểm", "Điểm số", "Xếp hạng" };
                var headerRow = sheet.CreateRow(0);
                for (int i = 0; i < headers.Length; i++)
                {
                    headerRow.CreateCell(i).SetCellValue(headers[i]);
                }

                var studentsWithScore = results
                .Where(r => r.Score != null)
                .OrderByDescending(r => r.Score)
                .ToList();

                var studentRanks = new Dictionary<long, int>(); // StudentResultId -> Rank

                int currentRank = 1;
                int index = 0;

                while (index < studentsWithScore.Count)
                {
                    var currentScore = studentsWithScore[index].Score;
                    var sameScoreGroup = studentsWithScore
                        .Skip(index)
                        .TakeWhile(s => s.Score == currentScore)
                        .ToList();

                    foreach (var s in sameScoreGroup)
                    {
                        studentRanks[s.StudentResultId] = currentRank;
                    }

                    currentRank += sameScoreGroup.Count;
                    index += sameScoreGroup.Count;
                }
                int rowIndex = 1;
                foreach (var s in results)
                {
                    var row = sheet.CreateRow(rowIndex++);
                    row.CreateCell(0).SetCellValue(rowIndex - 1); // STT
                    row.CreateCell(1).SetCellValue(s.StudentCode ?? "");
                    row.CreateCell(2).SetCellValue(s.StudentName ?? "");
                    row.CreateCell(3).SetCellValue(s.Exam?.Classname ?? "");
                    row.CreateCell(4).SetCellValue(s.ExamCode ?? "");
                    row.CreateCell(5).SetCellValue(s.CreateDate?.ToString("yyyy-MM-dd HH:mm:ss") ?? "");
                    row.CreateCell(6).SetCellValue(s.Score ?? 0);

                    if (s.Score != null && studentRanks.TryGetValue(s.StudentResultId, out int rank))
                        row.CreateCell(7).SetCellValue(rank);
                    else
                        row.CreateCell(7).SetCellValue("Chưa thi");
                }
                for (int i = 0; i < headers.Length; i++)
                {
                    sheet.AutoSizeColumn(i);
                    infoSheet.AutoSizeColumn(i);
                }
                // Ghi workbook vào mảng byte[] ngay lập tức
                byte[] fileBytes;
                using (var stream = new MemoryStream())
                {
                    workbook.Write(stream);
                    fileBytes = stream.ToArray(); // lấy dữ liệu ra ngay trước khi stream tự đóng
                }

                return File(fileBytes,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "BangDiem.xlsx");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi export Excel: " + ex.Message });
            }
        }
    }
}
