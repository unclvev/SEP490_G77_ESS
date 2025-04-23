namespace SEP490_G77_ESS.Services
{
    using System.Security.Claims;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.EntityFrameworkCore;
    using SEP490_G77_ESS.Models;

    public class ResourcePermissionHandler : AuthorizationHandler<ResourcePermissionRequirement>
    {
        private readonly EssDbV11Context _db;
        public ResourcePermissionHandler(EssDbV11Context db) => _db = db;

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            ResourcePermissionRequirement requirement)
        {
            // Lấy userId từ claim "sub" (hoặc NameIdentifier)
            var sub = context.User.FindFirst("AccId")?.Value;
            if (!long.TryParse(sub, out var userId))
            {
                context.Fail();
                return;
            }

            // Check if user is owner of the resource
            var isOwner = await _db.ResourceAccesses
                .AnyAsync(ra =>
                    ra.Accid == userId &&
                    ra.ResourceType == requirement.ResourceType &&
                    ra.IsOwner == true);

            if (isOwner)
            {
                context.Succeed(requirement);
                return;
            }

            // Query ResourceAccess join RoleAccess
            var hasPermission = await _db.ResourceAccesses
                .Include(ra => ra.Role)
                .AnyAsync(ra =>
                    ra.Accid == userId &&
                    ra.ResourceType == requirement.ResourceType &&
                    (
                      (requirement.Action == "Read" && ra.Role.CanRead == true) ||
                      (requirement.Action == "Modify" && ra.Role.CanModify == true) ||
                      (requirement.Action == "Delete" && ra.Role.CanDelete == true)
                    )
                );

            if (hasPermission)
                context.Succeed(requirement);
            else
                context.Fail();
        }
    }
}