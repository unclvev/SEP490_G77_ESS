using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.BankdDTO;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;

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
        [HttpGet("account/{accid}")]
        public async Task<ActionResult<IEnumerable<object>>> GetBanksByAccount(
    long accid,
    [FromQuery] string query = "",
    [FromQuery] string grade = "",
    [FromQuery] string subject = "",
    [FromQuery] string curriculum = "")
        {
            // 1. Xác định danh sách bankId được share cho user này (IsOwner hoặc CanRead)
            var sharedBankIds = _context.ResourceAccesses
                .Where(ra =>
                    ra.Accid == accid &&
                    ra.ResourceType == "Bank" &&
                    // bạn có thể check sử dụng Include + ra.Role.CanRead nếu cần
                    (ra.IsOwner == true || ra.Role.CanRead == true)
                )
                .Select(ra => ra.ResourceId);

            // 2. Build query: lấy tất cả Bank mà accid == userId (owner) OR nằm trong sharedBankIds
            var banksQuery = _context.Banks
                .Where(b =>
                    b.Accid == accid ||
                    sharedBankIds.Contains(b.BankId)
                )
                .Include(b => b.Grade)
                .Include(b => b.Subject)
                .Include(b => b.Curriculum)
                .Include(b => b.Sections)
                .AsQueryable();

            // 3. Áp filter search như cũ
            if (!string.IsNullOrEmpty(query))
                banksQuery = banksQuery.Where(b => b.Bankname.Contains(query));

            if (!string.IsNullOrEmpty(grade))
                banksQuery = banksQuery.Where(b => b.Grade.GradeLevel == grade);

            if (!string.IsNullOrEmpty(subject))
                banksQuery = banksQuery.Where(b => b.Subject.SubjectName.Contains(subject));

            if (!string.IsNullOrEmpty(curriculum))
                banksQuery = banksQuery.Where(b => b.Curriculum.CurriculumName.Contains(curriculum));

            // 4. Project kết quả và trả về
            var banks = await banksQuery
                .OrderByDescending(b => b.CreateDate)
                .Select(b => new
                {
                    b.BankId,
                    b.Bankname,
                    TotalQuestion = _context.Questions
                        .Count(q => q.Secid != null && b.Sections.Any(s => s.Secid == q.Secid)),
                    b.CreateDate,
                    Grade = b.Grade != null ? b.Grade.GradeLevel : "Không xác định",
                    Subject = b.Subject != null ? b.Subject.SubjectName : "Không xác định",
                    Curriculum = b.Curriculum != null ? b.Curriculum.CurriculumName : "Không xác định"
                })
                .ToListAsync();

            return Ok(banks);
        }

        [HttpGet("default-banks")]
        public async Task<IActionResult> GetDefaultBanks(
            [FromQuery] string grade = "",
            [FromQuery] string subject = "",
            [FromQuery] string curriculum = "")
        {
            var banksQuery = _context.DefaultSectionHierarchies
                .Include(d => d.Grade)
                .Include(d => d.Subject)
                .Include(d => d.Curriculum)
                .AsQueryable();

            if (!string.IsNullOrEmpty(grade))
                banksQuery = banksQuery.Where(d => d.Grade.GradeLevel == grade);
            if (!string.IsNullOrEmpty(subject))
                banksQuery = banksQuery.Where(d => d.Subject.SubjectName.Contains(subject));
            if (!string.IsNullOrEmpty(curriculum))
                banksQuery = banksQuery.Where(d => d.Curriculum.CurriculumName.Contains(curriculum));

            // Get the basic bank information first
            var banks = await banksQuery.ToListAsync();

            // Create a list to hold our final result
            var result = new List<object>();

            // Process each bank individually
            foreach (var bank in banks)
            {
                try
                {
                    // Get all section IDs for this bank's curriculum
                    var sectionIds = await _context.DefaultSectionHierarchies
                        .Where(s => s.CurriculumId == bank.CurriculumId)
                        .Select(s => s.DfSectionId)
                        .ToListAsync();

                    // Count questions using the same logic as in GetDefaultBank
                    var questionCount = await _context.Questions
                        .Where(q => q.DfSectionId.HasValue && sectionIds.Contains(q.DfSectionId.Value))
                        .CountAsync();

                    // Add to result with all fields explicitly set
                    result.Add(new
                    {
                        BankId = bank.DfSectionId,
                        BankName = $"{bank.Subject.SubjectName}-{bank.Grade.GradeLevel}",
                        Grade = bank.Grade.GradeLevel,
                        Subject = bank.Subject.SubjectName,
                        Curriculum = bank.Curriculum.CurriculumName,
                        TotalQuestion = questionCount
                    });
                }
                catch (Exception ex)
                {
                    // Log the exception but continue processing other banks
                    Console.WriteLine($"Error processing bank {bank.DfSectionId}: {ex.Message}");
                }
            }

            return Ok(result);
        }








        [HttpGet("default/{id}")]
        public async Task<ActionResult<object>> GetDefaultBank(long id)
        {
            // ✅ Lấy thông tin ngân hàng dựa trên `id`
            var bankInfo = await _context.DefaultSectionHierarchies
                .Include(d => d.Grade)
                .Include(d => d.Subject)
                .Include(d => d.Curriculum)
                .Where(d => d.DfSectionId == id)
                .FirstOrDefaultAsync();

            if (bankInfo == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            // ✅ Lấy `curriculum_id` của ngân hàng này
            var curriculumId = bankInfo.CurriculumId;

            // ✅ Lấy tất cả `df_section_id` thuộc curriculum này
            var sectionIds = await _context.DefaultSectionHierarchies
                .Where(s => s.CurriculumId == curriculumId)
                .Select(s => s.DfSectionId)
                .ToListAsync();

            // ✅ Tính tổng số câu hỏi của tất cả sections trong ngân hàng
            var totalQuestions = await _context.Questions
                .Where(q => q.DfSectionId.HasValue && sectionIds.Contains(q.DfSectionId.Value))
                .CountAsync();

            // ✅ Trả về dữ liệu đúng
            var bank = new
            {
                BankId = bankInfo.DfSectionId,
                BankName = $"{bankInfo.Subject.SubjectName} - {bankInfo.Grade.GradeLevel}",
                Grade = bankInfo.Grade.GradeLevel,
                Subject = bankInfo.Subject.SubjectName,
                Curriculum = bankInfo.Curriculum.CurriculumName,
                TotalQuestion = totalQuestions // 🟢 Giá trị chính xác
            };

            return Ok(bank);
        }


        [HttpGet("default/{bankId}/sections")]
        public async Task<ActionResult<IEnumerable<object>>> GetDefaultSectionsByBankId(long bankId)
        {
            var curriculumId = await _context.DefaultSectionHierarchies
                .Where(d => d.DfSectionId == bankId)
                .Select(d => d.CurriculumId)
                .FirstOrDefaultAsync();

            if (curriculumId == null)
            {
                return NotFound(new { message = "Không tìm thấy curriculum cho bank này!" });
            }

            var sections = await _context.DefaultSectionHierarchies
                .Where(s => s.CurriculumId == curriculumId)
                .ToListAsync();

            var hierarchyRelations = await _context.DefaultSectionHierarchies
                .Where(s => s.AncestorId != null && s.DescendantId != null && s.AncestorId != s.DescendantId)
                .ToListAsync();

            var descendantIds = hierarchyRelations.Select(h => h.DescendantId.Value).ToHashSet();

            var rootSections = sections
                .Where(s => (s.AncestorId == s.DfSectionId) || (s.AncestorId == null && !descendantIds.Contains(s.DfSectionId)))
                .ToList();

            var sectionLookup = sections.ToDictionary(s => s.DfSectionId);
            var hierarchyLookup = hierarchyRelations
                .GroupBy(h => h.AncestorId)
                .ToDictionary(g => g.Key, g => g.Select(h => h.DescendantId.Value).ToList());

            // ✅ Lấy số lượng câu hỏi theo từng section
            var questionCounts = await _context.Questions
                .Where(q => q.DfSectionId.HasValue && sections.Select(s => s.DfSectionId).Contains(q.DfSectionId.Value))
                .GroupBy(q => q.DfSectionId)
                .Select(g => new { SectionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.SectionId.Value, g => g.Count);

            var sectionTree = rootSections
                .Select(s => BuildSectionTree(s, sectionLookup, hierarchyLookup, questionCounts))
                .ToList();

            return Ok(sectionTree);
        }

        // ✅ Build cây đệ quy tối ưu (có cộng dồn số câu hỏi)
        private object BuildSectionTree(DefaultSectionHierarchy section,
            Dictionary<long, DefaultSectionHierarchy> sectionLookup,
            Dictionary<long?, List<long>> hierarchyLookup,
            Dictionary<long, int> questionCounts)
        {
            var childSections = hierarchyLookup.ContainsKey(section.DfSectionId)
                ? hierarchyLookup[section.DfSectionId].Where(sectionLookup.ContainsKey).Select(id => sectionLookup[id]).ToList()
                : new List<DefaultSectionHierarchy>();

            // ✅ Đếm số câu hỏi của section hiện tại (nếu có)
            int totalQuestions = questionCounts.ContainsKey(section.DfSectionId) ? questionCounts[section.DfSectionId] : 0;

            var children = childSections
                .Select(s => BuildSectionTree(s, sectionLookup, hierarchyLookup, questionCounts))
                .ToList();

            totalQuestions += children.Sum(c => (int)c.GetType().GetProperty("questionCount").GetValue(c, null));

            return new
            {
                secid = section.DfSectionId,
                secname = section.DfSectionName,
                questionCount = totalQuestions, // ✅ Cộng dồn số câu hỏi từ con
                children = children
            };
        }



        [HttpGet("default/{sectionId}/questions")]
        public async Task<ActionResult<IEnumerable<object>>> GetQuestionsForSection(long sectionId)
        {
            // ✅ Kiểm tra sectionId có tồn tại không
            var sectionExists = await _context.DefaultSectionHierarchies.AnyAsync(s => s.DfSectionId == sectionId);
            if (!sectionExists)
            {
                return NotFound(new { message = "Không tìm thấy section này!" });
            }

            // ✅ Chỉ lấy câu hỏi thuộc sectionId cụ thể
            var questions = await _context.Questions
                .Where(q => q.DfSectionId == sectionId)
                .Select(q => new
                {
                    q.Quesid,
                    q.Quescontent,
                    q.TypeId,
                    q.Modeid,
                    q.Solution,
                    q.AnswerContent,
                    q.ImageUrl,
                    CorrectAnswers = _context.CorrectAnswers
                        .Where(a => a.Quesid == q.Quesid)
                        .Select(a => a.Content)
                        .ToList()
                })
                .ToListAsync();

            return Ok(questions.Any() ? questions : new List<object>()); // ✅ Đảm bảo luôn trả về []
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
        [Authorize(Policy = "BankModify")]
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
        [Authorize(Policy = "BankDelete")]
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

            // ✅ Xóa dữ liệu trong Correct_Answer trước
            // ✅ Xóa dữ liệu trong Correct_Answer trước
            var questionIds = bank.Sections.SelectMany(s => s.Questions).Select(q => q.Quesid).ToList();
            var correctAnswers = _context.CorrectAnswers
      .Where(ca => ca.Quesid.HasValue && questionIds.Contains(ca.Quesid.Value))
      .ToList();



            // ✅ Xóa toàn bộ câu hỏi thuộc các Sections của Bank
            var questions = _context.Questions.Where(q => questionIds.Contains(q.Quesid));
            _context.Questions.RemoveRange(questions);

            // ✅ Xóa toàn bộ Sections thuộc Bank
            var sections = bank.Sections.ToList();
            _context.Sections.RemoveRange(sections);

            // ✅ Xóa quan hệ SectionHierarchy liên quan đến Bank
            var sectionIds = sections.Select(s => s.Secid).ToList();
            var sectionHierarchies = _context.SectionHierarchies
                .Where(sh => sectionIds.Contains(sh.AncestorId) || sectionIds.Contains(sh.DescendantId));
            _context.SectionHierarchies.RemoveRange(sectionHierarchies);

            // ✅ Xóa toàn bộ dữ liệu trong BankAccess liên quan đến Bank
            

            // ✅ Xóa ngân hàng câu hỏi
            _context.Banks.Remove(bank);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa ngân hàng câu hỏi và toàn bộ dữ liệu liên quan thành công" });
        }



        // ✅ Tìm kiếm ngân hàng câu hỏi theo tên
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchBanks([FromQuery] string query, [FromQuery] long accid)
        {
            if (string.IsNullOrEmpty(query))
            {
                return BadRequest(new { message = "Truy vấn tìm kiếm không hợp lệ" });
            }

            var banks = await _context.Banks
                .Where(b => b.Bankname.Contains(query) && b.Accid == accid) // 🔥 Chỉ lấy bank thuộc accid
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


        [HttpPost("generate/{accid}")]
        public async Task<ActionResult<object>> GenerateQuestionBank(long accid, [FromBody] Bank bank)
        {
            var grade = await _context.Grades.FindAsync(bank.GradeId);
            var subject = await _context.Subjects.FindAsync(bank.SubjectId);
            var curriculum = bank.CurriculumId != null ? await _context.Curricula.FindAsync(bank.CurriculumId) : null;

            if (grade == null || subject == null || (bank.CurriculumId != null && curriculum == null))
            {
                return BadRequest(new { message = "Không tìm thấy Khối học, Môn học hoặc Chương trình!" });
            }

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
                CreateDate = DateTime.Now,
                Accid = accid
            };

            _context.Banks.Add(newBank);
            await _context.SaveChangesAsync();

            // Get all default sections for this curriculum
            var defaultSections = await _context.DefaultSectionHierarchies
                .Where(d => d.CurriculumId == bank.CurriculumId)
                .ToListAsync();

            // Get hierarchy relations from default sections
            var hierarchyRelations = await _context.DefaultSectionHierarchies
                .Where(s => s.CurriculumId == bank.CurriculumId &&
                            s.AncestorId != null && s.DescendantId != null &&
                            s.AncestorId != s.DescendantId)
                .ToListAsync();

            // Create a mapping from default section IDs to new section IDs
            Dictionary<long, long> sectionMapping = new Dictionary<long, long>();
            Dictionary<long, string> sectionNames = new Dictionary<long, string>();

            // Create sections first
            foreach (var defaultSection in defaultSections)
            {
                var newSection = new Section
                {
                    Secname = defaultSection.DfSectionName,
                    BankId = newBank.BankId
                };

                _context.Sections.Add(newSection);
                await _context.SaveChangesAsync();

                // Store mapping from default section ID to new section ID
                sectionMapping[defaultSection.DfSectionId] = newSection.Secid;
                sectionNames[newSection.Secid] = defaultSection.DfSectionName;
            }
            foreach (var defaultSection in defaultSections)
            {
                var selfHierarchy = new SectionHierarchy
                {
                    AncestorId = sectionMapping[defaultSection.DfSectionId],
                    DescendantId = sectionMapping[defaultSection.DfSectionId],
                    Depth = 0
                };
                _context.SectionHierarchies.Add(selfHierarchy);
            }

            // Create section hierarchy relationships
            foreach (var relation in hierarchyRelations)
            {
                if (relation.AncestorId.HasValue && relation.DescendantId.HasValue)
                {
                    // Create the same relationship in the new sections
                    if (sectionMapping.ContainsKey(relation.AncestorId.Value) &&
                        sectionMapping.ContainsKey(relation.DescendantId.Value))
                    {
                        var sectionHierarchy = new SectionHierarchy
                        {
                            AncestorId = sectionMapping[relation.AncestorId.Value],
                            DescendantId = sectionMapping[relation.DescendantId.Value],
                            Depth = relation.Depth.HasValue ? (long)relation.Depth.Value : 0
                        };

                        _context.SectionHierarchies.Add(sectionHierarchy);
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Identify root sections by using the same logic as GetDefaultSectionsByBankId
            var descendantIds = hierarchyRelations
                .Select(h => h.DescendantId.Value)
                .ToHashSet();

            var rootDefaultSections = defaultSections
                .Where(s => (s.AncestorId == s.DfSectionId) ||
                           (s.AncestorId == null && !descendantIds.Contains(s.DfSectionId)))
                .ToList();

            var sectionLookup = defaultSections.ToDictionary(s => s.DfSectionId);
            var hierarchyLookup = hierarchyRelations
                .GroupBy(h => h.AncestorId)
                .ToDictionary(g => g.Key, g => g.Select(h => h.DescendantId.Value).ToList());

            // Build the response with multiple root sections
            var sectionTree = rootDefaultSections
                .Select(s => BuildSectionTreeForResponse(s, sectionLookup, hierarchyLookup, sectionMapping))
                .ToList();

            // Return the bank with sections at the proper hierarchy
            return Ok(new
            {
                BankId = newBank.BankId,
                BankName = newBank.Bankname,
                CurriculumId = newBank.CurriculumId,
                Grade = grade.GradeLevel,
                Subject = subject.SubjectName,
                Sections = sectionTree  // This is now a list of root sections
            });
        }

        // Build a hierarchical section tree for the response
        private object BuildSectionTreeForResponse(
            DefaultSectionHierarchy defaultSection,
            Dictionary<long, DefaultSectionHierarchy> sectionLookup,
            Dictionary<long?, List<long>> hierarchyLookup,
            Dictionary<long, long> sectionMapping)
        {
            var childSections = hierarchyLookup.ContainsKey(defaultSection.DfSectionId)
                ? hierarchyLookup[defaultSection.DfSectionId]
                    .Where(sectionLookup.ContainsKey)
                    .Select(id => sectionLookup[id])
                    .ToList()
                : new List<DefaultSectionHierarchy>();

            var children = childSections
                .Select(s => BuildSectionTreeForResponse(s, sectionLookup, hierarchyLookup, sectionMapping))
                .ToList();

            return new
            {
                secid = sectionMapping[defaultSection.DfSectionId],
                secname = defaultSection.DfSectionName,
                questionCount = 0, // Initially 0 since it's a new bank
                children = children
            };
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
            // Find the bank to ensure it exists
            var bank = await _context.Banks.FindAsync(bankId);
            if (bank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            // Get all sections for this bank
            var sections = await _context.Sections
                .Where(s => s.BankId == bankId)
                .ToListAsync();

            // Get section hierarchies for this bank
            var sectionHierarchies = await _context.SectionHierarchies
                .Where(sh => sections.Select(s => s.Secid).Contains(sh.AncestorId) &&
                             sections.Select(s => s.Secid).Contains(sh.DescendantId))
                .ToListAsync();

            // Get question counts for each section
            var questionCounts = await _context.Questions
                .Where(q => q.Secid != null && sections.Select(s => s.Secid).Contains(q.Secid.Value))
                .GroupBy(q => q.Secid)
                .Select(g => new
                {
                    Key = g.Key ?? 0,
                    Count = g.Count()
                })
                .ToDictionaryAsync(g => g.Key, g => g.Count);

            var descendantIds = sectionHierarchies
      .Where(h => h.AncestorId != h.DescendantId)
      .Select(h => h.DescendantId)
      .ToHashSet();

            var rootSections = sectionHierarchies
                .Where(h => h.AncestorId == h.DescendantId && h.Depth == 0 && !descendantIds.Contains(h.DescendantId))
                .Select(h => h.AncestorId)
                .Distinct()
                .Select(id => sections.FirstOrDefault(s => s.Secid == id))
                .Where(s => s != null)
                .ToList();


            // Build the section tree for root sections
            var sectionTree = rootSections
                .Select(s => BuildSectionTreeForResponse(s, sections, sectionHierarchies, questionCounts))
                .ToList();

            return Ok(sectionTree);
        }

        // Modified BuildSectionTreeForResponse to match generation method
        private object BuildSectionTreeForResponse(
            Section section,
            List<Section> allSections,
            List<SectionHierarchy> sectionHierarchies,
            Dictionary<long, int> questionCounts)
        {
            // Find child sections
            var childSectionIds = sectionHierarchies
                .Where(sh => sh.AncestorId == section.Secid && sh.DescendantId != section.Secid)
                .Select(sh => sh.DescendantId)
                .ToList();

            var childSections = allSections
                .Where(s => childSectionIds.Contains(s.Secid))
                .ToList();

            // Recursively build children
            var children = childSections
                .Select(s => BuildSectionTreeForResponse(s, allSections, sectionHierarchies, questionCounts))
                .ToList();

            // Calculate question count (including child sections)
            int directQuestionCount = questionCounts.ContainsKey(section.Secid)
                ? questionCounts[section.Secid]
                : 0;
            int totalQuestionCount = directQuestionCount + children.Sum(c =>
                (int)c.GetType().GetProperty("questionCount").GetValue(c, null));

            return new
            {
                secid = section.Secid,
                secname = section.Secname,
                questionCount = totalQuestionCount,
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

            try
            {
                var bank = await _context.Banks.FindAsync(bankId);
                if (bank == null)
                    return NotFound(new { message = "Ngân hàng không tồn tại" });

                var newSection = new Section
                {
                    Secname = section.Secname,
                    BankId = bankId
                };

                _context.Sections.Add(newSection);
                await _context.SaveChangesAsync();

                var selfHierarchy = new SectionHierarchy
                {
                    AncestorId = newSection.Secid,
                    DescendantId = newSection.Secid,
                    Depth = 0
                };

                _context.SectionHierarchies.Add(selfHierarchy);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Thêm section thành công",
                    newSection = new
                    {
                        newSection.Secid,
                        newSection.Secname,
                        newSection.BankId,
                        questionCount = 0  // Add this for UI consistency
                    }
                });
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Error adding section: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi hệ thống khi thêm section" });
            }
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