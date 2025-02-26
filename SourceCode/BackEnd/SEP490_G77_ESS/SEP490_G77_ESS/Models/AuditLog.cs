using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class AuditLog
{
    public long AuditId { get; set; }

    public string Operation { get; set; } = null!;

    public string Tablename { get; set; } = null!;

    public long RecordId { get; set; }

    public DateTime? Operationdate { get; set; }

    public decimal Performedby { get; set; }

    public string? Details { get; set; }
}
