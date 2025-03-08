using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.BankdDTO;
using ClosedXML.Excel;

namespace SEP490_G77_ESS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BankController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public BankController(EssDbV11Context context)
        {
            _context = context;
        }

        // ✅ Lấy danh sách ngân hàng câu hỏi
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBanks()
        {
            var banks = await _context.Banks
                .Include(b => b.Grade)
                .Include(b => b.Subject)
                .Select(b => new
                {
                    b.BankId,
                    b.Bankname,
                    Totalquestion = _context.Questions
                        .Where(q => q.Secid != null && b.Sections.Select(s => s.Secid).Contains(q.Secid.Value))
                        .Count(), // ✅ Tính lại tổng số câu hỏi thực tế
                    b.CreateDate,
                    Grade = b.Grade != null ? b.Grade.GradeLevel : "Không xác định",
                    Subject = b.Subject != null ? b.Subject.SubjectName : "Không xác định"
                })
                .ToListAsync();

            return Ok(banks);
        }


        // ✅ Lấy chi tiết ngân hàng câu hỏi theo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetBank(long id)
        {
            var bank = await _context.Banks
                .Include(b => b.Sections)
                .Where(b => b.BankId == id)
                .Select(b => new
                {
                    b.BankId,
                    b.Bankname,
                    Totalquestion = _context.Questions
                        .Where(q => q.Secid != null && b.Sections.Select(s => s.Secid).Contains(q.Secid.Value))
                        .Count(), // ✅ Không lấy giá trị từ DB mà tính toán lại
                    b.CreateDate,
                    Grade = b.Grade != null ? b.Grade.GradeLevel : "Không xác định",
                    Subject = b.Subject != null ? b.Subject.SubjectName : "Không xác định",
                    Sections = b.Sections.Select(s => new
                    {
                        s.Secid,
                        s.Secname,
                        QuestionCount = _context.Questions.Count(q => q.Secid == s.Secid) // ✅ Đếm số câu hỏi trong từng section
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (bank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            return Ok(bank);
        }



        // ✅ Thêm mới ngân hàng câu hỏi
        [HttpPost]
        public async Task<ActionResult<Bank>> CreateBank([FromBody] Bank bank)
        {
            if (string.IsNullOrEmpty(bank.Bankname))
            {
                return BadRequest(new { message = "Tên ngân hàng câu hỏi không được để trống" });
            }

            bank.CreateDate = DateTime.Now;
            _context.Banks.Add(bank);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBank), new { id = bank.BankId }, bank);
        }

        // ✅ Cập nhật chỉ Bankname
        [HttpPut("{id}/name")]
        public async Task<IActionResult> UpdateBankName(long id, [FromBody] Bank bank)
        {
            if (string.IsNullOrEmpty(bank.Bankname))
            {
                return BadRequest(new { message = "Tên ngân hàng không được để trống" });
            }

            var existingBank = await _context.Banks.FindAsync(id);
            if (existingBank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            existingBank.Bankname = bank.Bankname;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new
                {
                    message = "Cập nhật tên ngân hàng thành công!",
                    bankId = existingBank.BankId,
                    bankname = existingBank.Bankname
                });
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, new { message = "Lỗi cập nhật dữ liệu!" });
            }
        }



        // ✅ Xóa ngân hàng câu hỏi
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBank(long id)
        {
            var bank = await _context.Banks
                .Include(b => b.Sections)
                .ThenInclude(s => s.Questions)
                .FirstOrDefaultAsync(b => b.BankId == id);

            if (bank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            // ✅ Xóa toàn bộ câu hỏi thuộc các Sections của Bank
            var sections = bank.Sections.ToList();
            foreach (var section in sections)
            {
                var questions = _context.Questions.Where(q => q.Secid == section.Secid);
                _context.Questions.RemoveRange(questions);
            }

            // ✅ Xóa toàn bộ Sections thuộc Bank
            _context.Sections.RemoveRange(sections);

            // ✅ Xóa quan hệ SectionHierarchy liên quan đến Bank
            var sectionIds = sections.Select(s => s.Secid).ToList();
            var sectionHierarchies = _context.SectionHierarchies
                .Where(sh => sectionIds.Contains(sh.AncestorId) || sectionIds.Contains(sh.DescendantId));
            _context.SectionHierarchies.RemoveRange(sectionHierarchies);

            // ✅ Xóa ngân hàng câu hỏi
            _context.Banks.Remove(bank);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa ngân hàng câu hỏi và toàn bộ dữ liệu liên quan thành công" });
        }


        // ✅ Tìm kiếm ngân hàng câu hỏi theo tên
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchBanks([FromQuery] string query)
        {
            if (string.IsNullOrEmpty(query))
            {
                return BadRequest(new { message = "Truy vấn tìm kiếm không hợp lệ" });
            }

            var banks = await _context.Banks
                .Where(b => b.Bankname.Contains(query))
                .OrderByDescending(b => b.CreateDate)
                .Select(b => new
                {
                    b.BankId,
                    b.Bankname,
                    b.Totalquestion,
                    b.CreateDate
                })
                .ToListAsync();

            return Ok(banks);
        }

        // ✅ Tạo ngân hàng câu hỏi tự động nếu chưa có
        // ✅ Tạo ngân hàng câu hỏi tự động luôn tạo mới
        [HttpPost("generate")]
        public async Task<ActionResult<BankDto>> GenerateQuestionBank([FromBody] Bank bank)
        {
            // 🔍 Kiểm tra thông tin bắt buộc
            var grade = await _context.Grades.FindAsync(bank.GradeId);
            var subject = await _context.Subjects.FindAsync(bank.SubjectId);
            var curriculum = bank.CurriculumId != null ? await _context.Curricula.FindAsync(bank.CurriculumId) : null;

            if (grade == null || subject == null || (bank.CurriculumId != null && curriculum == null))
            {
                return BadRequest(new { message = "Không tìm thấy Khối học, Môn học hoặc Chương trình!" });
            }

            // 🔹 Tạo ngân hàng câu hỏi mới
            string newBankName = curriculum != null
                ? $"Ngân hàng {subject.SubjectName} {grade.GradeLevel} - {curriculum.CurriculumName}"
                : $"Ngân hàng {subject.SubjectName} {grade.GradeLevel}";

            var newBank = new Bank
            {
                Bankname = newBankName,
                Bankstatus = 1,
                Totalquestion = 0,
                GradeId = bank.GradeId,
                SubjectId = bank.SubjectId,
                CurriculumId = bank.CurriculumId,
                CreateDate = DateTime.Now
            };

            _context.Banks.Add(newBank);
            await _context.SaveChangesAsync(); // Lưu để lấy ID của ngân hàng mới

            Console.WriteLine($"✅ Tạo ngân hàng câu hỏi mới: {newBank.BankId} - {newBank.Bankname}");

            List<SectionDto> createdSections = new List<SectionDto>();

            // ✅ Chỉ lấy dữ liệu từ Default_Section_Hierarchy
            var defaultSections = await _context.DefaultSectionHierarchies
                .Where(d => d.CurriculumId == bank.CurriculumId)
                .ToListAsync();

            Console.WriteLine($"📌 Lấy {defaultSections.Count} sections từ Default_Section_Hierarchy");

            foreach (var defaultSection in defaultSections)
            {
                var newSection = new Section
                {
                    Secname = defaultSection.DfSectionName,
                    BankId = newBank.BankId
                };

                _context.Sections.Add(newSection);
                await _context.SaveChangesAsync();

                createdSections.Add(new SectionDto
                {
                    Secid = newSection.Secid,
                    Secname = newSection.Secname
                });

                Console.WriteLine($"➕ Thêm Section: {newSection.Secid} - {newSection.Secname}");
            }

            return Ok(new BankDto
            {
                BankId = newBank.BankId,
                BankName = newBank.Bankname,
                CurriculumId = newBank.CurriculumId,
                Sections = createdSections
            });
        }
















        // ✅ Lấy danh sách các Khối học
        [HttpGet("grades")]
        public async Task<ActionResult<IEnumerable<object>>> GetGrades()
        {
            var grades = await _context.Grades
                .Select(g => new { g.GradeId, g.GradeLevel })
                .ToListAsync();

            return Ok(grades);
        }

        // ✅ Lấy danh sách các Môn học
        [HttpGet("subjects")]
        public async Task<ActionResult<IEnumerable<object>>> GetSubjects()
        {
            var subjects = await _context.Subjects
                .Select(s => new { s.SubjectId, s.SubjectName })
                .ToListAsync();

            return Ok(subjects);
        }

        // ✅ API: Lấy danh sách Sections dưới dạng cây
        // ✅ API: Lấy danh sách Sections dưới dạng cây
        // ✅ API: Lấy danh sách Sections theo BankId (dạng cây đệ quy)
        [HttpGet("{bankId}/sections")]
        public async Task<ActionResult<IEnumerable<object>>> GetSectionsByBankId(long bankId)
        {
            var sections = await _context.Sections
                .Where(s => s.BankId == bankId)
                .ToListAsync();  // ✅ Lấy toàn bộ sections của Bank

            var sectionHierarchies = await _context.SectionHierarchies
                .ToListAsync();  // ✅ Lấy toàn bộ quan hệ cha - con

            var questionCounts = await _context.Questions
    .Where(q => q.Secid != null && sections.Select(s => s.Secid).Contains(q.Secid.Value))
    .GroupBy(q => q.Secid)
    .Select(g => new { Key = g.Key ?? 0, Count = g.Count() }) // ✅ Đảm bảo Key không null
    .ToDictionaryAsync(g => g.Key, g => g.Count);  // ✅ Chuyển thành Dictionary<long, int>

            var sectionTree = sections
                .Where(s => !sectionHierarchies.Any(sh => sh.DescendantId == s.Secid))  // ✅ Chỉ lấy các section gốc
                .Select(s => BuildSectionTree(s, sections, sectionHierarchies, questionCounts))
                .ToList();

            return Ok(sectionTree);
        }

        // ✅ Hàm đệ quy xây dựng cây section (CÓ SỐ LƯỢNG CÂU HỎI)
        // ✅ Hàm đệ quy xây dựng cây section (CÓ CỘNG DỒN SỐ LƯỢNG CÂU HỎI)
        private object BuildSectionTree(Section section, List<Section> sections, List<SectionHierarchy> sectionHierarchies, Dictionary<long, int> questionCounts)
        {
            // ✅ Lấy danh sách các section con của section hiện tại
            var childSections = sectionHierarchies
                .Where(sh => sh.AncestorId == section.Secid)
                .Select(sh => sections.FirstOrDefault(s => s.Secid == sh.DescendantId))
                .Where(s => s != null)
                .ToList();

            // ✅ Tính tổng số câu hỏi: Câu hỏi của section hiện tại + tất cả các section con
            int totalQuestions = questionCounts.ContainsKey(section.Secid) ? questionCounts[section.Secid] : 0;

            // ✅ Đệ quy tính tổng số câu hỏi từ các section con
            var children = childSections.Select(s => BuildSectionTree(s, sections, sectionHierarchies, questionCounts)).ToList();

            // ✅ Cộng số câu hỏi của các con vào cha
            totalQuestions += children.Sum(c => (int)c.GetType().GetProperty("questionCount").GetValue(c, null));

            return new
            {
                secid = section.Secid,
                secname = section.Secname,
                questionCount = totalQuestions, // ✅ Hiển thị tổng số câu hỏi từ cha và con
                children = children
            };
        }


        [HttpGet("curriculums")]
        public async Task<ActionResult<IEnumerable<object>>> GetCurriculums()
        {
            var curriculums = await _context.Curricula
                .Select(c => new { c.CurriculumId, c.CurriculumName })
                .ToListAsync();

            return Ok(curriculums);
        }










        [HttpPost("{bankId}/add-section")]
        public async Task<ActionResult<object>> AddSection(long bankId, [FromBody] Section section)
        {
            if (string.IsNullOrWhiteSpace(section.Secname))
                return BadRequest(new { message = "Tên section không được để trống" });

            var newSection = new Section
            {
                Secname = section.Secname,
                BankId = bankId
            };

            _context.Sections.Add(newSection);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Thêm section thành công", newSection });
        }
        // ✅ API: Thêm Section con cho bất kỳ Section
        [HttpPost("{parentId}/add-subsection")]
        public async Task<ActionResult<object>> AddSubSection(long parentId, [FromBody] Section section)
        {
            if (string.IsNullOrWhiteSpace(section.Secname))
                return BadRequest(new { message = "Tên section không được để trống" });

            var parentSection = await _context.Sections.FindAsync(parentId);
            if (parentSection == null)
                return NotFound(new { message = "Section cha không tồn tại" });

            // ✅ Tạo Section con với BankId từ Section cha
            var newSection = new Section
            {
                Secname = section.Secname,
                BankId = parentSection.BankId
            };

            _context.Sections.Add(newSection);
            await _context.SaveChangesAsync();

            // ✅ Thêm quan hệ cha - con
            var sectionHierarchy = new SectionHierarchy
            {
                AncestorId = parentId,
                DescendantId = newSection.Secid,
                Depth = 1
            };

            _context.SectionHierarchies.Add(sectionHierarchy);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm section con thành công",
                newSection = new
                {
                    newSection.Secid,
                    newSection.Secname,
                    newSection.BankId
                }
            });
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





























        // ✅ Cập nhật tên Section
        [HttpPut("section/{sectionId}")]
        public async Task<IActionResult> UpdateSection(long sectionId, [FromBody] Section updatedSection)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null)
                return NotFound(new { message = "Không tìm thấy section" });

            section.Secname = updatedSection.Secname ?? section.Secname;

            _context.Entry(section).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật section thành công" });
        }

        // ✅ Xóa Section (Sửa route để không bị trùng)
        [HttpDelete("section/{sectionId}")]
        public async Task<IActionResult> DeleteSection(long sectionId)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null)
                return NotFound(new { message = "Không tìm thấy section" });

            var sectionRelations = _context.SectionHierarchies
                .Where(sh => sh.AncestorId == sectionId || sh.DescendantId == sectionId);
            _context.SectionHierarchies.RemoveRange(sectionRelations);

            _context.Sections.Remove(section);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa section thành công" });
        }
    }
}