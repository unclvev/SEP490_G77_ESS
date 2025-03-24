using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SEP490_G77_ESS.Controllers.EssayManagement
{
    [Route("essay/savestudentlist")]
    [ApiController]
    public class SaveStudentList : ControllerBase
    {
        [HttpPost]
        public IActionResult UploadExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("Không có file hoặc file rỗng.");
            }

            // ✅ Tạm thời chưa xử lý nội dung, chỉ trả kết quả thành công
            return Ok("Import thành công!");
        }
    }
}
