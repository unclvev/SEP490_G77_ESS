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
