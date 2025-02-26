using System;
using System.Collections.Generic;

namespace SEP490_G77_ESS.Models;

public partial class Exam
{
    public long ExamId { get; set; }

    public string? Examname { get; set; }

    public DateTime? Createdate { get; set; }

    public long? AccId { get; set; }

    public virtual Account? Acc { get; set; }
}
