using Microsoft.AspNetCore.Mvc;
using SEP490_G77_ESS.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.Controllers.ExamManager
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> CreateExam([FromBody] Exam newExam)
        {
            return Ok(new { message = $"Đã tạo bài kiểm tra '{newExam.Examname}' thành công với ID giả lập {newExam.ExamId}." });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Exam>>> GetExamByUser()
        {
            // Tạo danh sách dữ liệu giả
            var fakeExams = new List<Exam>
            {
                new Exam { ExamId = 1, Examname = "Toán cấp 1", Createdate = DateTime.UtcNow, AccId = 1 },
                new Exam { ExamId = 2, Examname = "Toán nâng cao", Createdate = DateTime.UtcNow, AccId = 1 }
            };

            return Ok(fakeExams);
        }


        [HttpPut("{examid}")]
        public async Task<IActionResult> UpdateExamName(int examid, [FromBody] string newName)
        {
            return Ok(new { message = $"Đã cập nhật tên bài kiểm tra có ID {examid} thành '{newName}'." });
        }


        [HttpDelete("{examid}")]
        public async Task<IActionResult> DeleteExamById(int examid)
        {
            return Ok(new { message = $"Đã xóa thành công bài kiểm tra có ID {examid}." });
        }

    }


}
