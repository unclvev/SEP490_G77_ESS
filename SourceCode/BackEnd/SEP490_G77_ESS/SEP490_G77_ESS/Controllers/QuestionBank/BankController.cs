using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SEP490_G77_ESS.Models;

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
                    b.Totalquestion,
                    b.CreateDate,
                    Grade = b.Grade.GradeLevel,
                    Subject = b.Subject.SubjectName
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
                    b.Totalquestion,
                    b.CreateDate,
                    Sections = b.Sections.Select(s => new { s.Secid, s.Secname })
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

        // ✅ Cập nhật ngân hàng câu hỏi
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBank(long id, [FromBody] Bank bank)
        {
            if (id != bank.BankId)
            {
                return BadRequest(new { message = "ID không khớp" });
            }

            var existingBank = await _context.Banks.FindAsync(id);
            if (existingBank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            existingBank.Bankname = bank.Bankname ?? existingBank.Bankname;
            existingBank.Totalquestion = bank.Totalquestion ?? existingBank.Totalquestion;

            _context.Entry(existingBank).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, new { message = "Lỗi cập nhật dữ liệu" });
            }

            return NoContent();
        }

        // ✅ Xóa ngân hàng câu hỏi
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBank(long id)
        {
            var bank = await _context.Banks.FindAsync(id);
            if (bank == null)
            {
                return NotFound(new { message = "Không tìm thấy ngân hàng câu hỏi" });
            }

            _context.Banks.Remove(bank);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa ngân hàng câu hỏi thành công" });
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
        [HttpPost("generate")]
        public async Task<ActionResult<object>> GenerateQuestionBank([FromBody] Bank bank)
        {
            var existingBank = await _context.Banks
                .Include(b => b.Sections)
                .FirstOrDefaultAsync(b => b.GradeId == bank.GradeId && b.SubjectId == bank.SubjectId);

            if (existingBank != null)
            {
                return Ok(new
                {
                    BankId = existingBank.BankId,
                    BankName = existingBank.Bankname,
                    Totalquestion = existingBank.Totalquestion,
                    CreateDate = existingBank.CreateDate,
                    Sections = existingBank.Sections.Select(s => new { s.Secid, s.Secname })
                });
            }

            // ✅ Lấy số Grade (Bỏ chữ "Grade")
            var grade = await _context.Grades.FindAsync(bank.GradeId);
            var subject = await _context.Subjects.FindAsync(bank.SubjectId);

            if (grade == null || subject == null)
            {
                return BadRequest(new { message = "Không tìm thấy Khối học hoặc Môn học." });
            }

            string gradeNumber = grade.GradeLevel.Replace("Grade ", "");
            string newBankName = $"{subject.SubjectName} Bank {gradeNumber}";

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
            await _context.SaveChangesAsync();

            // ✅ Lấy danh sách chủ đề mặc định
            var defaultSections = await _context.DefaultSectionHierarchies
                .Select(s => new Section
                {
                    Secname = s.DfSectionName,
                    BankId = newBank.BankId
                })
                .ToListAsync();

            if (defaultSections.Count > 0)
            {
                _context.Sections.AddRange(defaultSections);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                BankId = newBank.BankId,
                BankName = newBank.Bankname,
                Totalquestion = 0,
                CreateDate = newBank.CreateDate,
                Sections = defaultSections.Select(s => new { s.Secid, s.Secname })
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

        // ✅ Lấy danh sách Section theo BankId
        [HttpGet("{bankId}/sections")]
        public async Task<ActionResult<IEnumerable<object>>> GetSectionsByBankId(long bankId)
        {
            var sections = await _context.Sections
                .Where(s => s.BankId == bankId)
                .Select(s => new
                {
                    s.Secid,
                    s.Secname,
                    Children = _context.SectionHierarchies
                        .Where(sh => sh.AncestorId == s.Secid)
                        .Select(sh => new
                        {
                            ChildId = sh.DescendantId,
                            ChildName = _context.Sections
                                .Where(cs => cs.Secid == sh.DescendantId)
                                .Select(cs => cs.Secname)
                                .FirstOrDefault()
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(sections);
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
