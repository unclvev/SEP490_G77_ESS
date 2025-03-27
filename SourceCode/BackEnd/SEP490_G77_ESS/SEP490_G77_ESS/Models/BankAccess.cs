using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class BankAccess
{
    public long BankaccessId { get; set; }

    public long Bankid { get; set; }

    public long Accid { get; set; }

    public bool? Canedit { get; set; }

    public bool? Canview { get; set; }

   

    public virtual Account Acc { get; set; } = null!;

    public virtual Bank Bank { get; set; } = null!;
}
