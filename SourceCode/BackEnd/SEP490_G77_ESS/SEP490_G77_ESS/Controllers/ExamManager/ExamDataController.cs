using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SEP490_G77_ESS.DTO.ExamDTO;
using SEP490_G77_ESS.Models;
using System.Security.Claims;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamDataController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public ExamDataController(EssDbV11Context context)
        {
            _context = context;
        }

        private async Task<long?> GetAccIdFromToken()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var account = await _context.Accounts.FirstOrDefaultAsync(a => a.Email == email);
            return account?.AccId;
        }

        [HttpGet]
        public async Task<IActionResult> GetExamData(int examid)
        {
            Exam edata = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (edata != null)
            {
                return Content(edata.Examdata, "application/json");
            }
            else
            {
                return NotFound();
            }
        }


        [HttpPost]
        public async Task<IActionResult> AddExamDataDemo([FromQuery] int examid, [FromBody] ExamDataDTO examData)
        {
            var edata = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (edata == null)
            {
                return NotFound();
            }

            // Chuyển examData thành chuỗi JSON để lưu vào ExamData
            string jsonData = JsonConvert.SerializeObject(examData);

            // Cập nhật ExamData
            edata.Examdata = jsonData;

            // Lưu vào database
            _context.Exams.Update(edata);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam data added successfully!" });
        }

        //Demo Data
        [HttpPost("AddExamDataDemo")]
        public async Task<IActionResult> AddExamDataDemo([FromQuery] int examid)
        {
            var edata = await _context.Exams.FirstOrDefaultAsync(e => e.ExamId == examid);
            if (edata == null)
            {
                return NotFound();
            }

            // Tạo dữ liệu mẫu
            var examData = new ExamDataDTO
            {
                ExamId = examid,
                ExamName = "Sample Exam",
                Questions = new List<QuestionDTO>
            {
                new QuestionDTO
                {
                    QuestionId = 1,
                    Content = "What is 2 + 2?",
                    Type = "Multiple Choice",
                    Answers = new List<AnswerDTO>
                    {
                        new AnswerDTO { AnswerId = 1, Content = "3", IsCorrect = false },
                        new AnswerDTO { AnswerId = 2, Content = "4", IsCorrect = true },
                        new AnswerDTO { AnswerId = 3, Content = "5", IsCorrect = false }
                    }
                },
                new QuestionDTO
                {
                    QuestionId = 2,
                    Content = "What is the capital of France?",
                    Type = "Multiple Choice",
                    Answers = new List<AnswerDTO>
                    {
                        new AnswerDTO { AnswerId = 4, Content = "Berlin", IsCorrect = false },
                        new AnswerDTO { AnswerId = 5, Content = "Paris", IsCorrect = true },
                        new AnswerDTO { AnswerId = 6, Content = "Madrid", IsCorrect = false }
                    }
                }
            }
            };

            // Chuyển dữ liệu thành JSON string
            string jsonData = JsonConvert.SerializeObject(examData);

            // Cập nhật Examdata
            edata.Examdata = jsonData;

            // Lưu vào database
            _context.Exams.Update(edata);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Exam data added successfully!", data = examData });
        }

    }
}
