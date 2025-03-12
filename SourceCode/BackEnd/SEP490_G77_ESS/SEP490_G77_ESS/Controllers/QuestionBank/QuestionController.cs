using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.BankdDTO;
using SEP490_G77_ESS.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Controllers.QuestionBank
{
    [Route("api/Question")]
    [ApiController]
    public class QuestionController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public QuestionController(EssDbV11Context context)
        {
            _context = context;
        }

        // ✅ API lấy danh sách câu hỏi theo SectionId
        [HttpGet("questions")]
        public async Task<ActionResult<IEnumerable<QuestionDto>>> GetQuestions([FromQuery] long sectionId)
        {
            var questions = await _context.Questions
                .Where(q => q.Secid == sectionId)
                .Include(q => q.Type)
                .Include(q => q.Mode) // 🔹 Lấy tên Level dựa trên modeid
                .ToListAsync();

            var result = questions.Select(q => new QuestionDto
            {
                Quesid = q.Quesid,
                Quescontent = q.Quescontent,
                Secid = q.Secid ?? 0,
                TypeId = q.TypeId,
             
                Solution = q.Solution,
                Modeid = q.Modeid ?? 0,
             
                Answers = q.AnswerContent?.Split(",").ToList() ?? new List<string>(),
                CorrectAnswers = _context.CorrectAnswers
                    .Where(a => a.Quesid == q.Quesid)
                    .Select(a => a.Content)
                    .ToList(),
            }).ToList();

            return Ok(result);
        }

        [HttpGet("levels")]
        public async Task<ActionResult<IEnumerable<object>>> GetLevels()
        {
            var levels = await _context.Levels
                .Select(l => new { LevelId = l.LevelId, LevelName = l.Levelname })
                .ToListAsync();

            return Ok(levels);
        }

        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<object>>> GetQuestionTypes()
        {
            var types = await _context.TypeQuestions
                .Select(t => new { t.TypeId, t.TypeName })
                .ToListAsync();

            return Ok(types);
        }

        [HttpPost("questions")]
        public async Task<IActionResult> CreateQuestion([FromBody] QuestionDto questionDto)
        {
            Console.WriteLine($"🔍 Received Data: {System.Text.Json.JsonSerializer.Serialize(questionDto)}");

            if (string.IsNullOrEmpty(questionDto.Quescontent))
                return BadRequest(new { message = "Nội dung câu hỏi không được để trống!" });

            if (questionDto.Secid == null || questionDto.Secid == 0)
                return BadRequest(new { message = "Section ID không hợp lệ!" });

            if (questionDto.TypeId == 0)
                return BadRequest(new { message = "Loại câu hỏi không hợp lệ!" });

            if (questionDto.Modeid == 0)
                return BadRequest(new { message = "Độ khó không hợp lệ!" });

            var question = new Question
            {
                Quescontent = questionDto.Quescontent,
                Secid = questionDto.Secid,
                TypeId = questionDto.TypeId,
                Modeid = questionDto.Modeid,
                Solution = (questionDto.TypeId == 2 || questionDto.TypeId == 3) ? questionDto.Solution : null,

                AnswerContent = questionDto.TypeId == 1 ? string.Join(",", questionDto.Answers) : null
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            if (questionDto.TypeId == 1)
            {
                foreach (var correctAns in questionDto.CorrectAnswers)
                {
                    _context.CorrectAnswers.Add(new CorrectAnswer
                    {
                        Content = correctAns,
                        Quesid = question.Quesid
                    });
                }
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Câu hỏi đã được thêm!", questionId = question.Quesid });
        }

        [HttpGet("{sectionId}/export-excel")]
        public async Task<IActionResult> ExportSectionQuestionsToExcel(long sectionId)
        {
            var section = await _context.Sections
                .Include(s => s.Questions)
                .FirstOrDefaultAsync(s => s.Secid == sectionId);

            if (section == null)
            {
                return NotFound(new { message = "Không tìm thấy Section!" });
            }

            using var workbook = new XLWorkbook();

            // 🟢 **Sheet 1: Dữ liệu câu hỏi**
            var worksheet = workbook.Worksheets.Add("Section Questions");
            worksheet.Cell(1, 1).Value = "Question Content";
            worksheet.Cell(1, 2).Value = "Type ID";
            worksheet.Cell(1, 3).Value = "Mode ID";
            worksheet.Cell(1, 4).Value = "Solution";
            worksheet.Cell(1, 5).Value = "Answers";
            worksheet.Cell(1, 6).Value = "Correct Answers";

            int row = 2;
            var correctAnswers = await _context.CorrectAnswers.ToListAsync();

            foreach (var question in section.Questions)
            {
                worksheet.Cell(row, 1).Value = question.Quescontent;
                worksheet.Cell(row, 2).Value = question.TypeId;
                worksheet.Cell(row, 3).Value = question.Modeid;
                worksheet.Cell(row, 4).Value = question.Solution ?? "";
                worksheet.Cell(row, 5).Value = question.AnswerContent ?? "";
                worksheet.Cell(row, 6).Value = string.Join(",", correctAnswers
                    .Where(a => a.Quesid == question.Quesid)
                    .Select(a => a.Content));
                row++;
            }

            // 🎯 **Sheet 2: Hướng dẫn Import**
            var guideSheet = workbook.Worksheets.Add("Import Guide");
            guideSheet.Cell(1, 1).Value = "HƯỚNG DẪN IMPORT EXCEL";
            guideSheet.Cell(2, 1).Value = "1. Cột 'Question Content': Nhập nội dung câu hỏi.";
            guideSheet.Cell(3, 1).Value = "2. Cột 'Type ID': Loại câu hỏi (1: Trắc nghiệm, 2: Tự luận).";
            guideSheet.Cell(4, 1).Value = "3. Cột 'Mode ID': Mức độ khó của câu hỏi.";
            guideSheet.Cell(5, 1).Value = "4. Cột 'Solution': Giải thích (Chỉ áp dụng cho tự luận).";
            guideSheet.Cell(6, 1).Value = "5. Cột 'Answers': Các đáp án (Ngăn cách bằng dấu ',').";
            guideSheet.Cell(7, 1).Value = "6. Cột 'Correct Answers': Đáp án đúng (Ngăn cách bằng dấu ',').";

            // 🔒 **Làm cho sheet hướng dẫn chỉ đọc**
            guideSheet.Protect().AllowElement(XLSheetProtectionElements.SelectLockedCells);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Section_{sectionId}_Questions.xlsx");
        }



        //[HttpPost("{sectionId}/import-excel")]
        //public async Task<IActionResult> ImportQuestionsFromExcel(long sectionId, IFormFile file)
        //{
        //    if (file == null || file.Length == 0)
        //        return BadRequest(new { message = "File không hợp lệ hoặc rỗng." });

        //    try
        //    {
        //        using var stream = new MemoryStream();
        //        await file.CopyToAsync(stream);
        //        using var workbook = new XLWorkbook(stream);

        //        var worksheet = workbook.Worksheets.FirstOrDefault();
        //        if (worksheet == null)
        //            return BadRequest(new { message = "File Excel không có sheet nào." });

        //        var existingQuestions = await _context.Questions
        //            .Where(q => q.Secid == sectionId)
        //            .Include(q => q.CorrectAnswers)
        //            .ToListAsync();

        //        var questionMap = existingQuestions.ToDictionary(q => q.Quescontent.Trim().ToLower(), q => q);
        //        var excelQuestions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        //        int row = 2;
        //        while (!worksheet.Cell(row, 1).IsEmpty())
        //        {
        //            var quesContent = worksheet.Cell(row, 1).GetString().Trim();
        //            if (string.IsNullOrEmpty(quesContent))
        //            {
        //                row++;
        //                continue;
        //            }

        //            excelQuestions.Add(quesContent);

        //            int.TryParse(worksheet.Cell(row, 2).GetString(), out int typeId);
        //            int.TryParse(worksheet.Cell(row, 3).GetString(), out int modeId);
        //            var solution = worksheet.Cell(row, 4).GetString().Trim();
        //            var answers = worksheet.Cell(row, 5).GetString().Trim();
        //            var correctAnswers = worksheet.Cell(row, 6).GetString().Trim();

        //            if (questionMap.TryGetValue(quesContent.ToLower(), out var existingQuestion))
        //            {
        //                // ✅ Cập nhật nếu câu hỏi đã tồn tại
        //                existingQuestion.TypeId = typeId;
        //                existingQuestion.Modeid = modeId;
        //                existingQuestion.Solution = solution;
        //                existingQuestion.AnswerContent = answers;

        //                // ✅ Cập nhật lại Correct Answers
        //                _context.CorrectAnswers.RemoveRange(existingQuestion.CorrectAnswers);
        //                var newCorrectAnswers = correctAnswers.Split(',')
        //                    .Where(a => !string.IsNullOrWhiteSpace(a))
        //                    .Select(a => new CorrectAnswer { Quesid = existingQuestion.Quesid, Content = a.Trim() });

        //                await _context.CorrectAnswers.AddRangeAsync(newCorrectAnswers);
        //            }
        //            else
        //            {
        //                // ✅ Tạo câu hỏi mới nếu chưa có
        //                var newQuestion = new Question
        //                {
        //                    Quescontent = quesContent,
        //                    Secid = sectionId,
        //                    TypeId = typeId,
        //                    Modeid = modeId,
        //                    Solution = solution,
        //                    AnswerContent = answers
        //                };
        //                _context.Questions.Add(newQuestion);
        //                await _context.SaveChangesAsync();

        //                // ✅ Thêm Correct Answers nếu có
        //                var newCorrectAnswers = correctAnswers.Split(',')
        //                    .Where(a => !string.IsNullOrWhiteSpace(a))
        //                    .Select(a => new CorrectAnswer { Quesid = newQuestion.Quesid, Content = a.Trim() });

        //                await _context.CorrectAnswers.AddRangeAsync(newCorrectAnswers);
        //            }

        //            row++;
        //        }

        //        // ✅ **XÓA câu hỏi cũ không có trong file Excel nhưng thuộc Section này**
        //        var questionsToDelete = existingQuestions
        //            .Where(q => !excelQuestions.Contains(q.Quescontent))
        //            .ToList();

        //        if (questionsToDelete.Count > 0)
        //        {
        //            var correctAnswersToDelete = questionsToDelete.SelectMany(q => q.CorrectAnswers).ToList();
        //            _context.CorrectAnswers.RemoveRange(correctAnswersToDelete);
        //            _context.Questions.RemoveRange(questionsToDelete);
        //        }

        //        await _context.SaveChangesAsync();
        //        return Ok(new { message = "Import dữ liệu thành công!" });
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, new { message = "Lỗi hệ thống khi xử lý file Excel.", error = ex.Message });
        //    }
        //}
        [HttpPost("{sectionId}/import-excel")]
        public async Task<IActionResult> ImportQuestionsFromExcel(long sectionId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File không hợp lệ hoặc rỗng." });

            try
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                using var workbook = new XLWorkbook(stream);

                // 🔍 **Tìm sheet có tên 'Section Questions'**
                var worksheet = workbook.Worksheets.FirstOrDefault(w => w.Name == "Section Questions")
                                ?? workbook.Worksheets.FirstOrDefault(); // Nếu không tìm thấy thì lấy sheet đầu tiên

                if (worksheet == null)
                    return BadRequest(new { message = "File Excel không có sheet hợp lệ." });

                var existingQuestions = await _context.Questions
                    .Where(q => q.Secid == sectionId)
                    .Include(q => q.CorrectAnswers)
                    .ToListAsync();

                var questionMap = existingQuestions.ToDictionary(q => q.Quescontent.Trim().ToLower(), q => q);
                var excelQuestions = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                int row = 2;
                while (!worksheet.Cell(row, 1).IsEmpty())
                {
                    var quesContent = worksheet.Cell(row, 1).GetString().Trim();
                    if (string.IsNullOrEmpty(quesContent))
                    {
                        row++;
                        continue;
                    }

                    excelQuestions.Add(quesContent);

                    int.TryParse(worksheet.Cell(row, 2).GetString(), out int typeId);
                    int.TryParse(worksheet.Cell(row, 3).GetString(), out int modeId);
                    var solution = worksheet.Cell(row, 4).GetString().Trim();
                    var answers = worksheet.Cell(row, 5).GetString().Trim();
                    var correctAnswers = worksheet.Cell(row, 6).GetString().Trim();

                    if (questionMap.TryGetValue(quesContent.ToLower(), out var existingQuestion))
                    {
                        // ✅ **Cập nhật nếu câu hỏi đã tồn tại**
                        existingQuestion.TypeId = typeId;
                        existingQuestion.Modeid = modeId;
                        existingQuestion.Solution = solution;
                        existingQuestion.AnswerContent = answers;

                        _context.CorrectAnswers.RemoveRange(existingQuestion.CorrectAnswers);
                        var newCorrectAnswers = correctAnswers.Split(',')
                            .Where(a => !string.IsNullOrWhiteSpace(a))
                            .Select(a => new CorrectAnswer { Quesid = existingQuestion.Quesid, Content = a.Trim() });

                        await _context.CorrectAnswers.AddRangeAsync(newCorrectAnswers);
                    }
                    else
                    {
                        // ✅ **Thêm mới câu hỏi**
                        var newQuestion = new Question
                        {
                            Quescontent = quesContent,
                            Secid = sectionId,
                            TypeId = typeId,
                            Modeid = modeId,
                            Solution = solution,
                            AnswerContent = answers
                        };
                        _context.Questions.Add(newQuestion);
                        await _context.SaveChangesAsync();

                        var newCorrectAnswers = correctAnswers.Split(',')
                            .Where(a => !string.IsNullOrWhiteSpace(a))
                            .Select(a => new CorrectAnswer { Quesid = newQuestion.Quesid, Content = a.Trim() });

                        await _context.CorrectAnswers.AddRangeAsync(newCorrectAnswers);
                    }

                    row++;
                }

                // ✅ **XÓA câu hỏi không còn trong file Excel**
                var questionsToDelete = existingQuestions.Where(q => !excelQuestions.Contains(q.Quescontent)).ToList();
                if (questionsToDelete.Count > 0)
                {
                    var correctAnswersToDelete = questionsToDelete.SelectMany(q => q.CorrectAnswers).ToList();
                    _context.CorrectAnswers.RemoveRange(correctAnswersToDelete);
                    _context.Questions.RemoveRange(questionsToDelete);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "✅ Import dữ liệu thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "❌ Lỗi hệ thống khi xử lý file Excel.", error = ex.Message });
            }
        }


        // ✅ Cập nhật câu hỏi
        [HttpPut("questions/{id}")]
        public async Task<IActionResult> UpdateQuestion(long id, [FromBody] QuestionDto questionDto)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
            {
                return NotFound(new { message = "Không tìm thấy câu hỏi!" });
            }

            question.Quescontent = questionDto.Quescontent;
            question.Secid = questionDto.Secid;
            question.TypeId = questionDto.TypeId;
            question.Modeid = questionDto.Modeid;
            question.Solution = (questionDto.TypeId == 2 || questionDto.TypeId == 3) ? questionDto.Solution : null;

            question.AnswerContent = questionDto.TypeId == 1 ? string.Join(",", questionDto.Answers) : null;

            _context.Questions.Update(question);

            if (questionDto.TypeId == 1)
            {
                var existingCorrectAnswers = _context.CorrectAnswers.Where(a => a.Quesid == id);
                _context.CorrectAnswers.RemoveRange(existingCorrectAnswers);

                foreach (var correctAns in questionDto.CorrectAnswers)
                {
                    _context.CorrectAnswers.Add(new CorrectAnswer { Content = correctAns, Quesid = id });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Câu hỏi đã được cập nhật!" });
        }


        // ✅ Xóa câu hỏi
        [HttpDelete("questions/{id}")]
        public async Task<IActionResult> DeleteQuestion(long id)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
            {
                return NotFound(new { message = "Không tìm thấy câu hỏi!" });
            }

            var correctAnswers = _context.CorrectAnswers.Where(a => a.Quesid == id);
            _context.CorrectAnswers.RemoveRange(correctAnswers);

            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa câu hỏi!" });
        }
    }
}
