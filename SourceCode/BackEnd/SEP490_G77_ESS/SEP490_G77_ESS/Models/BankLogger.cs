using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class BankLogger
{
    public long LogId { get; set; }

    public string? Logmessage { get; set; }

    public DateTime? Logtime { get; set; }

    public long? BankId { get; set; }

    public virtual Bank? Bank { get; set; }
}
