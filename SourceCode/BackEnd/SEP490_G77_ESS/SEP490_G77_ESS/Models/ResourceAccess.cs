using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class ResourceAccess
{
    public long ResourceAccessId { get; set; }

    public string? ResourceType { get; set; }

    public long? ResourceId { get; set; }

    public long? Accid { get; set; }

    public bool? IsOwner { get; set; }

    public int? RoleId { get; set; }

    public virtual Account? Acc { get; set; }

    public virtual RoleAccess? Role { get; set; }
}
