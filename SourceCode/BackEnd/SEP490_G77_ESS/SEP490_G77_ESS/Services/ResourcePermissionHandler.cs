using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SEP490_G77_ESS.Models;

namespace SEP490_G77_ESS.Services
{
    public class ResourcePermissionHandler : AuthorizationHandler<ResourcePermissionRequirement, long>
    {
        private readonly EssDbV11Context _db;
        private readonly ILogger<ResourcePermissionHandler> _logger;

        public ResourcePermissionHandler(EssDbV11Context db, ILogger<ResourcePermissionHandler> logger)
        {
            _db = db;
            _logger = logger;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            ResourcePermissionRequirement requirement,
            long resourceId)
        {
            try
            {
                // Lấy userId từ claim
                var sub = context.User.FindFirst("AccId")?.Value;
                if (!long.TryParse(sub, out var userId))
                {
                    _logger.LogWarning("Invalid or missing AccId claim");
                    context.Fail();
                    return;
                }

                // Kiểm tra owner trên chính ResourceId
                if (await CheckResourceOwnership(userId, requirement.ResourceType, resourceId))
                {
                    context.Succeed(requirement);
                    return;
                }

                // Kiểm tra quyền cụ thể (Read/Modify/Delete) trên chính ResourceId
                if (await CheckResourcePermission(userId, requirement.ResourceType, requirement.Action, resourceId))
                {                   
                    context.Succeed(requirement);
                }
                else
                {
                    context.Fail();
                }
            }
            catch (Exception ex)
            {
                context.Fail();
            }
        }

        private Task<bool> CheckResourceOwnership(long userId, string resourceType, long resourceId)
        {
            return _db.ResourceAccesses.AnyAsync(ra =>
                ra.Accid == userId &&
                ra.ResourceType == resourceType &&
                ra.ResourceId == resourceId &&
                ra.IsOwner == true);
        }

        private Task<bool> CheckResourcePermission(long userId, string resourceType, string action, long resourceId)
        {
            var query = _db.ResourceAccesses
                .Include(ra => ra.Role)
                .Where(ra =>
                    ra.Accid == userId &&
                    ra.ResourceType == resourceType &&
                    ra.ResourceId == resourceId);

            return action switch
            {
                "Read" => query.AnyAsync(ra => ra.Role.CanRead == true),
                "Modify" => query.AnyAsync(ra => ra.Role.CanModify == true),
                "Delete" => query.AnyAsync(ra => ra.Role.CanDelete == true),
                _ => Task.FromResult(false)
            };
        }
    }
}
