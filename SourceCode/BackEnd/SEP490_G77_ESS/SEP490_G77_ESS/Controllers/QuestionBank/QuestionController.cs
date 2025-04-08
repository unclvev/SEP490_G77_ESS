using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.BankdDTO;
using SEP490_G77_ESS.Models;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
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
                .Include(q => q.Mode)
                .ToListAsync();

            var result = questions.Select(q => new QuestionDto
            {
                Quesid = q.Quesid,
                Quescontent = q.Quescontent,
                Secid = q.Secid ?? 0,
                TypeId = q.TypeId,
                Solution = q.Solution,
                Modeid = q.Modeid ?? 0,
                ImageUrl = q.ImageUrl,
                Answers = (q.TypeId == 3) ? new List<string>() : q.AnswerContent?.Split(",").ToList() ?? new List<string>(),
                CorrectAnswers = _context.CorrectAnswers
                    .Where(a => a.Quesid == q.Quesid)
                    .OrderBy(a => a.AnsId) // giữ đúng thứ tự cho True/False
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
                Solution = questionDto.Solution,
                ImageUrl = questionDto.ImageUrl
            };

            if (questionDto.TypeId == 1)
            {
                if (questionDto.CorrectAnswers.Count != 1)
                    return BadRequest(new { message = "Câu hỏi trắc nghiệm chỉ được có một đáp án đúng!" });

                question.AnswerContent = string.Join(",", questionDto.Answers);
            }
            else if (questionDto.TypeId == 2)
            {
                if (questionDto.CorrectAnswers.Count != 4)
                    return BadRequest(new { message = "Câu hỏi Đúng/Sai phải có đúng 4 đáp án tương ứng với 4 ý!" });

                question.AnswerContent = "True,False";
            }
            else if (questionDto.TypeId == 3)
            {
                if (questionDto.CorrectAnswers.Count != 1 || questionDto.CorrectAnswers[0].Length != 4)
                    return BadRequest(new { message = "Câu hỏi điền kết quả phải có một đáp án đúng và đúng 4 ký tự!" });

                question.AnswerContent = null;
            }

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            foreach (var answer in questionDto.CorrectAnswers)
            {
                _context.CorrectAnswers.Add(new CorrectAnswer
                {
                    Content = answer,
                    Quesid = question.Quesid
                });
            }

            await _context.SaveChangesAsync();
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
            var worksheet = workbook.Worksheets.Add("Section Questions");

            worksheet.Cell(1, 1).Value = "Question Content";
            worksheet.Cell(1, 2).Value = "Type ID";
            worksheet.Cell(1, 3).Value = "Mode ID";
            worksheet.Cell(1, 4).Value = "Solution";
            worksheet.Cell(1, 5).Value = "Answers";
            worksheet.Cell(1, 6).Value = "Correct Answers";
            worksheet.Cell(1, 7).Value = "Image URL";

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
                worksheet.Cell(row, 7).Value = question.ImageUrl ?? "";
                row++;
            }

            var guideSheet = workbook.Worksheets.Add("Import Guide");
            guideSheet.Cell(1, 1).Value = "HƯỚNG DẪN IMPORT EXCEL";
            guideSheet.Cell(2, 1).Value = "1. Question Content: Nội dung câu hỏi (dùng [MATH:...] cho công thức).";
            guideSheet.Cell(3, 1).Value = "2. Type ID: Loại câu hỏi (1: Trắc nghiệm, 2: True/False, 3: Điền kết quả).";
            guideSheet.Cell(4, 1).Value = "3. Mode ID: Mức độ khó.";
            guideSheet.Cell(5, 1).Value = "4. Solution: Giải thích (cho phép có [MATH:...]).";
            guideSheet.Cell(6, 1).Value = "5. Answers: Các đáp án (phân tách bằng ',', hỗ trợ [MATH:...]).";
            guideSheet.Cell(7, 1).Value = "6. Correct Answers: Đáp án đúng (có thể dùng [MATH:...]).";
            guideSheet.Cell(8, 1).Value = "7. Image URL: Link ảnh đã upload (không bắt buộc).";

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

                // Tìm sheet có tên 'Section Questions'
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
                int importCount = 0;
                int updateCount = 0;
                var errors = new List<string>();

                while (!worksheet.Cell(row, 1).IsEmpty())
                {
                    var quesContent = worksheet.Cell(row, 1).GetString().Trim();
                    if (string.IsNullOrEmpty(quesContent))
                    {
                        row++;
                        continue;
                    }

                    excelQuestions.Add(quesContent);

                    // Xử lý số nguyên an toàn
                    int typeId = 0;
                    int modeId = 0;

                    if (worksheet.Cell(row, 2).TryGetValue(out int typeIdValue))
                        typeId = typeIdValue;
                    else if (!int.TryParse(worksheet.Cell(row, 2).GetString(), out typeId))
                    {
                        errors.Add($"Dòng {row}: TypeID không hợp lệ");
                        row++;
                        continue;
                    }

                    if (worksheet.Cell(row, 3).TryGetValue(out int modeIdValue))
                        modeId = modeIdValue;
                    else if (!int.TryParse(worksheet.Cell(row, 3).GetString(), out modeId))
                    {
                        errors.Add($"Dòng {row}: ModeID không hợp lệ");
                        row++;
                        continue;
                    }

                    // Xử lý formula và trim
                    var solution = GetCellValueAsString(worksheet.Cell(row, 4));
                    var answers = GetCellValueAsString(worksheet.Cell(row, 5));
                    var correctAnswers = GetCellValueAsString(worksheet.Cell(row, 6));
                    var imageUrl = GetCellValueAsString(worksheet.Cell(row, 7));

                    // Xác thực và chuẩn hóa URL ảnh
                    if (!string.IsNullOrWhiteSpace(imageUrl))
                    {
                        try
                        {
                            // Kiểm tra và chuẩn hóa URL
                            var validatedUrl = ValidateAndNormalizeUrl(imageUrl);
                            imageUrl = validatedUrl;
                        }
                        catch (Exception)
                        {
                            errors.Add($"Dòng {row}: Đường dẫn ảnh không hợp lệ");
                            imageUrl = null;
                        }
                    }

                    // Kiểm tra TypeID và điều chỉnh dữ liệu phù hợp
                    if (typeId < 1 || typeId > 3)
                    {
                        errors.Add($"Dòng {row}: TypeID phải từ 1-3");
                        row++;
                        continue;
                    }

                    // Xử lý dữ liệu theo TypeID
                    switch (typeId)
                    {
                        case 1: // Single choice
                            if (string.IsNullOrWhiteSpace(answers))
                            {
                                errors.Add($"Dòng {row}: Câu hỏi trắc nghiệm cần có các đáp án");
                                row++;
                                continue;
                            }
                            if (string.IsNullOrWhiteSpace(correctAnswers))
                            {
                                errors.Add($"Dòng {row}: Câu hỏi trắc nghiệm cần có đáp án đúng");
                                row++;
                                continue;
                            }
                            // Kiểm tra xem đáp án đúng có nằm trong danh sách đáp án không
                            var answersList = answers.Split(',').Select(a => a.Trim()).ToList();
                            if (!answersList.Contains(correctAnswers))
                            {
                                errors.Add($"Dòng {row}: Đáp án đúng phải có trong danh sách đáp án");
                                row++;
                                continue;
                            }
                            break;

                        case 2: // True/False với 4 ý
                            answers = "True,False";

                            var tfAnswers = correctAnswers.Split(',').Select(x => x.Trim()).ToList();
                            if (tfAnswers.Count != 4 || tfAnswers.Any(a => a != "True" && a != "False"))
                            {
                                errors.Add($"Dòng {row}: Đáp án cho câu hỏi True/False phải có đúng 4 giá trị 'True' hoặc 'False'");
                                row++;
                                continue;
                            }
                            break;

                        case 3: // Điền kết quả
                                // Không cần answers
                            answers = null;
                            if (string.IsNullOrWhiteSpace(correctAnswers) || correctAnswers.Length != 4)
                            {
                                errors.Add($"Dòng {row}: Đáp án cho câu hỏi điền kết quả phải có đúng 4 ký tự");
                                row++;
                                continue;
                            }
                            break;
                    }

                    if (questionMap.TryGetValue(quesContent.ToLower(), out var existingQuestion))
                    {
                        // Cập nhật nếu câu hỏi đã tồn tại
                        existingQuestion.TypeId = typeId;
                        existingQuestion.Modeid = modeId;
                        existingQuestion.Solution = solution;
                        existingQuestion.AnswerContent = answers;
                        existingQuestion.ImageUrl = imageUrl;
                        _context.CorrectAnswers.RemoveRange(existingQuestion.CorrectAnswers.ToList());

                        foreach (var ans in correctAnswers.Split(',').Select(a => a.Trim()))
                        {
                            await _context.CorrectAnswers.AddAsync(new CorrectAnswer
                            {
                                Quesid = existingQuestion.Quesid,
                                Content = ans
                            });
                        }

                        updateCount++;
                    }
                    else
                    {
                        // Thêm mới câu hỏi
                        var newQuestion = new Question
                        {
                            Quescontent = quesContent,
                            Secid = sectionId,
                            TypeId = typeId,
                            Modeid = modeId,
                            Solution = solution,
                            AnswerContent = answers,
                            ImageUrl = imageUrl
                        };
                        _context.Questions.Add(newQuestion);
                        await _context.SaveChangesAsync();
                        foreach (var ans in correctAnswers.Split(',').Select(a => a.Trim()))
                        {
                            await _context.CorrectAnswers.AddAsync(new CorrectAnswer
                            {
                                Quesid = existingQuestion?.Quesid ?? newQuestion.Quesid,
                                Content = ans
                            });
                        }

                        importCount++;
                    }

                    row++;
                }

                // XÓA câu hỏi không còn trong file Excel
                var questionsToDelete = existingQuestions
    .Where(q =>
        q.Secid == sectionId &&
        !excelQuestions.Contains(q.Quescontent, StringComparer.OrdinalIgnoreCase)
    )
    .ToList();

                int deleteCount = questionsToDelete.Count;

                if (deleteCount > 0)
                {
                    var correctAnswersToDelete = questionsToDelete.SelectMany(q => q.CorrectAnswers).ToList();
                    _context.CorrectAnswers.RemoveRange(correctAnswersToDelete);
                    _context.Questions.RemoveRange(questionsToDelete);
                }

                await _context.SaveChangesAsync();

                // Tạo thông báo chi tiết kết quả
                string resultMessage = $"✅ Import thành công: {importCount} câu hỏi mới, {updateCount} câu hỏi cập nhật, {deleteCount} câu hỏi đã xóa.";
                if (errors.Any())
                {
                    resultMessage += $"\n⚠️ {errors.Count} lỗi: {string.Join("; ", errors.Take(5))}";
                    if (errors.Count > 5)
                        resultMessage += "...";
                }

                return Ok(new { message = resultMessage });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "❌ Lỗi hệ thống khi xử lý file Excel.", error = ex.Message });
            }
        }

        // Phương thức hỗ trợ để lấy giá trị ô Excel, hỗ trợ formula
        private string GetCellValueAsString(IXLCell cell)
        {
            try
            {
                // Ưu tiên giá trị công thức
                if (cell.HasFormula)
                    return cell.Value.ToString().Trim();

                // Nếu không có công thức, lấy giá trị thông thường
                return cell.GetString().Trim();
            }
            catch
            {
                // Trả về chuỗi rỗng nếu không thể lấy giá trị
                return string.Empty;
            }
        }

        // Phương thức xác thực và chuẩn hóa URL
        private string ValidateAndNormalizeUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return null;

            // Loại bỏ khoảng trắng thừa
            url = url.Trim();

            // Kiểm tra định dạng URL
            if (Uri.TryCreate(url, UriKind.Absolute, out Uri validatedUri))
            {
                // Kiểm tra scheme
                if (validatedUri.Scheme == Uri.UriSchemeHttp || validatedUri.Scheme == Uri.UriSchemeHttps)
                {
                    return validatedUri.ToString();
                }
            }

            throw new ArgumentException("URL không hợp lệ");
        }


        // ✅ Cập nhật câu hỏi
        [HttpPut("questions/{id}")]
        public async Task<IActionResult> UpdateQuestion(long id, [FromBody] QuestionDto questionDto)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
                return NotFound(new { message = "Không tìm thấy câu hỏi!" });

            question.Quescontent = questionDto.Quescontent;
            question.Secid = questionDto.Secid;
            question.TypeId = questionDto.TypeId;
            question.Modeid = questionDto.Modeid;
            question.Solution = questionDto.Solution;
            question.ImageUrl = questionDto.ImageUrl;

            _context.CorrectAnswers.RemoveRange(_context.CorrectAnswers.Where(a => a.Quesid == id));

            if (questionDto.TypeId == 1)
            {
                if (questionDto.CorrectAnswers.Count != 1)
                    return BadRequest(new { message = "Câu hỏi trắc nghiệm chỉ được có một đáp án đúng!" });

                question.AnswerContent = string.Join(",", questionDto.Answers);
            }
            else if (questionDto.TypeId == 2)
            {
                if (questionDto.CorrectAnswers.Count != 4)
                    return BadRequest(new { message = "Câu hỏi Đúng/Sai phải có đúng 4 đáp án tương ứng với 4 ý!" });

                question.AnswerContent = "True,False";
            }
            else if (questionDto.TypeId == 3)
            {
                if (questionDto.CorrectAnswers.Count != 1 || questionDto.CorrectAnswers[0].Length != 4)
                    return BadRequest(new { message = "Câu hỏi điền kết quả phải có một đáp án đúng và đúng 4 ký tự!" });

                question.AnswerContent = null;
            }

            foreach (var answer in questionDto.CorrectAnswers)
            {
                _context.CorrectAnswers.Add(new CorrectAnswer
                {
                    Content = answer,
                    Quesid = id
                });
            }

            _context.Questions.Update(question);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Câu hỏi đã được cập nhật!" });
        }
    

        [HttpPost("upload-image-base64")]
        public IActionResult UploadBase64Image([FromBody] Base64ImageDto dto)
        {
            if (string.IsNullOrEmpty(dto.Base64Image))
                return BadRequest(new { message = "Không có dữ liệu ảnh base64!" });

            try
            {
                var base64Data = Regex.Match(dto.Base64Image, @"data:image/(?<type>.+?);base64,(?<data>.+)").Groups["data"].Value;
                var fileType = Regex.Match(dto.Base64Image, @"data:image/(?<type>.+?);base64,").Groups["type"].Value;

                if (string.IsNullOrEmpty(base64Data) || string.IsNullOrEmpty(fileType))
                    return BadRequest(new { message = "Dữ liệu base64 không hợp lệ!" });

                var fileBytes = Convert.FromBase64String(base64Data);

                var extension = fileType switch
                {
                    "jpeg" => ".jpg",
                    "jpg" => ".jpg",
                    "png" => ".png",
                    "gif" => ".gif",
                    _ => ".jpg"
                };

                var fileName = $"{Guid.NewGuid()}{extension}";
                var folderPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");

                if (!Directory.Exists(folderPath))
                    Directory.CreateDirectory(folderPath);

                var fullPath = Path.Combine(folderPath, fileName);
                System.IO.File.WriteAllBytes(fullPath, fileBytes);

                var imageUrl = $"/images/{fileName}";
                return Ok(new { imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xử lý ảnh base64!", error = ex.Message });
            }
        }

        public class Base64ImageDto
        {
            public string Base64Image { get; set; }
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

            // ✅ Xóa ảnh nếu có
            if (!string.IsNullOrEmpty(question.ImageUrl))
            {
                var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", question.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath); // ✅ Xóa file ảnh khỏi server
                }
            }

            // ✅ Xóa đáp án đúng
            var correctAnswers = _context.CorrectAnswers.Where(a => a.Quesid == id);
            _context.CorrectAnswers.RemoveRange(correctAnswers);

            // ✅ Xóa câu hỏi
            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa câu hỏi!" });
        }

    }
}
