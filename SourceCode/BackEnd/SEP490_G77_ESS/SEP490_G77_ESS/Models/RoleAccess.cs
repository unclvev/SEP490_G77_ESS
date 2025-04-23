using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class RoleAccess
{
    public int Roleid { get; set; }

    public string? RoleName { get; set; }

    public bool? CanModify { get; set; }

    public bool? CanRead { get; set; }

    public bool? CanDelete { get; set; }

    public virtual ICollection<ResourceAccess> ResourceAccesses { get; set; } = new List<ResourceAccess>();
}
