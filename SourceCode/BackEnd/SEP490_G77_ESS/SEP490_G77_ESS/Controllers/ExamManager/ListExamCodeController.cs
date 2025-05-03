using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using SEP490_G77_ESS.DTO.AnalysisDTO;
using SEP490_G77_ESS.Models;
using System.IO;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using System.Text.Json;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    public class ListExamCode : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public ListExamCode(EssDbV11Context context)
        {
            _context = context;
        }

        [HttpGet("{examId}/examcodes")]
        public async Task<IActionResult> GetExamCodes(long examId)
        {
            var exam = await _context.Exams.FindAsync(examId);
            if (exam == null)
                return NotFound(new { message = "Exam not found." });

            if (string.IsNullOrWhiteSpace(exam.Examdata))
                return BadRequest(new { message = "Examdata is empty." });

            try
            {
                var parsed = JsonDocument.Parse(exam.Examdata);
                var codes = parsed.RootElement.GetProperty("ExamCodes")
                    .EnumerateArray()
                    .Select(code => code.GetProperty("ExamCode").GetString())
                    .ToList();

                return Ok(codes);
            }
            catch
            {
                return BadRequest(new { message = "Invalid examdata format." });
            }
        }

        [HttpGet("{examId}/examcode/{examCode}/correct-answers")]
        public async Task<IActionResult> GetCorrectAnswerLetters(long examId, string examCode)
        {
            var exam = await _context.Exams.FindAsync(examId);
            if (exam == null)
                return NotFound(new { message = "Exam not found." });

            if (string.IsNullOrWhiteSpace(exam.Examdata))
                return BadRequest(new { message = "Examdata is empty." });

            try
            {
                var parsed = JsonDocument.Parse(exam.Examdata);
                var examCodes = parsed.RootElement.GetProperty("ExamCodes").EnumerateArray();

                var codeBlock = examCodes.FirstOrDefault(c =>
                    c.TryGetProperty("ExamCode", out var codeProp) &&
                    codeProp.GetString() == examCode);

                if (codeBlock.ValueKind == JsonValueKind.Undefined)
                    return NotFound(new { message = "ExamCode not found." });

                var result = new List<object>();
                var answerLabels = new[] { "A", "B", "C", "D" };

                foreach (var question in codeBlock.GetProperty("Questions").EnumerateArray())
                {
                    var answers = question.GetProperty("Answers").EnumerateArray().ToList();
                    int correctIndex = answers.FindIndex(a => a.GetProperty("IsCorrect").GetBoolean());

                    if (correctIndex >= 0 && correctIndex < answerLabels.Length)
                    {
                        result.Add(new
                        {
                            QuestionId = question.GetProperty("QuestionId").GetInt64(),
                            CorrectAnswer = answerLabels[correctIndex]
                        });
                    }
                }

                return Ok(result);
            }
            catch
            {
                return BadRequest(new { message = "Invalid examdata format." });
            }
        }
    }
}
