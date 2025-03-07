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



        [HttpGet("{bankId}/export-excel")]
        public async Task<IActionResult> ExportBankToExcel(long bankId)
        {
            var bank = await _context.Banks
                .Include(b => b.Sections)
                    .ThenInclude(s => s.Questions)
                .FirstOrDefaultAsync(b => b.BankId == bankId);

            if (bank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Bank Details");

            // 🟢 Tiêu đề file Excel
            worksheet.Cell(1, 1).Value = "Parent Section Name";
            worksheet.Cell(1, 2).Value = "Section Name";
            worksheet.Cell(1, 3).Value = "Question Content";
            worksheet.Cell(1, 4).Value = "Type ID";
            worksheet.Cell(1, 5).Value = "Mode ID";
            worksheet.Cell(1, 6).Value = "Solution";
            worksheet.Cell(1, 7).Value = "Answers";
            worksheet.Cell(1, 8).Value = "Correct Answers";

            int row = 2;

            var sectionHierarchy = await _context.SectionHierarchies.ToListAsync();
            var correctAnswers = await _context.CorrectAnswers.ToListAsync();

            var sectionMap = bank.Sections.ToDictionary(s => s.Secid, s => s.Secname);

            foreach (var section in bank.Sections)
            {
                var parentSecName = sectionHierarchy
                    .FirstOrDefault(h => h.DescendantId == section.Secid)?.AncestorId is long parentSecId && sectionMap.ContainsKey(parentSecId)
                    ? sectionMap[parentSecId] : "";

                row = WriteSectionToSheet(worksheet, section, row, parentSecName, correctAnswers);
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            stream.Position = 0;

            return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Bank_{bankId}.xlsx");
        }

        private int WriteSectionToSheet(IXLWorksheet worksheet, Section section, int row, string parentSecName, List<CorrectAnswer> correctAnswers)
        {
            if (!section.Questions.Any()) // ✅ Xuất cả Sections không có câu hỏi
            {
                worksheet.Cell(row, 1).Value = parentSecName;
                worksheet.Cell(row, 2).Value = section.Secname;
                worksheet.Cell(row, 3).Value = ""; // Cột câu hỏi để trống
                worksheet.Cell(row, 4).Value = "";
                worksheet.Cell(row, 5).Value = "";
                worksheet.Cell(row, 6).Value = "";
                worksheet.Cell(row, 7).Value = "";
                worksheet.Cell(row, 8).Value = "";

                row++;
            }
            else
            {
                foreach (var question in section.Questions)
                {
                    worksheet.Cell(row, 1).Value = parentSecName;
                    worksheet.Cell(row, 2).Value = section.Secname;
                    worksheet.Cell(row, 3).Value = question.Quescontent;
                    worksheet.Cell(row, 4).Value = question.TypeId;
                    worksheet.Cell(row, 5).Value = question.Modeid;
                    worksheet.Cell(row, 6).Value = question.Solution ?? "";
                    worksheet.Cell(row, 7).Value = question.AnswerContent ?? "";
                    worksheet.Cell(row, 8).Value = string.Join(",", correctAnswers.Where(a => a.Quesid == question.Quesid).Select(a => a.Content));

                    row++;
                }
            }

            return row;
        }
        //[HttpPost("{bankId}/import-excel")]
        //public async Task<IActionResult> ImportBankFromExcel(long bankId, IFormFile file)
        //{
        //    if (file == null || file.Length == 0)
        //    {
        //        return BadRequest(new { message = "File không hợp lệ" });
        //    }

        //    using var stream = new MemoryStream();
        //    await file.CopyToAsync(stream);
        //    using var workbook = new XLWorkbook(stream);
        //    var worksheet = workbook.Worksheets.First();

        //    var bankExists = await _context.Banks.AnyAsync(b => b.BankId == bankId);
        //    if (!bankExists)
        //    {
        //        return NotFound(new { message = $"Ngân hàng câu hỏi với ID {bankId} không tồn tại." });
        //    }

        //    // 🔥 Lấy danh sách Sections & Questions thuộc bankId trong DB
        //    var existingSections = await _context.Sections
        //        .Where(s => s.BankId == bankId)
        //        .Include(s => s.Questions)
        //        .ToListAsync();

        //    var sectionMap = existingSections.ToDictionary(s => s.Secname.Trim().ToLower(), s => s);
        //    var questionMap = existingSections
        //        .SelectMany(s => s.Questions)
        //        .ToDictionary(q => q.Quescontent.Trim().ToLower(), q => q);

        //    List<Section> newSections = new List<Section>();
        //    List<Question> newQuestions = new List<Question>();
        //    List<SectionHierarchy> newHierarchies = new List<SectionHierarchy>();

        //    HashSet<long> updatedSectionIds = new HashSet<long>();
        //    HashSet<long> updatedQuestionIds = new HashSet<long>();

        //    // 📌 Lưu danh sách Section & Question có trong file Excel
        //    HashSet<string> excelSectionNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        //    HashSet<string> excelQuestionContents = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        //    int row = 2;
        //    Dictionary<string, long> sectionIdMap = new Dictionary<string, long>(StringComparer.OrdinalIgnoreCase);

        //    while (!worksheet.Cell(row, 2).IsEmpty())
        //    {
        //        string parentSecName = worksheet.Cell(row, 1).GetString().Trim();
        //        string secName = worksheet.Cell(row, 2).GetString().Trim();
        //        string quesContent = worksheet.Cell(row, 3).GetString().Trim();

        //        // ✅ Lưu lại các section & question xuất hiện trong file Excel
        //        if (!string.IsNullOrEmpty(secName))
        //            excelSectionNames.Add(secName.ToLower());
        //        if (!string.IsNullOrEmpty(quesContent))
        //            excelQuestionContents.Add(quesContent.ToLower());

        //        long? parentSecId = null;
        //        if (!string.IsNullOrEmpty(parentSecName) && sectionIdMap.TryGetValue(parentSecName, out long pSecId))
        //        {
        //            parentSecId = pSecId;
        //        }

        //        Section section;
        //        string sectionKey = secName.ToLower();

        //        if (!string.IsNullOrEmpty(secName))
        //        {
        //            if (!sectionMap.TryGetValue(sectionKey, out section))
        //            {
        //                section = new Section
        //                {
        //                    Secname = secName,
        //                    BankId = bankId
        //                };
        //                newSections.Add(section);
        //                sectionMap[sectionKey] = section;
        //            }
        //            else
        //            {
        //                section.Secname = secName;
        //                _context.Sections.Update(section);
        //            }
        //            updatedSectionIds.Add(section.Secid);
        //            sectionIdMap[secName] = section.Secid;

        //            if (parentSecId.HasValue && !newHierarchies.Any(h => h.AncestorId == parentSecId && h.DescendantId == section.Secid))
        //            {
        //                newHierarchies.Add(new SectionHierarchy
        //                {
        //                    AncestorId = parentSecId.Value,
        //                    DescendantId = section.Secid,
        //                    Depth = 1
        //                });
        //            }
        //        }

        //        if (!string.IsNullOrEmpty(quesContent) && sectionMap.TryGetValue(sectionKey, out section))
        //        {
        //            if (!questionMap.TryGetValue(quesContent.ToLower(), out var question))
        //            {
        //                question = new Question
        //                {
        //                    Quescontent = quesContent,
        //                    Secid = section.Secid,
        //                    TypeId = worksheet.Cell(row, 4).GetValue<int>(),
        //                    Modeid = worksheet.Cell(row, 5).GetValue<int>(),
        //                    Solution = worksheet.Cell(row, 6).GetString().Trim(),
        //                    AnswerContent = worksheet.Cell(row, 7).GetString().Trim()
        //                };
        //                newQuestions.Add(question);
        //                questionMap[quesContent.ToLower()] = question;
        //            }
        //            else
        //            {
        //                _context.Entry(question).State = EntityState.Modified;
        //                question.TypeId = worksheet.Cell(row, 4).GetValue<int>();
        //                question.Modeid = worksheet.Cell(row, 5).GetValue<int>();
        //                question.Solution = worksheet.Cell(row, 6).GetString().Trim();
        //                question.AnswerContent = worksheet.Cell(row, 7).GetString().Trim();
        //                _context.Questions.Update(question);
        //            }
        //            updatedQuestionIds.Add(question.Quesid);
        //        }
        //        row++;
        //    }

        //    await _context.Sections.AddRangeAsync(newSections);
        //    await _context.SaveChangesAsync();

        //    await _context.SectionHierarchies.AddRangeAsync(newHierarchies);
        //    await _context.SaveChangesAsync();

        //    await _context.Questions.AddRangeAsync(newQuestions);
        //    await _context.SaveChangesAsync();

        //    // 🔥 XÓA CHỈ NHỮNG SECTION & QUESTION CỦA `bankId` MÀ KHÔNG CÓ TRONG EXCEL
        //    try
        //    {
        //        // 🟢 XÓA SECTION KHÔNG CÓ TRONG FILE EXCEL, NHƯNG PHẢI CHỈ TRONG `bankId`
        //        var sectionsToDelete = await _context.Sections
        //            .Where(s => s.BankId == bankId && !excelSectionNames.Contains(s.Secname.ToLower()))
        //            .ToListAsync();

        //        var sectionIdsToDelete = sectionsToDelete.Select(s => s.Secid).ToList();

        //        // 🟢 XÓA QUESTION CHỈ TRONG `bankId`, CHỨ KHÔNG XÓA QUESTION CỦA BANK KHÁC
        //        var questionsToDelete = await _context.Questions
        //            .Where(q => q.Secid.HasValue && sectionIdsToDelete.Contains(q.Secid.Value)
        //                && !excelQuestionContents.Contains(q.Quescontent.ToLower()))
        //            .ToListAsync();

        //        // 🟢 XÓA `SectionHierarchy` trước khi xóa `Section`
        //        var hierarchiesToDelete = await _context.SectionHierarchies
        //            .Where(h => sectionIdsToDelete.Contains(h.DescendantId))
        //            .ToListAsync();

        //        if (hierarchiesToDelete.Any())
        //        {
        //            _context.SectionHierarchies.RemoveRange(hierarchiesToDelete);
        //            await _context.SaveChangesAsync();
        //        }

        //        if (questionsToDelete.Any())
        //        {
        //            _context.Questions.RemoveRange(questionsToDelete);
        //            await _context.SaveChangesAsync();
        //        }

        //        if (sectionsToDelete.Any())
        //        {
        //            _context.Sections.RemoveRange(sectionsToDelete);
        //            await _context.SaveChangesAsync();
        //        }
        //    }
        //    catch (DbUpdateConcurrencyException ex)
        //    {
        //        return BadRequest(new { message = "Dữ liệu đã bị thay đổi hoặc xóa trước đó.", error = ex.Message });
        //    }

        //    return Ok(new { message = "Import dữ liệu thành công!" });
        //}

























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