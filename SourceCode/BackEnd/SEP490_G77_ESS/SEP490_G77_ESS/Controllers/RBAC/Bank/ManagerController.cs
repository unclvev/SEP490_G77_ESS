using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP490_G77_ESS.DTO.RBAC.Bank;
using SEP490_G77_ESS.Models;
using SEP490_G77_ESS.Services;

namespace SEP490_G77_ESS.Controllers.RBAC.Bank
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ManagerController : ControllerBase
    {
        private readonly EssDbV11Context _context;
        private readonly EmailService _emailService;

        public ManagerController(EssDbV11Context context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpGet("SearchUserToInvite")]
        public async Task<IActionResult> GetUsers(string search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return BadRequest("Search query cannot be empty.");
            }

            var users = await _context.Accounts
                .Where(u => (u.Email != null && u.Email.Contains(search))
                        || (u.Phone != null && u.Phone.Contains(search)))
                .Take(10)
                .Select(u => new GetUserDTO
                {
                    AccId = u.AccId,
                    Name = u.Username,
                    Email = u.Email
                })
                .ToListAsync();

            return Ok(users);
        }


        [HttpPost("InviteUser")]
        public async Task<IActionResult> InviteUser([FromBody] InviteUserRequest request)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }
            var ownerRecord = await _context.ResourceAccesses
                .FirstOrDefaultAsync(r =>
                r.ResourceType == request.Resource.ResourceType &&
                r.ResourceId == request.Resource.ResourceId &&
                r.Accid == long.Parse(claimAccId) &&
                r.IsOwner == true
                );
            if (ownerRecord == null)
                return Forbid("Bạn không có quyền mời người dùng cho tài nguyên này.");
            
            var existingAccess = await _context.ResourceAccesses
                                               .FirstOrDefaultAsync(r => r.ResourceId == request.Resource.ResourceId 
                                                                                         && r.Accid == request.Resource.Accid);

            if (existingAccess != null)
            {
                return Conflict("Người dùng đã được mời trước đó.");
            }

            var roleAc = new RoleAccess
            {
                RoleName = request.AccessRole.RoleName,
                CanRead = request.AccessRole.CanRead,
                CanModify = request.AccessRole.CanModify,
                CanDelete = request.AccessRole.CanDelete
            };
            _context.RoleAccesses.Add(roleAc);

            await _context.SaveChangesAsync();
            // Tạo quyền truy cập cho người dùng mới


            var roleId = roleAc.Roleid;
            var accessRec = new ResourceAccess
            {
                ResourceType = request.Resource.ResourceType,
                ResourceId = request.Resource.ResourceId,
                Accid = request.Resource.Accid,
                RoleId = roleId,
                IsOwner = false
            };

            // 5. Lấy thông tin inviter & invited để gửi email
            var inviterId = long.Parse(claimAccId);
            var inviter = await _context.Accounts.FindAsync(inviterId);
            var invitedUser = await _context.Accounts.FindAsync(request.Resource.Accid);

            var invitedBy = inviter?.Email ?? inviterId.ToString();
            var toEmail = invitedUser?.Email;
            // Nếu resource là Bank, lấy tên ngân hàng từ DB
            string resourceName;
            if (request.Resource.ResourceType == "Bank")
            {
                var bank = await _context.Banks.FindAsync(request.Resource.ResourceId);
                resourceName = bank?.Bankname ?? $"Bank #{request.Resource.ResourceId}";
            }
            else
            {
                resourceName = $"{request.Resource.ResourceType} #{request.Resource.ResourceId}";
            }

            // 6. Gọi service gửi mail
            await _emailService.SendResourceInvitationEmailAsync(
                toEmail,
                resourceName,
                request.AccessRole.RoleName,
                request.AccessRole.CanModify.GetValueOrDefault(),
                request.AccessRole.CanDelete.GetValueOrDefault(),
                invitedBy
            );

            _context.ResourceAccesses.Add(accessRec);
            await _context.SaveChangesAsync();
            return Ok("Người dùng đã được mời thành công.");
        }


        [HttpGet("Member/{bankId}/{resourceType}")]
        public async Task<IActionResult> GetInvitedUsers(long bankId, string resourceType)
        {
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }

            long currentUserId = long.Parse(claimAccId);
           

            // Lấy danh sách các người dùng đã được mời vào ngân hàng
            var invitedUsers = await _context.ResourceAccesses
                                             .Where(ra => ra.ResourceId == bankId && ra.ResourceType == resourceType)
                                             .Join(_context.Accounts, ra => ra.Accid, acc => acc.AccId, (ra, acc) => new
                                             {
                                                 Accid = acc.AccId,
                                                 Username = acc.Username,
                                                 Email = acc.Email,
                                                 Phone = acc.Phone,
                                                 Role = ra.Role.RoleName,
                                             })
                                             .ToListAsync();

            // Trả về danh sách người dùng đã được mời
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

            // Kiểm tra xem người dùng có phải là chủ ngân hàng không
            var bank = await _context.Banks.FirstOrDefaultAsync(b => b.BankId == bankId && b.Accid == currentUserId);
            if (bank == null)
            {
                return Unauthorized("Bạn không có quyền cập nhật quyền truy cập cho ngân hàng này.");
            }

            // Kiểm tra xem người dùng có trong ngân hàng này hay không
            var resourceAccess = await _context.ResourceAccesses
                .FirstOrDefaultAsync(ra => ra.ResourceId == bankId && ra.Accid == userId);

            if (resourceAccess == null)
            {
                return NotFound("Người dùng không tồn tại trong ngân hàng này.");
            }

            // Cập nhật vai trò của người dùng
            var roleUpdate = await _context.RoleAccesses.FirstOrDefaultAsync(r => r.Roleid == resourceAccess.RoleId);
            roleUpdate.RoleName = dto.RoleName;
            roleUpdate.CanModify = dto.CanModify;
            roleUpdate.CanRead = dto.CanRead;
            roleUpdate.CanDelete = dto.CanDelete;    

            // Lưu các thay đổi vào cơ sở dữ liệu
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

            // Kiểm tra xem người dùng có phải là chủ ngân hàng không
            var bank = await _context.Banks.FirstOrDefaultAsync(b => b.BankId == bankId && b.Accid == currentUserId);
            if (bank == null)
            {
                return Unauthorized("Bạn không có quyền xóa thành viên khỏi ngân hàng này.");
            }

            // Kiểm tra xem người dùng có trong ngân hàng này hay không
            var resourceAccess = await _context.ResourceAccesses
                .FirstOrDefaultAsync(ra => ra.ResourceId == bankId && ra.Accid == userId);

            if (resourceAccess == null)
            {
                return NotFound("Người dùng không tồn tại trong ngân hàng này.");
            }
            var roleAccess = await _context.RoleAccesses.FirstOrDefaultAsync(ra => ra.Roleid == resourceAccess.RoleId);
            if (roleAccess != null)
            {
                // Xóa chức danh (role) của người dùng khỏi bảng RoleAccesses
                _context.RoleAccesses.Remove(roleAccess);
            }

            // Xóa quyền truy cập của người dùng khỏi ngân hàng
            _context.ResourceAccesses.Remove(resourceAccess);

            // Lưu các thay đổi vào cơ sở dữ liệu
            await _context.SaveChangesAsync();

            return Ok("Thành viên đã được xóa.");
        }




    }
}