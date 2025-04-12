using Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.Models;
using System.Linq;
using System.Threading.Tasks;

namespace SEP490_G77_ESS.DTO.RBAC.test
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FakeAccessController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public FakeAccessController(EssDbV11Context context)
        {
            _context = context;
        }

        [HttpGet("CheckAccess/{bankId}")]
        public async Task<IActionResult> CheckAccess(long bankId)
        {
            // Lấy thông tin người dùng từ claims
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized("Không có thông tin người dùng.");
            }

            long currentUserId = long.Parse(claimAccId);

            // Kiểm tra xem người dùng có quyền truy cập vào ngân hàng này không
            var bankAccess = await _context.ResourceAccesses
                .FirstOrDefaultAsync(ra => ra.ResourceId == bankId && ra.Accid == currentUserId);

            if (bankAccess == null)
            {
                return Unauthorized("Bạn không có quyền truy cập vào ngân hàng này.");
            }

            // Trả về thông tin quyền truy cập nếu có
            return Ok("bạn được quyền truy cập");
           
        }
    }
}
