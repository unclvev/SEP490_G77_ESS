using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
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
    [Authorize]
    public class QuestionController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly IAuthorizationService _authorizationService;
        public QuestionController(EssDbV11Context context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
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
                Answers = (q.TypeId == 3) ? new List<string>() : q.AnswerContent?.Split(";", StringSplitOptions.None).ToList() ?? new List<string>(),
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
            var section = await _context.Sections.FindAsync(questionDto.Secid);
            if (section == null)
                return NotFound(new { message = "Section không tồn tại!" });

            //var authorizationResult = await _authorizationService.AuthorizeAsync(User, section.BankId, "BankModify");
            //if (!authorizationResult.Succeeded)
            //    return Forbid();

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

                question.AnswerContent = string.Join(";", questionDto.Answers);
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
                .ThenInclude(q => q.CorrectAnswers)
                .FirstOrDefaultAsync(s => s.Secid == sectionId);

            if (section == null)
                return NotFound(new { message = "Không tìm thấy Section!" });

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Section Questions");

            // 1. Header
            var headers = new[] {
        "Question Content", "Type ID", "Mode ID", "Solution",
        "Answer 1", "Answer 2", "Answer 3", "Answer 4",
        "Correct Answers", "Image URL"
    };
            for (int i = 0; i < headers.Length; i++)
                worksheet.Cell(1, i + 1).Value = headers[i];

            // 2. Mẫu ví dụ (row 2)
            worksheet.Cell(2, 1).Value = "[MATH:\\sqrt{4}]";
            worksheet.Cell(2, 2).Value = 1;
            worksheet.Cell(2, 3).Value = 1;
            worksheet.Cell(2, 4).Value = "Phép cộng cơ bản.";
            worksheet.Cell(2, 5).Value = "1";
            worksheet.Cell(2, 6).Value = "2";
            worksheet.Cell(2, 7).Value = "3";
            worksheet.Cell(2, 8).Value = "4";
            worksheet.Cell(2, 9).Value = "2";
            worksheet.Cell(2, 10).FormulaA1 =
                "=IMAGE(\"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTE7X1Jz2BfKDUhA738FQCZwEiOC_S_DBefuA&s\")";

            // Điều chỉnh hàng và cột mẫu
            worksheet.Row(2).Height = 100;
            worksheet.Column(10).Width = 30;

            // 3. Ghi dữ liệu thật (bắt đầu từ row 3)
            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            int row = 3;
            foreach (var q in section.Questions)
            {
                worksheet.Cell(row, 1).Value = RestoreMathPlaceholders(q.Quescontent);
                worksheet.Cell(row, 2).Value = q.TypeId;
                worksheet.Cell(row, 3).Value = q.Modeid;
                worksheet.Cell(row, 4).Value = q.Solution ?? "";

                // Answers
                var answerList = (q.AnswerContent ?? "")
                    .Split(';', StringSplitOptions.RemoveEmptyEntries)
                    .ToList();
                for (int i = 0; i < 4; i++)
                    worksheet.Cell(row, 5 + i).Value = i < answerList.Count ? answerList[i] : "";

                // CorrectAnswers
                var corrects = q.CorrectAnswers
                    .OrderBy(a => a.AnsId)
                    .Select(a => a.Content);
                worksheet.Cell(row, 9).Value = string.Join(";", corrects);

                // Image
                if (!string.IsNullOrEmpty(q.ImageUrl))
                {
                    var url = q.ImageUrl.StartsWith("http")
                        ? q.ImageUrl
                        : baseUrl + q.ImageUrl;
                    worksheet.Cell(row, 10).FormulaA1 = $"=IMAGE(\"{url}\")";
                    worksheet.Row(row).Height = 100;
                    worksheet.Column(10).Width = 30;
                }

                row++;
            }

            // 4. Tạo Table & styling
            var usedRange = worksheet.Range(1, 1, row - 1, headers.Length);
            var table = usedRange.CreateTable("QuestionsTable");
            table.Theme = XLTableTheme.TableStyleMedium9;
            worksheet.SheetView.FreezeRows(1);

            // Auto-fit và wrap text
            worksheet.ColumnsUsed().AdjustToContents();
            worksheet.RowsUsed().AdjustToContents();
            worksheet.Style.Alignment.WrapText = true;

            // Header in đậm, căn giữa
            var headerRow = worksheet.Row(1);
            headerRow.Style.Font.Bold = true;
            headerRow.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            // 5. Sheet hướng dẫn
            var guideSheet = workbook.Worksheets.Add("Import Guide");
            guideSheet.Cell(1, 1).Value = "HƯỚNG DẪN IMPORT EXCEL";
            guideSheet.Cell(2, 1).Value = "1. Question Content: Nội dung câu hỏi. Nếu có công thức toán học, cần giữ nguyên định dạng [MATH:...] (tham khảo công thức tại đây: https://www.mathvn.com/2021/09/latex-co-ban-cach-go-cac-cong-thuc-ki.html)";
            guideSheet.Cell(3, 1).Value = "2. Type ID: Loại câu hỏi (1: Trắc nghiệm, 2: True/False, 3: Điền kết quả).";
            guideSheet.Cell(4, 1).Value = "3. Mode ID: Mức độ khó.(1: Nhận biết, 2: Thổng hiểu, 3: Vận dụng )";
            guideSheet.Cell(5, 1).Value = "4. Solution: Giải thích cho câu hỏi).";
            guideSheet.Cell(6, 1).Value = "5-8. Answer 1–4: Các đáp án trắc nghiệm, mỗi ô 1 đáp án.";
            guideSheet.Cell(7, 1).Value = "9. Correct Answers: Đáp án đúng (phân tách bằng ';', với dạng đúng sai thì các đáp án cách nhau bằng dấu ; với nhập đáp án thì phải gõ đủ 4 ký tự bao gồm dấu - và ,).";
            guideSheet.Cell(8, 1).Value = "10. Image URL: gõ công thức ảnh theo ví dụ có sẵn (không bắt buộc).";

            guideSheet.ColumnsUsed().AdjustToContents();
            guideSheet.RowsUsed().AdjustToContents();
            guideSheet.SheetView.FreezeRows(1);
            guideSheet.Row(1).Style.Font.Bold = true;
            guideSheet.Style.Alignment.WrapText = true;

            // 6. Xuất file
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            ms.Position = 0;
            return File(ms.ToArray(),
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        $"Section_{sectionId}_Questions.xlsx");
        }


        private string RestoreMathPlaceholders(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;

            // ✅ Khôi phục [MATH:...] từ các thẻ HTML
            string restored = Regex.Replace(html,
                @"<span[^>]*class=[""']katex-math[""'][^>]*data-formula=[""'](.*?)[""'][^>]*>.*?</span>",
                "[MATH:$1]",
                RegexOptions.IgnoreCase);

            // ✅ Xóa các tag HTML còn lại (nếu có)
            restored = Regex.Replace(restored, "<.*?>", string.Empty);

            return restored.Trim();
        }


        private string StripHtmlTags(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return string.Empty;

            // Loại bỏ tất cả thẻ HTML, nhưng giữ nguyên nội dung [MATH:...]
            return Regex.Replace(html, "<.*?>", string.Empty).Trim();
        }



        [HttpPost("{sectionId}/import-excel")]
        [Authorize]
        public async Task<IActionResult> ImportQuestionsFromExcel(long sectionId, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "File không hợp lệ hoặc rỗng." });
            var section = await _context.Sections.FindAsync(sectionId);
            //var authorizationResult = await _authorizationService.AuthorizeAsync(User, section.BankId, "BankModify");
            //if (!authorizationResult.Succeeded)
            //{
            //    return Forbid();
            //}
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
                    quesContent = ConvertMathPlaceholdersToHtml(quesContent);
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

                    // Đọc đáp án từ 4 cột riêng biệt (5, 6, 7, 8)
                    var answer1 = GetCellValueAsString(worksheet.Cell(row, 5));
                    var answer2 = GetCellValueAsString(worksheet.Cell(row, 6));
                    var answer3 = GetCellValueAsString(worksheet.Cell(row, 7));
                    var answer4 = GetCellValueAsString(worksheet.Cell(row, 8));

                    // Đọc đáp án đúng từ cột 9
                    // Đọc đáp án đúng từ cột 9
                    var correctAnswers = GetCellValueAsString(worksheet.Cell(row, 9));

                    // Kiểm tra nếu là câu hỏi True/False, thay đổi dấu phân cách từ ";" thành ","
                  

                    // Đọc URL ảnh từ cột 10
                    var imageCell = worksheet.Cell(row, 10);
                    string imageUrl = null;

                    if (imageCell.HasFormula)
                    {
                        var formula = imageCell.FormulaA1; // Ví dụ: =IMAGE("https://.../abc.png", 1, "desc", 100, 100)

                        var match = Regex.Match(formula, "IMAGE\\([\"'](?<url>.*?)[\"']", RegexOptions.IgnoreCase);

                        if (match.Success)
                        {
                            imageUrl = match.Groups["url"].Value;
                        }
                    }
                    else
                    {
                        imageUrl = GetCellValueAsString(imageCell); // fallback nếu là text thường
                    }


                    // Tạo chuỗi answers từ các cột riêng lẻ
                    List<string> answersList = new List<string>();
                    if (!string.IsNullOrWhiteSpace(answer1)) answersList.Add(answer1);
                    if (!string.IsNullOrWhiteSpace(answer2)) answersList.Add(answer2);
                    if (!string.IsNullOrWhiteSpace(answer3)) answersList.Add(answer3);
                    if (!string.IsNullOrWhiteSpace(answer4)) answersList.Add(answer4);

                    string answers = null;
                    if (answersList.Count > 0)
                    {
                        answers = string.Join(";", answersList);
                    }

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
                            var ansListCheck = answers.Split(';', StringSplitOptions.RemoveEmptyEntries)
                           .Select(a => a.Trim()).ToList();
                            var correctAnsCheck = correctAnswers.Split(';').Select(a => a.Trim()).ToList();

                            if (correctAnsCheck.Count != 1)
                            {
                                errors.Add($"Dòng {row}: Câu hỏi trắc nghiệm chỉ được có một đáp án đúng");
                                row++;
                                continue;
                            }

                            if (!ansListCheck.Contains(correctAnsCheck[0]))
                            {
                                errors.Add($"Dòng {row}: Đáp án đúng phải có trong danh sách đáp án");
                                row++;
                                continue;
                            }
                            break;

                        case 2: // True/False với 4 ý
                                // Split trên ';' và bỏ các entry rỗng
                            var tfAnswers = correctAnswers
      .Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
      .Select(x => x.Trim())
      .ToList();

                            if (tfAnswers.Count != 4 || tfAnswers.Any(a => a != "True" && a != "False"))
                            {
                                errors.Add($"Dòng {row}: Đáp án cho câu hỏi True/False phải có đúng 4 giá trị 'True' hoặc 'False'");
                                row++;
                                continue;
                            }
                            break;

                        case 3: // Điền kết quả
                                // Không cần answers
                       // Điền kết quả
                                // Không cần answers
                            if (string.IsNullOrWhiteSpace(correctAnswers))
                            {
                                errors.Add($"Dòng {row}: Đáp án cho câu hỏi điền kết quả không được để trống");
                                row++;
                                continue;
                            }

                            correctAnswers = correctAnswers.Trim()
    .Replace(".", ",")
    .Replace(" ", "");
                            if (!Regex.IsMatch(correctAnswers, @"^[0-9,\-]{1,6}$"))
                            {
                                errors.Add($"Dòng {row}: Đáp án chỉ được chứa số, dấu - hoặc dấu , và tối đa 6 ký tự!");
                                row++;
                                continue;
                            }


                            answers = null; // 🟢 Không cần AnswerContent cho dạng điền kết quả
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

                        if (typeId == 3)
                        {
                            // Điền kết quả: giữ nguyên cả chuỗi (ví dụ "1,23" hoặc "1.23")
                            await _context.CorrectAnswers.AddAsync(new CorrectAnswer
                            {
                                Quesid = existingQuestion.Quesid,
                                Content = correctAnswers.Trim()
                            });
                        }
                        else
                        {
                            // Trắc nghiệm/TrueFalse: split từng phần tử
                            foreach (var ans in correctAnswers.Split(';').Select(a => a.Trim()))
                            {
                                await _context.CorrectAnswers.AddAsync(new CorrectAnswer
                                {
                                    Quesid = existingQuestion.Quesid,
                                    Content = ans
                                });
                            }
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
                        if (typeId == 3)
                        {
                            // Giữ nguyên chuỗi "1,23" làm một đáp án duy nhất
                            await _context.CorrectAnswers.AddAsync(new CorrectAnswer
                            {
                                Quesid = newQuestion.Quesid,
                                Content = correctAnswers
                            });
                        }
                        else
                        {
                            foreach (var ans in correctAnswers.Split(';', StringSplitOptions.RemoveEmptyEntries)
                                    .Select(a => a.Trim()))
                            {
                                await _context.CorrectAnswers.AddAsync(new CorrectAnswer
                                {
                                    Quesid = newQuestion.Quesid,
                                    Content = ans
                                });
                            }
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
                    resultMessage += $" ⚠️ {errors.Count} lỗi phát sinh.";
                }

                return Ok(new
                {
                    message = resultMessage,
                    errors = errors// Trả thêm danh sách lỗi này
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "❌ Lỗi hệ thống khi xử lý file Excel.", error = ex.Message });
            }
        }
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

            var section = await _context.Sections.FindAsync(question.Secid);
            if (section == null)
                return NotFound(new { message = "Section không tồn tại!" });

            //var authorizationResult = await _authorizationService.AuthorizeAsync(User, section.BankId, "BankModify");
            //if (!authorizationResult.Succeeded)
            //    return Forbid();

            if (string.IsNullOrWhiteSpace(questionDto.Quescontent))
            {
                return BadRequest("Question content must not be empty!");
            }

            if (questionDto.Secid == null || questionDto.Secid <= 0)
            {
                return BadRequest("Invalid Section ID!");
            }

            if (questionDto.TypeId <= 0 || !_context.TypeQuestions.Any(t => t.TypeId == questionDto.TypeId))
            {
                return BadRequest("Invalid question type!");
            }

            if (questionDto.Modeid <= 0 || !_context.Levels.Any(m => m.LevelId == questionDto.Modeid))
            {
                return BadRequest("Invalid difficulty level!");
            }

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

                question.AnswerContent = string.Join(";", questionDto.Answers);
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

        private string ConvertMathPlaceholdersToHtml(string content)
        {
            if (string.IsNullOrWhiteSpace(content))
                return content;

            // Dùng Regex tìm tất cả [MATH:...] và thay bằng <span class="katex-math" data-formula="...">...</span>
            return Regex.Replace(content, @"\[MATH:(.+?)\]", match =>
            {
                var formula = match.Groups[1].Value;
                return $"<span class=\"katex-math\" data-formula=\"{formula}\">$$ {formula} $$</span>";
            });
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
            var section = await _context.Sections.FindAsync(question.Secid);
            if (section == null)
                return NotFound(new { message = "Section không tồn tại!" });

            //var authorizationResult = await _authorizationService.AuthorizeAsync(User, section.BankId, "BankModify");
            //if (!authorizationResult.Succeeded)
            //    return Forbid();
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
        // DELETE api/Question/sections/{sectionId}/questions
        [HttpDelete("sections/{sectionId}/questions")]
        public async Task<IActionResult> DeleteQuestionsBySection(long sectionId)
        {
            // 1. Kiểm tra section tồn tại
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null)
                return NotFound(new { message = $"Section với ID={sectionId} không tồn tại!" });

            // 2. Lấy danh sách tất cả các câu hỏi kèm đáp án đúng
            var questions = await _context.Questions
                .Where(q => q.Secid == sectionId)
                .Include(q => q.CorrectAnswers)
                .ToListAsync();

            if (!questions.Any())
                return NotFound(new { message = $"Không có câu hỏi nào trong section {sectionId}." });

            // 3. Xóa file ảnh (nếu có) và đáp án đúng
            foreach (var q in questions)
            {
                if (!string.IsNullOrEmpty(q.ImageUrl))
                {
                    var imagePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", q.ImageUrl.TrimStart('/'));
                    if (System.IO.File.Exists(imagePath))
                        System.IO.File.Delete(imagePath);
                }

                // xóa toàn bộ bản ghi CorrectAnswer liên quan
                _context.CorrectAnswers.RemoveRange(q.CorrectAnswers);
            }

            // 4. Xóa câu hỏi
            _context.Questions.RemoveRange(questions);

            // 5. Commit thay đổi
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã xóa {questions.Count} câu hỏi của section {sectionId}." });
        }

    }
}