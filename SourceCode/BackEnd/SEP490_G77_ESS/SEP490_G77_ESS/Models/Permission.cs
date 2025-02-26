using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Permission
{
    public long PermissionId { get; set; }

    public string? PermissionName { get; set; }

    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}
