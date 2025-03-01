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
    }
}
