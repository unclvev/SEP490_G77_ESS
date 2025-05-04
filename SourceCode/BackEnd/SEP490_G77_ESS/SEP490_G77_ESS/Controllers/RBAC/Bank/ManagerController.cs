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

            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }

            long currentUserId = long.Parse(claimAccId); // Lấy AccId của người dùng hiện tại

            // Truy vấn tìm kiếm người dùng, loại trừ người dùng hiện tại khỏi kết quả
            var users = await _context.Accounts
                .Where(u => (u.Email != null && u.Email.Contains(search))
                            || (u.Phone != null && u.Phone.Contains(search)))
                .Where(u => u.AccId != currentUserId) // Loại trừ chính mình
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
                return Unauthorized();
            var userId = long.Parse(claimAccId);

            var resType = request.Resource.ResourceType;
            var resId = request.Resource.ResourceId;
            bool isOwner = false;

            if (resType == "Bank")
            {
                isOwner = await _context.ResourceAccesses.AnyAsync(r =>
                    // so sánh ResourceType bình thường (string == string)
                    r.ResourceType == "Bank"
                    && r.ResourceId == resId
                    && r.Accid == userId
                    // thêm == true để chuyển nullable bool? -> bool
                    && r.IsOwner == true
                );
                if (!isOwner)
                    return Forbid("Bạn không có quyền mời người dùng vào ngân hàng này.");
            }
            else
            {
                isOwner = await _context.ResourceAccesses.AnyAsync(r =>
                    r.ResourceType == "Exam"
                    && r.ResourceId == resId
                    && r.Accid == userId
                    && r.IsOwner == true
                );
                if (!isOwner)
                    return Forbid("Bạn không có quyền mời người dùng cho đề thi này.");
            }

            // 3. Kiểm tra đã invite chưa
            var existing = await _context.ResourceAccesses.FirstOrDefaultAsync(r =>
                r.ResourceType == resType &&
                r.ResourceId == resId &&
                r.Accid == request.Resource.Accid);
            if (existing != null)
                return Conflict("Người dùng đã được mời trước đó.");

            // 4. Tạo RoleAccess mới
            var roleAc = new RoleAccess
            {
                RoleName = request.AccessRole.RoleName,
                CanRead = request.AccessRole.CanRead.GetValueOrDefault(),
                CanModify = request.AccessRole.CanModify.GetValueOrDefault(),
                CanDelete = request.AccessRole.CanDelete.GetValueOrDefault()
            };
            _context.RoleAccesses.Add(roleAc);
            await _context.SaveChangesAsync();

            // 5. Tạo ResourceAccess cho user mới
            var accessRec = new ResourceAccess
            {
                ResourceType = resType,
                ResourceId = resId,
                Accid = request.Resource.Accid,
                RoleId = roleAc.Roleid,
                IsOwner = false
            };
            _context.ResourceAccesses.Add(accessRec);

            // 6. Gửi email invitation (giữ nguyên logic hiện tại)
            var inviter = await _context.Accounts.FindAsync(userId);
            var invited = await _context.Accounts.FindAsync(request.Resource.Accid);
            var invitedBy = inviter?.Email ?? inviter?.AccId.ToString();
            var toEmail = invited?.Email;

            string resourceName;
            if (resType == "Bank")
            {
                var bank = await _context.Banks.FindAsync(resId);
                resourceName = bank?.Bankname ?? $"Bank #{resId}";
            }
            else
            {
                var exam = await _context.Exams.FindAsync(resId);
                resourceName = exam?.Examname ?? $"Exam #{resId}";
            }

            await _emailService.SendResourceInvitationEmailAsync(
                toEmail,
                resourceName,
                request.AccessRole.RoleName,
                request.AccessRole.CanModify.GetValueOrDefault(),
                request.AccessRole.CanDelete.GetValueOrDefault(),
                invitedBy
            );

            await _context.SaveChangesAsync();
            return Ok("Người dùng đã được mời thành công.");
        }


        [HttpGet("Member/{bankId}/{resourceType}")]
        public async Task<IActionResult> GetInvitedUsers(long bankId, string resourceType)
        {
            // Lấy userId từ claim
            var claimAccId = User.FindFirst("AccId")?.Value;
            if (string.IsNullOrEmpty(claimAccId))
            {
                return Unauthorized();
            }

            long currentUserId = long.Parse(claimAccId);

            // Kiểm tra quyền truy cập vào tài nguyên Exam và Analysis
            if (resourceType == "Exam")
            {
                var hasExamReadPermission = await _context.ResourceAccesses
                    .AnyAsync(ra => ra.Accid == currentUserId && ra.ResourceType == "Exam" && ra.ResourceId == bankId && ra.Role.CanRead == true);

                if (!hasExamReadPermission)
                {
                    return Forbid(); // Không có quyền đọc Exam
                }
            }

            // Kiểm tra quyền truy cập vào Analysis (nếu resourceType là "Analysis")
            if (resourceType == "Analysis")
            {
                var hasAnalysisReadPermission = await _context.ResourceAccesses
                    .AnyAsync(ra => ra.Accid == currentUserId && ra.ResourceType == "Analysis" && ra.ResourceId == bankId && ra.Role.CanRead == true);

                if (!hasAnalysisReadPermission)
                {
                    return Forbid(); // Không có quyền đọc Analysis
                }
            }

            // Lấy danh sách các người dùng đã được mời vào ngân hàng (bankId)
            var invitedUsers = await _context.ResourceAccesses
                .Where(ra => ra.ResourceId == bankId && ra.ResourceType == resourceType)
                .Join(_context.Accounts, ra => ra.Accid, acc => acc.AccId, (ra, acc) => new
                {
                    Accid = acc.AccId,
                    Username = acc.Username,
                    Email = acc.Email,
                    Phone = acc.Phone,
                    Role = (bool)ra.IsOwner ? "Owner" : ra.Role.RoleName,
                    IsOwner = ra.IsOwner
                })
                .ToListAsync();

            // Kiểm tra nếu resourceType là "Bank" và chỉ có 1 người sở hữu (IsOwner)
            if (resourceType == "Bank")
            {
                var ownerCount = invitedUsers.Count(user => user.IsOwner.HasValue && user.IsOwner.Value);

                if (ownerCount > 1)
                {
                    return BadRequest("Mỗi ngân hàng chỉ có một người sở hữu.");
                }
            }

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
            long currentUserId = long.Parse(claimAccId);

            // Lấy tất cả quyền truy cập của user với bankId này
            var resourceAccesses = await _context.ResourceAccesses
                .Where(ra => ra.ResourceId == bankId && ra.Accid == userId)
                .ToListAsync();

            if (resourceAccesses == null || resourceAccesses.Count == 0)
            {
                return NotFound("Người dùng không tồn tại trong ngân hàng này.");
            }

            // Lấy tất cả roleId liên quan
            var roleIds = resourceAccesses.Select(ra => ra.RoleId).ToList();

            // Lấy tất cả RoleAccesses liên quan
            var roleAccesses = await _context.RoleAccesses
                .Where(ra => roleIds.Contains(ra.Roleid))
                .ToListAsync();

            // Xóa tất cả RoleAccesses liên quan
            _context.RoleAccesses.RemoveRange(roleAccesses);

            // Xóa tất cả ResourceAccesses liên quan
            _context.ResourceAccesses.RemoveRange(resourceAccesses);

            // Lưu các thay đổi vào cơ sở dữ liệu
            await _context.SaveChangesAsync();

            return Ok("Thành viên đã được xóa khỏi tất cả quyền truy cập.");
        }



    }
}