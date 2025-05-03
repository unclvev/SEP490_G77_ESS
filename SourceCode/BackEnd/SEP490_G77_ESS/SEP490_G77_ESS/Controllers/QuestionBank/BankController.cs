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
using System.Security.Claims;
using MathNet.Numerics.Distributions;

namespace SEP490_G77_ESS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    public class BankController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly IAuthorizationService _authorizationService;

        public BankController(EssDbV11Context context, IAuthorizationService authorizationService)
        {
            _context = context;
            _authorizationService = authorizationService;
        }

        private async Task<long?> GetAccIdFromToken()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
            return account?.AccId;
        }

        // ✅ Lấy danh sách ngân hàng do chính user tạo
        [HttpGet("account/{accid}")]
        public async Task<ActionResult<IEnumerable<object>>> GetBanksByAccount(long accid)
        {
            // 1. Lấy tất cả Bank mà accid == userId (chỉ owner)
            var banksQuery = _context.Banks
                .Where(b => b.Accid == accid)
                .Include(b => b.Grade)
                .Include(b => b.Subject)
                .Include(b => b.Curriculum)
                .Include(b => b.Sections)
                .AsQueryable();

            // 3. Project kết quả và trả về
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


        // ✅ Lấy danh sách ngân hàng được share bởi người khác (chỉ CanRead, không bao gồm owner)
        [HttpGet("account/shared")]
        public async Task<ActionResult<IEnumerable<object>>> GetBanksSharedWithAccount()
        {

            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });
            // 1. Xác định danh sách bankId được share với user này (IsOwner == false && Role.CanRead == true)
            var sharedBankIds = _context.ResourceAccesses
                .Include(ra => ra.Role)
                .Where(ra =>
                    ra.Accid == accId &&
                    ra.ResourceType == "Bank" &&
                    ra.IsOwner == false &&
                    ra.Role.CanRead == true
                )
                .Select(ra => ra.ResourceId);

            // 2. Lấy tất cả Bank mà bankId nằm trong sharedBankIds
            var banksQuery = _context.Banks
                .Where(b => sharedBankIds.Contains(b.BankId))
                .Include(b => b.Grade)
                .Include(b => b.Subject)
                .Include(b => b.Curriculum)
                .Include(b => b.Sections)
                .AsQueryable();


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
        public async Task<IActionResult> GetDefaultBanks()
        {
            // 1.Lấy tất cả Bank mà accid == userId(chỉ owner)
            var banksQuery = _context.Banks
                .Where(b => b.Accid == null)
                .Include(b => b.Grade)
                .Include(b => b.Subject)
                .Include(b => b.Curriculum)
                .Include(b => b.Sections)
                .AsQueryable();

            // 3. Project kết quả và trả về
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


        [HttpGet("default/{id}")]
        public async Task<ActionResult<object>> GetDefaultBank(long id)
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


        [HttpGet("default/{bankId}/sections")]
        public async Task<ActionResult<IEnumerable<object>>> GetDefaultSectionsByBankId(long bankId)
        {
            // 1. Kiểm tra tồn tại bank
            var bank = await _context.Banks.FindAsync(bankId);
            if (bank == null)
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });

            // 2. Lấy tất cả sections của bank
            var sections = await _context.Sections
                .Where(s => s.BankId == bankId)
                .ToListAsync();
            if (!sections.Any())
                return Ok(new List<object>());

            // 3. Chuẩn bị tập ID của sections
            var sectionIds = sections.Select(s => s.Secid).ToHashSet();

            // 4. Lấy tất cả hierarchy liên quan
            var sectionHierarchies = await _context.SectionHierarchies
                .Where(sh => sectionIds.Contains(sh.AncestorId)
                          && sectionIds.Contains(sh.DescendantId))
                .ToListAsync();

            // 5. Đếm số câu hỏi theo section
            var questionCounts = await _context.Questions
                .Where(q => q.Secid.HasValue && sectionIds.Contains(q.Secid.Value))
                .GroupBy(q => q.Secid.Value)
                .Select(g => new { SectionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.SectionId, x => x.Count);

            // 6. Xác định root sections
            List<Section> rootSections;
            if (sectionHierarchies.Any())
            {
                // các descendant thực sự (depth > 0)
                var descendantIds = sectionHierarchies
                    .Where(h => h.AncestorId != h.DescendantId)
                    .Select(h => h.DescendantId)
                    .ToHashSet();

                // các self-hierarchy depth=0 mà không phải là descendant của ai khác
                rootSections = sectionHierarchies
                    .Where(h => h.AncestorId == h.DescendantId && h.Depth == 0
                             && !descendantIds.Contains(h.DescendantId))
                    .Select(h => sections.First(s => s.Secid == h.AncestorId))
                    .Distinct()
                    .ToList();
            }
            else
            {
                // fallback: nếu chưa có hierarchy, lấy toàn bộ
                rootSections = sections;
            }

            // 7. Xây cây trả về
            var sectionTree = rootSections
                .Select(s => BuildSectionTreeForResponse(s, sections, sectionHierarchies, questionCounts))
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

        // ✅ Cập nhật chỉ Bankname
        [HttpPut("{id}/name")]
        [Authorize]
        public async Task<IActionResult> UpdateBankName(long id, [FromBody] Bank bank)
        {
            var authorizationResult = await _authorizationService.AuthorizeAsync(User, id, "BankModify");
            if (!authorizationResult.Succeeded)
            {
                return Forbid("");
            }

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
        [Authorize]
        public async Task<IActionResult> DeleteBank(long id)
        {
            var authorizationResult = await _authorizationService.AuthorizeAsync(User, id, "BankDelete");
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }
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
        [Authorize]
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
            var owner = new ResourceAccess
            {
                Accid = newBank.Accid,
                ResourceId = newBank.BankId,
                ResourceType = "Bank",
                IsOwner = true,


            };
            _context.ResourceAccesses.Add(owner);
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
            // 1. Kiểm tra tồn tại bank
            var bank = await _context.Banks.FindAsync(bankId);
            if (bank == null)
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });

            // 2. Lấy tất cả sections của bank
            var sections = await _context.Sections
                .Where(s => s.BankId == bankId)
                .ToListAsync();
            if (!sections.Any())
                return Ok(new List<object>());

            // 3. Chuẩn bị tập ID của sections
            var sectionIds = sections.Select(s => s.Secid).ToHashSet();

            // 4. Lấy tất cả hierarchy liên quan
            var sectionHierarchies = await _context.SectionHierarchies
                .Where(sh => sectionIds.Contains(sh.AncestorId)
                          && sectionIds.Contains(sh.DescendantId))
                .ToListAsync();

            // 5. Đếm số câu hỏi theo section
            var questionCounts = await _context.Questions
                .Where(q => q.Secid.HasValue && sectionIds.Contains(q.Secid.Value))
                .GroupBy(q => q.Secid.Value)
                .Select(g => new { SectionId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.SectionId, x => x.Count);

            // 6. Xác định root sections
            List<Section> rootSections;
            if (sectionHierarchies.Any())
            {
                // các descendant thực sự (depth > 0)
                var descendantIds = sectionHierarchies
                    .Where(h => h.AncestorId != h.DescendantId)
                    .Select(h => h.DescendantId)
                    .ToHashSet();

                // các self-hierarchy depth=0 mà không phải là descendant của ai khác
                rootSections = sectionHierarchies
                    .Where(h => h.AncestorId == h.DescendantId && h.Depth == 0
                             && !descendantIds.Contains(h.DescendantId))
                    .Select(h => sections.First(s => s.Secid == h.AncestorId))
                    .Distinct()
                    .ToList();
            }
            else
            {
                // fallback: nếu chưa có hierarchy, lấy toàn bộ
                rootSections = sections;
            }

            // 7. Xây cây trả về
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
        public async Task<ActionResult<IEnumerable<object>>> GetCurriculums(
            [FromQuery] long? gradeId,
            [FromQuery] long? subjectId)
        {
            var query = _context.Curricula
                .Include(c => c.Grade)
                .Include(c => c.Subject)
                .AsQueryable();

            if (gradeId.HasValue)
                query = query.Where(c => c.GradeId == gradeId.Value);
            if (subjectId.HasValue)
                query = query.Where(c => c.SubjectId == subjectId.Value);

            var curriculums = await query
                .Select(c => new
                {
                    c.CurriculumId,
                    c.CurriculumName,
                    c.GradeId,
                    GradeName = c.Grade!.GradeLevel,
                    c.SubjectId,
                    SubjectName = c.Subject!.SubjectName
                })
                .ToListAsync();

            return Ok(curriculums);
        }









        [HttpPost("{bankId}/add-section")]
        [Authorize]
        public async Task<ActionResult<object>> AddSection(long bankId, [FromBody] Section section)
        {
            var authorizationResult = await _authorizationService.AuthorizeAsync(User, bankId, "BankModify");
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }

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
        [Authorize]
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
        [Authorize]
        public async Task<IActionResult> UpdateSection(long sectionId, [FromBody] Section updatedSection)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null)
                return NotFound(new { message = "Không tìm thấy section" });

            var authorizationResult = await _authorizationService.AuthorizeAsync(User, section.BankId, "BankModify");
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }
            section.Secname = updatedSection.Secname ?? section.Secname;

            _context.Entry(section).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật section thành công" });
        }

        // ✅ Xóa Section (Sửa route để không bị trùng)
        [HttpDelete("section/{sectionId}")]
        [Authorize]
        public async Task<IActionResult> DeleteSection(long sectionId)
        {
            var section = await _context.Sections.FindAsync(sectionId);
            if (section == null)
                return NotFound(new { message = "Không tìm thấy section" });

            var authorizationResult = await _authorizationService.AuthorizeAsync(User, section.BankId, "BankModify");
            if (!authorizationResult.Succeeded)
            {
                return Forbid();
            }

            // ✅ Xóa SectionHierarchy liên quan
            var sectionRelations = _context.SectionHierarchies
                .Where(sh => sh.AncestorId == sectionId || sh.DescendantId == sectionId);
            _context.SectionHierarchies.RemoveRange(sectionRelations);

            // ✅ Tìm tất cả câu hỏi thuộc section này
            var questions = await _context.Questions
                .Where(q => q.Secid == sectionId)
                .ToListAsync();

            var questionIds = questions.Select(q => q.Quesid).ToList();

            // ✅ Xóa CorrectAnswers liên quan
            var correctAnswers = await _context.CorrectAnswers
                .Where(ca => ca.Quesid != null && questionIds.Contains(ca.Quesid.Value))
                .ToListAsync();
            _context.CorrectAnswers.RemoveRange(correctAnswers);

            // ✅ Xóa câu hỏi
            _context.Questions.RemoveRange(questions);

            // ✅ Xóa section
            _context.Sections.Remove(section);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa section và tất cả câu hỏi liên quan thành công" });
        }

        [HttpGet("isowner/{bankId}")]
        [Authorize]
        public async Task<IActionResult> IsOwner(long bankId)
        {
            var accId = await GetAccIdFromToken();
            if (accId == null)
                return Unauthorized(new { message = "Không thể xác định tài khoản." });

            var bank = await _context.Banks.FindAsync(bankId);
            if (bank == null)
                return NotFound(new { message = "Không tìm thấy ngân hàng." });

            bool isOwner = bank.Accid == accId;
            return Ok(new { isOwner });
        }


    }
}