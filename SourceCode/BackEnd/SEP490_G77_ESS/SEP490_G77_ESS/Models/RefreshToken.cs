using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class RefreshToken
{
    public long RefreshTokenId { get; set; }

    public string Token { get; set; } = null!;

    public DateTime Created { get; set; }

    public DateTime Expires { get; set; }

    public DateTime? Revoked { get; set; }

    public long AccountId { get; set; }

    public virtual Account Account { get; set; } = null!;
}
