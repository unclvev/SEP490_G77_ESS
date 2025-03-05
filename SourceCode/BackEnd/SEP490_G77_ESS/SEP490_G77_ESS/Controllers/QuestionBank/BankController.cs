using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.DTO.BankdDTO;

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
            // 🔍 Kiểm tra Khối học và Môn học có tồn tại không
            var grade = await _context.Grades.FindAsync(bank.GradeId);
            var subject = await _context.Subjects.FindAsync(bank.SubjectId);

            if (grade == null || subject == null)
            {
                return BadRequest(new { message = "Không tìm thấy Khối học hoặc Môn học." });
            }

            // 🔍 Tìm ngân hàng câu hỏi trước đó có cùng GradeId và SubjectId
            var previousBank = await _context.Banks
                .Where(b => b.GradeId == bank.GradeId && b.SubjectId == bank.SubjectId)
                .OrderByDescending(b => b.CreateDate)
                .FirstOrDefaultAsync();

            // 🎯 Tạo ngân hàng câu hỏi mới (dù có hay không ngân hàng trước đó)
            string newBankName = $"Ngân hàng câu hỏi {subject.SubjectName} {grade.GradeLevel}";

            var newBank = new Bank
            {
                Bankname = newBankName,
                Bankstatus = 1,
                Totalquestion = 0,
                GradeId = bank.GradeId,
                SubjectId = bank.SubjectId,
                CreateDate = DateTime.Now
            };

            _context.Banks.Add(newBank);
            await _context.SaveChangesAsync(); // Lưu để lấy ID của ngân hàng mới

            Console.WriteLine($"✅ Tạo ngân hàng câu hỏi mới: {newBank.BankId} - {newBank.Bankname}");

            List<SectionDto> createdSections = new List<SectionDto>();
            Dictionary<long, long> sectionIdMapping = new Dictionary<long, long>();

            if (previousBank != null)
            {
                // ✅ Sao chép toàn bộ Sections từ ngân hàng trước đó (bao gồm con của con)
                var previousSections = await _context.Sections
                    .Where(s => s.BankId == previousBank.BankId)
                    .ToListAsync();

                Console.WriteLine($"📌 Copy {previousSections.Count} sections từ Bank {previousBank.BankId}");

                foreach (var oldSection in previousSections)
                {
                    var newSection = new Section
                    {
                        Secname = oldSection.Secname,
                        BankId = newBank.BankId
                    };

                    _context.Sections.Add(newSection);
                    await _context.SaveChangesAsync();

                    sectionIdMapping[oldSection.Secid] = newSection.Secid;
                    createdSections.Add(new SectionDto { Secid = newSection.Secid, Secname = newSection.Secname });

                    Console.WriteLine($"➕ Copy Section: {newSection.Secid} - {newSection.Secname}");
                }

                // ✅ Sao chép lại quan hệ **SectionHierarchy** để giữ nguyên cấu trúc cây của ngân hàng cũ
                var previousHierarchyList = await _context.SectionHierarchies
                    .Where(sh => previousSections.Select(s => s.Secid).Contains(sh.AncestorId))
                    .ToListAsync();

                foreach (var oldHierarchy in previousHierarchyList)
                {
                    if (sectionIdMapping.TryGetValue(oldHierarchy.AncestorId, out long newAncestorId) &&
                        sectionIdMapping.TryGetValue(oldHierarchy.DescendantId, out long newDescendantId))
                    {
                        var newHierarchy = new SectionHierarchy
                        {
                            AncestorId = newAncestorId,
                            DescendantId = newDescendantId,
                            Depth = oldHierarchy.Depth
                        };

                        _context.SectionHierarchies.Add(newHierarchy);
                        Console.WriteLine($"🔗 Copy SectionHierarchy: {newHierarchy.AncestorId} -> {newHierarchy.DescendantId}");
                    }
                }

                await _context.SaveChangesAsync();
            }
            else
            {
                // Nếu không có ngân hàng trước đó, lấy từ Default_Section_Hierarchy
                var defaultSections = await (from d in _context.DefaultSectionHierarchies
                                             join c in _context.Curricula
                                             on d.DfSectionId equals c.DfSectionId
                                             where c.GradeId == bank.GradeId && c.SubjectId == bank.SubjectId
                                             select d).ToListAsync();

                Console.WriteLine($"📌 Không có ngân hàng trước đó. Lấy {defaultSections.Count} sections từ Default_Section_Hierarchy");

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
            }

            return Ok(new BankDto
            {
                BankId = newBank.BankId,
                BankName = newBank.Bankname,
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