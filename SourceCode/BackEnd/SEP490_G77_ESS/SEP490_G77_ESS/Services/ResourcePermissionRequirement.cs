using Microsoft.AspNetCore.Authorization;

namespace SEP490_G77_ESS.Services
{
    public class ResourcePermissionRequirement : IAuthorizationRequirement
    {
        public string ResourceType { get; }
        public string Action { get; }

        public ResourcePermissionRequirement(string resourceType, string action)
        {
            ResourceType = resourceType;
            Action = action; // "Read", "Modify" hoặc "Delete"
        }
    }
}
