using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.RBAC.Bank;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Controllers.RBAC.Bank
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ManagerController : ControllerBase
    {
        private readonly EssDbV11Context _context;

        public ManagerController(EssDbV11Context context)
        {
            _context = context;
        }

        [HttpGet("SearchUserToInvite")]
        public async Task<IActionResult> GetUsers(string search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return BadRequest("Search query cannot be empty.");
            }

            var users = await _context.Accounts
                .Where(u => u.Email.Contains(search) || u.Phone.Contains(search))
                .Take(10)
                .Select(u => new GetUserDTO
                {
                    Name = u.Username,
                    Email = u.Email
                })
                .ToListAsync();

            return Ok(users);
        }


        [HttpPost("InviteUser")]
        public async Task<IActionResult> InviteUser([FromBody] InviteUserDTO dto)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            var bank = await _context.Banks.FirstOrDefaultAsync(b => b.BankId == dto.BankId
                                                                  && b.Accid == long.Parse(claimAccId));

            var existingInvitation = await _context.BankAccesses
             .FirstOrDefaultAsync(ba => ba.Bankid == dto.BankId && ba.Accid == dto.UserId);
            if (existingInvitation != null)
            {
                return BadRequest("Người dùng đã được mời hoặc đã có quyền truy cập vào ngân hàng.");
            }
            var bankAccess = new BankAccess
            {
                Bankid = dto.BankId,
                Accid = dto.UserId,
                Canedit = dto.CanEdit,
                Canview = dto.CanEdit || dto.CanView,
                Role = "Collaborator"
            };


            _context.BankAccesses.Add(bankAccess);
            await _context.SaveChangesAsync();
            return Ok("Người dùng đã được mời thành công vào ngân hàng.");
        }

        [HttpGet("Member/{bankId}")]
        public async Task<IActionResult> GetInvitedUsers(long bankId)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            long currentUserId = long.Parse(claimAccId);

            var bank = await _context.Banks.FirstOrDefaultAsync(b => b.BankId == bankId && b.Accid == currentUserId);
            if (bank == null)
            {
                return Forbid("Bạn không có quyền truy cập danh sách mời của bank này.");
            }

            var invitedUsers = await _context.BankAccesses
                                              .Where(ba => ba.Bankid == bankId && ba.Accid != bank.Accid)
                                              .Join(_context.Accounts,
                                                    ba => ba.Accid,
                                                    a => a.AccId,
                                                    (ba, a) => new InvitedUserDTO
                                                    {
                                                        UserId = a.AccId,
                                                        Name = a.Username,
                                                        Email = a.Email,
                                                        CanEdit = ba.Canedit,
                                                        CanView = ba.Canview
                                                    })
                                              .ToListAsync();
            return Ok(invitedUsers);
        }

        [HttpPut("UpdateRole/{bankId}/{userId}")]
        public async Task<IActionResult> UpdateRole(long bankId, long userId, [FromBody] UpdateRoleDTO dto)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            long currentUserId = long.Parse(claimAccId);

            // Kiểm tra xem currentUser có phải là chủ ngân hàng hay không
            var ownerAccess = await _context.BankAccesses
                .FirstOrDefaultAsync(ba => ba.Bankid == bankId && ba.Accid == currentUserId && ba.Role == "Owner");

            if (ownerAccess == null)
            {
                return Forbid("Chỉ chủ ngân hàng mới có thể cập nhật quyền.");
            }

            // Tìm quyền truy cập của người cần cập nhật
            var userAccess = await _context.BankAccesses
                .FirstOrDefaultAsync(ba => ba.Bankid == bankId && ba.Accid == userId);

            if (userAccess == null)
            {
                return NotFound("Không tìm thấy người dùng này trong ngân hàng.");
            }

            userAccess.Canedit = dto.CanEdit;
            userAccess.Canview = dto.CanEdit || dto.CanView;
            
            await _context.SaveChangesAsync();
            return Ok("Quyền truy cập đã được cập nhật.");
        }

        [HttpDelete("remove/{bankId}/{userId}")]
        public async Task<IActionResult> RemoveUser(long bankId, long userId)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            long currentUserId = long.Parse(claimAccId);

            // Kiểm tra xem currentUser có phải là chủ ngân hàng hay không
            var ownerAccess = await _context.BankAccesses
                .FirstOrDefaultAsync(ba => ba.Bankid == bankId && ba.Accid == currentUserId && ba.Role == "Owner");

            if (ownerAccess == null)
            {
                return Forbid("Chỉ chủ ngân hàng mới có thể xóa thành viên.");
            }

            // Tìm quyền truy cập của người cần xóa
            var userAccess = await _context.BankAccesses
                .FirstOrDefaultAsync(ba => ba.Bankid == bankId && ba.Accid == userId);

            if (userAccess == null)
            {
                return NotFound("Không tìm thấy người dùng này trong ngân hàng.");
            }

            _context.BankAccesses.Remove(userAccess);
            await _context.SaveChangesAsync();
            return Ok("Thành viên đã được xóa.");
        }



    }
}
